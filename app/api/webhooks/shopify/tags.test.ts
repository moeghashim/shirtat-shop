import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { shopifyWebhookTags, verifyShopifyWebhook } from "./tags";

const HANDLE = "rise-up-t-shirt";
const GID = "gid://shopify/Product/8123456789012";
const NUMERIC_ID = "8123456789012";

function productPayload(overrides: Record<string, unknown> = {}) {
  return {
    admin_graphql_api_id: GID,
    handle: HANDLE,
    id: Number(NUMERIC_ID),
    published_at: "2026-11-21T11:25:04Z",
    status: "active",
    updated_at: "2026-11-21T11:35:55Z",
    ...overrides,
  };
}

test("product webhook tags are the handle and numeric id, shared by English and Arabic", () => {
  const tags = shopifyWebhookTags("products/update", productPayload());
  assert.deepEqual(tags, [
    `product-${HANDLE}`,
    `recommendations-${HANDLE}`,
    `product-${NUMERIC_ID}`,
  ]);
  assert.equal(
    tags.some((tag) => tag.includes("/ar") || tag.includes("locale") || tag.endsWith("-en")),
    false,
  );
});

test("a REST id is used when the admin gid is missing", () => {
  const tags = shopifyWebhookTags(
    "products/update",
    productPayload({ admin_graphql_api_id: undefined, id: NUMERIC_ID }),
  );
  assert.equal(tags.includes(`product-${NUMERIC_ID}`), true);
});

test("creating or deleting a product also expires the catalog index", () => {
  for (const topic of ["products/create", "products/delete"]) {
    const tags = shopifyWebhookTags(topic, productPayload());
    assert.equal(tags[0], "products-index");
    assert.equal(tags.includes(`product-${HANDLE}`), true);
  }
});

test("publishing a product expires the catalog index; a later image edit does not", () => {
  const published = shopifyWebhookTags(
    "products/update",
    productPayload({
      published_at: "2026-11-21T11:25:04Z",
      updated_at: "2026-11-21T11:25:04Z",
    }),
  );
  assert.equal(published[0], "products-index");

  const imageEdit = shopifyWebhookTags("products/update", productPayload());
  assert.equal(imageEdit.includes("products-index"), false);
  assert.equal(imageEdit.includes(`product-${HANDLE}`), true);
});

test("a draft update does not expire the catalog index", () => {
  const tags = shopifyWebhookTags(
    "products/update",
    productPayload({
      published_at: null,
      status: "draft",
      updated_at: "2026-11-21T11:25:04Z",
    }),
  );
  assert.equal(tags.includes("products-index"), false);
});

test("collection and metaobject topics keep their own tags", () => {
  assert.deepEqual(
    shopifyWebhookTags("collections/update", {
      admin_graphql_api_id: "gid://shopify/Collection/42",
      handle: "tees",
    }),
    ["collection-tees", "collection-42"],
  );
  assert.deepEqual(shopifyWebhookTags("metaobjects/update", { handle: "home" }), [
    "metaobjects",
    "metaobject-home",
  ]);
});

test("create still expires the catalog index when the payload cannot be read", () => {
  assert.deepEqual(shopifyWebhookTags("products/create", undefined), ["products-index"]);
});

test("webhook HMAC accepts the signed body and rejects a tampered one", () => {
  const secret = "shpss_example_webhook_secret";
  const body = JSON.stringify(productPayload());
  const hmac = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
  assert.equal(verifyShopifyWebhook(body, hmac, secret), true);
  assert.equal(verifyShopifyWebhook(`${body} `, hmac, secret), false);
  assert.equal(verifyShopifyWebhook(body, null, secret), false);
  assert.equal(verifyShopifyWebhook(body, hmac, "other-secret"), false);
});

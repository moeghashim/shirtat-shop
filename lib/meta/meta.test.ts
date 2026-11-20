import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  capiEventData,
  pixelCustomData,
  purchaseEventId,
  purchaseFromOrder,
  shopifyContentId,
  trackingAllowed,
} from "./index";
import {
  capiUserData,
  deliverMetaEvent,
  evaluateStorefrontEvent,
  notifyMetaPurchase,
} from "./server";

const NOW = Date.parse("2026-11-19T12:00:00.000Z");
const UUID = "11111111-1111-4111-8111-111111111111";

function paidOrder(country: string, consent?: string) {
  return {
    billing_address: {
      city: "Austin",
      country_code: country,
      first_name: "Moe",
      last_name: "Ghashim",
      province_code: "TX",
      zip: "78701",
    },
    browser_ip: "203.0.113.8",
    client_details: { user_agent: "Mozilla/5.0" },
    currency: "USD",
    current_total_price: "67.98",
    customer: { email: "moe@shirtat.co", first_name: "Moe", id: 42, last_name: "Ghashim" },
    email: "Moe@Shirtat.co",
    id: 987654321,
    line_items: [{ price: "33.99", product_id: 444, quantity: 2, variant_id: 555 }],
    note_attributes: consent ? [{ name: "meta_consent", value: consent }] : [],
    phone: "+1 (415) 555-1212",
    processed_at: new Date(NOW).toISOString(),
  };
}

function pageEvent(consent: { analytics: boolean; marketing: boolean; saleOfData: boolean }) {
  return {
    consent,
    contentIds: [] as string[],
    eventId: `pv_${UUID}`,
    eventName: "PageView" as const,
    eventTime: Math.floor(NOW / 1000),
    sourceUrl: "https://shirtat.co/ar",
  };
}

test("purchase event ids match across the webhook and the checkout pixel", () => {
  assert.equal(purchaseEventId("gid://shopify/Order/987654321"), "purchase_987654321");
  assert.equal(purchaseEventId(987654321), "purchase_987654321");
  const purchase = purchaseFromOrder(paidOrder("US"), NOW);
  assert.equal(purchase.status, "ok");
  if (purchase.status !== "ok") return;
  assert.equal(purchase.match.event.eventId, "purchase_987654321");
  const server = capiEventData(purchase.match.event, { client_ip_address: "203.0.113.8" });
  assert.equal(server.event_id, purchase.match.event.eventId);
  assert.equal(server.event_name, "Purchase");
  assert.deepEqual(pixelCustomData(purchase.match.event).content_ids, ["555"]);
  assert.equal(pixelCustomData(purchase.match.event).content_type, "product");
  assert.equal(pixelCustomData(purchase.match.event).value, 67.98);
  assert.equal(pixelCustomData(purchase.match.event).currency, "USD");
});

test("content ids use the numeric Shopify variant id", () => {
  assert.equal(shopifyContentId("gid://shopify/ProductVariant/555"), "555");
  assert.equal(shopifyContentId("555"), "555");
  assert.equal(shopifyContentId("gid://shopify/Product/444"), "444");
  assert.equal(shopifyContentId("not-an-id"), null);
});

test("consent allows a grant, blocks a decline, and defaults by region", () => {
  const grant = {
    analyticsAllowed: true,
    country: "DE",
    marketingAllowed: true,
    saleOfDataAllowed: true,
  };
  assert.equal(trackingAllowed(grant), true);
  assert.equal(trackingAllowed({ ...grant, marketingAllowed: false }), false);
  assert.equal(trackingAllowed({ ...grant, saleOfDataAllowed: false }), false);
  assert.equal(
    trackingAllowed({
      analyticsAllowed: null,
      country: "US",
      marketingAllowed: null,
      saleOfDataAllowed: null,
    }),
    true,
  );
  assert.equal(
    trackingAllowed({
      analyticsAllowed: null,
      country: "DE",
      marketingAllowed: null,
      saleOfDataAllowed: null,
    }),
    false,
  );
  assert.equal(
    trackingAllowed({
      analyticsAllowed: null,
      country: null,
      marketingAllowed: null,
      saleOfDataAllowed: null,
    }),
    false,
  );
  assert.equal(purchaseFromOrder(paidOrder("DE"), NOW).status, "skip");
  assert.equal(purchaseFromOrder(paidOrder("DE", "granted"), NOW).status, "ok");
  assert.equal(purchaseFromOrder(paidOrder("US", "denied"), NOW).status, "skip");
  assert.equal(purchaseFromOrder(paidOrder("GB"), NOW).status, "skip");
  assert.equal(
    trackingAllowed({
      analyticsAllowed: true,
      country: "US",
      marketingAllowed: null,
      saleOfDataAllowed: null,
    }),
    false,
  );
  const stale = paidOrder("US");
  stale.processed_at = new Date(NOW - 8 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(purchaseFromOrder(stale, NOW).status, "skip");
});

test("a declined Shopify consent cookie blocks Conversions API", () => {
  const cookie = `_tracking_consent=${encodeURIComponent(
    JSON.stringify({ con: { CMP: { a: "1", m: "0", p: "1", s: "1" } } }),
  )}`;
  const decision = evaluateStorefrontEvent({
    cookieHeader: cookie,
    country: "US",
    forwardedFor: "203.0.113.8",
    json: pageEvent({ analytics: true, marketing: true, saleOfData: true }),
    nowMs: NOW,
    realIp: null,
    requestHost: "shirtat.co",
    userAgent: "Mozilla/5.0",
  });
  assert.deepEqual(decision, { ok: false, status: 204 });
});

test("storefront events keep the browser event id on the server event", () => {
  const decision = evaluateStorefrontEvent({
    cookieHeader: `_fbp=fb.1.1.1; _fbc=fb.1.1.click`,
    country: "DE",
    forwardedFor: "203.0.113.8",
    json: pageEvent({ analytics: true, marketing: true, saleOfData: true }),
    nowMs: NOW,
    realIp: null,
    requestHost: "shirtat.co",
    userAgent: "Mozilla/5.0",
  });
  assert.equal(decision.ok, true);
  if (!decision.ok) return;
  assert.equal(decision.event.eventId, `pv_${UUID}`);
  assert.equal(decision.user.fbp, "fb.1.1.1");
  assert.equal(decision.user.fbc, "fb.1.1.click");
  assert.equal(decision.user.client_ip_address, "203.0.113.8");
  assert.equal(
    evaluateStorefrontEvent({
      cookieHeader: null,
      country: "US",
      forwardedFor: null,
      json: {
        ...pageEvent({ analytics: true, marketing: true, saleOfData: true }),
        sourceUrl: "https://evil.test/",
      },
      nowMs: NOW,
      realIp: null,
      requestHost: "shirtat.co",
      userAgent: "Mozilla/5.0",
    }).ok,
    false,
  );
});

test("customer data is hashed and omitted when it was not provided", () => {
  const purchase = purchaseFromOrder(paidOrder("US"), NOW);
  assert.equal(purchase.status, "ok");
  if (purchase.status !== "ok") return;
  const user = capiUserData({
    customer: purchase.match.customer,
    ip: purchase.match.ip,
    userAgent: purchase.match.userAgent,
  });
  const email = createHash("sha256").update("moe@shirtat.co").digest("hex");
  assert.deepEqual(user.em, [email]);
  assert.equal(JSON.stringify(user).includes("Moe@Shirtat.co"), false);
  assert.equal(JSON.stringify(user).includes("+1 (415) 555-1212"), false);
  const empty = capiUserData({ ip: "203.0.113.8", userAgent: "Mozilla/5.0" });
  assert.equal("em" in empty, false);
  assert.equal(empty.client_ip_address, "203.0.113.8");
});

test("conversions api stays inert until the pixel id and token are set", async () => {
  const previous = {
    id: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    test: process.env.META_TEST_EVENT_CODE,
    token: process.env.META_CAPI_ACCESS_TOKEN,
  };
  const calls: Array<{ body: string; url: string }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ body: String(init?.body ?? ""), url: String(input) });
    return new Response("{}", { status: 200 });
  };
  try {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.META_TEST_EVENT_CODE;
    const purchase = purchaseFromOrder(paidOrder("US"), NOW);
    assert.equal(purchase.status, "ok");
    if (purchase.status !== "ok") return;
    assert.equal(await deliverMetaEvent(purchase.match.event, {}, fetchImpl), "unconfigured");
    assert.equal(await notifyMetaPurchase(paidOrder("US"), fetchImpl), "unconfigured");
    assert.equal(calls.length, 0);

    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456789012345";
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    process.env.META_TEST_EVENT_CODE = "TEST12345";
    assert.equal(
      await deliverMetaEvent(purchase.match.event, { client_user_agent: "Mozilla/5.0" }, fetchImpl),
      "sent",
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, "https://graph.facebook.com/v27.0/123456789012345/events");
    assert.equal(calls[0]?.url.includes("test-token"), false);
    const params = new URLSearchParams(calls[0]?.body);
    assert.equal(params.get("access_token"), "test-token");
    assert.equal(params.get("test_event_code"), "TEST12345");
    const data = JSON.parse(params.get("data") ?? "[]") as Array<{
      event_id: string;
      event_name: string;
    }>;
    assert.equal(data[0]?.event_id, "purchase_987654321");
    assert.equal(data[0]?.event_name, "Purchase");
  } finally {
    restore("NEXT_PUBLIC_META_PIXEL_ID", previous.id);
    restore("META_CAPI_ACCESS_TOKEN", previous.token);
    restore("META_TEST_EVENT_CODE", previous.test);
  }
});

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

import { getAdminToken } from "@/lib/sales/server";

import { getProductType } from "./product-types";
import type { CreatorRecord, DesignRecord } from "./types";

const API_VERSION = "2025-01";
/** The "Shirtat Vercel" headless sales channel that powers shirtat.co. */
export const HEADLESS_PUBLICATION_ID =
  process.env.SHOPIFY_HEADLESS_PUBLICATION_ID ?? "gid://shopify/Publication/192816644318";

export class ShopifyWriteError extends Error {}

export async function adminGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new ShopifyWriteError("Store domain not configured");
  const token = await getAdminToken(domain);
  if (!token) throw new ShopifyWriteError("Could not get a Shopify Admin token");
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: { extensions?: { code?: string }; message: string }[];
  };
  if (json.errors?.length) {
    const denied = json.errors.some(
      (e) => e.extensions?.code === "ACCESS_DENIED" || /access denied|scope/i.test(e.message),
    );
    throw new ShopifyWriteError(
      denied
        ? `Shopify app is missing a required Admin API scope (write_orders/read_orders for order records; write_products/read_products/write_publications for catalog): ${json.errors[0]!.message}`
        : json.errors[0]!.message,
    );
  }
  if (!json.data) throw new ShopifyWriteError(`Shopify request failed (${res.status})`);
  return json.data;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Legacy single-type draft for a designer upload; delegates to the product workflow. */
export async function createDraftProduct(
  creator: CreatorRecord,
  design: DesignRecord,
): Promise<{ handle: string; id: string }> {
  const type = getProductType(design.productTypeId);
  if (!type) throw new ShopifyWriteError("Unknown product type");
  if (!creator.handle) throw new ShopifyWriteError("Designer has no handle");
  const { createDraftForType } = await import("@/lib/catalog/workflow");
  return createDraftForType({
    categoryId: design.tags.find((t) => t.startsWith("category:"))?.slice(9) ?? "cultures",
    colors: design.colors,
    descriptionAr: design.descriptionAr,
    descriptionEn: design.descriptionEn,
    designerHandle: creator.handle,
    designerName: creator.details?.displayName || creator.name,
    extraTags: design.tags,
    file: design.file,
    title: design.title,
    typeId: type.id,
  });
}

/** Sets the product ACTIVE and publishes it to the headless channel used by shirtat.co. */
export async function publishProduct(productId: string): Promise<void> {
  const data = await adminGraphql<{
    productUpdate: { userErrors: { message: string }[] };
    publishablePublish: { userErrors: { message: string }[] };
  }>(
    `mutation Publish($id: ID!, $pub: ID!) {
      productUpdate(input: { id: $id, status: ACTIVE }) { userErrors { message } }
      publishablePublish(id: $id, input: [{ publicationId: $pub }]) { userErrors { message } }
    }`,
    { id: productId, pub: HEADLESS_PUBLICATION_ID },
  );
  const err = data.productUpdate.userErrors[0] ?? data.publishablePublish.userErrors[0];
  if (err) throw new ShopifyWriteError(err.message);
}

/** Archives a rejected draft so it never goes live. */
export async function archiveProduct(productId: string): Promise<void> {
  const data = await adminGraphql<{ productUpdate: { userErrors: { message: string }[] } }>(
    `mutation Archive($id: ID!) { productUpdate(input: { id: $id, status: ARCHIVED }) { userErrors { message } } }`,
    { id: productId },
  );
  const err = data.productUpdate.userErrors[0];
  if (err) throw new ShopifyWriteError(err.message);
}

/** Permanently deletes a product (used to clean up test data). */
export async function deleteProduct(productId: string): Promise<void> {
  await adminGraphql(
    `mutation Del($id: ID!) { productDelete(input: { id: $id }) { deletedProductId userErrors { message } } }`,
    {
      id: productId,
    },
  );
}

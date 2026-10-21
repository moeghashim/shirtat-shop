import { getGbpUsdRate } from "@/lib/money/fx";
import { getCachedGbpUsdRate } from "@/lib/money/fx-server";
import { getAdminToken } from "@/lib/sales/server";

import { getProductType } from "./product-types";
import { signedAssetUrl } from "./tokens";
import type { CreatorRecord, DesignRecord } from "./types";

const API_VERSION = "2025-01";
/** The "Shirtat Vercel" headless sales channel that powers shirtat.co. */
export const HEADLESS_PUBLICATION_ID =
  process.env.SHOPIFY_HEADLESS_PUBLICATION_ID ?? "gid://shopify/Publication/192816644318";

export class ShopifyWriteError extends Error {}

async function adminGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
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
        ? "Shopify app is missing write_products (and read_products, write_publications) scopes"
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

/** Creates the design as a DRAFT product tagged creator:<handle>, with type, category, variants and image. */
export async function createDraftProduct(
  creator: CreatorRecord,
  design: DesignRecord,
): Promise<{ handle: string; id: string }> {
  const type = getProductType(design.productTypeId);
  if (!type) throw new ShopifyWriteError("Unknown product type");
  if (!creator.handle) throw new ShopifyWriteError("Creator has no handle");
  const colors = design.colors.length ? design.colors : [type.colors[0]!.en];
  const descriptionHtml = [
    design.descriptionEn && `<p>${escapeHtml(design.descriptionEn)}</p>`,
    design.descriptionAr && `<p dir="rtl" lang="ar">${escapeHtml(design.descriptionAr)}</p>`,
    `<p>Design by ${escapeHtml(creator.details?.displayName || creator.name)}.</p>`,
  ]
    .filter(Boolean)
    .join("\n");
  const rate = (await getCachedGbpUsdRate()) ?? getGbpUsdRate();
  const gbpPrice = (Number(type.basePrice) / rate).toFixed(2);
  const variants = type.sizes.flatMap((size) =>
    colors.map((color) => ({
      optionValues: [
        { name: size, optionName: "Size" },
        { name: color, optionName: "Color" },
      ],
      price: gbpPrice,
    })),
  );
  const files =
    design.file.contentType === "image/png" || design.file.contentType === "image/jpeg"
      ? [
          {
            alt: design.title,
            contentType: "IMAGE",
            originalSource: signedAssetUrl(design.file.pathname),
          },
        ]
      : [];
  const data = await adminGraphql<{
    productSet: {
      product: { handle: string; id: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation CreateDraft($input: ProductSetInput!) {
      productSet(synchronous: true, input: $input) { product { id handle } userErrors { field message } }
    }`,
    {
      input: {
        category: type.category,
        descriptionHtml,
        files,
        productOptions: [
          { name: "Size", values: type.sizes.map((name) => ({ name })) },
          { name: "Color", values: colors.map((name) => ({ name })) },
        ],
        productType: type.productType,
        status: "DRAFT",
        tags: [`creator:${creator.handle}`, ...design.tags].slice(0, 20),
        title: design.title,
        variants,
        vendor: "Shirtat",
      },
    },
  );
  const err = data.productSet.userErrors[0];
  if (err || !data.productSet.product)
    throw new ShopifyWriteError(err?.message ?? "Product not created");
  return data.productSet.product;
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

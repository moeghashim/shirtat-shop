import type { ProductRecommendationIntent } from "@shopify/hydrogen/storefront-api-types";
import { cacheLife, cacheTag } from "next/cache";

import type { CommerceLocale } from "@/lib/config/types";
import { isCustomDesignHandle } from "@/lib/custom/products";
import type { PageInfo } from "@/lib/pagination/types";
import type { ProductCard, ProductDetails, ProductPage } from "@/lib/product/types";
import { getNumericShopifyId } from "@/lib/shopify/id/server";
import {
  fetchProduct,
  fetchProductRecommendations,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";
import type { SearchIndexProductsParams } from "@/lib/shopify/operations/products/types";

const CATALOG_PAGE_CAP = 20;
const CATALOG_PAGE_SIZE = 50;

// Only valid inside a cache directive scope.
export function tagProducts(products: Array<{ id: string }>): void {
  for (const product of products) {
    const numericId = getNumericShopifyId(product.id);
    if (numericId) cacheTag(`product-${numericId}`);
  }
}

export async function getProduct(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductDetails | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `product-${params.handle}`);

  const product = await fetchProduct(params);
  if (product) tagProducts([product]);
  return product;
}

export async function collectCatalogProducts(
  load: (cursor: string | null) => Promise<{ pageInfo: PageInfo; products: ProductCard[] }>,
): Promise<ProductCard[]> {
  const products: ProductCard[] = [];
  const seen = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < CATALOG_PAGE_CAP; page += 1) {
    const result = await load(cursor);
    for (const product of result.products) {
      if (seen.has(product.handle) || isCustomDesignHandle(product.handle)) continue;
      seen.add(product.handle);
      products.push(product);
    }
    const next = result.pageInfo.endCursor;
    if (!result.pageInfo.hasNextPage || !next || next === cursor) break;
    cursor = next;
  }
  return products;
}

export async function getProductIndex(
  params: { locale?: CommerceLocale } = {},
): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "products-index");

  const products = await collectCatalogProducts((cursor) =>
    fetchSearchIndexProducts({
      cursor: cursor ?? undefined,
      limit: CATALOG_PAGE_SIZE,
      locale: params.locale,
    }),
  );
  tagProducts(products);
  return products;
}

// Cursor-paginated browse reads stay uncached in lib/collections/server.ts; this serves fixed grids only.
export async function getSearchIndexProducts(
  params: SearchIndexProductsParams,
): Promise<ProductPage> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "products-index");

  const result = await fetchSearchIndexProducts(params);
  tagProducts(result.products);
  return result;
}

export async function getProductRecommendations(params: {
  handle: string;
  intent: ProductRecommendationIntent;
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `recommendations-${params.handle}`);

  const products = await fetchProductRecommendations(params);
  tagProducts(products);
  return products;
}

import { cacheLife, cacheTag } from "next/cache";

import { getCollectionResults } from "@/lib/collections/server";
import type { CommerceLocale } from "@/lib/config/types";
import { fetchGuideCatalogPage } from "@/lib/shopify/operations/products/server";

import type { GuideMatch, GuideProduct, RailProduct } from "./types";

function frame(
  image: {
    altText?: string | null;
    height?: number | null;
    url?: string | null;
    width?: number | null;
  } | null,
): GuideProduct["image"] {
  if (!image?.url) return null;
  return {
    altText: image.altText ?? "",
    height: image.height || 800,
    url: image.url,
    width: image.width || 800,
  };
}

export async function getGuideCatalog(
  locale: CommerceLocale,
): Promise<{ ok: boolean; products: GuideProduct[] }> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", "products-index");

  const products: GuideProduct[] = [];
  let cursor: string | null = null;
  try {
    for (let page = 0; page < 5; page += 1) {
      const connection = await fetchGuideCatalogPage({ cursor, locale });
      for (const node of connection.nodes) {
        if (node.tags.includes("example")) continue;
        products.push({
          availableForSale: node.availableForSale,
          description: node.description,
          handle: node.handle,
          image: frame(node.featuredImage),
          maxPrice: node.priceRange.maxVariantPrice,
          price: node.priceRange.minVariantPrice,
          productType: node.productType,
          tags: node.tags,
          title: node.title,
        });
      }
      if (!connection.pageInfo.hasNextPage) break;
      cursor = connection.pageInfo.endCursor;
    }
    return { ok: true, products };
  } catch {
    return { ok: false, products: [] };
  }
}

export async function getOccasionRail(
  locale: CommerceLocale,
): Promise<{ ok: boolean; products: RailProduct[] }> {
  try {
    const { products } = await getCollectionResults({ handle: "occasions", locale });
    return {
      ok: true,
      products: products.map((product) => ({
        handle: product.handle,
        image: product.featuredImage?.url
          ? {
              altText: product.featuredImage.altText,
              height: product.featuredImage.height || 800,
              url: product.featuredImage.url,
              width: product.featuredImage.width || 800,
            }
          : null,
        maxPrice: product.maxPrice,
        price: product.price,
        title: product.title,
      })),
    };
  } catch {
    return { ok: false, products: [] };
  }
}

export async function loadGuideSources(match: GuideMatch, locale: CommerceLocale) {
  const catalog =
    match.kind === "none" || match.kind === "occasions"
      ? { ok: true, products: [] }
      : await getGuideCatalog(locale);
  const occasions =
    match.kind === "occasions" ? await getOccasionRail(locale) : { ok: true, products: [] };
  return { catalog, occasions };
}

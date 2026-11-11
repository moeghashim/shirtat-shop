import { cacheLife, cacheTag } from "next/cache";

import { getCollectionResults } from "@/lib/collections/server";
import type { CommerceLocale } from "@/lib/config/types";

import type { GuideMatch, GuideProduct, RailProduct } from "./types";

const API_VERSION = "2025-01";

interface RawProduct {
  availableForSale: boolean;
  description: string;
  featuredImage: {
    altText: string | null;
    height: number | null;
    url: string;
    width: number | null;
  } | null;
  handle: string;
  priceRange: {
    maxVariantPrice: { amount: string; currencyCode: string };
    minVariantPrice: { amount: string; currencyCode: string };
  };
  productType: string;
  tags: string[];
  title: string;
}

function frame(image: RawProduct["featuredImage"]): GuideProduct["image"] {
  if (!image?.url) return null;
  return {
    altText: image.altText ?? "",
    height: image.height || 800,
    url: image.url,
    width: image.width || 800,
  };
}

/** Direct Storefront read, same exception as getHomeProducts: guides match phrases in descriptions. */
export async function getGuideCatalog(): Promise<{ ok: boolean; products: GuideProduct[] }> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", "products-index");

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return { ok: false, products: [] };

  const products: GuideProduct[] = [];
  let cursor: string | null = null;
  try {
    for (let page = 0; page < 5; page += 1) {
      const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
        body: JSON.stringify({
          query: `query GuideProducts($cursor: String) {
            products(first: 100, after: $cursor, sortKey: TITLE) {
              pageInfo { hasNextPage endCursor }
              nodes {
                availableForSale
                description
                handle
                productType
                tags
                title
                featuredImage { altText url width height }
                priceRange {
                  minVariantPrice { amount currencyCode }
                  maxVariantPrice { amount currencyCode }
                }
              }
            }
          }`,
          variables: { cursor },
        }),
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        method: "POST",
      });
      if (!res.ok) return { ok: false, products: [] };
      const json = (await res.json()) as {
        data?: {
          products: {
            nodes: RawProduct[];
            pageInfo: { endCursor: string | null; hasNextPage: boolean };
          };
        };
      };
      const connection = json.data?.products;
      if (!connection) return { ok: false, products: [] };
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
      : await getGuideCatalog();
  const occasions =
    match.kind === "occasions" ? await getOccasionRail(locale) : { ok: true, products: [] };
  return { catalog, occasions };
}

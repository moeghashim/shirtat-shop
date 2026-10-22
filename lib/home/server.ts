import { cacheLife, cacheTag } from "next/cache";

const API_VERSION = "2025-01";

export interface HomeProduct {
  handle: string;
  image: { altText: string | null; url: string } | null;
  price: { amount: string; currencyCode: string };
  productType: string;
  tags: string[];
  title: string;
}

/** Active products visible to the storefront, newest first (used for homepage tiles and spotlight). */
export async function getHomeProducts(): Promise<HomeProduct[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", "products-index");

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return [];
  try {
    const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({
        query: `{ products(first: 100, sortKey: CREATED_AT, reverse: true) { nodes { handle title productType tags featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } } } }`,
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: {
        products: {
          nodes: {
            featuredImage: { altText: string | null; url: string } | null;
            handle: string;
            priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
            productType: string;
            tags: string[];
            title: string;
          }[];
        };
      };
    };
    return (json.data?.products.nodes ?? [])
      .filter((p) => !p.tags.includes("example"))
      .map((p) => ({
        handle: p.handle,
        image: p.featuredImage,
        price: p.priceRange.minVariantPrice,
        productType: p.productType,
        tags: p.tags,
        title: p.title,
      }));
  } catch {
    return [];
  }
}

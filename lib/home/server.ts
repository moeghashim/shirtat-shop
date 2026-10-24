import { cacheLife, cacheTag } from "next/cache";

import { withStyleTest } from "@/lib/style-test";

const API_VERSION = "2025-01";

export interface HomeProduct {
  handle: string;
  /** Card gallery: featured image first, then the hover image (design art, else on-model photo, else next image). */
  gallery: { altText: string; height: number; url: string; width: number }[];
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
        query: `{ products(first: 100, sortKey: CREATED_AT, reverse: true) { nodes { handle title productType tags featuredImage { url altText } media(first: 10) { nodes { ... on MediaImage { image { url altText width height } } } } priceRange { minVariantPrice { amount currencyCode } } } } }`,
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: {
        products: {
          nodes: {
            featuredImage: { altText: string | null; url: string } | null;
            handle: string;
            media: { nodes: { image?: { altText: string | null; height: number | null; url: string; width: number | null } }[] };
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
        gallery: styleTestGallery(p.handle, p.title, homeGallery(p.featuredImage, p.media.nodes)),
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

const DESIGN_ALT = /\b(design|artwork|calligraphy)\b/i;
const LIFESTYLE_ALT = /\bmodel wearing\b/i;

function homeGallery(
  featured: { altText: string | null; url: string } | null,
  nodes: { image?: { altText: string | null; height: number | null; url: string; width: number | null } }[],
): HomeProduct["gallery"] {
  const base = (u: string) => u.split("?")[0];
  const imgs = nodes.flatMap((n) =>
    n.image ? [{ altText: n.image.altText ?? "", height: n.image.height ?? 1, url: n.image.url, width: n.image.width ?? 1 }] : [],
  );
  const first = featured ? imgs.find((i) => base(i.url) === base(featured.url)) : undefined;
  const rest = imgs.filter((i) => i !== first);
  let h = rest.findIndex((i) => DESIGN_ALT.test(i.altText));
  if (h < 0) h = rest.findIndex((i) => LIFESTYLE_ALT.test(i.altText));
  if (h > 0) rest.unshift(...rest.splice(h, 1));
  return first ? [first, ...rest] : rest;
}

// STYLE TEST: on-model shot right after the hover design art.
function styleTestGallery(handle: string, title: string, all: HomeProduct["gallery"]): HomeProduct["gallery"] {
  const styled = withStyleTest(handle, title, all);
  if (styled === all) return all;
  const shot = styled.find((img) => img.url.startsWith("/style-test/"))!;
  const others = all.filter((img) => !/\/lifestyle-[^/?]+\.jpg/.test(img.url));
  return [...others.slice(0, 2), shot, ...others.slice(2)];
}

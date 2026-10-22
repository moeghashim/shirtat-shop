import { cacheLife, cacheTag } from "next/cache";

import type { CommerceLocale } from "@/lib/config/types";
import type { ProductCard } from "@/lib/product/types";
import { fetchProductsByIds } from "@/lib/shopify/operations/products/server";

const API_VERSION = "2025-01";

/** Product-type suffixes every Shirtat design can be printed on; the handle is `${design}-${suffix}`. */
const TYPE_SUFFIXES = ["t-shirt", "hoodie", "sweatshirt", "cap", "beanie", "tote-bag", "print"] as const;

export interface DesignStory {
  meaning?: string;
  origin?: string;
  phrase?: string;
}

export interface PdpExtras {
  category?: string;
  design?: string;
  story?: DesignStory;
  tags: string[];
}

export function designFromHandle(handle: string): string | undefined {
  for (const suffix of TYPE_SUFFIXES) {
    if (handle.endsWith(`-${suffix}`)) return handle.slice(0, -(suffix.length + 1));
  }
  return undefined;
}

async function storefrontFetch<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return null;
  try {
    const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/** Reads shirtat.design_story_en / _ar (json: phrase, meaning, origin) plus tags for grouping. */
export async function getPdpExtras(handle: string, isArabic: boolean): Promise<PdpExtras> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", `product-${handle}`);
  const data = await storefrontFetch<{
    product: { tags: string[]; story: { value: string } | null } | null;
  }>(
    `query($h: String!, $k: String!) { product(handle: $h) { tags story: metafield(namespace: "shirtat", key: $k) { value } } }`,
    { h: handle, k: isArabic ? "design_story_ar" : "design_story_en" },
  );
  const tags = data?.product?.tags ?? [];
  let story: DesignStory | undefined;
  if (data?.product?.story?.value) {
    try {
      story = JSON.parse(data.product.story.value) as DesignStory;
    } catch {
      story = undefined;
    }
  }
  const categories = tags.filter((t) => t.startsWith("category:")).map((t) => t.slice(9));
  // Prefer the most specific category (Humor/Poetry/Occasions) over the broad Cultures one.
  const category = categories.find((c) => c !== "cultures") ?? categories[0];
  return { category, design: designFromHandle(handle), story, tags };
}

/** The same design on every other product type, in a fixed type order. */
export async function getMoreFromDesign(
  handle: string,
  locale: CommerceLocale,
): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", `design-${handle}`);
  const design = designFromHandle(handle);
  if (!design) return [];
  const aliases = TYPE_SUFFIXES.map(
    (s, i) => `p${i}: product(handle: "${design}-${s}") { id handle }`,
  ).join(" ");
  const data = await storefrontFetch<Record<string, { id: string; handle: string } | null>>(
    `query { ${aliases} }`,
    {},
  );
  if (!data) return [];
  const ids = Object.values(data)
    .filter((p): p is { id: string; handle: string } => !!p && p.handle !== handle)
    .map((p) => p.id);
  if (ids.length === 0) return [];
  return fetchProductsByIds({ ids, locale });
}

/** Other designs from the same category (one product per design, same product type first). */
export async function getAlsoLike(
  handle: string,
  category: string,
  locale: CommerceLocale,
): Promise<ProductCard[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", `also-like-${handle}`);
  const design = designFromHandle(handle);
  const suffix = design ? handle.slice(design.length + 1) : undefined;
  const data = await storefrontFetch<{ products: { nodes: { id: string; handle: string }[] } }>(
    `query($q: String!) { products(first: 100, query: $q) { nodes { id handle } } }`,
    { q: `tag:"category:${category}"` },
  );
  const nodes = data?.products.nodes ?? [];
  const byDesign = new Map<string, { id: string; handle: string }>();
  for (const n of nodes) {
    const d = designFromHandle(n.handle);
    if (!d || d === design || n.handle.startsWith("example-")) continue;
    const current = byDesign.get(d);
    const isSameType = suffix && n.handle === `${d}-${suffix}`;
    if (!current || isSameType) byDesign.set(d, n);
  }
  const ids = [...byDesign.values()].slice(0, 4).map((n) => n.id);
  if (ids.length === 0) return [];
  return fetchProductsByIds({ ids, locale });
}

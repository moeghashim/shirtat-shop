import { listCreators } from "@/lib/creators/store";
import type { CreatorRecord } from "@/lib/creators/types";

const API_VERSION = "2025-01";

export interface PublicDesigner {
  avatarUrl: string | null;
  bio: string;
  designCount: number;
  handle: string;
  bioAr?: string;
  initials: string;
  name: string;
  nameAr?: string;
}

/** Shirtat's in-house studio; its products carry designer:shirtat. */
const HOUSE_HANDLE = "shirtat";
const HOUSE = {
  avatarUrl: "/android-chrome-512x512.png",
  bio: "Original designs from the Shirtat studio: Arabic calligraphy, poetry and wisdom, made to wear.",
  bioAr: "تصاميم أصلية من استوديو شِرتات: خط عربي وشعر وحكمة، صُنعت لتُلبس.",
  handle: HOUSE_HANDLE,
  initials: "S",
  name: "Shirtat",
  nameAr: "شِرتات",
};

const listed = (c: CreatorRecord) =>
  c.status === "approved" && Boolean(c.handle) && c.handle !== HOUSE_HANDLE && !c.hiddenFromDirectory;

export interface DesignerProduct {
  handle: string;
  id: string;
  image: { altText: string | null; url: string } | null;
  price: { amount: string; currencyCode: string };
  title: string;
}

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => [...w][0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

export function avatarOf(c: CreatorRecord) {
  return c.avatar ?? c.details?.avatar ?? null;
}

/** Published products tagged designer:<handle> (or legacy creator:<handle>), with Shopify's own prices. */
export async function fetchDesignerProducts(handle: string): Promise<DesignerProduct[]> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token || !/^[a-z0-9-]+$/.test(handle)) return [];
  const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
    body: JSON.stringify({
      query: `query($q: String!) { products(first: 100, query: $q) { nodes { id handle title tags featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } } } }`,
      variables: { q: `tag:'designer:${handle}' OR tag:'creator:${handle}'` },
    }),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: {
      products: {
        nodes: {
          featuredImage: { altText: string | null; url: string } | null;
          handle: string;
          id: string;
          priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
          tags: string[];
          title: string;
        }[];
      };
    };
  };
  const wanted = [`designer:${handle}`, `creator:${handle}`];
  return (json.data?.products.nodes ?? [])
    .filter((p) => p.tags.some((t) => wanted.includes(t.toLowerCase())))
    .map((p) => ({
      handle: p.handle,
      id: p.id,
      image: p.featuredImage,
      price: p.priceRange.minVariantPrice,
      title: p.title,
    }));
}

function toPublic(c: CreatorRecord, count: number): PublicDesigner {
  const name = c.details?.displayName || c.name;
  return {
    avatarUrl: avatarOf(c) ? `/api/designers/avatar/${c.handle}` : null,
    bio: c.details?.bio || c.bio,
    designCount: count,
    handle: c.handle!,
    initials: initialsOf(name),
    name,
  };
}

export async function listPublicDesigners(): Promise<PublicDesigner[]> {
  const approved = (await listCreators()).filter(listed);
  const [house, ...others] = await Promise.all([
    fetchDesignerProducts(HOUSE_HANDLE).then((p) => ({ ...HOUSE, designCount: p.length })),
    ...approved.map(async (c) => toPublic(c, (await fetchDesignerProducts(c.handle!)).length)),
  ]);
  return [house, ...others];
}

export async function getPublicDesigner(
  handle: string,
): Promise<{ designer: PublicDesigner; products: DesignerProduct[] } | null> {
  if (handle.toLowerCase() === HOUSE_HANDLE) {
    const products = await fetchDesignerProducts(HOUSE_HANDLE);
    return { designer: { ...HOUSE, designCount: products.length }, products };
  }
  const c = (await listCreators()).find((x) => listed(x) && x.handle === handle.toLowerCase());
  if (!c) return null;
  const products = await fetchDesignerProducts(c.handle!);
  return { designer: toPublic(c, products.length), products };
}

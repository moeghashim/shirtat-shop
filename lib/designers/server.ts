import type { ProductSortKeys } from "@shopify/hydrogen/storefront-api-types";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { cache } from "react";

import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { BrowseResults, BrowseState } from "@/lib/collections/types";
import { summarizeText } from "@/lib/content";
import { listCreators } from "@/lib/creators/store";
import type { CreatorRecord } from "@/lib/creators/types";
import {
  type DesignerCredit,
  designerCopy,
  designerDisplayName,
  designerHandleFromTags,
  designerProductQuery,
  isPublicDesigner,
  publicDesignerCredits,
  resolveDesignerCredit,
  SHIRTAT_DESIGNER,
  SHIRTAT_DESIGNER_LOGO,
} from "@/lib/designers";
import type { PublicDesigner } from "@/lib/designers/types";
import { getLocale, getT } from "@/lib/i18n/server";
import type { ProductCard } from "@/lib/product/types";
import { fetchSearchResults } from "@/lib/search/server";
import { buildAlternates, buildOpenGraph, siteOgImages } from "@/lib/seo";
import {
  fetchProductIdsByQuery,
  fetchSearchFacets,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";

const API_VERSION = "2025-01";

/** Shirtat's in-house studio; its products carry designer:shirtat. */
const HOUSE = {
  avatarUrl: SHIRTAT_DESIGNER_LOGO,
  bio: "Original designs from the Shirtat studio: Arabic calligraphy, poetry and wisdom, made to wear.",
  bioAr: "تصاميم أصلية من استوديو شِرتات: خط عربي وشعر وحكمة، صُنعت لتُلبس.",
  handle: SHIRTAT_DESIGNER.handle,
  initials: "S",
  name: SHIRTAT_DESIGNER.name,
  nameAr: SHIRTAT_DESIGNER.nameAr,
};

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
  const name = designerDisplayName(c);
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
  const approved = (await listCreators()).filter(isPublicDesigner);
  const [house, ...others] = await Promise.all([
    fetchDesignerProducts(SHIRTAT_DESIGNER.handle).then((p) => ({
      ...HOUSE,
      designCount: p.length,
    })),
    ...approved.map(async (c) => toPublic(c, (await fetchDesignerProducts(c.handle!)).length)),
  ]);
  return [house, ...others];
}

async function readPublicDesigner(handle: string): Promise<PublicDesigner | null> {
  const normalized = handle.toLowerCase();
  if (normalized === SHIRTAT_DESIGNER.handle) return { ...HOUSE, designCount: 0 };
  const creator = (await listCreators()).find(
    (item) => isPublicDesigner(item) && item.handle === normalized,
  );
  if (!creator) return null;
  return toPublic(creator, 0);
}

export const getPublicDesigner = cache(readPublicDesigner);

async function getCachedPublicDesigner(handle: string): Promise<PublicDesigner | null> {
  "use cache";
  cacheLife("hours");
  return readPublicDesigner(handle);
}

export async function getDesignerMetadata(handle: string): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getT();
  const designer = await getCachedPublicDesigner(handle).catch(() => null);
  const copy = designer ? designerCopy(designer, locale) : null;
  const title = copy?.name ?? t("Designs by @{handle}", { handle });
  const description =
    summarizeText(copy?.bio ?? "") || t("Browse Shirtat designs by the designers who made them.");
  const url = `/designers/${handle}`;
  return {
    alternates: buildAlternates({ locale, pathname: url }),
    description,
    openGraph: buildOpenGraph({ description, locale, title, type: "website", url }),
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: siteOgImages(locale),
      title,
    },
  };
}

const NO_PAGE = {
  endCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
} as const;

// Storefront search sorts by relevance and price. The other collection sorts come from the products connection.
function shopifyCatalogSort(
  sort: string | undefined,
): { reverse: boolean; sortKey: ProductSortKeys } | null {
  switch (sort) {
    case "best-selling":
      return { reverse: false, sortKey: "BEST_SELLING" };
    case "created-ascending":
      return { reverse: false, sortKey: "CREATED_AT" };
    case "created-descending":
      return { reverse: true, sortKey: "CREATED_AT" };
    case "title-ascending":
      return { reverse: false, sortKey: "TITLE" };
    case "title-descending":
      return { reverse: true, sortKey: "TITLE" };
    default:
      return null;
  }
}

async function fetchEverySearchProduct(
  query: string,
  filters: BrowseState["filters"],
): Promise<ProductCard[]> {
  const products: ProductCard[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < 5; page += 1) {
    const result = await fetchSearchIndexProducts({
      cursor,
      filters,
      limit: PRODUCTS_PER_PAGE,
      query,
    });
    for (const product of result.products) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      products.push(product);
    }
    if (!result.pageInfo.hasNextPage || !result.pageInfo.endCursor) break;
    cursor = result.pageInfo.endCursor;
  }
  return products;
}

function orderByIds(products: ProductCard[], ids: readonly string[]): ProductCard[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered: ProductCard[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const product = byId.get(id);
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    ordered.push(product);
  }
  for (const product of products) {
    if (seen.has(product.id)) continue;
    ordered.push(product);
  }
  return ordered;
}

export async function fetchDesignerResults({
  handle,
  statePromise,
}: {
  handle: string;
  statePromise: Promise<BrowseState>;
}): Promise<BrowseResults> {
  const state = await statePromise;
  const query = designerProductQuery(handle);
  if (!query) {
    return {
      dataSearch: state.dataSearch,
      facets: { filters: [] },
      pageInfo: NO_PAGE,
      products: [],
      source: { type: "search" },
    };
  }
  const order = shopifyCatalogSort(state.sort);
  if (!order) return fetchSearchResults({ query, statePromise: Promise.resolve(state) });
  const [products, facets, ids] = await Promise.all([
    fetchEverySearchProduct(query, state.filters),
    fetchSearchFacets({ filters: state.filters, query }),
    fetchProductIdsByQuery({ query, reverse: order.reverse, sortKey: order.sortKey }),
  ]);
  return {
    dataSearch: state.dataSearch,
    facets: facets.facets,
    pageInfo: NO_PAGE,
    products: orderByIds(products, ids),
    source: { query, type: "search" },
    total: facets.total,
  };
}

export interface DesignerCreditCard extends DesignerCredit {
  avatarUrl: string | null;
  initials: string;
}

const SHIRTAT_CARD: DesignerCreditCard = {
  avatarUrl: HOUSE.avatarUrl,
  handle: SHIRTAT_DESIGNER.handle,
  initials: HOUSE.initials,
  name: SHIRTAT_DESIGNER.name,
  nameAr: SHIRTAT_DESIGNER.nameAr,
};

/** Name, handle, and logo for the product-page credit. Shirtat when the tag is missing or not a public designer. */
export async function getDesignerCreditCard(tags: readonly string[]): Promise<DesignerCreditCard> {
  const handle = designerHandleFromTags(tags);
  if (!handle || handle === SHIRTAT_DESIGNER.handle) return SHIRTAT_CARD;
  try {
    // Live directory read. connection() first so the blob client's Date.now() does not abort prerender.
    await connection();
    const creators = await listCreators();
    const credit = resolveDesignerCredit(tags, publicDesignerCredits(creators));
    if (credit.handle === SHIRTAT_DESIGNER.handle) return SHIRTAT_CARD;
    const creator = creators.find(
      (item) => isPublicDesigner(item) && item.handle === credit.handle,
    );
    return {
      avatarUrl: creator && avatarOf(creator) ? `/api/designers/avatar/${credit.handle}` : null,
      handle: credit.handle,
      initials: initialsOf(credit.name),
      name: credit.name,
    };
  } catch {
    return SHIRTAT_CARD;
  }
}

/** Name and handle for the product-page credit. Shirtat when the tag is missing or not a public designer. */
export async function getDesignerCredit(tags: readonly string[]): Promise<DesignerCredit> {
  const { handle, name, nameAr } = await getDesignerCreditCard(tags);
  return { handle, name, nameAr };
}

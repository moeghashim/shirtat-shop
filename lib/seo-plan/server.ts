import { locales, type Locale } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal/content";
import { getShopPolicies } from "@/lib/policies/server";
import { fetchSearchConsole } from "@/lib/search-console/server";
import { SITEMAP_STATIC_PATHS } from "@/lib/seo";
import { getShopifySitemapPage, getShopifySitemapPagesCount } from "@/lib/seo/server";
import type { ShopifySitemapType } from "@/lib/shopify/operations/sitemap/types";

import {
  parseTaskFilter,
  presentApprovals,
  presentKpiDefinitions,
  presentReference,
  presentTasks,
  presentTimeline,
  progressOf,
  seoPlan,
} from "./index";
import type {
  ApprovalsPayload,
  CountReading,
  KpisPayload,
  ProgressPayload,
  ReferencePayload,
  SeoTool,
  TasksPayload,
  TimelinePayload,
} from "./types";

const SITEMAP_TYPES: readonly ShopifySitemapType[] = [
  "ARTICLE",
  "BLOG",
  "COLLECTION",
  "PAGE",
  "PRODUCT",
];

const API_VERSION = "2025-01";

function storefrontConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  );
}

async function countConnection(root: "collections" | "products"): Promise<CountReading> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return { state: "not-connected" };
  let count = 0;
  let cursor: string | null = null;
  try {
    for (let page = 0; page < 20; page += 1) {
      const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
        body: JSON.stringify({
          query: `query CatalogCount($cursor: String) { ${root}(first: 250, after: $cursor) { nodes { id } pageInfo { hasNextPage endCursor } } }`,
          variables: { cursor },
        }),
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          "x-shopify-storefront-access-token": token,
        },
        method: "POST",
      });
      if (!response.ok) return { state: "unavailable" };
      const json = (await response.json()) as {
        data?: {
          collections?: Connection;
          products?: Connection;
        };
        errors?: unknown[];
      };
      if (json.errors?.length) return { state: "unavailable" };
      const connection = json.data?.[root];
      if (!connection) return { state: "unavailable" };
      count += connection.nodes.length;
      if (!connection.pageInfo.hasNextPage) return { count, state: "ok" };
      if (!connection.pageInfo.endCursor) return { state: "unavailable" };
      cursor = connection.pageInfo.endCursor;
    }
    return { state: "unavailable" };
  } catch {
    return { state: "unavailable" };
  }
}

interface Connection {
  nodes: { id: string }[];
  pageInfo: { endCursor: string | null; hasNextPage: boolean };
}

async function readCatalogCounts(): Promise<{ collections: CountReading; products: CountReading }> {
  const [collections, products] = await Promise.all([
    countConnection("collections"),
    countConnection("products"),
  ]);
  return { collections, products };
}

export async function getCatalogCounts(): Promise<{
  collections: CountReading;
  products: CountReading;
}> {
  if (!storefrontConfigured()) {
    return {
      collections: { state: "not-connected" },
      products: { state: "not-connected" },
    };
  }
  return readCatalogCounts();
}

async function readSitemapUrlCount(): Promise<CountReading> {
  try {
    const policies = await getShopPolicies();
    const paths = new Set<string>([
      ...SITEMAP_STATIC_PATHS,
      ...Object.values(LEGAL).map((page) => page.path),
      ...policies.map((policy) => `/policies/${policy.handle}`),
    ]);
    let urls = paths.size * locales.length;
    for (const type of SITEMAP_TYPES) {
      const pages = await getShopifySitemapPagesCount(type);
      for (let page = 1; page <= pages; page += 1) {
        const { items } = await getShopifySitemapPage(type, page);
        urls += items.length * locales.length;
      }
    }
    return { count: urls, state: "ok" };
  } catch {
    return { state: "unavailable" };
  }
}

export async function getSitemapUrlCount(): Promise<CountReading> {
  return readSitemapUrlCount();
}

export async function readSeoTool(
  tool: SeoTool,
  locale: Locale,
  query: URLSearchParams,
): Promise<
  | ApprovalsPayload
  | KpisPayload
  | ProgressPayload
  | ReferencePayload
  | TasksPayload
  | TimelinePayload
> {
  if (tool === "seo_tasks") {
    return {
      ready: true,
      tasks: presentTasks(
        locale,
        parseTaskFilter({
          area: query.get("area"),
          owner: query.get("owner"),
          phase: query.get("phase"),
          status: query.get("status"),
        }),
      ),
    };
  }
  if (tool === "seo_progress") {
    return { ...progressOf(seoPlan.tasks, locale), ready: true };
  }
  if (tool === "seo_approvals") {
    return { ...presentApprovals(locale), ready: true };
  }
  if (tool === "seo_timeline") {
    return { ready: true, rows: presentTimeline(locale) };
  }
  if (tool === "seo_reference") {
    return { ...presentReference(locale), ready: true };
  }
  const [catalog, gsc, sitemapUrls] = await Promise.all([
    getCatalogCounts(),
    fetchSearchConsole(query.get("window")),
    getSitemapUrlCount(),
  ]);
  return {
    catalog,
    definitions: presentKpiDefinitions(locale),
    gsc,
    ready: true,
    sitemapUrls,
  };
}

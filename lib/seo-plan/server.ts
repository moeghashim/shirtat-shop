import { locales, type Locale } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal/content";
import { getShopPolicies } from "@/lib/policies/server";
import { fetchSearchConsole } from "@/lib/search-console/server";
import { SITEMAP_STATIC_PATHS } from "@/lib/seo";
import {
  getShopifySitemapPage,
  getShopifySitemapPagesCount,
  isIndexableSitemapResource,
} from "@/lib/seo/server";
import type { ShopifySitemapType } from "@/lib/shopify/operations/sitemap/types";

import { getCatalogCounts } from "./catalog";
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
import { countIndexableSitemapUrls } from "./sitemap-count";
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

async function readSitemapUrlCount(): Promise<CountReading> {
  try {
    const policies = await getShopPolicies();
    const paths = new Set<string>([
      ...SITEMAP_STATIC_PATHS,
      ...Object.values(LEGAL).map((page) => page.path),
      ...policies.map((policy) => `/policies/${policy.handle}`),
    ]);
    const resources: { handle: string; type: string }[] = [];
    for (const type of SITEMAP_TYPES) {
      const pages = await getShopifySitemapPagesCount(type);
      for (let page = 1; page <= pages; page += 1) {
        const { items } = await getShopifySitemapPage(type, page);
        for (const item of items) resources.push({ handle: item.handle, type });
      }
    }
    return {
      count: await countIndexableSitemapUrls({
        indexable: (type, handle) => isIndexableSitemapResource(type as ShopifySitemapType, handle),
        localeCount: locales.length,
        paths,
        resources,
      }),
      state: "ok",
    };
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

import { CUSTOM_DESIGN_HANDLES } from "../../../../../lib/custom/handles.ts";
import { LEGAL } from "../../../../../lib/legal/content.ts";
import { SITEMAP_LOCALES, SITEMAP_STATIC_PATHS } from "../../../../../lib/seo/paths.ts";
import { countIndexableSitemapUrls } from "../../../../../lib/seo-plan/sitemap-count.ts";
import type { CountReading } from "../../../../../lib/seo-plan/types.ts";

const API_VERSION = "2025-01";
const SITEMAP_TYPES = ["ARTICLE", "BLOG", "COLLECTION", "PAGE", "PRODUCT"] as const;

type SitemapType = (typeof SITEMAP_TYPES)[number];

function configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN && process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  );
}

async function shopify<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) throw new Error("not-connected");
  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-shopify-storefront-access-token": token,
    },
    method: "POST",
  });
  if (!response.ok) throw new Error("unavailable");
  const json = (await response.json()) as { data?: T; errors?: unknown[] };
  if (json.errors?.length || !json.data) throw new Error("unavailable");
  return json.data;
}

async function policyPaths(): Promise<string[]> {
  const data = await shopify<{
    shop: Record<string, { handle: string } | null>;
  }>(`query AdminSeoPolicies {
    shop {
      contactInformation { handle }
      legalNotice { handle }
      privacyPolicy { handle }
      refundPolicy { handle }
      shippingPolicy { handle }
      termsOfSale { handle }
      termsOfService { handle }
    }
  }`);
  return Object.values(data.shop)
    .filter((policy): policy is { handle: string } => Boolean(policy?.handle))
    .map((policy) => `/policies/${policy.handle}`);
}

async function articleHandles(): Promise<string[]> {
  const handles: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 40; page += 1) {
    const data: {
      articles: {
        nodes: { handle: string }[];
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
      };
    } = await shopify(
      `query AdminSeoArticles($cursor: String) {
        articles(first: 250, after: $cursor, sortKey: UPDATED_AT) {
          nodes { handle }
          pageInfo { endCursor hasNextPage }
        }
      }`,
      { cursor },
    );
    handles.push(...data.articles.nodes.map((article) => article.handle));
    if (!data.articles.pageInfo.hasNextPage) return handles;
    if (!data.articles.pageInfo.endCursor) throw new Error("unavailable");
    cursor = data.articles.pageInfo.endCursor;
  }
  throw new Error("unavailable");
}

async function sitemapHandles(type: Exclude<SitemapType, "ARTICLE">): Promise<string[]> {
  const counted = await shopify<{ sitemap: { pagesCount: { count: number } | null } }>(
    `query AdminSeoSitemapCount($type: SitemapType!) {
      sitemap(type: $type) { pagesCount { count } }
    }`,
    { type },
  );
  const pages = counted.sitemap.pagesCount?.count ?? 0;
  const handles: string[] = [];
  for (let page = 1; page <= pages && page <= 100; page += 1) {
    const data = await shopify<{ sitemap: { resources: { items: { handle: string }[] } | null } }>(
      `query AdminSeoSitemapPage($type: SitemapType!, $page: Int!) {
        sitemap(type: $type) { resources(page: $page) { items { handle } } }
      }`,
      { page, type },
    );
    handles.push(...(data.sitemap.resources?.items ?? []).map((item) => item.handle));
  }
  if (pages > 100) throw new Error("unavailable");
  return handles;
}

async function blogHasArticles(handle: string): Promise<boolean> {
  const data = await shopify<{ blog: { articles: { nodes: { id: string }[] } } | null }>(
    `query AdminSeoBlog($handle: String!) {
      blog(handle: $handle) { articles(first: 1) { nodes { id } } }
    }`,
    { handle },
  );
  return (data.blog?.articles.nodes.length ?? 0) > 0;
}

async function indexable(type: string, handle: string): Promise<boolean> {
  if (type === "PRODUCT") return !CUSTOM_DESIGN_HANDLES.has(handle);
  if (type === "PAGE") return handle !== "contact";
  if (type === "BLOG") return blogHasArticles(handle);
  return true;
}

export async function countAdminSitemapUrls(): Promise<CountReading> {
  if (!configured()) return { state: "not-connected" };
  try {
    const policies = await policyPaths();
    const paths = new Set<string>([
      ...SITEMAP_STATIC_PATHS,
      ...Object.values(LEGAL).map((page) => page.path),
      ...policies,
    ]);
    const resources: { handle: string; type: string }[] = [];
    for (const type of SITEMAP_TYPES) {
      const handles = type === "ARTICLE" ? await articleHandles() : await sitemapHandles(type);
      for (const handle of handles) resources.push({ handle, type });
    }
    return {
      count: await countIndexableSitemapUrls({
        indexable,
        localeCount: SITEMAP_LOCALES.length,
        paths,
        resources,
      }),
      state: "ok",
    };
  } catch {
    return { state: "unavailable" };
  }
}

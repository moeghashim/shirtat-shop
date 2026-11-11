import { notFound } from "next/navigation";

import { shopConfig } from "@/lib/config";
import { GUIDE_PATHS } from "@/lib/guides/copy";
import { locales, localizePath, type Locale } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal/content";
import { getShopPolicies } from "@/lib/policies/server";
import {
  SITEMAP_LOCALIZED_MARKDOWN_PATHS,
  SITEMAP_SHARED_MARKDOWN_PATHS,
  SITEMAP_STATIC_PATHS,
  sitemapResourcePaths,
} from "@/lib/seo";
import { GUIDE_LASTMOD } from "@/lib/seo/paths";
import {
  getShopifySitemapPage,
  getShopifySitemapPagesCount,
  isIndexableSitemapResource,
} from "@/lib/seo/server";
import { type ShopifySitemapType } from "@/lib/shopify/operations/sitemap/types";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toAbsoluteUrl(pathname: string): string {
  return `${shopConfig.site.url}${pathname}`;
}

function urlsetWrap(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

/** One <url> per language, each carrying the full hreflang set (en, ar, x-default). */
function localizedEntries(pathname: string, lastmod?: string): string {
  const href = (locale: Locale) => escapeXml(toAbsoluteUrl(localizePath(locale, pathname)));
  const alternates = [
    ...locales.map(
      (locale) => `    <xhtml:link rel="alternate" hreflang="${locale}" href="${href(locale)}"/>`,
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${href("en")}"/>`,
  ].join("\n");
  return locales
    .map(
      (locale) =>
        `  <url>\n    <loc>${href(locale)}</loc>\n${lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` : ""}${alternates}\n  </url>`,
    )
    .join("\n");
}

const STATIC_PATHS = SITEMAP_STATIC_PATHS;

// Google ignores lastmod that is not a real content date. Legal copy is dated in lib/legal.
const LEGAL_LASTMOD = "2026-10-21";
const STATIC_LASTMOD = "2026-11-10";

function staticLastmod(pathname: string): string {
  if (
    pathname.startsWith("/policies/") ||
    Object.values(LEGAL).some((page) => page.path === pathname)
  ) {
    return LEGAL_LASTMOD;
  }
  if ((GUIDE_PATHS as readonly string[]).includes(pathname)) return GUIDE_LASTMOD;
  return STATIC_LASTMOD;
}

async function renderStatic(): Promise<Response> {
  const policies = await getShopPolicies().catch(() => []);
  const paths = new Set([
    ...STATIC_PATHS,
    ...Object.values(LEGAL).map(({ path }) => path),
    ...policies.map(({ handle }) => `/policies/${handle}`),
  ]);
  const entries = [
    ...[...paths].map((pathname) => localizedEntries(pathname, staticLastmod(pathname))),
    ...SITEMAP_LOCALIZED_MARKDOWN_PATHS.map((pathname) =>
      localizedEntries(pathname, STATIC_LASTMOD),
    ),
    ...GUIDE_PATHS.map((pathname) => localizedEntries(`${pathname}.md`, GUIDE_LASTMOD)),
    ...SITEMAP_SHARED_MARKDOWN_PATHS.map((pathname) => singleEntry(pathname, STATIC_LASTMOD)),
  ].join("\n");
  return xmlResponse(urlsetWrap(entries));
}

function singleEntry(pathname: string, lastmod: string): string {
  return `  <url>\n    <loc>${escapeXml(toAbsoluteUrl(pathname))}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n  </url>`;
}

async function renderShard(
  type: ShopifySitemapType,
  page: number,
  segment: string,
): Promise<Response> {
  if (page < 1 || page > (await getShopifySitemapPagesCount(type))) notFound();
  const { items } = await getShopifySitemapPage(type, page);

  const indexable = [];
  for (const item of items) {
    if (await isIndexableSitemapResource(type, item.handle)) indexable.push(item);
  }
  const kind =
    segment === "products" ? "product" : segment === "collections" ? "collection" : "other";
  const entries = indexable
    .flatMap((item) => {
      const path = item.pathname ?? `/${segment}/${item.handle}`;
      return sitemapResourcePaths(path, kind).map((entry) =>
        localizedEntries(entry, item.updatedAt),
      );
    })
    .join("\n");

  return xmlResponse(urlsetWrap(entries));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shard: string }> },
): Promise<Response> {
  const { shard } = await params;
  const id = shard.endsWith(".xml") ? shard.slice(0, -".xml".length) : shard;

  if (id === "static") return renderStatic();

  const match = id.match(/^(articles|blogs|collections|pages|products)-(\d+)$/);
  if (!match) notFound();

  const segment = match[1];
  const types: Record<string, ShopifySitemapType> = {
    articles: "ARTICLE",
    blogs: "BLOG",
    collections: "COLLECTION",
    pages: "PAGE",
    products: "PRODUCT",
  };
  const type = types[segment];
  if (!type) notFound();

  return renderShard(type, Number(match[2]), segment);
}

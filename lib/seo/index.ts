import type { Metadata } from "next";

import { shopConfig } from "@/lib/config";
import { defaultLocale, type Locale, locales, localizePath } from "@/lib/i18n";

import type { SearchParamsInput } from "./types";

export const SITEMAP_STATIC_PATHS = [
  "/",
  "/collections",
  "/creators",
  "/design",
  "/designers",
  "/making-of",
  "/roadmap",
  "/sales",
] as const;

/** Markdown indexes that have an English and Arabic URL. */
export const SITEMAP_LOCALIZED_MARKDOWN_PATHS = [
  "/collections.md",
  "/collections/all.md",
  "/products.md",
] as const;

/** One URL for both languages. The file itself is bilingual. */
export const SITEMAP_SHARED_MARKDOWN_PATHS = ["/llms-full.txt", "/llms.txt"] as const;

export function sitemapResourcePaths(
  pathname: string,
  kind: "collection" | "other" | "product",
): string[] {
  if (kind === "collection" || kind === "product") return [pathname, `${pathname}.md`];
  return [pathname];
}

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withLeadingSlash === "/") return withLeadingSlash;
  return withLeadingSlash.replace(/\/+$/, "");
}

function toSearchParams(input: SearchParamsInput): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return new URLSearchParams(input);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (key.startsWith("filter.")) {
        if (value.length > 0) params.set(key, value.join(","));
      } else {
        for (const item of value) {
          params.append(key, item);
        }
      }
      continue;
    }
    params.set(key, value);
  }

  return params;
}

function buildCanonicalPath(pathname: string, searchParams?: SearchParamsInput): string {
  const params = toSearchParams(searchParams);
  params.delete("cursor");

  const query = params.toString();
  const normalizedPath = normalizePath(pathname);
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

export function buildAlternates({
  locale = defaultLocale,
  markdown = false,
  pathname,
  searchParams,
}: {
  locale?: Locale;
  markdown?: boolean;
  pathname: string;
  searchParams?: SearchParamsInput;
}): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const candidate of locales) {
    languages[candidate] = buildCanonicalPath(localizePath(candidate, pathname), searchParams);
  }
  languages["x-default"] = buildCanonicalPath(localizePath(defaultLocale, pathname), searchParams);
  const canonical = buildCanonicalPath(localizePath(locale, pathname), searchParams);
  return {
    canonical,
    languages,
    ...(markdown
      ? { types: { "text/markdown": `${buildCanonicalPath(localizePath(locale, pathname))}.md` } }
      : {}),
  };
}

export function buildOpenGraph({
  title,
  description,
  url,
  type,
  images,
  locale,
}: {
  locale?: Locale;
  title: string;
  description?: string;
  url: string;
  type?: "website" | "article";
  images?: Array<
    | string
    | {
        url: string;
        width?: number;
        height?: number;
        alt?: string;
      }
  >;
}): Metadata["openGraph"] {
  // Omit type so product pages can emit og:type=product through raw meta tags.
  return {
    ...(type ? { type } : {}),
    title,
    description,
    url,
    siteName: shopConfig.site.name,
    locale: ogLocale(locale ?? defaultLocale),
    images: images ?? siteOgImages(locale ?? defaultLocale),
  };
}

/** Shirtat-branded share image (1200x630) for the given locale. */
export function siteOgImages(locale: Locale = defaultLocale) {
  const lang = locale === "ar" ? "ar" : "en";
  return [
    {
      url: `/og/${lang}.png?v=2`,
      width: 1200,
      height: 630,
      alt: lang === "ar" ? "شِرتات: ملابس بالخط العربي" : "Shirtat: Arabic calligraphy apparel",
    },
  ];
}

export function ogLocale(locale: Locale = defaultLocale): string {
  return locale === "ar" ? "ar_AR" : "en_US";
}

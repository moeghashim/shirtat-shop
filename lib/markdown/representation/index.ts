import { shopConfig } from "@/lib/config";
import { GUIDE_PATHS } from "@/lib/guides/copy";
import { type Locale } from "@/lib/i18n";

export const MARKDOWN_LOCALE_HEADER = "x-shirtat-locale";

export type MarkdownResolution =
  | { locale: Locale; pathname: string; type: "rewrite" }
  | { location: string; type: "redirect" };

export function markdownLocale(request: Request): Locale {
  return request.headers.get(MARKDOWN_LOCALE_HEADER) === "ar" ? "ar" : "en";
}

/** Internal markdown route for an unprefixed page path. */
export function getMarkdownPath(pathname: string, locale: Locale = "en"): string | null {
  const base = markdownBase(pathname);
  if (!base) return null;
  // Stored product, collection, and guide output is per path. Arabic uses /md/ar so those handlers never read request headers.
  if (locale === "ar" && isStoredMarkdownPath(base)) return `/md/ar${base.slice(3)}`;
  return base;
}

function markdownBase(pathname: string): string | null {
  if (pathname === "/") return "/md";
  if (pathname === "/search") return "/md/search";
  if (pathname === "/products") return "/md/products";
  if (pathname === "/collections") return "/md/collections";
  if (pathname.startsWith("/collections/")) return `/md${pathname}`;
  if (pathname.startsWith("/products/")) return `/md${pathname}`;
  if ((GUIDE_PATHS as readonly string[]).includes(pathname)) return `/md/guides${pathname}`;
  return null;
}

function isStoredMarkdownPath(pathname: string): boolean {
  return (
    pathname.startsWith("/md/products/") ||
    pathname.startsWith("/md/collections/") ||
    pathname.startsWith("/md/guides/")
  );
}

function normalize(pathname: string): string {
  if (pathname === "" || pathname === "/") return "/";
  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return trimmed === "/index" ? "/" : trimmed;
}

// Accept is ignored on purpose: one URL has one body, and markdown is only the .md URL.
export function resolveMarkdownRequest(request: Request): MarkdownResolution | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const { pathname } = new URL(request.url);
  if (!pathname.endsWith(".md")) return null;

  let pagePath = normalize(pathname.slice(0, -".md".length));

  if (pagePath === "/en" || pagePath.startsWith("/en/")) {
    const rest = normalize(pagePath.slice("/en".length));
    return { location: rest === "/" ? "/index.md" : `${rest}.md`, type: "redirect" };
  }

  let locale: Locale = "en";
  if (pagePath === "/ar" || pagePath.startsWith("/ar/")) {
    locale = "ar";
    pagePath = normalize(pagePath.slice("/ar".length));
  }

  const internal = getMarkdownPath(pagePath, locale);
  if (!internal) return null;
  return { locale, pathname: internal, type: "rewrite" };
}

export function markdownHeaders({
  cacheControl,
  pathname,
}: {
  cacheControl: string;
  pathname: string;
}): Headers {
  const arabic = pathname === "/ar" || pathname.startsWith("/ar/");
  return new Headers({
    "Cache-Control": cacheControl,
    "Content-Language": arabic ? "ar" : "en",
    "Content-Type": "text/markdown; charset=utf-8",
    Link: `<${new URL(pathname, shopConfig.site.url)}>; rel="canonical"`,
  });
}

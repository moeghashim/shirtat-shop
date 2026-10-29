import type { CommerceLocale } from "@/lib/config/types";

import { ar as arBase } from "./messages/ar";
import { arCreators } from "./messages/ar-creators";
import { arSupport } from "./messages/ar-support";

const ar = { ...arBase, ...arCreators, ...arSupport };

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Formatting locale for Intl APIs. */
export function formatLocale(locale: Locale): string {
  return locale === "ar" ? "ar" : "en-US";
}

/** Shopify @inContext language; Shopify falls back to the default language when AR is unpublished. */
export function commerceLocale(locale: Locale): CommerceLocale {
  return { country: "US", language: locale === "ar" ? "AR" : "EN" };
}

/** Pages that stay English-only (roadmap, sales, accounts); Arabic links point at the English version. */
const UNLOCALIZED_PREFIXES = ["/roadmap", "/sales", "/account", "/admin", "/api", "/md", "/agent"];

export function isUnlocalizedPath(pathname: string): boolean {
  return UNLOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Strip a leading /ar or /en prefix. */
export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(ar|en)(?=\/|$)/);
  if (!match) return pathname || "/";
  return pathname.slice(match[0].length) || "/";
}

export function localizePath(locale: Locale, pathname: string): string {
  const base = stripLocale(pathname);
  if (locale === defaultLocale || isUnlocalizedPath(base)) return base;
  return base === "/" ? "/ar" : `/ar${base}`;
}

/** Localize an internal href string (keeps query/hash). External or non-root hrefs are returned unchanged. */
export function localizeHref(locale: Locale, href: string): string {
  if (locale === defaultLocale || !href.startsWith("/") || href.startsWith("//")) return href;
  const index = href.search(/[?#]/);
  const path = index === -1 ? href : href.slice(0, index);
  const rest = index === -1 ? "" : href.slice(index);
  if (/\.[a-z0-9]+$/i.test(path)) return href;
  return localizePath(locale, path) + rest;
}

export type MessageKey = keyof typeof ar;

/** English strings are the keys; Arabic comes from the catalog. */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let text = locale === "ar" ? ((ar as Record<string, string>)[key] ?? key) : key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

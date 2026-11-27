import { locale as rootLocale } from "next/root-params";

import { parseCommerceRouteSegment } from "@/lib/commerce";
import type { CommerceLocale } from "@/lib/config/types";

import { defaultLocale, isLocale, type Locale, type Translate, translate } from "./index";

export async function getLocale(): Promise<Locale> {
  const current = await rootLocale();
  return (
    parseCommerceRouteSegment(current)?.locale ?? (isLocale(current) ? current : defaultLocale)
  );
}

export async function getCommerceCountry(): Promise<CommerceLocale["country"]> {
  const current = await rootLocale();
  return parseCommerceRouteSegment(current)?.country ?? "US";
}

export async function getCommerceLocale(): Promise<CommerceLocale> {
  const current = await rootLocale();
  const parsed = parseCommerceRouteSegment(current);
  return {
    country: parsed?.country ?? "US",
    language: (parsed?.locale ?? defaultLocale) === "ar" ? "AR" : "EN",
  };
}

export async function getT(): Promise<Translate> {
  const locale = await getLocale();
  return (key, vars) => translate(locale, key, vars);
}

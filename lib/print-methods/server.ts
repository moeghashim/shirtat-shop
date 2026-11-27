import { getGuideCatalog } from "@/lib/guides/server";
import type { Locale } from "@/lib/i18n";
import { getCommerceLocale } from "@/lib/i18n/server";

import { productsForMethod } from "./index";
import type { PrintMethod } from "./types";

export async function getPrintMethodProducts(method: PrintMethod["id"], locale: Locale) {
  const commerce = await getCommerceLocale();
  const catalog = await getGuideCatalog({
    ...commerce,
    language: locale === "ar" ? "AR" : "EN",
  });
  if (!catalog.ok) return [];
  return productsForMethod(catalog.products, method);
}

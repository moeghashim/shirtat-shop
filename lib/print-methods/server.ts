import { getGuideCatalog } from "@/lib/guides/server";
import { commerceLocale, type Locale } from "@/lib/i18n";

import { productsForMethod } from "./index";
import type { PrintMethod } from "./types";

export async function getPrintMethodProducts(method: PrintMethod["id"], locale: Locale) {
  const catalog = await getGuideCatalog(commerceLocale(locale));
  if (!catalog.ok) return [];
  return productsForMethod(catalog.products, method);
}

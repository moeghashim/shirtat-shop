import { locale as rootLocale } from "next/root-params";

import { defaultLocale, isLocale, type Locale, type Translate, translate } from "./index";

export async function getLocale(): Promise<Locale> {
  const current = await rootLocale();
  return isLocale(current) ? current : defaultLocale;
}

export async function getT(): Promise<Translate> {
  const locale = await getLocale();
  return (key, vars) => translate(locale, key, vars);
}

"use client";

import { createContext, type ReactNode, useContext } from "react";

import { defaultLocale, type Locale, type Translate, translate } from "./index";

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): Translate {
  const locale = useLocale();
  return (key, vars) => translate(locale, key, vars);
}

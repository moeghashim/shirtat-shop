import type { CommerceLocale } from "@/lib/config/types";
import type { Locale } from "@/lib/i18n";

export const COUNTRY_COOKIE = "shirtat_country";
export const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const COUNTRY_HEADER = "x-shirtat-country";
export const LANGUAGE_HEADER = "x-shirtat-language";

export const commerceCountries = [
  {
    code: "US",
    currency: "USD",
    group: "core",
    nameAr: "الولايات المتحدة",
    nameEn: "United States",
  },
  { code: "AE", currency: "AED", group: "core", nameAr: "الإمارات", nameEn: "United Arab Emirates" },
  { code: "SA", currency: "SAR", group: "core", nameAr: "السعودية", nameEn: "Saudi Arabia" },
  {
    code: "GB",
    currency: "GBP",
    group: "core",
    nameAr: "المملكة المتحدة",
    nameEn: "United Kingdom",
  },
  { code: "AT", currency: "EUR", group: "eurozone", nameAr: "النمسا", nameEn: "Austria" },
  { code: "BE", currency: "EUR", group: "eurozone", nameAr: "بلجيكا", nameEn: "Belgium" },
  { code: "HR", currency: "EUR", group: "eurozone", nameAr: "كرواتيا", nameEn: "Croatia" },
  { code: "CY", currency: "EUR", group: "eurozone", nameAr: "قبرص", nameEn: "Cyprus" },
  { code: "EE", currency: "EUR", group: "eurozone", nameAr: "إستونيا", nameEn: "Estonia" },
  { code: "FI", currency: "EUR", group: "eurozone", nameAr: "فنلندا", nameEn: "Finland" },
  { code: "FR", currency: "EUR", group: "eurozone", nameAr: "فرنسا", nameEn: "France" },
  { code: "DE", currency: "EUR", group: "eurozone", nameAr: "ألمانيا", nameEn: "Germany" },
  { code: "GR", currency: "EUR", group: "eurozone", nameAr: "اليونان", nameEn: "Greece" },
  { code: "IE", currency: "EUR", group: "eurozone", nameAr: "أيرلندا", nameEn: "Ireland" },
  { code: "IT", currency: "EUR", group: "eurozone", nameAr: "إيطاليا", nameEn: "Italy" },
  { code: "LV", currency: "EUR", group: "eurozone", nameAr: "لاتفيا", nameEn: "Latvia" },
  { code: "LT", currency: "EUR", group: "eurozone", nameAr: "ليتوانيا", nameEn: "Lithuania" },
  { code: "LU", currency: "EUR", group: "eurozone", nameAr: "لوكسمبورغ", nameEn: "Luxembourg" },
  { code: "MT", currency: "EUR", group: "eurozone", nameAr: "مالطا", nameEn: "Malta" },
  { code: "NL", currency: "EUR", group: "eurozone", nameAr: "هولندا", nameEn: "Netherlands" },
  { code: "PT", currency: "EUR", group: "eurozone", nameAr: "البرتغال", nameEn: "Portugal" },
  { code: "SK", currency: "EUR", group: "eurozone", nameAr: "سلوفاكيا", nameEn: "Slovakia" },
  { code: "SI", currency: "EUR", group: "eurozone", nameAr: "سلوفينيا", nameEn: "Slovenia" },
  { code: "ES", currency: "EUR", group: "eurozone", nameAr: "إسبانيا", nameEn: "Spain" },
] as const;

export type CommerceCountry = (typeof commerceCountries)[number];
export type SupportedCountry = CommerceCountry["code"];

const SUPPORTED_COUNTRIES = new Set<string>(commerceCountries.map((country) => country.code));

export function isSupportedCountry(value: string): value is SupportedCountry {
  return SUPPORTED_COUNTRIES.has(value);
}

export function currencyForCountry(country: string): string {
  const code = country.trim().toUpperCase();
  return commerceCountries.find((entry) => entry.code === code)?.currency ?? "USD";
}

/** Unsupported or empty input is the US market. */
export function resolveCommerceCountry(value: string | null | undefined): SupportedCountry {
  if (!value) return "US";
  const code = value.trim().toUpperCase();
  return isSupportedCountry(code) ? code : "US";
}

/** A supported cookie wins, including an explicit US. An invalid cookie falls through to geo, then US. */
export function resolveRequestCountry(
  cookie: string | null | undefined,
  geo: string | null | undefined,
): SupportedCountry {
  if (cookie?.trim()) {
    const code = cookie.trim().toUpperCase();
    if (isSupportedCountry(code)) return code;
  }
  return resolveCommerceCountry(geo);
}

export function commerceRouteSegment(locale: Locale, country: string): string {
  const resolved = resolveCommerceCountry(country);
  return resolved === "US" ? locale : `${locale}.${resolved.toLowerCase()}`;
}

export function parseCommerceRouteSegment(
  value: string,
): { country: SupportedCountry; locale: Locale } | null {
  const match = /^(en|ar)(?:\.([a-z]{2}))?$/.exec(value);
  if (!match) return null;
  const locale = match[1] as Locale;
  if (!match[2]) return { country: "US", locale };
  const country = match[2].toUpperCase();
  if (!isSupportedCountry(country)) return null;
  return { country, locale };
}

/** Direct visits to the internal segment canonicalize to the public language path. `/ar` stays public. */
export function canonicalPublicPath(pathname: string): string | null {
  const match = pathname.match(/^\/(en|ar)(?:\.([a-z]{2}))?(?=\/|$)/);
  if (!match) return null;
  const locale = match[1];
  const suffix = match[2];
  if (locale === "ar" && !suffix) return null;
  const rest = pathname.slice(match[0].length) || "/";
  if (locale === "ar") return rest === "/" ? "/ar" : `/ar${rest}`;
  return rest;
}

export function readRequestCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

function isArabicPublicPath(pathname: string): boolean {
  return pathname === "/ar" || pathname.startsWith("/ar/");
}

export function languageFromRequest(pathname: string, referer: string | null): "AR" | "EN" {
  if (isArabicPublicPath(pathname)) return "AR";
  if (!referer) return "EN";
  try {
    return isArabicPublicPath(new URL(referer).pathname) ? "AR" : "EN";
  } catch {
    return "EN";
  }
}

export function commerceForProxy(input: {
  cookie: string | null;
  geo: string | null;
  page: boolean;
  pathname: string;
  referer: string | null;
}): CommerceLocale {
  const country = resolveRequestCountry(input.cookie, input.geo);
  const language = input.page
    ? isArabicPublicPath(input.pathname)
      ? "AR"
      : "EN"
    : languageFromRequest(input.pathname, input.referer);
  return { country, language };
}

export function commerceFromRequest(request: Request): CommerceLocale {
  const headerCountry = request.headers.get(COUNTRY_HEADER);
  const headerLanguage = request.headers.get(LANGUAGE_HEADER);
  const country = headerCountry
    ? resolveCommerceCountry(headerCountry)
    : resolveRequestCountry(
        readRequestCookie(request.headers.get("cookie"), COUNTRY_COOKIE),
        request.headers.get("x-vercel-ip-country"),
      );
  const language =
    headerLanguage === "AR" || headerLanguage === "EN"
      ? headerLanguage
      : languageFromRequest(new URL(request.url).pathname, request.headers.get("referer"));
  return { country, language };
}

// Same union as lib/i18n Locale, kept local so the admin app can type-check lib/seo/paths.
type Locale = "en" | "ar";

export interface LocalText {
  ar: string;
  en: string;
}

export interface GuideLink {
  href: string;
  label: LocalText;
}

export interface GuideSection {
  heading: LocalText;
  paragraphs: LocalText[];
}

export type GuideMatch =
  | { groups: readonly (readonly string[])[]; kind: "all" }
  | { kind: "gift" }
  | { kind: "needles"; needles: readonly string[] }
  | { kind: "none" }
  | { kind: "occasions" }
  | { kind: "type"; productType: "baby" | "hoodie" | "kids" | "tee" };

export interface Guide {
  empty: LocalText;
  h1: LocalText;
  intro: LocalText[];
  links: GuideLink[];
  match: GuideMatch;
  path: string;
  sections: GuideSection[];
  seoDescription: LocalText;
  seoTitle: LocalText;
}

export interface RailImage {
  altText: string;
  height: number;
  url: string;
  width: number;
}

export interface RailProduct {
  handle: string;
  image: RailImage | null;
  maxPrice: { amount: string; currencyCode: string };
  price: { amount: string; currencyCode: string };
  title: string;
}

export interface GuideProduct extends RailProduct {
  availableForSale: boolean;
  description: string;
  productType: string;
  tags: string[];
}

export interface ProductRail {
  heading: LocalText;
  note?: LocalText;
  products: RailProduct[];
}

export function pick(text: LocalText, locale: Locale): string {
  return locale === "ar" ? text.ar : text.en;
}

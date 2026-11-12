export interface PrintText {
  ar: string;
  en: string;
}

export interface PrintMethodLink {
  href: string;
  label: PrintText;
}

export interface PrintMethodSection {
  body: PrintText[];
  heading: PrintText;
  id: "best" | "care" | "durability" | "fabric" | "how" | "look";
}

/** Fields the catalog matcher needs. Shopify descriptions carry the method when the metafield does not. */
export interface PrintMethodProduct {
  description: string;
  handle: string;
  productType: string;
  tags: string[];
  title: string;
}

export interface PrintMethod {
  card: PrintText;
  id: "aop" | "dtf" | "dtg" | "embroidery";
  name: PrintText;
  path: string;
  sections: readonly PrintMethodSection[];
  seoDescription: PrintText;
  seoTitle: PrintText;
  shopLinks: readonly PrintMethodLink[];
  shopNote: PrintText;
  slug: string;
  status: PrintText;
}

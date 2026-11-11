import { shopConfig } from "@/lib/config";
import { type Locale, localizePath } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal/content";

export interface OfferPolicyFacts {
  returns: string;
  shipping: string;
}

/** Sentences taken from the shipping and refunds pages, in that page's wording. */
export function offerPolicyFacts(locale: Locale): OfferPolicyFacts {
  const refunds = LEGAL.refunds[locale];
  const shipping = LEGAL.shipping[locale];
  return {
    returns: [refunds.intro, refunds.sections[1]?.body[0], refunds.sections[0]?.body[0]]
      .filter((part): part is string => Boolean(part))
      .join(" "),
    shipping: [
      shipping.intro,
      shipping.sections[1]?.body[0],
      shipping.sections[2]?.body[0],
      shipping.sections[3]?.body[0],
    ]
      .filter((part): part is string => Boolean(part))
      .join(" "),
  };
}

export function absoluteStoreUrl(locale: Locale, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${shopConfig.site.url}${localizePath(locale, path)}`;
}

function dayRange(min: number, max: number, unitText: string) {
  return {
    "@type": "QuantitativeValue",
    maxValue: max,
    minValue: min,
    unitText,
  };
}

export function shippingDetailsJsonLd(locale: Locale, description: string) {
  const unitText = locale === "ar" ? "أيام عمل" : "business days";
  const domestic = {
    "@type": "OfferShippingDetails",
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: dayRange(2, 5, unitText),
      transitTime: dayRange(3, 7, unitText),
    },
    description,
  };
  const international = {
    ...domestic,
    deliveryTime: {
      ...domestic.deliveryTime,
      transitTime: dayRange(7, 20, unitText),
    },
  };
  return [domestic, international];
}

export function returnPolicyJsonLd(locale: Locale, description: string) {
  return {
    "@type": "MerchantReturnPolicy",
    description,
    merchantReturnLink: absoluteStoreUrl(locale, "/refunds"),
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
  };
}

export interface ProductJsonLdImage {
  caption: string;
  height: number;
  url: string;
  width: number;
}

export interface ProductJsonLdInput {
  availableForSale: boolean;
  brand?: string;
  currencyCode: string;
  description: string;
  handle: string;
  highPrice: string;
  images: ProductJsonLdImage[];
  locale: Locale;
  lowPrice: string;
  name: string;
  offerCount: number;
  properties: { name: string; value: string }[];
  sku?: string;
}

export function productJsonLd(input: ProductJsonLdInput) {
  const facts = offerPolicyFacts(input.locale);
  const url = absoluteStoreUrl(input.locale, `/products/${input.handle}`);
  const availability = input.availableForSale
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const singlePrice = input.lowPrice === input.highPrice;
  const commerce = {
    availability,
    hasMerchantReturnPolicy: returnPolicyJsonLd(input.locale, facts.returns),
    priceCurrency: input.currencyCode,
    shippingDetails: shippingDetailsJsonLd(input.locale, facts.shipping),
    url,
    ...(input.sku ? { sku: input.sku } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    additionalProperty: input.properties.length
      ? input.properties.map((property) => ({
          "@type": "PropertyValue",
          name: property.name,
          value: property.value,
        }))
      : undefined,
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    description: input.description,
    image: input.images.map((image) => ({
      "@type": "ImageObject",
      caption: image.caption,
      ...(image.height > 0 ? { height: image.height } : {}),
      name: image.caption,
      url: image.url,
      ...(image.width > 0 ? { width: image.width } : {}),
    })),
    name: input.name,
    offers: singlePrice
      ? { "@type": "Offer", ...commerce, price: input.lowPrice }
      : {
          "@type": "AggregateOffer",
          ...commerce,
          highPrice: input.highPrice,
          lowPrice: input.lowPrice,
          offerCount: input.offerCount,
        },
    sku: input.sku,
  };
}

export function breadcrumbJsonLd(locale: Locale, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteStoreUrl(locale, item.path),
      name: item.name,
      position: index + 1,
    })),
  };
}

export function itemListJsonLd(locale: Locale, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      name: item.name,
      position: index + 1,
      url: absoluteStoreUrl(locale, item.path),
    })),
    numberOfItems: items.length,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function isAbsoluteUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("https://") || value.startsWith("http://"));
}

function dayRangeErrors(value: unknown, label: string): string[] {
  const range = asRecord(value);
  if (!range) return [`${label} missing`];
  const errors: string[] = [];
  if (range["@type"] !== "QuantitativeValue") errors.push(`${label} type`);
  if (typeof range.minValue !== "number" || typeof range.maxValue !== "number") {
    errors.push(`${label} min/max`);
  } else if (range.minValue > range.maxValue) errors.push(`${label} inverted`);
  if (typeof range.unitText !== "string" || range.unitText.length === 0) {
    errors.push(`${label} unit`);
  }
  return errors;
}

/** Local stand-in for the Product, Offer, breadcrumb and ItemList checks a rich-results test applies. */
export function auditJsonLd(schema: unknown): string[] {
  const node = asRecord(schema);
  if (!node) return ["schema is not an object"];
  const type = node["@type"];
  if (type === "Product") return auditProduct(node);
  if (type === "BreadcrumbList") return auditBreadcrumb(node);
  if (type === "ItemList") return auditItemList(node);
  if (type === "Organization") return auditOrganization(node);
  return [`unsupported @type ${String(type)}`];
}

function auditProduct(node: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (node["@context"] !== "https://schema.org") errors.push("Product context");
  if (typeof node.name !== "string" || node.name.length === 0) errors.push("Product name");
  if (typeof node.description !== "string") errors.push("Product description");
  if (!Array.isArray(node.image) || node.image.length === 0) errors.push("Product image");
  if (node.sku !== undefined && typeof node.sku !== "string") errors.push("Product sku");
  const offer = asRecord(node.offers);
  if (!offer) return [...errors, "Product offers"];
  const offerType = offer["@type"];
  if (offerType !== "Offer" && offerType !== "AggregateOffer") errors.push("Offer type");
  if (offerType === "Offer" && typeof offer.price !== "string") errors.push("Offer price");
  if (offerType === "AggregateOffer") {
    if (typeof offer.lowPrice !== "string" || typeof offer.highPrice !== "string") {
      errors.push("AggregateOffer prices");
    }
    if (typeof offer.offerCount !== "number" || offer.offerCount < 1) {
      errors.push("AggregateOffer offerCount");
    }
  }
  if (typeof offer.priceCurrency !== "string" || offer.priceCurrency.length !== 3) {
    errors.push("Offer priceCurrency");
  }
  if (
    offer.availability !== "https://schema.org/InStock" &&
    offer.availability !== "https://schema.org/OutOfStock"
  ) {
    errors.push("Offer availability");
  }
  if (!isAbsoluteUrl(offer.url)) errors.push("Offer url");
  if (offer.shippingRate !== undefined) errors.push("shipping rate invented");
  const details = Array.isArray(offer.shippingDetails) ? offer.shippingDetails : [];
  if (details.length === 0) errors.push("shippingDetails");
  details.forEach((detail, index) => {
    const row = asRecord(detail);
    if (!row || row["@type"] !== "OfferShippingDetails") {
      errors.push(`shippingDetails ${index} type`);
      return;
    }
    const time = asRecord(row.deliveryTime);
    if (!time || time["@type"] !== "ShippingDeliveryTime") {
      errors.push(`shippingDetails ${index} deliveryTime`);
      return;
    }
    errors.push(...dayRangeErrors(time.handlingTime, `handling ${index}`));
    errors.push(...dayRangeErrors(time.transitTime, `transit ${index}`));
  });
  const policy = asRecord(offer.hasMerchantReturnPolicy);
  if (!policy || policy["@type"] !== "MerchantReturnPolicy") errors.push("hasMerchantReturnPolicy");
  else {
    if (
      typeof policy.returnPolicyCategory !== "string" ||
      !policy.returnPolicyCategory.startsWith("https://schema.org/")
    ) {
      errors.push("returnPolicyCategory");
    }
    if (!isAbsoluteUrl(policy.merchantReturnLink)) errors.push("merchantReturnLink");
    if (typeof policy.description !== "string" || policy.description.length === 0) {
      errors.push("return description");
    }
  }
  if (Array.isArray(node.additionalProperty)) {
    for (const property of node.additionalProperty) {
      const row = asRecord(property);
      if (
        !row ||
        row["@type"] !== "PropertyValue" ||
        typeof row.name !== "string" ||
        typeof row.value !== "string"
      ) {
        errors.push("additionalProperty");
      }
    }
  }
  return errors;
}

function auditBreadcrumb(node: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const items = Array.isArray(node.itemListElement) ? node.itemListElement : [];
  if (items.length < 2) errors.push("breadcrumb length");
  items.forEach((item, index) => {
    const row = asRecord(item);
    if (!row || row["@type"] !== "ListItem") errors.push(`breadcrumb ${index} type`);
    else {
      if (row.position !== index + 1) errors.push(`breadcrumb ${index} position`);
      if (typeof row.name !== "string" || row.name.length === 0)
        errors.push(`breadcrumb ${index} name`);
      if (!isAbsoluteUrl(row.item)) errors.push(`breadcrumb ${index} item`);
    }
  });
  return errors;
}

function auditItemList(node: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const items = Array.isArray(node.itemListElement) ? node.itemListElement : [];
  if (items.length === 0) errors.push("ItemList empty");
  if (node.numberOfItems !== items.length) errors.push("ItemList numberOfItems");
  items.forEach((item, index) => {
    const row = asRecord(item);
    if (!row || row["@type"] !== "ListItem") errors.push(`ItemList ${index} type`);
    else {
      if (row.position !== index + 1) errors.push(`ItemList ${index} position`);
      if (typeof row.name !== "string" || row.name.length === 0)
        errors.push(`ItemList ${index} name`);
      if (!isAbsoluteUrl(row.url)) errors.push(`ItemList ${index} url`);
    }
  });
  return errors;
}

function auditOrganization(node: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (typeof node.name !== "string" || node.name.length === 0) errors.push("Organization name");
  if (node.alternateName !== "شيرتات") errors.push("Organization alternateName");
  if (!isAbsoluteUrl(node.url)) errors.push("Organization url");
  return errors;
}

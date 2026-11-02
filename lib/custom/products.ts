import { retailPrice, SUPPLIER_CATALOG } from "@/lib/catalog/pricing";

import regions from "./regions.json";

/** Shopify handles of the two products the design builder sells. */
export const CUSTOM_TEE_HANDLE = "custom-calligraphy-t-shirt";
export const CUSTOM_MUG_HANDLE = "custom-calligraphy-mug";
export const CUSTOM_TAG = "custom-design";
export const CUSTOM_SKU_PREFIX = "CUS-";

export type CustomKind = "mug" | "tee";

export const CUSTOM_PROPERTY = {
  preset: "Preset",
  style: "Style",
  text: "Text",
} as const;

export const MAX_CUSTOM_TEXT = 80;

export const MUG_REGIONS = {
  eu: { catalogId: "mug-eu", labelAr: "أوروبا والمملكة المتحدة", labelEn: "Europe & UK" },
  us: { catalogId: "mug-us", labelAr: "الولايات المتحدة", labelEn: "United States" },
} as const;
export type MugRegion = keyof typeof MUG_REGIONS;

/** Countries the EU mug provider (OPT OnDemand, Germany) delivers to; shared with scripts/custom-order.mjs. */
export const EU_MUG_COUNTRIES = new Set<string>(regions.euMugCountries);

export function mugRegionForCountry(code: string | undefined): MugRegion | undefined {
  if (!code) return undefined;
  if (code === "US") return "us";
  return EU_MUG_COUNTRIES.has(code) ? "eu" : undefined;
}

/** SKU on every custom variant: CUS-TEE-<printifyVariantId> or CUS-MUG-<US|EU>-<11|15>. */
export function teeSku(printifyVariantId: number): string {
  return `${CUSTOM_SKU_PREFIX}TEE-${printifyVariantId}`;
}

export function mugSku(region: MugRegion, size: "11oz" | "15oz"): string {
  return `${CUSTOM_SKU_PREFIX}MUG-${region.toUpperCase()}-${size.replace("oz", "")}`;
}

export type ParsedCustomSku =
  | { kind: "mug"; region: MugRegion; size: "11oz" | "15oz" }
  | { kind: "tee"; variantId: number };

export function parseCustomSku(sku: string | null | undefined): ParsedCustomSku | null {
  if (!sku?.startsWith(CUSTOM_SKU_PREFIX)) return null;
  const tee = sku.match(/^CUS-TEE-(\d+)$/);
  if (tee) return { kind: "tee", variantId: Number(tee[1]) };
  const mug = sku.match(/^CUS-MUG-(US|EU)-(11|15)$/);
  if (mug) {
    return {
      kind: "mug",
      region: mug[1]!.toLowerCase() as MugRegion,
      size: `${mug[2]}oz` as "11oz" | "15oz",
    };
  }
  return null;
}

/** Printify blueprint, provider and variant for a custom SKU, taken from the supplier catalog. */
export function printifyTargetForSku(sku: string) {
  const parsed = parseCustomSku(sku);
  if (!parsed) return null;
  if (parsed.kind === "tee") {
    const cat = SUPPLIER_CATALOG["t-shirt"]!;
    for (const sizes of Object.values(cat.variants))
      for (const v of Object.values(sizes))
        if (v.id === parsed.variantId)
          return {
            blueprintId: cat.blueprintId,
            cost: v.cost,
            providerId: cat.providerId,
            variantId: v.id,
          };
    return null;
  }
  const cat = SUPPLIER_CATALOG[MUG_REGIONS[parsed.region].catalogId]!;
  const v = cat.variants.White?.[parsed.size];
  return v
    ? { blueprintId: cat.blueprintId, cost: v.cost, providerId: cat.providerId, variantId: v.id }
    : null;
}

export const customPrice = retailPrice;

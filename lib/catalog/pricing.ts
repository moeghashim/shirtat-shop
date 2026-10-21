/**
 * Supplier: Printify. Costs below are REAL Printify base costs (USD, blank + one front print,
 * excluding shipping and tax) read from the Printify API on 21 Oct 2026 for the chosen
 * blueprint/provider/variant (see printify-catalog.json). Retail price rule, per variant:
 * supplier cost × 3, rounded UP to the next $x.99.
 */
import catalog from "./printify-catalog.json";

export const SUPPLIER = {
  apiDocs: "https://developers.printify.com/",
  id: "printify",
  name: "Printify",
} as const;

export const PRICE_MULTIPLIER = 3;

export interface PrintifyVariant {
  cost: number;
  id: number;
}

export interface SupplierProduct {
  blueprint: string;
  blueprintId: number;
  provider: string;
  providerId: number;
  /** colour → size → Printify variant id and cost */
  variants: Record<string, Record<string, PrintifyVariant>>;
}

export const SUPPLIER_CATALOG = catalog as Record<string, SupplierProduct>;

/** cost × 3, rounded up to the next .99 (e.g. 11.29 → 33.87 → 33.99). */
export function retailPrice(costUsd: number): string {
  const raw = Math.round(costUsd * PRICE_MULTIPLIER * 100) / 100;
  return (Math.ceil(raw + 0.01) - 0.01).toFixed(2);
}

/** Printify variant for a Shopify colour/size (prints ignore colour). */
export function supplierVariant(
  typeId: string,
  color: string,
  size: string,
): PrintifyVariant | undefined {
  const p = SUPPLIER_CATALOG[typeId];
  if (!p) return undefined;
  const byColor = p.variants[color] ?? Object.values(p.variants)[0];
  return byColor?.[size];
}

export function variantPrice(typeId: string, color: string, size: string): string | undefined {
  const v = supplierVariant(typeId, color, size);
  return v ? retailPrice(v.cost) : undefined;
}

/** Lowest cost for the type (the standard sizes). */
export function baseCost(typeId: string): number | undefined {
  const p = SUPPLIER_CATALOG[typeId];
  if (!p) return undefined;
  return Math.min(...Object.values(p.variants).flatMap((s) => Object.values(s).map((v) => v.cost)));
}

export function priceForType(typeId: string): string | undefined {
  const c = baseCost(typeId);
  return c === undefined ? undefined : retailPrice(c);
}

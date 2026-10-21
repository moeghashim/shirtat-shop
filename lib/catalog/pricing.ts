/**
 * Supplier: Printify (print-on-demand, Shopify app + public REST API, US and international providers).
 * Costs are Printify Free-plan USD base costs (blank + one print area, excluding shipping and tax),
 * checked October 2026. Retail price rule: supplier cost × 3, rounded UP to the next $x.99.
 */
export const SUPPLIER = {
  apiDocs: "https://developers.printify.com/",
  id: "printify",
  name: "Printify",
} as const;

export const PRICE_MULTIPLIER = 3;

export interface SupplierCost {
  /** Printify catalog blueprint (verify with GET /v1/catalog/blueprints.json before enabling). */
  blueprint: string;
  blueprintId: number | null;
  costUsd: number;
  source: string;
}

export const SUPPLIER_COSTS: Record<string, SupplierCost> = {
  "t-shirt": {
    blueprint: "Bella+Canvas 3001 Unisex Jersey Short Sleeve Tee",
    blueprintId: 12,
    costUsd: 10.98,
    source: "https://printify.com/app/products (Bella+Canvas 3001, from $10.98 Free plan)",
  },
  hoodie: {
    blueprint: "Gildan 18500 Unisex Heavy Blend Hooded Sweatshirt",
    blueprintId: 77,
    costUsd: 21.58,
    source: "https://printify.com/blog/cheapest-print-on-demand-products/ (Gildan 18500 $21.58)",
  },
  sweatshirt: {
    blueprint: "Gildan 18000 Unisex Heavy Blend Crewneck Sweatshirt",
    blueprintId: 49,
    costUsd: 17.87,
    source: "https://printify.com/blog/gildan-sweatshirts/ (Gildan 18000 from $17.87)",
  },
  "tote-bag": {
    blueprint: "Cotton Canvas Tote Bag",
    blueprintId: null,
    costUsd: 9.5,
    source: "Printify catalog, standard cotton tote ≈ $9.50 (confirm in the product editor)",
  },
  print: {
    blueprint: "Matte Vertical Poster",
    blueprintId: null,
    costUsd: 4.96,
    source:
      "https://printify.com/blog/cheapest-print-on-demand-products/ (Matte Vertical Poster $4.96)",
  },
};

/** cost × 3, rounded up to the next .99 (e.g. 32.94 → 32.99, 64.74 → 64.99). */
export function retailPrice(costUsd: number): string {
  const raw = costUsd * PRICE_MULTIPLIER;
  const price = Math.ceil(raw + 0.01) - 0.01;
  return price.toFixed(2);
}

export function priceForType(typeId: string): string | undefined {
  const c = SUPPLIER_COSTS[typeId];
  return c ? retailPrice(c.costUsd) : undefined;
}

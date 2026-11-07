export const SENATOR_HEADING = "Habibi, Call Me Senator";
export const SENATOR_PHRASE = "HABIBI CALL ME SENATOR";

export const SENATOR_TYPES = [
  { id: "cap", label: "Cap", productTypes: ["Cap"] },
  { id: "hoodie", label: "Hoodie", productTypes: ["Hoodie"] },
  { id: "mug", label: "Mug", productTypes: ["Mug"] },
  { id: "t-shirt", label: "T-shirt", productTypes: ["T-Shirt"] },
] as const;

export interface SenatorProduct {
  handle: string;
  image: { altText: string | null; url: string } | null;
  price: { amount: string; currencyCode: string };
  productType: string;
  title: string;
}

export interface SenatorSlot<T> {
  id: (typeof SENATOR_TYPES)[number]["id"];
  label: (typeof SENATOR_TYPES)[number]["label"];
  product: T | null;
}

/** Both words, as tokens. A fuzzy catalog hit such as "hubb" does not qualify. */
export function isSenatorCampaignProduct(product: { handle: string; title: string }): boolean {
  const hay = ` ${`${product.handle} ${product.title}`.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  return hay.includes(" habibi ") && hay.includes(" senator ");
}

export function senatorSlots<T extends { handle: string; productType: string; title: string }>(
  products: T[],
): SenatorSlot<T>[] {
  const matched = products.filter(isSenatorCampaignProduct);
  return SENATOR_TYPES.map((type) => ({
    id: type.id,
    label: type.label,
    product:
      matched.find((product) =>
        (type.productTypes as readonly string[]).includes(product.productType),
      ) ?? null,
  }));
}

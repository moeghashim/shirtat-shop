import { priceForType } from "@/lib/catalog/pricing";

/**
 * Product types creators can choose for a design. One config drives the upload form (EN/AR),
 * the Shopify draft (productType, standard category, variants) and the matching collection.
 * basePrice is the USD retail price: Printify cost × 3 rounded up to .99 (lib/catalog/pricing.ts).
 */
export interface ProductTypeConfig {
  basePrice: string;
  category: string;
  collectionHandle: string;
  colors: { ar: string; en: string }[];
  id: string;
  labelAr: string;
  labelEn: string;
  productType: string;
  sizes: string[];
}

const APPAREL_SIZES = ["S", "M", "L", "XL", "2XL"];
/** Colour names match Printify variant colours (lib/catalog/printify-catalog.json). */
const C = {
  black: { ar: "أسود", en: "Black" },
  white: { ar: "أبيض", en: "White" },
  navy: { ar: "كحلي", en: "Navy" },
  maroon: { ar: "عنابي", en: "Maroon" },
};
const TEE_COLORS = [
  C.black,
  C.white,
  C.navy,
  C.maroon,
  { ar: "طبيعي", en: "Natural" },
  { ar: "كريمي", en: "Soft Cream" },
  { ar: "رملي", en: "Sand Dune" },
  { ar: "رمادي مُبرقش", en: "Athletic Heather" },
  { ar: "زيتي", en: "Olive" },
];
const FLEECE_COLORS = [
  C.black,
  C.white,
  C.navy,
  C.maroon,
  { ar: "بني داكن", en: "Dark Chocolate" },
  { ar: "رملي", en: "Sand" },
  { ar: "رمادي", en: "Sport Grey" },
];

export const PRODUCT_TYPES: ProductTypeConfig[] = [
  {
    basePrice: priceForType("t-shirt")!,
    category: "gid://shopify/TaxonomyCategory/aa-1-13-8",
    collectionHandle: "t-shirts",
    colors: TEE_COLORS,
    id: "t-shirt",
    labelAr: "تيشيرت",
    labelEn: "T-shirt",
    productType: "T-Shirt",
    sizes: APPAREL_SIZES,
  },
  {
    basePrice: priceForType("hoodie")!,
    category: "gid://shopify/TaxonomyCategory/aa-1-13-13",
    collectionHandle: "hoodies",
    colors: FLEECE_COLORS,
    id: "hoodie",
    labelAr: "هودي",
    labelEn: "Hoodie",
    productType: "Hoodie",
    sizes: APPAREL_SIZES,
  },
  {
    basePrice: priceForType("sweatshirt")!,
    category: "gid://shopify/TaxonomyCategory/aa-1-13-14",
    collectionHandle: "sweatshirts",
    colors: FLEECE_COLORS,
    id: "sweatshirt",
    labelAr: "سويتشيرت",
    labelEn: "Sweatshirt",
    productType: "Sweatshirt",
    sizes: APPAREL_SIZES,
  },
  {
    basePrice: priceForType("tote-bag")!,
    category: "gid://shopify/TaxonomyCategory/lb-13",
    collectionHandle: "tote-bags",
    colors: [
      { ar: "أسود", en: "Black" },
      { ar: "كريمي", en: "Cream" },
    ],
    id: "tote-bag",
    labelAr: "حقيبة قماشية",
    labelEn: "Tote bag",
    productType: "Tote Bag",
    sizes: ["One size"],
  },
  {
    basePrice: priceForType("print")!,
    category: "gid://shopify/TaxonomyCategory/hg-3-4-2-1",
    collectionHandle: "posters-prints",
    colors: [{ ar: "ورق أبيض", en: "White paper" }],
    id: "print",
    labelAr: "لوحة مطبوعة",
    labelEn: "Print",
    productType: "Poster",
    sizes: ['12" x 18"', '18" x 24"'],
  },
];

export function getProductType(id: string): ProductTypeConfig | undefined {
  return PRODUCT_TYPES.find((t) => t.id === id);
}

/**
 * Product types creators can choose for a design. One config drives the upload form (EN/AR),
 * the Shopify draft (productType, standard category, variants) and the matching collection.
 * basePrice is the USD placeholder price shown on the site. The Shopify store stays in GBP, so drafts
 * are created at the GBP equivalent (today's rate) and display back as roughly this USD price.
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
const BASIC_COLORS = [
  { ar: "أسود", en: "Black" },
  { ar: "أبيض", en: "White" },
  { ar: "رملي", en: "Sand" },
  { ar: "كحلي", en: "Navy" },
];

export const PRODUCT_TYPES: ProductTypeConfig[] = [
  {
    basePrice: "30.00",
    category: "gid://shopify/TaxonomyCategory/aa-1-13-8",
    collectionHandle: "t-shirts",
    colors: [...BASIC_COLORS, { ar: "زيتي", en: "Olive" }],
    id: "t-shirt",
    labelAr: "تيشيرت",
    labelEn: "T-shirt",
    productType: "T-Shirt",
    sizes: APPAREL_SIZES,
  },
  {
    basePrice: "55.00",
    category: "gid://shopify/TaxonomyCategory/aa-1-13-13",
    collectionHandle: "hoodies",
    colors: BASIC_COLORS,
    id: "hoodie",
    labelAr: "هودي",
    labelEn: "Hoodie",
    productType: "Hoodie",
    sizes: APPAREL_SIZES,
  },
  {
    basePrice: "50.00",
    category: "gid://shopify/TaxonomyCategory/aa-1-13-14",
    collectionHandle: "sweatshirts",
    colors: BASIC_COLORS,
    id: "sweatshirt",
    labelAr: "سويتشيرت",
    labelEn: "Sweatshirt",
    productType: "Sweatshirt",
    sizes: APPAREL_SIZES,
  },
  {
    basePrice: "22.00",
    category: "gid://shopify/TaxonomyCategory/lb-13",
    collectionHandle: "tote-bags",
    colors: [
      { ar: "طبيعي", en: "Natural" },
      { ar: "أسود", en: "Black" },
    ],
    id: "tote-bag",
    labelAr: "حقيبة قماشية",
    labelEn: "Tote bag",
    productType: "Tote Bag",
    sizes: ["One size"],
  },
  {
    basePrice: "25.00",
    category: "gid://shopify/TaxonomyCategory/hg-3-4-2-1",
    collectionHandle: "posters-prints",
    colors: [{ ar: "ورق أبيض", en: "White paper" }],
    id: "print",
    labelAr: "لوحة مطبوعة",
    labelEn: "Print",
    productType: "Poster",
    sizes: ["A4", "A3", "A2"],
  },
];

export function getProductType(id: string): ProductTypeConfig | undefined {
  return PRODUCT_TYPES.find((t) => t.id === id);
}

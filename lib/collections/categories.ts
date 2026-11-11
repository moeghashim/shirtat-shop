/**
 * Storefront categories. Each is a Shopify smart collection matching the tag `category:<id>`.
 * Arabic titles/descriptions are applied here because the store has no Arabic translations.
 */
export interface CategoryConfig {
  descriptionAr: string;
  descriptionEn: string;
  id: string;
  labelAr: string;
  labelEn: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    descriptionAr: "تصاميم مستوحاة من الشعر العربي: أبيات قديمة وحديثة بخط عربي جميل.",
    descriptionEn: "Designs built on Arabic poetry: classic and modern verses set in calligraphy.",
    id: "poetry",
    labelAr: "شعر",
    labelEn: "Poetry",
  },
  {
    descriptionAr: "عبارات الشارع والأمثال اليومية التي تُضحك العالم العربي.",
    descriptionEn: "Arab street slang and everyday sayings that make the Arab world laugh.",
    id: "humor",
    labelAr: "فكاهة",
    labelEn: "Humor",
  },
  {
    descriptionAr: "تصاميم تحتفي بتنوّع الثقافات واللهجات والتقاليد في العالم العربي.",
    descriptionEn:
      "Designs celebrating the many cultures, dialects and traditions across the Arab world.",
    id: "cultures",
    labelAr: "ثقافات",
    labelEn: "Cultures",
  },
  {
    descriptionAr: "للّحظات المهمة: العيد، أعياد الميلاد، ليلة الخطوبة، الأعراس، التخرّج وغيرها.",
    descriptionEn:
      "For the moments that matter: Eid, birthdays, engagement nights, weddings, graduations and more.",
    id: "occasions",
    labelAr: "مناسبات",
    labelEn: "Occasions",
  },
  {
    descriptionAr: "تصاميم عن الحياة العامة والكلمات التي يرتديها الناس حين يعبّرون.",
    descriptionEn: "Designs about public life and the words people wear when they speak up.",
    id: "politics",
    labelAr: "سياسة",
    labelEn: "Politics",
  },
  {
    descriptionAr: "تصاميم شيرتات بالخط العربي بمقاسات الأطفال.",
    descriptionEn: "Shirtat calligraphy designs in kids' sizes.",
    id: "kids",
    labelAr: "أطفال",
    labelEn: "Kids",
  },
  {
    descriptionAr: "بدلات رضّع قطنية ناعمة بتصاميم شيرتات.",
    descriptionEn: "Soft cotton baby bodysuits with Shirtat designs.",
    id: "baby",
    labelAr: "رضّع",
    labelEn: "Baby",
  },
];

export function getCategory(id: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Garment collections published in the shop. Labels are for product-page links only. */
const PRODUCT_COLLECTIONS: { id: string; labelAr: string; labelEn: string; suffixes: string[] }[] =
  [
    { id: "kids", labelAr: "أطفال", labelEn: "Kids", suffixes: ["-kids-t-shirt"] },
    { id: "baby", labelAr: "رضّع", labelEn: "Baby", suffixes: ["-baby-bodysuit"] },
    { id: "t-shirts", labelAr: "تيشيرتات", labelEn: "T-shirts", suffixes: ["-t-shirt"] },
    { id: "hoodies", labelAr: "هوديز", labelEn: "Hoodies", suffixes: ["-hoodie"] },
    { id: "sweatshirts", labelAr: "سويتشيرتات", labelEn: "Sweatshirts", suffixes: ["-sweatshirt"] },
    { id: "tote-bags", labelAr: "حقائب قماشية", labelEn: "Tote bags", suffixes: ["-tote-bag"] },
    { id: "posters-prints", labelAr: "مطبوعات", labelEn: "Prints", suffixes: ["-print"] },
    {
      id: "caps-beanies",
      labelAr: "قبعات وطواقي",
      labelEn: "Caps & beanies",
      suffixes: ["-cap", "-beanie"],
    },
    { id: "mugs", labelAr: "أكواب", labelEn: "Mugs", suffixes: ["-mug"] },
  ];

const PRODUCT_SUFFIXES = PRODUCT_COLLECTIONS.flatMap((collection) =>
  collection.suffixes.map((suffix) => ({ id: collection.id, suffix })),
).sort((a, b) => b.suffix.length - a.suffix.length || a.suffix.localeCompare(b.suffix));

const COLLECTION_ORDER = ["poetry", "humor", "occasions", "politics", "cultures", "kids", "baby"];
const PRODUCT_ORDER = PRODUCT_COLLECTIONS.map((collection) => collection.id);

export function collectionLabel(id: string): { labelAr: string; labelEn: string } | undefined {
  const category = getCategory(id);
  if (category) return { labelAr: category.labelAr, labelEn: category.labelEn };
  const product = PRODUCT_COLLECTIONS.find((collection) => collection.id === id);
  return product ? { labelAr: product.labelAr, labelEn: product.labelEn } : undefined;
}

/** The published product-type collection for this handle, when the shop has one. */
export function productCollectionId(handle: string): string | undefined {
  return PRODUCT_SUFFIXES.find((rule) => handle.endsWith(rule.suffix))?.id;
}

/** Theme collections plus the product-type collection. Only ids the shop publishes. */
export function relatedCollectionIds(handle: string, tags: readonly string[]): string[] {
  const tagged = tags
    .filter((tag) => tag.startsWith("category:"))
    .map((tag) => tag.slice("category:".length));
  const typeId = productCollectionId(handle);
  return [...new Set([...tagged, ...(typeId ? [typeId] : [])])]
    .filter((id) => collectionLabel(id))
    .sort((a, b) => collectionSort(a) - collectionSort(b));
}

function collectionSort(id: string): number {
  const theme = COLLECTION_ORDER.indexOf(id);
  if (theme >= 0) return theme;
  const type = PRODUCT_ORDER.indexOf(id);
  return type >= 0
    ? COLLECTION_ORDER.length + type
    : PRODUCT_ORDER.length + COLLECTION_ORDER.length;
}

/** One collection for the product breadcrumb: the theme, otherwise the product type. */
export function breadcrumbCollectionId(
  handle: string,
  tags: readonly string[],
): string | undefined {
  const ids = relatedCollectionIds(handle, tags);
  const theme = ids.find((id) => {
    const category = getCategory(id);
    return category !== undefined && id !== "kids" && id !== "baby";
  });
  return theme ?? productCollectionId(handle) ?? ids[0];
}

/** A known category before Shopify has a collection for it. No product id is invented. */
export function categoryCollection(handle: string, language?: string) {
  const cat = getCategory(handle);
  if (!cat) return undefined;
  const arabic = language === "ar" || language === "AR";
  const description = arabic ? cat.descriptionAr : cat.descriptionEn;
  const title = arabic ? cat.labelAr : cat.labelEn;
  return {
    description,
    handle,
    image: null,
    path: `/collections/${handle}`,
    seo: { description, title },
    title,
  };
}

/** Swap in Arabic title/description for category collections when the locale is Arabic. */
export function localizeCategory<T extends { description: string; handle: string; title: string }>(
  collection: T,
  language?: string,
): T {
  if (language !== "AR") return collection;
  const cat = getCategory(collection.handle);
  if (!cat) return collection;
  const out = { ...collection, description: cat.descriptionAr, title: cat.labelAr };
  if ("seo" in out && out.seo && typeof out.seo === "object")
    (out as Record<string, unknown>).seo = { description: cat.descriptionAr, title: cat.labelAr };
  if ("descriptionHtml" in out)
    (out as Record<string, unknown>).descriptionHtml = `<p>${cat.descriptionAr}</p>`;
  return out;
}

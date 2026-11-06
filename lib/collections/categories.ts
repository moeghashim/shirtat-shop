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

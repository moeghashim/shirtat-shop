import { CATEGORIES } from "@/lib/collections/categories";

/** Keyword hints (EN, AR, transliterated Arabic) for the four storefront categories. */
const KEYWORDS: Record<string, string[]> = {
  occasions: [
    "eid",
    "عيد",
    "ramadan",
    "رمضان",
    "birthday",
    "ميلاد",
    "engagement",
    "خطوبة",
    "خطوبه",
    "wedding",
    "عرس",
    "زفاف",
    "فرح",
    "graduation",
    "تخرج",
    "mubarak",
    "مبارك",
    "kareem",
    "كريم",
    "henna",
    "حنة",
    "baby",
    "مولود",
    "anniversary",
    "new year",
    "congrat",
    "مبروك",
    "mabrouk",
  ],
  humor: [
    "funny",
    "slang",
    "joke",
    "lol",
    "haha",
    "هههه",
    "يلا",
    "yalla",
    "habibi",
    "حبيبي",
    "shu",
    "شو",
    "khalas",
    "خلاص",
    "wallah",
    "والله",
    "mafi",
    "مافي",
    "mish",
    "مش",
    "mosh",
    "inshallah",
    "إن شاء الله",
    "ان شاء الله",
    "عادي",
    "3adi",
    "يا حبيبي",
    "زهقان",
    "تعبان",
    "صاحي",
    "قهوة",
    "coffee",
    "street",
  ],
  poetry: [
    "poem",
    "poetry",
    "verse",
    "شعر",
    "قصيدة",
    "بيت",
    "mutanabbi",
    "المتنبي",
    "darwish",
    "درويش",
    "qabbani",
    "قباني",
    "qifa",
    "قفا",
    "imru",
    "امرؤ",
    "حب",
    "love",
    "الهوى",
    "القلب",
    "heart",
    "ghazal",
    "غزل",
    "rumi",
    "الرومي",
    "سهر",
    "ليل",
    "fly",
    "أطير",
    "سأطير",
    "dream",
    "حلم",
    "يوماً",
    "يوما",
    "الأدب",
    "adab",
    "literature",
    "wisdom",
    "حكمة",
    "proverb",
    "مثل",
    "العقل",
    "الجهل",
    "الظلم",
    "injustice",
    "verse",
  ],
  cultures: [
    "culture",
    "heritage",
    "تراث",
    "ثقافة",
    "tea",
    "شاي",
    "bread",
    "خبز",
    "falafel",
    "فلافل",
    "dabke",
    "دبكة",
    "palestine",
    "فلسطين",
    "lebanon",
    "لبنان",
    "egypt",
    "مصر",
    "morocco",
    "المغرب",
    "saudi",
    "السعودية",
    "iraq",
    "العراق",
    "syria",
    "سوريا",
    "yemen",
    "اليمن",
    "gulf",
    "خليج",
    "khaleeji",
    "desert",
    "صحراء",
    "camel",
    "جمل",
    "souk",
    "سوق",
    "oud",
    "عود",
    "keffiyeh",
    "كوفية",
    "tatreez",
    "تطريز",
    "reflect",
    "تفكّر",
    "تفكر",
    "tafakkar",
    "wisdom",
    "حكمة",
    "proverb",
    "saying",
    "الأدب",
    "adab",
    "manners",
    "العقل",
    "mind",
    "الجهل",
    "الظلم",
    "injustice",
    "calligraphy",
  ],
};

export interface CategoryGuess {
  categoryId: string;
  matched: string[];
  scores: Record<string, number>;
}

/** Picks the category whose keywords best match the design's title, description and tags. Poetry is the default. */
export function suggestCategory(text: string): CategoryGuess {
  const hay = ` ${text.toLowerCase()} `;
  const scores: Record<string, number> = {};
  const matchedBy: Record<string, string[]> = {};
  for (const c of CATEGORIES) {
    matchedBy[c.id] = (KEYWORDS[c.id] ?? []).filter((k) => hay.includes(k.toLowerCase()));
    scores[c.id] = matchedBy[c.id]!.length;
  }
  const explicit = hay.match(/category:(\w+)/);
  if (explicit && scores[explicit[1]!] !== undefined) {
    return { categoryId: explicit[1]!, matched: [`category:${explicit[1]}`], scores };
  }
  const best = CATEGORIES.map((c) => c.id).reduce(
    (a, b) => (scores[b]! > scores[a]! ? b : a),
    "poetry",
  );
  return { categoryId: best, matched: matchedBy[best]!, scores };
}

export interface CategoriesGuess {
  categoryIds: string[];
  scores: Record<string, number>;
}

/**
 * Multi-category version: every category with at least one keyword hit (strongest first), plus any
 * explicit `category:<id>` tags already present. Falls back to Poetry when nothing matches.
 */
export function suggestCategories(text: string): CategoriesGuess {
  const hay = ` ${text.toLowerCase()} `;
  const ids = CATEGORIES.map((c) => c.id);
  const scores: Record<string, number> = {};
  for (const id of ids) {
    scores[id] = new Set((KEYWORDS[id] ?? []).filter((k) => hay.includes(k.toLowerCase()))).size;
  }
  const explicit = [...hay.matchAll(/category:(\w+)/g)].map((m) => m[1]!).filter((id) => ids.includes(id));
  const hits = ids.filter((id) => scores[id]! > 0).sort((a, b) => scores[b]! - scores[a]!);
  const categoryIds = [...new Set([...explicit, ...hits])];
  return { categoryIds: categoryIds.length ? categoryIds : ["poetry"], scores };
}

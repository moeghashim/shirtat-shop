import type { Locale } from "./index";

/**
 * Arabic presentation of Shopify product data. Titles follow "English name (Arabic phrase) Type"; the
 * Arabic page shows "Type «Arabic phrase»" and falls back to the Shopify text for anything unknown.
 */
const TYPE_AR: Record<string, string> = {
  "Baby Bodysuit": "بدلة بودي للرضّع",
  "Boxy Fleece Hoodie": "هودي فليس بقصّة واسعة",
  "Camo Panel Hoodie": "هودي بألواح تمويه",
  Cap: "قبعة",
  "Cuffed beanie": "قبعة صوفية بحافة",
  "Dad cap": "قبعة كاب",
  "Heavyweight Hoodie": "هودي ثقيل",
  Hoodie: "هودي",
  "Kids T-shirt": "تيشيرت أطفال",
  "Mock-Neck Sweatshirt": "سويتشيرت بياقة عالية",
  Mug: "كوب",
  Print: "لوحة مطبوعة",
  "Snow-Wash Hoodie": "هودي بغسلة ثلجية",
  Sweatshirt: "سويتشيرت",
  "T-Shirt": "تيشيرت",
  "T-shirt": "تيشيرت",
  "Topstitch Hoodie": "هودي بخياطة علوية",
  "Tote bag": "حقيبة قماشية",
  "Track Jacket": "جاكيت رياضي",
};

const TITLE_PATTERN = /^(.*?)\s*\(([^)]+)\)\s*(.*)$/;

export function localizeProductTitle(title: string, locale: Locale): string {
  if (locale !== "ar") return title;
  const match = title.match(TITLE_PATTERN);
  if (!match) return title;
  const phrase = match[2]!.trim();
  const type = match[3]!.trim();
  if (!type) return phrase;
  const typeAr = TYPE_AR[type];
  return typeAr ? `${typeAr} «${phrase}»` : title;
}

const OPTION_NAME_AR: Record<string, string> = {
  Color: "اللون",
  Fit: "القصّة",
  Size: "المقاس",
  "Ships to": "الشحن إلى",
};

const COLOR_AR: Record<string, string> = {
  "Army Green with Khaki Camo": "أخضر عسكري بنقشة كاكي",
  "Athletic Heather": "رمادي مُبرقش",
  Apricot: "مشمشي",
  Black: "أسود",
  "Coffee with Khaki Camo": "بنّي قهوة بنقشة كاكي",
  Cream: "كريمي",
  "Cream Apricot": "مشمشي كريمي",
  "Dark Chocolate": "بني داكن",
  "Flower Gray": "رمادي زهري",
  Heather: "رمادي مُبرقش",
  "Light Blue": "أزرق فاتح",
  "Light Gray": "رمادي فاتح",
  Maroon: "عنابي",
  "Mild Apricot": "مشمشي هادئ",
  Natural: "طبيعي",
  Navy: "كحلي",
  "Oat Gray": "رمادي شوفاني",
  Olive: "زيتي",
  Sand: "رملي",
  "Sand Dune": "رملي",
  "Sky Blue": "أزرق سماوي",
  "Soft Cream": "كريمي",
  "Sport Grey": "رمادي فاتح",
  Stone: "حجري",
  White: "أبيض",
  "White paper": "ورق أبيض",
};

const SIZE_AR: Record<string, string> = {
  "12M": "12 شهرًا",
  "18M": "18 شهرًا",
  "24M": "24 شهرًا",
  "6M": "6 أشهر",
  "NB (0-3M)": "حديث الولادة (0–3 أشهر)",
  "One size": "مقاس واحد",
};

const REGION_AR: Record<string, string> = {
  "Europe & UK": "أوروبا والمملكة المتحدة",
  "United States": "الولايات المتحدة",
};

const FIT_AR: Record<string, string> = { "Men's": "رجالي", "Women's": "نسائي", Unisex: "للجنسين" };

export function localizeOptionName(name: string, locale: Locale): string {
  return locale === "ar" ? (OPTION_NAME_AR[name] ?? name) : name;
}

export function localizeOptionValue(optionName: string, value: string, locale: Locale): string {
  if (locale !== "ar") return value;
  if (optionName === "Color") return COLOR_AR[value] ?? value;
  if (optionName === "Size") return SIZE_AR[value] ?? value;
  if (optionName === "Ships to") return REGION_AR[value] ?? value;
  if (optionName === "Fit") return FIT_AR[value] ?? value;
  return value;
}

/** Colour names for places that only know the value (swatch labels, cart variants). */
export function localizeAnyOptionValue(value: string, locale: Locale): string {
  if (locale !== "ar") return value;
  return COLOR_AR[value] ?? SIZE_AR[value] ?? REGION_AR[value] ?? FIT_AR[value] ?? value;
}

function productImageKind(altText: string): "detail" | "model" | "product" {
  if (/^AI-generated model/i.test(altText)) return "model";
  if (/\b(artwork|calligraphy|design)\b/i.test(altText)) return "detail";
  return "product";
}

/** Alt text in the page language, from the product title, garment type and colour. */
export function describeProductImage({
  altText = "",
  color,
  locale,
  title,
}: {
  altText?: string;
  color?: string;
  locale: Locale;
  title: string;
}): string {
  const kind = productImageKind(altText);
  const name = localizeProductTitle(title, locale).trim();
  const colorName = color ? localizeAnyOptionValue(color, locale) : "";
  if (locale === "ar") {
    const base = colorName ? `${name} باللون ${colorName}` : name;
    const mark = /خط/.test(name) ? "" : "، خط عربي";
    if (kind === "model") return `${base}، على عارض${mark}`;
    if (kind === "detail") return `${base}، تفاصيل التصميم${mark}`;
    return `${base}${mark}`;
  }
  const base = colorName ? `${name} in ${colorName}` : name;
  const calligraphy = /arabic calligraphy/i.test(name) ? "" : ", Arabic calligraphy";
  if (kind === "model") return `${base}, worn by a model${calligraphy}`;
  if (kind === "detail") return `${base}, design detail${calligraphy}`;
  return `${base}${calligraphy}`;
}

/** English sentences that appear in product descriptions next to the Arabic paragraph. */
const SENTENCE_AR: Record<string, string> = {
  "Design by Shirtat.": "تصميم شيرتات.",
  "Essential Cotton T-Shirt, 100% cotton, 260 gsm, loose fit.":
    "تيشيرت Essential من القطن 100%، بوزن 260 غرامًا للمتر المربع وقصّة واسعة.",
  "Essential Fleece Mock-Neck Crew Sweatshirt.": "سويتشيرت فليس Essential بياقة عالية.",
  "Essential Heavyweight Hoodie.": "هودي Essential ثقيل الوزن.",
  "Essential Oversized Boxy-Fit Fleece Hoodie.": "هودي فليس Essential واسع بقصّة صندوقية.",
  "Kids size: Bella+Canvas 3001Y Youth Jersey Tee, 100% combed ring-spun cotton (Heather colours are cotton blends).":
    "مقاسات الأطفال: تيشيرت Bella+Canvas 3001Y Youth Jersey من القطن الممشّط المغزول 100% (ألوان هيذر من خليط قطني).",
  "Baby size: Rabbit Skins 4424 Infant Fine Jersey Bodysuit, 100% combed ring-spun cotton (Heather colours are cotton blends).":
    "مقاسات الرضّع: بدلة Rabbit Skins 4424 Infant Fine Jersey من القطن الممشّط المغزول 100% (ألوان هيذر من خليط قطني).",
  "Snow-Wash Fleece Oversize Hoodie.": "هودي فليس واسع بغسلة ثلجية.",
  "Unisex Boxy Camo Paneled Hoodie (cream ink version for the dark garment).":
    "هودي صندوقي للجنسين بألواح تمويه (نسخة بحبر كريمي للقطعة الداكنة).",
  "Unisex Boxy Heavyweight Topstitch Hoodie.": "هودي ثقيل للجنسين بقصّة صندوقية وخياطة علوية.",
  "Unisex Color-Block Track Jacket (design printed on the back because of the front zip).":
    "جاكيت رياضي للجنسين بألوان متقابلة (يُطبع التصميم على الظهر بسبب السحّاب الأمامي).",
};

const ARABIC_LETTER = /[\u0600-\u06FF]/;
const PARAGRAPH = /<p\b[^>]*>[\s\S]*?<\/p>/g;

function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const ARABIC_MARKS = /[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g;

function arabicKey(value: string): string {
  return value.replace(ARABIC_MARKS, "").replace(/\s+/g, " ").trim();
}

// The Arabic paragraph leads with the phrase in bold, then a line break, then the same phrase in guillemets.
// Stripping the break glues the two into one doubled word, so the lead is dropped when they are the same phrase.
export function dedupeDescriptionHtml(html: string): string {
  return html.replace(
    /<strong>([^<]+)<\/strong>\s*(?:<br\s*\/?>\s*)?«([^»]*)»/gi,
    (full, lead: string, quoted: string) =>
      arabicKey(lead) === arabicKey(quoted) ? `«${quoted}»` : full,
  );
}

const SCRIPTS = [
  {
    ar: "الكوفي",
    en: "Kufic",
    id: "kufic",
    pattern: /kufic|كوفي/i,
    queryAr: "كوفي",
    queryEn: "Kufic",
  },
  {
    ar: "الثلث",
    en: "Thuluth",
    id: "thuluth",
    pattern: /thuluth|الثلث/i,
    queryAr: "الثلث",
    queryEn: "Thuluth",
  },
  {
    ar: "الديواني",
    en: "Diwani",
    id: "diwani",
    pattern: /diwani|ديواني/i,
    queryAr: "ديواني",
    queryEn: "Diwani",
  },
] as const;

export type ProductScript = (typeof SCRIPTS)[number];

export function detectProductScript(text: string): ProductScript | undefined {
  return SCRIPTS.find((script) => script.pattern.test(text));
}

const GARMENT_KEYS = Object.keys(TYPE_AR).sort((a, b) => b.length - a.length || a.localeCompare(b));

function canonicalGarment(value: string): string | undefined {
  const trimmed = value.trim();
  return GARMENT_KEYS.find((key) => key.toLowerCase() === trimmed.toLowerCase());
}

function garmentEn(garment: string): string {
  return /^t-shirt$/i.test(garment) ? "T-Shirt" : garment;
}

function designName(before: string): string {
  const name = before.split(/\s+[–—]\s+|\s+-\s+/)[0]?.trim() ?? "";
  return name || before.trim();
}

export interface ParsedProductTitle {
  design: string;
  garment: string;
  phrase?: string;
}

export function parseProductTitle(title: string): ParsedProductTitle | undefined {
  const paren = title.match(/^(.*?)\s*\(([^)]+)\)\s*(.+)$/);
  if (paren && ARABIC_LETTER.test(paren[2] ?? "")) {
    const garment = canonicalGarment(paren[3] ?? "");
    const design = designName(paren[1] ?? "");
    if (garment && design) return { design, garment, phrase: paren[2]!.trim() };
  }
  const trimmed = title.trim();
  for (const garment of GARMENT_KEYS) {
    const escaped = garment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = trimmed.match(new RegExp(`^(.*)\\s+${escaped}$`, "i"));
    const design = match?.[1]?.trim();
    if (design) return { design: designName(design), garment };
  }
  return undefined;
}

export function productHeading(title: string, scriptSource: string, locale: Locale): string {
  const parsed = parseProductTitle(title);
  if (!parsed) return localizeProductTitle(title, locale);
  const script = detectProductScript(scriptSource);
  const calligraphy =
    Boolean(script) || Boolean(parsed.phrase) || /calligraphy|خط/i.test(scriptSource);
  if (locale === "ar") {
    const typeAr = TYPE_AR[parsed.garment];
    if (!typeAr) return localizeProductTitle(title, locale);
    if (parsed.phrase) {
      const scriptPart = script ? ` بالخط ${script.ar}` : " بالخط العربي";
      return `${typeAr} «${parsed.phrase}»${scriptPart}`;
    }
    return `${typeAr} ${parsed.design}`;
  }
  const lead = parsed.phrase ? `${parsed.design} (${parsed.phrase})` : parsed.design;
  const tail = [
    script?.en,
    calligraphy ? "Arabic Calligraphy" : undefined,
    garmentEn(parsed.garment),
  ]
    .filter(Boolean)
    .join(" ");
  return `${lead} ${tail}`.replace(/\s+/g, " ").trim();
}

export function productDocumentTitle(heading: string, locale: Locale): string {
  return `${heading} | ${locale === "ar" ? "شيرتات" : "Shirtat"}`;
}

function translateEnglishParagraph(text: string): string | null {
  if (text === "Order it from the design page.") {
    return `<p>اطلبه من <a href="/design">صفحة التصميم</a>.</p>`;
  }
  const sentences = text.split(/(?<=\.)\s+/);
  const translated = sentences.map((s) => SENTENCE_AR[s]);
  return translated.every(Boolean) ? `<p>${translated.join(" ")}</p>` : null;
}

/**
 * Arabic product description: keep the Arabic paragraph, translate known English boilerplate, and
 * drop the English paragraph that the Arabic one already says.
 */
export function localizeDescriptionHtml(html: string, locale: Locale): string {
  const normalized = dedupeDescriptionHtml(html);
  if (locale !== "ar" || !normalized) return normalized;
  const paragraphs = normalized.match(PARAGRAPH);
  if (!paragraphs) return normalized;
  const hasArabic = paragraphs.some((p) => ARABIC_LETTER.test(plain(p)));
  if (!hasArabic) return normalized;
  return paragraphs
    .flatMap((p) => {
      const text = plain(p);
      if (ARABIC_LETTER.test(text)) return [p];
      const translated = translateEnglishParagraph(text);
      return translated ? [translated] : [];
    })
    .join("\n");
}

export function localizeDescriptionText(html: string, locale: Locale): string {
  return plain(localizeDescriptionHtml(html, locale));
}

type CommerceLanguage = { language: string };

function localeOf(commerce: CommerceLanguage): Locale {
  return commerce.language === "AR" ? "ar" : "en";
}

/** Product cards for the current commerce language (titles only). */
export function localizeCard<T extends { title: string }>(card: T, commerce: CommerceLanguage): T {
  const locale = localeOf(commerce);
  return locale === "ar" ? { ...card, title: localizeProductTitle(card.title, locale) } : card;
}

export function localizeDetails<
  T extends {
    description: string;
    descriptionHtml: string;
    seo: { description?: string | null; title?: string | null };
    title: string;
  },
>(details: T, commerce: CommerceLanguage): T {
  const locale = localeOf(commerce);
  const descriptionHtml = localizeDescriptionHtml(details.descriptionHtml, locale);
  const scriptSource = plain(dedupeDescriptionHtml(details.descriptionHtml));
  const description = plain(descriptionHtml) || details.description;
  const title = productHeading(details.title, scriptSource, locale);
  return {
    ...details,
    description,
    descriptionHtml,
    seo: { ...details.seo, description, title },
    title,
  };
}

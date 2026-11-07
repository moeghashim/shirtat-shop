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
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
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
  if (locale !== "ar" || !html) return html;
  const paragraphs = html.match(PARAGRAPH);
  if (!paragraphs) return html;
  const hasArabic = paragraphs.some((p) => ARABIC_LETTER.test(plain(p)));
  if (!hasArabic) return html;
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
  if (locale !== "ar") return details;
  const title = localizeProductTitle(details.title, locale);
  const descriptionHtml = localizeDescriptionHtml(details.descriptionHtml, locale);
  const description =
    localizeDescriptionText(details.descriptionHtml, locale) || details.description;
  return {
    ...details,
    description,
    descriptionHtml,
    seo: { ...details.seo, description, title },
    title,
  };
}

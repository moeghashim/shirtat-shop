/**
 * The calligraphy styles offered by arabicdesign.ai (ids match its style list). `font` is the
 * open-licence (OFL) web font the live preview uses as an approximation.
 */
export interface DesignStyle {
  font: FontKey;
  id: number;
  nameAr: string;
  nameEn: string;
  /** Stack words on separate lines. */
  vertical?: boolean;
}

export type FontKey =
  | "amiri"
  | "arefRuqaa"
  | "cairo"
  | "changa"
  | "katibeh"
  | "kufam"
  | "lalezar"
  | "lateef"
  | "markazi"
  | "mirza"
  | "naskh"
  | "nastaliq"
  | "rakkas"
  | "reemKufi";

export const DESIGN_STYLES: DesignStyle[] = [
  { font: "amiri", id: 1, nameAr: "خط الثلث", nameEn: "Thuluth" },
  { font: "naskh", id: 2, nameAr: "خط النسخ", nameEn: "Naskh" },
  { font: "katibeh", id: 3, nameAr: "خط الديواني", nameEn: "Diwani" },
  { font: "arefRuqaa", id: 4, nameAr: "خط الرقعة", nameEn: "Ruqa'a" },
  { font: "nastaliq", id: 5, nameAr: "النستعليق الفارسي", nameEn: "Farsi Nastaliq" },
  { font: "kufam", id: 6, nameAr: "صغيرون", nameEn: "Kiddo" },
  { font: "lalezar", id: 7, nameAr: "ريترو", nameEn: "Retro" },
  { font: "reemKufi", id: 9, nameAr: "الكوفي الحديث", nameEn: "Modern Kufic" },
  { font: "cairo", id: 11, nameAr: "متوازن عمودي", nameEn: "Balanced Vertical", vertical: true },
  { font: "reemKufi", id: 13, nameAr: "الفاطمي المورق", nameEn: "Fatimid Foliated" },
  { font: "lateef", id: 14, nameAr: "عتيق", nameEn: "Ateeq" },
  { font: "rakkas", id: 15, nameAr: "كاليجرافيتي", nameEn: "Calligraffiti" },
  { font: "changa", id: 16, nameAr: "إنسيابي عمودي", nameEn: "Fluid Vertical", vertical: true },
  { font: "reemKufi", id: 17, nameAr: "خط الخاتم", nameEn: "Khatam Seal" },
  { font: "lateef", id: 19, nameAr: "خط اليد", nameEn: "Handwriting" },
  { font: "markazi", id: 20, nameAr: "نسخ مطبعي", nameEn: "Press Naskh" },
  { font: "changa", id: 21, nameAr: "فرشاة عربية", nameEn: "Arabic Brush" },
  { font: "mirza", id: 22, nameAr: "الديواني الحر", nameEn: "Free Diwani" },
  { font: "rakkas", id: 23, nameAr: "انسيابي مرح", nameEn: "Fun Fluid" },
  { font: "cairo", id: 24, nameAr: "مدار", nameEn: "Madar" },
];

export function getStyle(id: number | string | undefined): DesignStyle | undefined {
  return DESIGN_STYLES.find((s) => String(s.id) === String(id));
}

export interface DesignPreset {
  id: number;
  styleId?: number;
  text: string;
}

/** Example designs from arabicdesign.ai's gallery. The image is public/design/g<NN>.webp. */
export const DESIGN_PRESETS: DesignPreset[] = [
  { id: 1, text: "بسم الله نبدأ" },
  { id: 2, text: "و قل رب زدني علماً" },
  { id: 3, text: "شكر و تقدير" },
  { id: 4, text: "لك في القلب مقام" },
  { id: 5, text: "عز و فخر" },
  { id: 6, text: "فن يلامس الروح" },
  { id: 7, text: "بالخير واللطف تزهر القلوب" },
  { id: 8, text: "دع الأيام تفعل ما تشاء وطب نفساً إذا حكم القضاء" },
  { id: 9, text: "مكتبة المجد" },
  { id: 10, text: "ستبدي لك الأيام ما كنت جاهلاً" },
  { id: 11, text: "سبعينيات" },
  { id: 12, text: "الحمدلله" },
];

export function presetImage(id: number): string {
  return `/design/g${String(id).padStart(2, "0")}.webp`;
}

export function styleImage(id: number): string {
  return `/design/s${String(id).padStart(2, "0")}.webp`;
}

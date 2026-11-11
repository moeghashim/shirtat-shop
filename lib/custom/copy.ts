import type { Locale } from "@/lib/i18n";
import { formatLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/money";
import type { Money } from "@/lib/money/types";

export const DESIGN_H1 = {
  ar: "اسمك بالخط العربي على تيشيرت أو هودي",
  en: "Custom Arabic name and calligraphy shirts",
};

export const DESIGN_SEO = {
  ar: {
    description:
      "اكتب اسمًا أو جملة قصيرة ليُرسم بالخط العربي على تيشيرت أو هودي أو كوب. السعر ظاهر في الصفحة، ولا تحتاج إلى حساب لإضافته إلى السلة.",
    title: "اكتب اسمك بالخط العربي على تيشيرت أو هودي | شيرتات",
  },
  en: {
    description:
      "Write a name or a short sentence and have it drawn in Arabic calligraphy on a t-shirt, hoodie or mug. The price is on the page. No account is required to add it to the cart.",
    title: "Custom Arabic Name & Calligraphy Shirts | Shirtat",
  },
} as const;

export const DESIGN_LEDE = {
  ar: [
    "اكتب اسمًا أو جملة قصيرة، ويرسمها شيرتات بالخط العربي على تيشيرت أو هودي أو كوب.",
    "السعر في هذه الصفحة، ويمكنك إضافة القطعة إلى السلة من غير حساب.",
    "ينهي مصمّم العمل الفني قبل الطباعة، وهذا يضيف يومًا إلى يومين إلى الإنتاج.",
  ],
  en: [
    "Write a name or a short sentence and Shirtat draws it in Arabic calligraphy on a t-shirt, a hoodie or a mug.",
    "The price is on this page, and you can add the piece to the cart without an account.",
    "A designer finishes the artwork before it is printed, which adds 1 to 2 days to production.",
  ],
} as const;

export interface DesignExample {
  glossAr: string;
  glossEn: string;
  id: number;
  text: string;
}

/** Sample artworks in the builder, not photographs of finished shirts. */
export const DESIGN_EXAMPLES: readonly DesignExample[] = [
  {
    glossAr: "افتتاح شائع، «بسم الله نبدأ». ليست آية بذاتها.",
    glossEn: "A common opening, “we begin in God’s name”. It is not itself a Quran verse.",
    id: 1,
    text: "بسم الله نبدأ",
  },
  {
    glossAr: "من سورة طه، الآية 114: «وقل رب زدني علمًا».",
    glossEn: "From Quran 20:114: “and say: My Lord, increase me in knowledge.”",
    id: 2,
    text: "و قل رب زدني علماً",
  },
  {
    glossAr: "«الحمد لله»، عبارة الحمد المختصرة. وفاتحة الكتاب تبدأ بـ«الحمد لله رب العالمين».",
    glossEn:
      "“Praise belongs to God”, the short phrase. The Fatiha opens with “praise belongs to God, Lord of the worlds.”",
    id: 12,
    text: "الحمدلله",
  },
  {
    glossAr: "مطلع معلقة طرفة بن العبد: «ستبدي لك الأيام ما كنت جاهلًا».",
    glossEn:
      "The opening of Tarafa ibn al-Abd’s Mu'allaqa: “the days will show you what you did not know.”",
    id: 10,
    text: "ستبدي لك الأيام ما كنت جاهلاً",
  },
  {
    glossAr: "«لك في القلب مقام». لا ننسبها إلى شاعر.",
    glossEn: "“You have a place in the heart.” This page does not assign it to a poet.",
    id: 4,
    text: "لك في القلب مقام",
  },
  {
    glossAr: "«عز وفخر». لا ننسبها إلى مصدر.",
    glossEn: "“Honour and pride.” This page does not assign it to a source.",
    id: 5,
    text: "عز و فخر",
  },
];

export const DESIGN_STYLES_SHOWN = [
  { id: 1, nameAr: "الثلث", nameEn: "Thuluth" },
  { id: 3, nameAr: "الديواني", nameEn: "Diwani" },
  { id: 9, nameAr: "الكوفي الحديث", nameEn: "Modern Kufic" },
] as const;

export interface PriceSpan {
  currency: string;
  high: string;
  low: string;
}

function money(amount: string, currency: string): Money {
  return { amount, currencyCode: currency };
}

export function priceSentence(
  kind: "hoodie" | "mug" | "tee",
  span: PriceSpan,
  locale: Locale,
): string {
  const from = formatPrice(money(span.low, span.currency), formatLocale(locale));
  const to = formatPrice(money(span.high, span.currency), formatLocale(locale));
  const same = span.low === span.high && span.currency.length > 0;
  if (locale === "ar") {
    if (kind === "tee")
      return same ? `التيشيرت المخصص سعره ${from}.` : `التيشيرت المخصص من ${from} إلى ${to}.`;
    if (kind === "hoodie")
      return same ? `الهودي المخصص سعره ${from}.` : `الهودي المخصص من ${from} إلى ${to}.`;
    return same ? `الكوب المخصص سعره ${from}.` : `الكوب المخصص من ${from} إلى ${to}.`;
  }
  if (kind === "tee") {
    return same ? `A custom t-shirt is ${from}.` : `A custom t-shirt runs from ${from} to ${to}.`;
  }
  if (kind === "hoodie") {
    return same ? `A custom hoodie is ${from}.` : `A custom hoodie runs from ${from} to ${to}.`;
  }
  return same ? `A custom mug is ${from}.` : `A custom mug runs from ${from} to ${to}.`;
}

const PRICE_TAIL = {
  ar: "يعرض المصمّم سعر الخيارات التي تختارها قبل الإضافة إلى السلة. المبالغ من Shopify.",
  en: "The builder shows the price of the options you pick before you add the piece to the cart. The amounts come from Shopify.",
} as const;

export function designFaq(
  facts: readonly string[],
  locale: Locale,
): { answer: string; question: string }[] {
  const priceAnswer = facts.length
    ? `${facts.join(" ")} ${PRICE_TAIL[locale]}`
    : PRICE_TAIL[locale];
  if (locale === "ar") {
    return [
      {
        answer:
          "نعم. اكتب اسمًا أو جملة قصيرة في هذه الصفحة، واختر خطًا، ثم اختر تيشيرتًا أو هوديًا أو كوبًا. ينهي مصمّم العمل الفني قبل الطباعة، وهذا يضيف يومًا إلى يومين إلى الإنتاج.",
        question: "هل أستطيع وضع اسمي بالخط العربي على تيشيرت؟",
      },
      { answer: priceAnswer, question: "كم سعر القطعة المخصصة؟" },
      {
        answer: "لا. السعر في هذه الصفحة، والإضافة إلى السلة تعمل من غير تسجيل دخول.",
        question: "هل أحتاج إلى حساب لرؤية السعر أو لإضافة القطعة إلى السلة؟",
      },
      {
        answer:
          "في المصمّم الثلث والديواني وأسلوب هندسي معاصر اسمه الكوفي الحديث، مع أيدٍ أخرى. الثلث والديواني هنا أسلوبان يرسمهما المصمّم، وليسا ادّعاء أن قطعة جاهزة في الكتالوج مكتوبة بهما.",
        question: "أي خطوط أستطيع اختيارها؟",
      },
    ];
  }
  return [
    {
      answer:
        "Yes. Write a name or a short sentence on this page, pick a calligraphy style, and choose a t-shirt, a hoodie or a mug. A designer finishes the artwork before it is printed, which adds 1 to 2 days to production.",
      question: "Can I put my own name in Arabic calligraphy on a shirt?",
    },
    { answer: priceAnswer, question: "What does a custom piece cost?" },
    {
      answer: "No. The price is on this page, and Add to cart works without signing in.",
      question: "Do I need an account to see the price or add it to the cart?",
    },
    {
      answer:
        "The builder includes Thuluth, Diwani and a contemporary geometric style called Modern Kufic, plus other hands. Thuluth and Diwani here are styles the builder can draw. They are not a claim that a ready-made product in the catalog is written in those scripts.",
      question: "Which calligraphy styles can I choose?",
    },
  ];
}

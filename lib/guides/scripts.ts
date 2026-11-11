import type { Guide } from "./types";

const INDEX = {
  href: "/scripts",
  label: { ar: "الخطوط الثلاثة", en: "The three scripts" },
};

export const SCRIPT_GUIDES: Guide[] = [
  {
    empty: {
      ar: "كل خط له صفحة: تاريخه المختصر، وما يقوله المتجر عنه، وأين يُطلب.",
      en: "Each script has a page: a short history, what the shop actually says about it, and where to request it.",
    },
    h1: { ar: "الثلث والكوفي والديواني", en: "Thuluth, Kufic and Diwani" },
    intro: [
      {
        ar: "ثلاث صفحات عن ثلاثة خطوط يطلبها الناس بأسمائها. الصفحة لا تنسب قطعة إلى خط إلا إذا قال نص المنتج ذلك.",
        en: "Three pages for three scripts people ask for by name. A page does not call a product that script unless the product's own text says so.",
      },
      {
        ar: "المصمّم في شيرتات يرسم الثلث والديواني والكوفي الحديث. والكوفي الحديث أسلوب هندسي معاصر، لا نسخة من مخطوطة.",
        en: "Shirtat's builder draws Thuluth, Diwani and Modern Kufic. Modern Kufic is a contemporary geometric style, not a copy of a manuscript hand.",
      },
      {
        ar: "السعر والمقاس في صفحة المنتج أو في المصمّم، لا في هذا الدليل.",
        en: "Price and size live on the product page or in the builder, not in this guide.",
      },
    ],
    links: [
      { href: "/scripts/thuluth", label: { ar: "الثلث", en: "Thuluth" } },
      { href: "/scripts/kufic", label: { ar: "الكوفي", en: "Kufic" } },
      { href: "/scripts/diwani", label: { ar: "الديواني", en: "Diwani" } },
      { href: "/glossary", label: { ar: "معجم العبارات", en: "Phrase glossary" } },
    ],
    match: { kind: "none" },
    path: "/scripts",
    sections: [],
    seoDescription: {
      ar: "دليل قصير لخط الثلث والكوفي والديواني، مع ما يبيعه المتجر فعلًا وما يُطلب من المصمّم.",
      en: "A short guide to Thuluth, Kufic and Diwani, with what the shop actually sells and what the builder can draw.",
    },
    seoTitle: {
      ar: "خطوط عربية: الثلث والكوفي والديواني | شيرتات",
      en: "Arabic Calligraphy Scripts | Shirtat",
    },
  },
  {
    empty: {
      ar: "لا وصف منتج حالي يسمّي الثلث. يمكن طلبه من المصمّم، والأسلوب رقم 1.",
      en: "No current product description names Thuluth. It can be requested in the builder, which offers it as style 1.",
    },
    h1: { ar: "خط الثلث", en: "Thuluth" },
    intro: [
      {
        ar: "الثلث من أقلام العرض. التفسير الشائع لاسمه أن عرض قلمه ثلث عرض قلم الطومار.",
        en: "Thuluth is a display script. The usual explanation of the name is that its pen was one-third the width of the tumar pen.",
      },
      {
        ar: "هو أحد الأقلام الستة التي نُسبت نسبتها إلى العصر العباسي، ويُنسب النظام إلى ابن مقلة.",
        en: "It is one of the six pens proportioned in the Abbasid period. Ibn Muqla is credited with that system.",
      },
      {
        ar: "يُرى في كتابات المساجد وعناوين السور، لا في الكتابة اليومية. من علاماته الصواعد الطويلة والتراكيب المتداخلة.",
        en: "It is a script of mosque inscriptions and surah headings, not of daily handwriting. Tall ascenders and stacked compositions are part of how it looks.",
      },
    ],
    links: [
      { href: "/design#thuluth", label: { ar: "ارسم بالثلث", en: "Draw in Thuluth" } },
      INDEX,
    ],
    match: { kind: "needles", needles: ["thuluth", "الثلث", "خط الثلث"] },
    path: "/scripts/thuluth",
    sections: [
      {
        heading: { ar: "في شيرتات", en: "At Shirtat" },
        paragraphs: [
          {
            ar: "المصمّم يقدّم أسلوب ثلث. تُدرج قطعة جاهزة هنا فقط إذا سمّى نصها الثلث. لا قطعة جاهزة في الكتالوج موصوفة بهذا الاسم في ما راجعناه من صفحات المنتجات.",
            en: "The builder offers a Thuluth style. A ready-made piece is listed here only when its own text names Thuluth. None of the catalog descriptions we read call a product Thuluth.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "الثلث قلم عرض، وعرضه في التفسير الشائع ثلث الطومار. يُطلب من مصمّم شيرتات، ولا قطعة جاهزة موصوفة به.",
      en: "Thuluth is a display script, named for a pen one-third the tumar. Shirtat's builder can draw it. No ready-made product we read is described as Thuluth.",
    },
    seoTitle: { ar: "خط الثلث | شيرتات", en: "Thuluth Calligraphy | Shirtat" },
  },
  {
    empty: {
      ar: "لا وصف منتج حالي يسمّي الكوفي. تفكّر وبيّني وبينك موصوفان به في نصيهما حين يكونان في الكتالوج.",
      en: "No current product description names Kufic. Tafakkar and Bayni wa Baynak are described that way in their own text when they are in the catalog.",
    },
    h1: { ar: "الخط الكوفي", en: "Kufic" },
    intro: [
      {
        ar: "الكوفي منسوب إلى الكوفة. هو من الخطوط المبكّرة التي كُتب بها المصحف، بحروف زاوية.",
        en: "Kufic is named for Kufa. It is an early angular script used for the Quran.",
      },
      {
        ar: "لاحقًا صارت منه أشكال مربعة وهندسية للزخرفة، غير خط المصاحف الأول.",
        en: "Later square and geometric forms were used as ornament, distinct from the earliest Quranic hand.",
      },
    ],
    links: [
      {
        href: "/design#kufic",
        label: { ar: "الكوفي الحديث في المصمّم", en: "Modern Kufic in the builder" },
      },
      { href: "/collections/hoodies", label: { ar: "الهوديز", en: "Hoodies" } },
      INDEX,
    ],
    match: { kind: "needles", needles: ["kufic", "كوفي"] },
    path: "/scripts/kufic",
    sections: [
      {
        heading: { ar: "ما يقوله المتجر", en: "What the shop says" },
        paragraphs: [
          {
            ar: "نص تفكّر يسمّي التصميم كوفيًا هندسيًا. ونص بيّني وبينك يسمّيه كوفيًا مربّعًا. القائمة أدناه كل منتج حالي يحمل «كوفي» أو kufic في عنوانه أو رابطه أو وصفه.",
            en: "Tafakkar's text calls that design geometric Kufic. Bayni wa Baynak's text calls it square Kufic. The list below is every current product whose title, handle or description contains “Kufic” or كوفي.",
          },
          {
            ar: "في المصمّم أسلوب اسمه الكوفي الحديث، ورقمه 9. هو أسلوب هندسي معاصر، لا نقلًا عن مخطوطة تاريخية.",
            en: "The builder has a style named Modern Kufic, id 9. It is a contemporary geometric style, not a copy of a historical manuscript hand.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "الكوفي خط مبكر منسوب إلى الكوفة. تفكّر كوفي هندسي وبيّني وبينك كوفي مربّع، والكوفي الحديث في المصمّم أسلوب معاصر.",
      en: "Kufic is an early script named for Kufa. Tafakkar is geometric Kufic and Bayni wa Baynak is square Kufic. The builder's Modern Kufic is a contemporary style.",
    },
    seoTitle: { ar: "الخط الكوفي | شيرتات", en: "Kufic Calligraphy | Shirtat" },
  },
  {
    empty: {
      ar: "لا وصف منتج حالي يسمّي الديواني. يمكن طلبه من المصمّم، والأسلوب رقم 3، والديواني الحر رقم 22.",
      en: "No current product description names Diwani. It can be requested in the builder as style 3, and Free Diwani as style 22.",
    },
    h1: { ar: "الخط الديواني", en: "Diwani" },
    intro: [
      {
        ar: "الديواني خط الديوان العثماني. شديد الاتصال، متداخل الحروف، واستُعمل في المراسيم.",
        en: "Diwani is the script of the Ottoman chancery, the diwan. It is highly cursive, with interlocking letters, and it was used for decrees.",
      },
      {
        ar: "الديواني الجلي صورته الأكثف. يُنسب الجلي في الرواية الشائعة إلى الحافظ عثمان.",
        en: "Diwani Jali is the denser form. The usual account attributes Jali to Hafiz Osman.",
      },
    ],
    links: [
      { href: "/design#diwani", label: { ar: "ارسم بالديواني", en: "Draw in Diwani" } },
      INDEX,
    ],
    match: { kind: "needles", needles: ["diwani", "الديواني", "ديواني"] },
    path: "/scripts/diwani",
    sections: [
      {
        heading: { ar: "في شيرتات", en: "At Shirtat" },
        paragraphs: [
          {
            ar: "المصمّم فيه الديواني رقم 3 والديواني الحر رقم 22. القطعة الجاهزة تُدرج هنا فقط إذا سمّى نصها الديواني. بحث المتجر قد يعيد قطعًا لا علاقة لوصفها بهذا الخط، ولا نعدّها ديوانيًا.",
            en: "The builder includes Diwani as style 3 and Free Diwani as style 22. A ready-made piece is listed here only when its own text names Diwani. Shop search can return unrelated products, and those are not counted as Diwani.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "الديواني خط الديوان العثماني، والجلي يُنسب إلى الحافظ عثمان. يُطلب من المصمّم، ولا قطعة جاهزة موصوفة به عندنا.",
      en: "Diwani is the Ottoman chancery script, and Jali is attributed to Hafiz Osman. Shirtat's builder can draw it. No ready-made product we read is described as Diwani.",
    },
    seoTitle: { ar: "الخط الديواني | شيرتات", en: "Diwani Calligraphy | Shirtat" },
  },
];

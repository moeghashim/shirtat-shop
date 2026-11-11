import type { Guide } from "./types";

export const INTENT_GUIDES: Guide[] = [
  {
    empty: {
      ar: "الاسم يُرسم من صفحة التصميم، والسعر يظهر هناك قبل السلة.",
      en: "The name is drawn on the design page, which shows the price before the cart.",
    },
    h1: { ar: "تيشيرت باسم عربي بخطك", en: "A shirt with your name in Arabic" },
    intro: [
      {
        ar: "تيشيرت الاسم العربي يُصنع من صفحة التصميم: تكتب الاسم أو جملة قصيرة، وتختار الخط، وترى السعر قبل الإضافة إلى السلة.",
        en: "A custom Arabic name shirt is made on the design page: you write the name or a short sentence, choose a script, and see the price before you add it to the cart.",
      },
      {
        ar: "لا حاجة إلى حساب لرؤية السعر أو للإضافة. التيشيرت المخصص فيه قصة للرجال وقصة للنساء. الهودي قصة واحدة، والكوب يُشحن إلى الولايات المتحدة وأوروبا والمملكة المتحدة فقط.",
        en: "No account is required to see the price or to add it. The custom t-shirt has a men's fit and a women's fit. The hoodie is one fit, and the mug ships only to the United States, Europe and the UK.",
      },
      {
        ar: "ينهي مصمّم العمل قبل الطباعة، وهذا يضيف يومًا إلى يومين إلى الإنتاج.",
        en: "A designer finishes the artwork before it is printed, which adds 1 to 2 days to production.",
      },
    ],
    links: [
      { href: "/design", label: { ar: "افتح المصمّم", en: "Open the design builder" } },
      { href: "/collections/t-shirts", label: { ar: "تيشيرتات جاهزة", en: "Ready-made t-shirts" } },
      { href: "/glossary", label: { ar: "معجم العبارات", en: "Phrase glossary" } },
    ],
    match: { kind: "none" },
    path: "/custom-arabic-name-shirt",
    sections: [
      {
        heading: { ar: "ما الذي يُطبع", en: "What gets printed" },
        paragraphs: [
          {
            ar: "الاسم يُرسم بالخط الذي تختاره، لا يُلصق بخط حاسوبي على صورة جاهزة ثم يُشحن كما هو. المعاينة في الصفحة تقريب للخط، والعمل النهائي يراجعه مصمّم.",
            en: "The name is drawn in the style you pick. It is not a computer font pasted onto a finished photo and shipped as-is. The preview on the page approximates the hand, and a designer reviews the final art.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "اكتب اسمك بالخط العربي على تيشيرت أو هودي أو كوب. السعر في الصفحة، ولا حساب قبل السلة.",
      en: "Put your name in Arabic calligraphy on a t-shirt, hoodie or mug. The price is on the page, and no account is required before the cart.",
    },
    seoTitle: {
      ar: "تيشيرت باسمك بالخط العربي | شيرتات",
      en: "Custom Arabic Name Shirt | Shirtat",
    },
  },
  {
    empty: {
      ar: "لا قطعة موسومة بمناسبة في المجموعة الآن. التحية أو الاسم يُكتبان من صفحة التصميم، والسعر يظهر قبل السلة.",
      en: "No piece is tagged for an occasion right now. A greeting or a name can be written on the design page, which shows the price before the cart.",
    },
    h1: { ar: "تيشيرت هدية للعيد", en: "An Eid gift t-shirt" },
    intro: [
      {
        ar: "العيد عيدان: عيد الفطر بعد رمضان، وعيد الأضحى. تيشيرت به اسم أو تحية هدية تُلبس، لا بطاقة تُرمى.",
        en: "Eid is two festivals: Eid al-Fitr after Ramadan, and Eid al-Adha. A t-shirt with a name or a short greeting is a gift someone can wear.",
      },
      {
        ar: "مجموعة المناسبات هي مكان القطع الموسومة بالعيد والأعراس وغيرها. إن كانت الشبكة فارغة، فلا قطعة موسومة بعد.",
        en: "The occasions collection is where pieces tagged for Eid, weddings and other celebrations would be. If that grid is empty, nothing is tagged for an occasion yet.",
      },
      {
        ar: "يمكن كتابة التحية من صفحة التصميم على تيشيرت أو هودي أو كوب. السعر في تلك الصفحة، ولا حساب قبل السلة.",
        en: "The greeting can be written on the design page, on a t-shirt, hoodie or mug. The price is on that page, and no account is required before the cart.",
      },
    ],
    links: [
      {
        href: "/collections/occasions",
        label: { ar: "مجموعة المناسبات", en: "Occasions collection" },
      },
      { href: "/design", label: { ar: "اكتب تحية", en: "Write a greeting" } },
      { href: "/gift-guide", label: { ar: "دليل الهدايا", en: "Gift guide" } },
    ],
    match: { kind: "occasions" },
    path: "/eid-gift-t-shirt",
    sections: [
      {
        heading: { ar: "ما لا ندّعيه", en: "What this page does not claim" },
        paragraphs: [
          {
            ar: "لا نعرض قطعة على أنها «تيشيرت عيد» إلا إذا كانت في مجموعة المناسبات. الشعر والعبارات الأخرى هدايا ممكنة، لكنها ليست موسومة بالعيد لمجرد أنها عربية.",
            en: "A piece is not shown here as an “Eid t-shirt” unless it is in the occasions collection. Poetry and other phrases can still be gifts. They are not Eid pieces only because they are in Arabic.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "هدية عيد بخط عربي: اسم أو تحية على تيشيرت. إن خلت مجموعة المناسبات، فاكتب التحية من صفحة التصميم.",
      en: "An Eid gift in Arabic calligraphy: a name or a greeting on a t-shirt. If the occasions collection is empty, write the greeting on the design page.",
    },
    seoTitle: { ar: "تيشيرت هدية للعيد | شيرتات", en: "Eid Gift T-Shirt | Shirtat" },
  },
  {
    empty: {
      ar: "لا هودي جاهز في الكتالوج الآن. الهودي المخصص يُفتح من صفحة التصميم والسعر ظاهر قبل السلة.",
      en: "No ready-made hoodie is in the catalog right now. A custom hoodie opens from the design page, with the price shown before the cart.",
    },
    h1: { ar: "هودي بالخط العربي", en: "An Arabic calligraphy hoodie" },
    intro: [
      {
        ar: "هوديز شيرتات تحمل خطًا عربيًا. بعض التصاميم كوفي هندسي أو كوفي مربّع، كما في نص تفكّر وبيّني وبينك، والبقية بأيدٍ أخرى.",
        en: "Shirtat hoodies carry Arabic calligraphy. Some designs are geometric or square Kufic, which is what the Tafakkar and Bayni wa Baynak text says, and the others use different hands.",
      },
      {
        ar: "السعر على البطاقة هو سعر Shopify الحالي. الهودي القياسي في الكتالوج Gildan 18500 بقصة للجنسين، وبعض الهوديز خامات أخرى. صفحة المنتج هي المرجع.",
        en: "The price on the card is the current Shopify price. The standard hoodie in the catalog is the Gildan 18500 unisex fleece, and some hoodies use other blanks. The product page is the source.",
      },
      {
        ar: "جملتك تُرسم على هودي من صفحة التصميم. أضف ?product=hoodie ليفتح الهودي مباشرة.",
        en: "A sentence of your own can be drawn on a hoodie from the design page. Adding ?product=hoodie opens the hoodie.",
      },
    ],
    links: [
      { href: "/collections/hoodies", label: { ar: "كل الهوديز", en: "All hoodies" } },
      {
        href: "/design?product=hoodie",
        label: { ar: "هودي باسمك", en: "A hoodie with your text" },
      },
      { href: "/scripts/kufic", label: { ar: "عن الكوفي", en: "About Kufic" } },
    ],
    match: { kind: "type", productType: "hoodie" },
    path: "/arabic-calligraphy-hoodie",
    sections: [],
    seoDescription: {
      ar: "هوديز بخط عربي، ومنها الكوفي في بعض التصاميم. السعر مباشر، وجملتك تُرسم من صفحة التصميم.",
      en: "Hoodies in Arabic calligraphy, including Kufic on some designs. Prices are live, and your own sentence starts on the design page.",
    },
    seoTitle: { ar: "هودي بالخط العربي | شيرتات", en: "Arabic Calligraphy Hoodie | Shirtat" },
  },
];

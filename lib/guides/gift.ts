import type { Guide } from "./types";

export const GIFT_GUIDE: Guide = {
  empty: {
    ar: "الروابط أدناه تفتح المجموعات وصفحة التصميم حتى لو لم تُحمَّل البطاقات.",
    en: "The links below open the collections and the design page even when the cards do not load.",
  },
  h1: { ar: "دليل هدايا الخط العربي", en: "A gift guide for Arabic calligraphy" },
  intro: [
    {
      ar: "هدايا شيرتات خط عربي على تيشيرت أو هودي أو سويتشيرت أو حقيبة أو لوحة أو قبعة أو كوب. السعر المعروض «يبدأ من» أقل سعر حالي في Shopify، ويتبدّل مع الكتالوج.",
      en: "Shirtat gifts are Arabic calligraphy on a t-shirt, hoodie, sweatshirt, tote, print, cap or mug. A price shown here is “from” the current Shopify minimum, and it changes with the catalog.",
    },
    {
      ar: "التيشيرت القياسي Bella+Canvas 3001 بقصة للجنسين، والهودي القياسي Gildan 18500، والسويتشيرت القياسي Gildan 18000. بعض القطع خامات أخرى. التيشيرت المخصص فيه قصة للرجال وقصة للنساء، ولا تقسّم هذه الصفحة المتجر إلى هدايا له وهدايا لها.",
      en: "The standard t-shirt is the unisex Bella+Canvas 3001, the standard hoodie is the unisex Gildan 18500, and the standard sweatshirt is the unisex Gildan 18000. Some pieces use other blanks. The custom t-shirt has a men's fit and a women's fit. This page does not sort the shop into gifts for him and gifts for her.",
    },
    {
      ar: "تيشيرت الأطفال الذي يصفه المتجر هو Bella+Canvas 3001Y بمقاس الناشئة. مقاس العمر مكتوب في صفحة المنتج، وكذلك بدلة الرضّع.",
      en: "The kids' t-shirt the shop describes is a Bella+Canvas 3001Y youth tee. The age size is on the product page, as it is for a baby bodysuit.",
    },
  ],
  links: [
    { href: "/design", label: { ar: "هدية باسم", en: "A gift with a name" } },
    { href: "/collections/kids", label: { ar: "أطفال", en: "Kids" } },
    { href: "/collections/baby", label: { ar: "رضّع", en: "Baby" } },
    { href: "/eid-gift-t-shirt", label: { ar: "هدية العيد", en: "Eid gift" } },
    { href: "/collections/t-shirts", label: { ar: "تيشيرتات", en: "T-shirts" } },
  ],
  match: { kind: "gift" },
  path: "/gift-guide",
  sections: [
    {
      heading: { ar: "له أو لها", en: "For him or for her" },
      paragraphs: [
        {
          ar: "القطع الجاهزة في الشبكة ليست مقسومة إلى رجالي ونسائي. إن كان المقاس أو القصة مهمين، فصفحة التصميم فيها التيشيرت بقصتين، والهودي بقصة واحدة.",
          en: "Ready-made pieces in the grid are not divided into men's and women's. When fit matters, the design page has the t-shirt in two fits and the hoodie in one.",
        },
      ],
    },
    {
      heading: { ar: "اسم", en: "A name" },
      paragraphs: [
        {
          ar: "الاسم أو الجملة القصيرة تُكتب في صفحة التصميم على تيشيرت أو هودي أو كوب. السعر ظاهر قبل السلة، ولا يُطلب حساب قبل ذلك. الكوب المخصص يُشحن إلى الولايات المتحدة وأوروبا والمملكة المتحدة فقط.",
          en: "A name or a short sentence is written on the design page, on a t-shirt, hoodie or mug. The price is shown before the cart, and no account is required before that. A custom mug ships only to the United States, Europe and the UK.",
        },
      ],
    },
    {
      heading: { ar: "مواعيد الشحن المقترحة للعيد", en: "Suggested holiday shipping dates" },
      paragraphs: [
        {
          ar: "التواريخ أدناه مواعيد تقترحها Printify لتقديم الطلب ليصل قبل 24 ديسمبر 2026. الخانة الفارغة في صفحتهم تعني أن الخدمة غير معروضة. الناقل قد يتأخر. ليست وعدًا من شيرتات بيوم تسليم.",
          en: "The dates below are the ones Printify suggests for submitting an order to arrive before 24 December 2026. An empty cell on their page means that service is not offered. A carrier can still delay a parcel. They are not a Shirtat promise of a delivery day.",
        },
        {
          ar: "ملابس الولايات المتحدة وأكوابها ولوحاتها في الأغلب من Printify Choice. الحقائب القماشية من The Print Bar، فلا ننقل إليها تواريخ Choice، وتاريخها في صف ذلك المطبّع على الصفحة نفسها ولم نثبته هنا. أكواب أوروبا والمملكة المتحدة من OPT OnDemand في ألمانيا.",
          en: "Most US apparel, US mugs and prints are Printify Choice. Tote bags are The Print Bar, so they do not inherit the Choice dates. That provider's row is on the same page and is not quoted here. Mugs for Europe and the UK are OPT OnDemand in Germany.",
        },
        {
          ar: "Printify Choice، الاقتصاد إلى الولايات المتحدة: 7 ديسمبر 2026. والتوصيل القياسي إلى الولايات المتحدة: 9 ديسمبر 2026.",
          en: "Printify Choice, United States economy: 7 December 2026. United States standard: 9 December 2026.",
        },
        {
          ar: "Printify Choice، القياسي: كندا 3 ديسمبر 2026، أوروبا 8 ديسمبر 2026، المملكة المتحدة 10 ديسمبر 2026، ألمانيا 10 ديسمبر 2026، أستراليا 8 ديسمبر 2026، نيوزيلندا 27 نوفمبر 2026، وبقية العالم 20 نوفمبر 2026.",
          en: "Printify Choice standard: Canada 3 December 2026, Europe 8 December 2026, the UK 10 December 2026, Germany 10 December 2026, Australia 8 December 2026, New Zealand 27 November 2026, and the rest of the world 20 November 2026.",
        },
        {
          ar: "OPT OnDemand، القياسي إلى أوروبا: 7 ديسمبر 2026. هذا تاريخ أكواب أوروبا، لا تاريخ ملابس الولايات المتحدة.",
          en: "OPT OnDemand, Europe standard: 7 December 2026. That date is for European mugs, not for US apparel.",
        },
        {
          ar: "قُرئت من صفحة Printify لحالة التوريد في 11 نوفمبر 2026: https://printify.com/network-fulfillment-status/#cut-off-dates",
          en: "Read from Printify's network fulfillment page on 11 November 2026: https://printify.com/network-fulfillment-status/#cut-off-dates",
        },
      ],
    },
  ],
  seoDescription: {
    ar: "دليل هدايا الخط العربي: له ولها بلا تقسيم مصطنع، وللأطفال والرضّع، وبالاسم، مع أسعار Shopify ومواعيد Printify المقترحة.",
    en: "An Arabic calligraphy gift guide: unisex pieces, kids and baby, a custom name, live Shopify prices, and Printify's suggested holiday dates.",
  },
  seoTitle: {
    ar: "دليل هدايا الخط العربي | شيرتات",
    en: "Arabic Calligraphy Gift Guide | Shirtat",
  },
};

import type { Locale } from "@/lib/i18n";

/** Storefront copy for collections. Arabic is overlaid here because Shopify translations are not writable. Theme categories stay in CATEGORIES so product-type collections are not category tiles. */
interface CollectionCopy {
  descriptionAr: string;
  descriptionEn: string;
  id: string;
  labelAr: string;
  labelEn: string;
  leadAr: readonly string[];
  leadEn: readonly string[];
  seoDescriptionAr: string;
  seoDescriptionEn: string;
  seoTitleAr: string;
  seoTitleEn: string;
}

export interface CategoryConfig {
  descriptionAr: string;
  descriptionEn: string;
  id: string;
  labelAr: string;
  labelEn: string;
}

const POETRY: CollectionCopy = {
  descriptionAr: "تصاميم مستوحاة من الشعر العربي: أبيات قديمة وحديثة بخط عربي جميل.",
  descriptionEn: "Designs built on Arabic poetry: classic and modern verses set in calligraphy.",
  id: "poetry",
  labelAr: "شعر",
  labelEn: "Poetry",
  leadAr: [
    "مجموعة الشعر في شيرتات أبيات عربية مكتوبة بخطٍ يُلبس، على تيشيرتات وهوديز وحقائب ولوحات.",
    "البيت الذي تحمله كل قطعة مذكور في صفحتها، ومعه قائله حين يسجّله التصميم.",
    "الأسعار والمقاسات في الشبكة هي كتالوج Shopify المباشر، والقطعة تُطبع بعد الطلب.",
  ],
  leadEn: [
    "Shirtat's poetry collection is Arabic verse set in calligraphy on shirts, hoodies, totes and prints.",
    "The line on each piece is named on its product page, along with who wrote it when the design records a source.",
    "Prices and sizes in the grid are the live Shopify catalog, and the piece is printed after you order.",
  ],
  seoDescriptionAr:
    "شعر عربي بخطٍ على تيشيرتات وهوديز وحقائب ولوحات. البيت مذكور في صفحة المنتج، والسعر من الكتالوج المباشر.",
  seoDescriptionEn:
    "Arabic poetry in calligraphy on shirts, hoodies, totes and prints. Each product names the verse, and the price is live.",
  seoTitleAr: "ملابس وهدايا بأبيات الشعر العربي | شيرتات",
  seoTitleEn: "Arabic Poetry Shirts, Hoodies & Prints | Shirtat",
};

const HUMOR: CollectionCopy = {
  descriptionAr: "عبارات الشارع والأمثال اليومية التي تُضحك العالم العربي.",
  descriptionEn: "Arab street slang and everyday sayings that make the Arab world laugh.",
  id: "humor",
  labelAr: "فكاهة",
  labelEn: "Humor",
  leadAr: [
    "مجموعة الفكاهة كلام الناس اليومي والنكات، بخط عربي، لا شعرًا رسميًا.",
    "ما يظهر في الشبكة هو المعروض للبيع الآن، والسعر على البطاقة هو السعر الحالي.",
    "عبارة لا تجدها هنا يمكن كتابتها على تيشيرت من صفحة التصميم، والسعر يظهر قبل الإضافة إلى السلة.",
  ],
  leadEn: [
    "The humor collection is everyday Arab speech and jokes, lettered in Arabic rather than set as formal poetry.",
    "What is in the grid is what the shop is selling now, and the price on each card is the current price.",
    "A phrase you do not see here can be written on a shirt from the design page, which shows the price before you add it to the cart.",
  ],
  seoDescriptionAr:
    "عبارات يومية ونكات بخط عربي على تيشيرتات وهوديز. السعر على البطاقة هو سعر الكتالوج الحالي.",
  seoDescriptionEn:
    "Everyday Arab phrases and jokes in Arabic script on shirts and hoodies. The price on each card is current.",
  seoTitleAr: "تيشيرتات وهوديز بعبارات عربية طريفة | شيرتات",
  seoTitleEn: "Funny Arabic Shirts & Hoodies | Shirtat",
};

const CULTURES: CollectionCopy = {
  descriptionAr: "تصاميم تحتفي بتنوّع الثقافات واللهجات والتقاليد في العالم العربي.",
  descriptionEn:
    "Designs celebrating the many cultures, dialects and traditions across the Arab world.",
  id: "cultures",
  labelAr: "ثقافات",
  labelEn: "Cultures",
  leadAr: [
    "مجموعة الثقافات تصاميم تستمد من ثقافات العالم العربي ولهجاته وتقاليده.",
    "قد يجتمع فيها شعر وعبارات يومية وقطع أخرى من شيرتات حين تُوسَم بهذه المجموعة.",
    "السعر على كل بطاقة هو السعر المباشر من Shopify.",
  ],
  leadEn: [
    "The cultures collection gathers designs that draw on Arab cultures, dialects and traditions.",
    "Poetry, street phrases and other Shirtat pieces share this grid when they are tagged here.",
    "The price on each card is the live Shopify price.",
  ],
  seoDescriptionAr:
    "تصاميم من ثقافات العالم العربي ولهجاته، بخط عربي. السعر على البطاقة مباشر من الكتالوج.",
  seoDescriptionEn:
    "Arabic calligraphy drawn from the cultures and dialects of the Arab world. Prices on the cards are live.",
  seoTitleAr: "ملابس بالخط العربي من ثقافات العالم العربي | شيرتات",
  seoTitleEn: "Arabic Culture Calligraphy Apparel | Shirtat",
};

const OCCASIONS: CollectionCopy = {
  descriptionAr: "للّحظات المهمة: العيد، أعياد الميلاد، ليلة الخطوبة، الأعراس، التخرّج وغيرها.",
  descriptionEn:
    "For the moments that matter: Eid, birthdays, engagement nights, weddings, graduations and more.",
  id: "occasions",
  labelAr: "مناسبات",
  labelEn: "Occasions",
  leadAr: [
    "مجموعة المناسبات للأيام التي يحتفل بها الناس: العيد، وأعياد الميلاد، والخطوبة، والأعراس، والتخرّج.",
    "إذا كانت الشبكة فارغة، فلا قطعة موسومة بمناسبة حتى الآن.",
    "يمكنك طلب تحية أو اسم على تيشيرت من صفحة التصميم، والسعر يظهر هناك قبل الإضافة إلى السلة.",
  ],
  leadEn: [
    "The occasions collection is for days people mark: Eid, birthdays, engagements, weddings and graduations.",
    "If the grid is empty, no piece is tagged for an occasion yet.",
    "You can still order a greeting or a name on a t-shirt from the design page, which shows the price before you add it to the cart.",
  ],
  seoDescriptionAr:
    "خط عربي للعيد والأعراس والمناسبات. إن خلت المجموعة، اكتب التحية من صفحة التصميم والسعر ظاهر قبل السلة.",
  seoDescriptionEn:
    "Calligraphy for Eid, weddings and other celebrations. If the collection is empty, write a greeting on the design page.",
  seoTitleAr: "خط عربي للعيد والأعراس والمناسبات | شيرتات",
  seoTitleEn: "Eid, Wedding & Celebration Calligraphy | Shirtat",
};

const POLITICS: CollectionCopy = {
  descriptionAr: "تصاميم عن الحياة العامة والكلمات التي يرتديها الناس حين يعبّرون.",
  descriptionEn: "Designs about public life and the words people wear when they speak up.",
  id: "politics",
  labelAr: "سياسة",
  labelEn: "Politics",
  leadAr: [
    "مجموعة السياسة تصاميم شيرتات عن الحياة العامة.",
    "هي تعليق، لا بضاعة حملة انتخابية، ولا تحظى بتأييد سياسي أو حزب.",
    "الشبكة تعرض ما هو معروض للبيع الآن، بالسعر الحالي.",
  ],
  leadEn: [
    "The politics collection is Shirtat designs about public life.",
    "They are commentary, not campaign merchandise, and they are not endorsed by a politician or a party.",
    "The grid lists what is for sale now, at the current price.",
  ],
  seoDescriptionAr:
    "تصاميم عن الحياة العامة بخط عربي. تعليق لا بضاعة حملة، والسعر على البطاقة هو السعر الحالي.",
  seoDescriptionEn:
    "Arabic-script designs about public life. Commentary, not campaign merchandise. Prices on the cards are current.",
  seoTitleAr: "تصاميم عربية عن الحياة العامة | شيرتات",
  seoTitleEn: "Arabic Public-Life Shirts | Shirtat",
};

const KIDS: CollectionCopy = {
  descriptionAr: "تصاميم شيرتات بالخط العربي بمقاسات الأطفال.",
  descriptionEn: "Shirtat calligraphy designs in kids' sizes.",
  id: "kids",
  labelAr: "أطفال",
  labelEn: "Kids",
  leadAr: [
    "هذه تيشيرتات أطفال بتصاميم شيرتات وبالخط العربي.",
    "العبارات هي الكلمات نفسها المستخدمة في قطع الكبار، بمقاسات الأطفال.",
    "السعر على البطاقة هو السعر الحالي، ومقاس العمر مذكور في صفحة المنتج.",
  ],
  leadEn: [
    "These are Shirtat calligraphy designs cut as kids' t-shirts.",
    "The phrases are the same words used on adult pieces, in children's sizes.",
    "The price on each card is the current price, and the age size is on the product page.",
  ],
  seoDescriptionAr:
    "تيشيرتات أطفال بخط عربي، بالعبارات نفسها التي على قطع الكبار. السعر الحالي في البطاقة.",
  seoDescriptionEn:
    "Kids' t-shirts in Arabic calligraphy, with the same phrases as the adult pieces. The card price is current.",
  seoTitleAr: "تيشيرتات أطفال بالخط العربي | شيرتات",
  seoTitleEn: "Arabic Calligraphy Kids T-Shirts | Shirtat",
};

const BABY: CollectionCopy = {
  descriptionAr: "بدلات رضّع قطنية ناعمة بتصاميم شيرتات.",
  descriptionEn: "Soft cotton baby bodysuits with Shirtat designs.",
  id: "baby",
  labelAr: "رضّع",
  labelEn: "Baby",
  leadAr: [
    "هذه بدلات بودي للرضّع مطبوعة بخط شيرتات العربي.",
    "العبارات تطابق تصاميم أخرى في المتجر، بمقاس الرضّع.",
    "تأكّد من مقاس العمر في صفحة المنتج. السعر أدناه هو السعر الحالي.",
  ],
  leadEn: [
    "These are baby bodysuits printed with Shirtat's Arabic calligraphy.",
    "The phrases match designs elsewhere in the shop, sized for infants.",
    "Check the age size on the product page. The price below is the current one.",
  ],
  seoDescriptionAr:
    "بدلات رضّع بخط عربي من شيرتات. تأكّد من مقاس العمر في صفحة المنتج، والسعر هو السعر الحالي.",
  seoDescriptionEn:
    "Baby bodysuits printed with Shirtat's Arabic calligraphy. Check the age size on the product page. Prices are current.",
  seoTitleAr: "بدلات رضّع بالخط العربي | شيرتات",
  seoTitleEn: "Arabic Calligraphy Baby Bodysuits | Shirtat",
};

const PRODUCT_TYPE_COLLECTIONS: readonly CollectionCopy[] = [
  {
    descriptionAr: "تيشيرتات بخط عربي: كلمة، أو بيت، أو اسم.",
    descriptionEn: "T-shirts with Arabic calligraphy: a word, a verse, or a name.",
    id: "t-shirts",
    labelAr: "تيشيرتات",
    labelEn: "T-shirts",
    leadAr: [
      "هذه صفحة تيشيرتات شيرتات: خط عربي على تيشيرت، من كلمة واحدة إلى بيت شعر.",
      "كل تيشيرت يُطبع عند الطلب، والسعر على البطاقة هو سعر Shopify الحالي.",
      "المقاسات والألوان مذكورة في صفحة المنتج.",
      "اسمك أنت يمكن أن يُرسم على تيشيرت من أداة التصميم، والسعر يظهر قبل الإضافة إلى السلة.",
    ],
    leadEn: [
      "This page is Shirtat's t-shirts: Arabic calligraphy on a tee, from a single word to a line of poetry.",
      "Each shirt is printed on demand, and the price on the card is the current Shopify price.",
      "Sizes and colours are listed on the product page.",
      "Your own name can go on a tee from the design builder, which shows its price before you add it to the cart.",
    ],
    seoDescriptionAr:
      "تيشيرتات بخط عربي، من كلمة إلى بيت شعر. السعر على البطاقة مباشر، واسمك يُرسم من صفحة التصميم.",
    seoDescriptionEn:
      "T-shirts in Arabic calligraphy, from one word to a line of poetry. Card prices are live. Put your name on one from the design page.",
    seoTitleAr: "تيشيرتات بالخط العربي | شيرتات",
    seoTitleEn: "Arabic Calligraphy T-Shirts | Shirtat",
  },
  {
    descriptionAr: "هوديز بخط عربي.",
    descriptionEn: "Hoodies with Arabic calligraphy.",
    id: "hoodies",
    labelAr: "هوديز",
    labelEn: "Hoodies",
    leadAr: [
      "هوديز شيرتات تحمل خطًا عربيًا، ومنها تصاميم بالكوفي الهندسي والكوفي المربّع وأيدٍ أخرى.",
      "الشبكة كل هودي ينشره المتجر الآن، بالسعر المباشر.",
      "جملتك يمكن أن تُرسم على هودي من صفحة التصميم.",
    ],
    leadEn: [
      "Shirtat hoodies carry Arabic calligraphy, including geometric and square Kufic on some designs and other hands on the rest.",
      "The grid is every hoodie the shop is publishing now, with the live price.",
      "A sentence of your own can be drawn on a hoodie from the design page.",
    ],
    seoDescriptionAr: "هوديز بخط عربي، ومنها الكوفي. السعر مباشر، ويمكن رسم جملتك من صفحة التصميم.",
    seoDescriptionEn:
      "Hoodies in Arabic calligraphy, including Kufic on some designs. Prices are live. Draw your own sentence from the design page.",
    seoTitleAr: "هوديز بالخط العربي | شيرتات",
    seoTitleEn: "Arabic Calligraphy Hoodies | Shirtat",
  },
  {
    descriptionAr: "سويتشيرتات بخط عربي للارتداء اليومي.",
    descriptionEn: "Sweatshirts with Arabic calligraphy for everyday wear.",
    id: "sweatshirts",
    labelAr: "سويتشيرتات",
    labelEn: "Sweatshirts",
    leadAr: [
      "هذه سويتشيرتات شيرتات بخط عربي، للبيت والشارع على السواء.",
      "كل بطاقة تعرض السعر الحالي، وصفحة المنتج تعرض المقاس واللون.",
      "القطعة تُطبع بعد الطلب، لا تُخزَّن جاهزة على الرف.",
    ],
    leadEn: [
      "These are Shirtat sweatshirts in Arabic calligraphy, for home and for the street.",
      "Each card shows the current price, and the product page lists size and colour.",
      "The piece is printed after you order. It is not sitting pre-made on a shelf.",
    ],
    seoDescriptionAr: "سويتشيرتات بخط عربي. السعر على البطاقة حالي، والقطعة تُطبع بعد الطلب.",
    seoDescriptionEn:
      "Sweatshirts in Arabic calligraphy. The card price is current, and the piece is printed after you order.",
    seoTitleAr: "سويتشيرتات بالخط العربي | شيرتات",
    seoTitleEn: "Arabic Calligraphy Sweatshirts | Shirtat",
  },
  {
    descriptionAr: "حقائب قماشية بخط عربي.",
    descriptionEn: "Tote bags printed with Arabic calligraphy.",
    id: "tote-bags",
    labelAr: "حقائب قماشية",
    labelEn: "Tote bags",
    leadAr: [
      "حقائب شيرتات القماشية تحمل العبارة نفسها التي على الملابس، مطبوعة على قماش الحقيبة.",
      "السعر على البطاقة هو السعر الحالي.",
      "تفاصيل المقاس والقماش في صفحة المنتج.",
    ],
    leadEn: [
      "Shirtat tote bags carry the same kind of Arabic phrase as the clothing, printed on the bag.",
      "The price on the card is the current price.",
      "Size and fabric details are on the product page.",
    ],
    seoDescriptionAr: "حقائب قماشية بخط عربي. السعر على البطاقة هو سعر الكتالوج الحالي.",
    seoDescriptionEn:
      "Tote bags printed with Arabic calligraphy. The price on each card is the current catalog price.",
    seoTitleAr: "حقائب قماشية بالخط العربي | شيرتات",
    seoTitleEn: "Arabic Calligraphy Tote Bags | Shirtat",
  },
  {
    descriptionAr: "لوحات ومطبوعات بخط عربي للجدار.",
    descriptionEn: "Prints and posters of Arabic calligraphy for the wall.",
    id: "posters-prints",
    labelAr: "لوحات ومطبوعات",
    labelEn: "Prints",
    leadAr: [
      "هذه مطبوعات شيرتات: الخط العربي نفسه الذي على الملابس، على ورقة للجدار.",
      "المقاسان المعروضان، إن وُجدا، وسعر كل منهما ظاهران في البطاقة وصفحة المنتج.",
      "ليست ملصقًا مؤقتًا. صفحة المنتج تذكر خامة الطباعة.",
    ],
    leadEn: [
      "These are Shirtat prints: the same Arabic calligraphy as the clothing, on paper for a wall.",
      "The sizes on sale, and the price of each, are on the card and the product page.",
      "The product page names the paper. Nothing here is a price we guessed.",
    ],
    seoDescriptionAr: "لوحات ومطبوعات بخط عربي للجدار. المقاس والسعر في البطاقة وصفحة المنتج.",
    seoDescriptionEn:
      "Wall prints of Arabic calligraphy. Size and price are on the card and the product page.",
    seoTitleAr: "لوحات ومطبوعات بالخط العربي | شيرتات",
    seoTitleEn: "Arabic Calligraphy Prints & Posters | Shirtat",
  },
  {
    descriptionAr: "قبعات وطواقي بخط عربي.",
    descriptionEn: "Caps and beanies with Arabic calligraphy.",
    id: "caps-beanies",
    labelAr: "قبعات وطواقي",
    labelEn: "Caps & beanies",
    leadAr: [
      "القبعات والطواقي هنا تحمل خط شيرتات، وبعضها مطرّز لا مطبوع.",
      "صفحة المنتج تبيّن إن كانت العلامة تطريزًا أو طباعة، وتبيّن اللون.",
      "السعر على البطاقة هو السعر الحالي.",
    ],
    leadEn: [
      "Caps and beanies here carry Shirtat calligraphy. Some of the marks are embroidered rather than printed.",
      "The product page says whether the mark is embroidery or print, and names the colour.",
      "The price on the card is the current price.",
    ],
    seoDescriptionAr:
      "قبعات وطواقي بخط عربي، بعضها مطرّز. اللون وطريقة التنفيذ والسعر في صفحة المنتج.",
    seoDescriptionEn:
      "Caps and beanies with Arabic calligraphy, some of it embroidered. Colour, method and price are on the product page.",
    seoTitleAr: "قبعات وطواقي بالخط العربي | شيرتات",
    seoTitleEn: "Arabic Calligraphy Caps & Beanies | Shirtat",
  },
  {
    descriptionAr: "أكواب بخط عربي.",
    descriptionEn: "Mugs with Arabic calligraphy.",
    id: "mugs",
    labelAr: "أكواب",
    labelEn: "Mugs",
    leadAr: [
      "الأكواب هنا تصاميم شيرتات على فنجان، ومنها القطع الجاهزة وكوب الاسم من صفحة التصميم.",
      "السعر الظاهر هو السعر المباشر.",
      "أكواب التصميم تُشحن إلى الولايات المتحدة وأوروبا والمملكة المتحدة فقط، وصفحة التصميم تقول ذلك قبل الطلب.",
    ],
    leadEn: [
      "Mugs here are Shirtat designs on a cup, including the ready-made pieces in the grid and a custom mug from the design page.",
      "The price shown is the live price.",
      "Custom mugs ship to the United States, Europe and the UK only, which the design page states before you order.",
    ],
    seoDescriptionAr:
      "أكواب بخط عربي. السعر مباشر. أكواب التصميم تُشحن إلى أمريكا وأوروبا والمملكة المتحدة فقط.",
    seoDescriptionEn:
      "Mugs with Arabic calligraphy. Prices are live. Custom mugs ship to the US, Europe and the UK only.",
    seoTitleAr: "أكواب بالخط العربي | شيرتات",
    seoTitleEn: "Arabic Calligraphy Mugs | Shirtat",
  },
];

const THEME_COLLECTIONS: readonly CollectionCopy[] = [
  POETRY,
  HUMOR,
  CULTURES,
  OCCASIONS,
  POLITICS,
  KIDS,
  BABY,
];

function asCategory(copy: CollectionCopy): CategoryConfig {
  return {
    descriptionAr: copy.descriptionAr,
    descriptionEn: copy.descriptionEn,
    id: copy.id,
    labelAr: copy.labelAr,
    labelEn: copy.labelEn,
  };
}

export const CATEGORIES: CategoryConfig[] = THEME_COLLECTIONS.map(asCategory);

const OVERLAY = new Map<string, CollectionCopy>(
  [...THEME_COLLECTIONS, ...PRODUCT_TYPE_COLLECTIONS].map((copy) => [copy.id, copy]),
);

const ALL_PRODUCTS: Pick<
  CollectionCopy,
  "leadAr" | "leadEn" | "seoDescriptionAr" | "seoDescriptionEn" | "seoTitleAr" | "seoTitleEn"
> = {
  leadAr: [
    "هذه كل قطع شيرتات: خط عربي على تيشيرتات وهوديز وسويتشيرتات وحقائب ولوحات وقبعات وغيرها.",
    "السعر والتوفّر في هذه الصفحة يأتيان من Shopify ويتبدّلان مع الكتالوج.",
    "اسم غير موجود في الكتالوج يمكن صنعه من صفحة التصميم، وتلك الصفحة تعرض السعر قبل السلة.",
  ],
  leadEn: [
    "This is Shirtat's full catalog: Arabic calligraphy on t-shirts, hoodies, sweatshirts, totes, prints, caps and more.",
    "Price and availability on this page come from Shopify and change with the catalog.",
    "A name that is not in the catalog can be made on the design page, and that page shows the price before the cart.",
  ],
  seoDescriptionAr:
    "كل ملابس شيرتات وهداياها بالخط العربي. السعر من Shopify، والاسم المخصص من صفحة التصميم.",
  seoDescriptionEn:
    "The full Shirtat catalog of Arabic calligraphy apparel and gifts. Prices come from Shopify. Custom names start on the design page.",
  seoTitleAr: "كل ملابس وهدايا الخط العربي | شيرتات",
  seoTitleEn: "All Arabic Calligraphy Apparel | Shirtat",
};

export function getCategory(id: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function collectionLeads(handle: string, locale: Locale): readonly string[] | undefined {
  if (handle === "all") return locale === "ar" ? ALL_PRODUCTS.leadAr : ALL_PRODUCTS.leadEn;
  const copy = OVERLAY.get(handle);
  if (!copy) return undefined;
  return locale === "ar" ? copy.leadAr : copy.leadEn;
}

export function collectionDocument(
  handle: string,
  locale: Locale,
): { description: string; title: string } | undefined {
  if (handle === "all") {
    return locale === "ar"
      ? { description: ALL_PRODUCTS.seoDescriptionAr, title: ALL_PRODUCTS.seoTitleAr }
      : { description: ALL_PRODUCTS.seoDescriptionEn, title: ALL_PRODUCTS.seoTitleEn };
  }
  const copy = OVERLAY.get(handle);
  if (!copy) return undefined;
  return locale === "ar"
    ? { description: copy.seoDescriptionAr, title: copy.seoTitleAr }
    : { description: copy.seoDescriptionEn, title: copy.seoTitleEn };
}

function presented(copy: CollectionCopy, language?: string) {
  const arabic = language === "ar" || language === "AR";
  const lead = arabic ? copy.leadAr : copy.leadEn;
  return {
    description: lead.join(" "),
    seo: {
      description: arabic ? copy.seoDescriptionAr : copy.seoDescriptionEn,
      title: arabic ? copy.seoTitleAr : copy.seoTitleEn,
    },
    title: arabic ? copy.labelAr : copy.labelEn,
  };
}

/** A known collection before Shopify has published it. No product id is invented. */
export function categoryCollection(handle: string, language?: string) {
  const copy = OVERLAY.get(handle);
  if (!copy) return undefined;
  const view = presented(copy, language);
  return {
    description: view.description,
    handle,
    image: null,
    path: `/collections/${handle}`,
    seo: view.seo,
    title: view.title,
  };
}

/** English and Arabic titles, descriptions and SEO for collections we own copy for. */
export function localizeCategory<T extends { description: string; handle: string; title: string }>(
  collection: T,
  language?: string,
): T {
  const copy = OVERLAY.get(collection.handle);
  if (!copy) return collection;
  const view = presented(copy, language);
  const out = { ...collection, description: view.description, title: view.title };
  if ("seo" in out && out.seo && typeof out.seo === "object")
    (out as Record<string, unknown>).seo = view.seo;
  if ("descriptionHtml" in out)
    (out as Record<string, unknown>).descriptionHtml = (
      language === "AR" || language === "ar" ? copy.leadAr : copy.leadEn
    )
      .map((sentence) => `<p>${sentence}</p>`)
      .join("");
  return out;
}

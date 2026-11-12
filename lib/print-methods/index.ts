import type { Locale } from "@/lib/i18n";

import type { PrintMethod, PrintMethodProduct, PrintText } from "./types";

export type { PrintMethod, PrintMethodProduct, PrintText } from "./types";

const DTG_SUFFIXES = [
  "-baby-bodysuit",
  "-hoodie",
  "-kids-t-shirt",
  "-sweatshirt",
  "-t-shirt",
  "-tote-bag",
] as const;

export function printMethodText(text: PrintText, locale: Locale): string {
  return locale === "ar" ? text.ar : text.en;
}

export const PRINT_METHOD_INDEX = {
  eyebrow: { ar: "الطباعة", en: "Printing" },
  intro: {
    ar: "تطبع شيرتات كل قطعة بعد طلبها. هذه الطرق الأربع التي نستخدمها. تختلف كل طريقة في شكل العلامة، والقماش الذي يناسبها، وطريقة الغسل.",
    en: "Shirtat prints each piece after you order. These are the four methods we use. Each one changes how the mark looks, which fabric it suits, and how you wash it.",
  },
  other: { ar: "طرق أخرى", en: "Other methods" },
  path: "/print-methods",
  read: { ar: "اقرأ عن كل طريقة", en: "Read about each method" },
  seoDescription: {
    ar: "شرح الطباعة المباشرة على القماش، والطباعة عبر فيلم، والتطريز، والتسامي على كامل القطعة، وأي قطع في شيرتات تُصنع بكل طريقة.",
    en: "How direct-to-garment, direct-to-film, embroidery and sublimation all-over printing work at Shirtat, and which pieces use each method.",
  },
  seoTitle: {
    ar: "طرق الطباعة في شيرتات: مباشرة، وفيلم، وتطريز، وتسامٍ | شيرتات",
    en: "Shirtat print methods: DTG, DTF, embroidery and all-over | Shirtat",
  },
  shop: { ar: "تسوّق قطعًا صُنعت بهذه الطريقة", en: "Shop products made this way" },
  title: { ar: "أربع طرق للطباعة", en: "Four print methods" },
} as const;

const DTG: PrintMethod = {
  card: {
    ar: "يُرش الحبر على القماش مباشرة. التيشيرتات والهوديز والسويتشيرتات وحقائب القطن في المتجر تُطبع بهذه الطريقة.",
    en: "Ink is sprayed straight onto the fabric. T-shirts, hoodies, sweatshirts and the cotton totes in the shop are printed this way.",
  },
  id: "dtg",
  name: { ar: "الطباعة المباشرة على القماش (DTG)", en: "Direct to garment (DTG)" },
  path: "/print-methods/dtg",
  sections: [
    {
      body: [
        {
          ar: "تضع الطابعة حبرًا مائيًا على القطعة، ثم تثبّته الحرارة داخل الألياف. لا شاشة حرير ولا فيلم يُنزع. تُطبع القطعة بعد الطلب، فتُصنع العلامة لهذا الطلب وحده.",
          en: "A printer lays water-based ink on the garment, then heat cures it into the fibres. There is no screen and no film to peel away. The piece is printed after you order, so the mark is made for that order.",
        },
      ],
      heading: { ar: "كيف تعمل", en: "How it works" },
      id: "how",
    },
    {
      body: [
        {
          ar: "على تيشيرت قطني فاتح يستقر الحبر في القماش وملمسه ناعم، ويبقى الخط الدقيق واضحًا. وعلى القماش الداكن تُطبع قاعدة بيضاء أولًا، فيُحس التصميم أوضح قليلًا تحت اليد.",
          en: "On a light cotton shirt the ink sits in the cloth and feels soft, and fine calligraphy stays sharp. On a dark shirt a white base is printed first, so the mark can feel a little more raised.",
        },
      ],
      heading: { ar: "الشكل والملمس", en: "Look and feel" },
      id: "look",
    },
    {
      body: [
        {
          ar: "تناسب كلمة، أو بيت شعر، أو اسمًا، في موضع واحد على القطعة. بهذه الطريقة تُطبع التيشيرتات والهوديز والسويتشيرتات وتيشيرتات الأطفال وبدلات الرضّع وحقائب القطن.",
          en: "It suits a word, a line of poetry, or a name, in one place on the garment. T-shirts, hoodies, sweatshirts, kids' tees, baby bodysuits and the cotton totes are printed this way.",
        },
      ],
      heading: { ar: "الأنسب لها", en: "Best for" },
      id: "best",
    },
    {
      body: [
        {
          ar: "يناسبها القطن والجرسي الغني بالقطن، ومنها تيشيرتات القطن الممشّط في المتجر. والألوان المخلوطة بقليل من البوليستر تُطبع بوضوح أيضًا. ولا تناسب قماشًا عازلًا للماء. إذا سمّت صفحة المنتج طريقة أخرى فاتبعها: بعض قطع الفليس الثقيلة يمكن إنهاؤها أيضًا بنقل فيلم.",
          en: "Cotton and cotton-rich jersey take it well, including the combed-cotton tees in the shop. A heather with a little polyester still prints clearly. Waterproof cloth is a poor match. If a product page names another method, follow that page: some heavier fleece blanks can also be finished with a film transfer.",
        },
      ],
      heading: { ar: "القماش المناسب", en: "Fabric" },
      id: "fabric",
    },
    {
      body: [
        {
          ar: "تدوم الطباعة المثبتة مع الارتداء العادي. تلين قليلًا مع الغسل، ولا تتشقق كما يتشقق النقل البلاستيكي السميك. وعلى القطع الداكنة تبلى القاعدة البيضاء أسرع إذا غُسلت بحرارة عالية أو كُويت على الطباعة.",
          en: "A cured print lasts through ordinary wear. It softens a little in the wash and does not crack the way a thick plastic transfer can. On dark garments the white base shows wear sooner if the piece is washed hot or ironed on the print.",
        },
      ],
      heading: { ar: "المتانة", en: "Durability" },
      id: "durability",
    },
    {
      body: [
        {
          ar: "اغسل القطعة مقلوبة، بماء بارد، وعلى دورة لطيفة. لا تستخدم المبيّض. جففها على حرارة منخفضة أو انشرها. كيّها من الخلف، لا على الطباعة. لا تنظّفها تنظيفًا جافًا. وإذا نشر المورّد تعليمات غسل خاصة به، تكررها صفحة المنتج.",
          en: "Wash inside out, in cold water, on a gentle cycle. Do not use bleach. Tumble dry low, or hang the piece up. Iron on the reverse, never on the print. Do not dry clean. When a vendor publishes its own care line, the product page repeats it.",
        },
      ],
      heading: { ar: "الغسل والعناية", en: "Care" },
      id: "care",
    },
  ],
  seoDescription: {
    ar: "كيف تطبع شيرتات التيشيرتات والهوديز والسويتشيرتات وحقائب القطن بالحبر المباشر، وكيف تُغسل.",
    en: "How Shirtat prints t-shirts, hoodies, sweatshirts and cotton totes with direct-to-garment ink, and how to wash them.",
  },
  seoTitle: {
    ar: "الطباعة المباشرة على القماش | شيرتات",
    en: "Direct-to-garment printing | Shirtat",
  },
  shopLinks: [
    { href: "/collections/t-shirts", label: { ar: "تيشيرتات", en: "T-shirts" } },
    { href: "/collections/hoodies", label: { ar: "هوديز", en: "Hoodies" } },
    { href: "/collections/sweatshirts", label: { ar: "سويتشيرتات", en: "Sweatshirts" } },
    { href: "/collections/tote-bags", label: { ar: "حقائب قماشية", en: "Tote bags" } },
    { href: "/collections/kids", label: { ar: "أطفال", en: "Kids" } },
    { href: "/collections/baby", label: { ar: "رضّع", en: "Baby" } },
  ],
  shopNote: {
    ar: "هذه المجموعات مطبوعة مباشرة على القماش. إذا سمّت صفحة قطعة طريقة أخرى، فتلك الصفحة هي المرجع.",
    en: "These collections are printed direct to garment. If a product page names another method, that page is the one to follow.",
  },
  slug: "dtg",
  status: { ar: "في المتجر", en: "In the shop" },
};

const DTF: PrintMethod = {
  card: {
    ar: "يُطبع التصميم على فيلم ثم يُكبس بالحرارة على القطعة. قبعة Habibi, Call Me Senator في المتجر نقل بهذه الطريقة، لا تطريز.",
    en: "The design is printed on a film, then heat-pressed onto the piece. The Habibi, Call Me Senator cap in the shop is a DTF transfer, not embroidery.",
  },
  id: "dtf",
  name: { ar: "الطباعة عبر فيلم (DTF)", en: "Direct to film (DTF)" },
  path: "/print-methods/dtf",
  sections: [
    {
      body: [
        {
          ar: "يُطبع الرسم، ومعه قاعدة بيضاء، على فيلم. تكبسه الحرارة على القطعة ثم يُنزع الفيلم، فيبقى التصميم طبقة رقيقة. تستخدم شيرتات هذه الطريقة لقبعة Habibi, Call Me Senator. أما قبعات الكاب ذات الخط العربي في المتجر فمطرّزة، وصفحاتها تقول ذلك. وبعض قطع الفليس يمكن إنهاؤها بهذه الطريقة أو بالطباعة المباشرة، وتسمّي صفحة المنتج الطريقة حين تُحسم.",
          en: "The artwork, including a white underbase, is printed onto a film. A heat press sticks that film to the piece and the film is peeled away, leaving a thin layer. Shirtat uses this for the Habibi, Call Me Senator cap. The calligraphy dad caps in the shop are embroidered, and their pages say so. Some fleece blanks can be finished either this way or direct to garment, and the product page names the method once it is fixed.",
        },
      ],
      heading: { ar: "كيف تعمل", en: "How it works" },
      id: "how",
    },
    {
      body: [
        {
          ar: "تبقى الألوان زاهية، ومنها الأبيض على قبعة داكنة، لأن البياض مطبوع في الفيلم وليس مشربًا في القماش. قد تحس بحافة خفيفة إذا مررت إصبعك على العلامة. والكتابة القصيرة تبقى واضحة.",
          en: "Colours stay bright, including white on a dark cap, because the white is in the film rather than soaked into the cloth. You can feel a light edge if you run a finger across the mark. Short lettering stays crisp.",
        },
      ],
      heading: { ar: "الشكل والملمس", en: "Look and feel" },
      id: "look",
    },
    {
      body: [
        {
          ar: "تناسب علامة صغيرة على قبعة، أو على قماش لا يشرب الحبر بالتساوي: شعارًا أو عبارة قصيرة. وهي غير مناسبة إذا أردت أن تختفي الطباعة داخل القطن.",
          en: "It suits a compact mark on a cap, or on a fabric that does not drink ink evenly: a logo or a short phrase. It is the wrong choice when you want the print to disappear into the cotton.",
        },
      ],
      heading: { ar: "الأنسب لها", en: "Best for" },
      id: "best",
    },
    {
      body: [
        {
          ar: "تعمل على القطن والبوليستر والقماش المخلوط، وعلى نسيج قبعة الكاب القطني. ولا تحتاج إلى طبقة البوليستر التي يحتاجها التسامي.",
          en: "It works on cotton, polyester, blends, and the cotton twill of a dad cap. It does not need the polyester coating that sublimation needs.",
        },
      ],
      heading: { ar: "القماش المناسب", en: "Fabric" },
      id: "fabric",
    },
    {
      body: [
        {
          ar: "يثبت النقل المضغوط جيدًا مع الغسل العادي. وقد يتشقق أو يرتفع من الأطراف إذا شُدّت القطعة بقوة، أو غُسلت بحرارة عالية، أو كُويت على التصميم.",
          en: "A well-pressed transfer holds through normal washing. It can crack or lift at the edges if the piece is stretched hard, washed very hot, or ironed on the design.",
        },
      ],
      heading: { ar: "المتانة", en: "Durability" },
      id: "durability",
    },
    {
      body: [
        {
          ar: "اغسلها مقلوبة، بماء بارد، وعلى دورة لطيفة. لا تستخدم المبيّض. لا تكوِ التصميم. انشرها لتجف إن أمكن. لا تنظّفها تنظيفًا جافًا.",
          en: "Wash inside out, cold, on a gentle cycle. Do not use bleach. Do not iron the design. Hang it to dry when you can. Do not dry clean.",
        },
      ],
      heading: { ar: "الغسل والعناية", en: "Care" },
      id: "care",
    },
  ],
  seoDescription: {
    ar: "كيف يُكبس نقل الطباعة عبر فيلم على قبعة من شيرتات، وكيف يُلمس، وكيف يُغسل.",
    en: "How a direct-to-film transfer is pressed onto a Shirtat cap, how it feels, and how to wash it.",
  },
  seoTitle: { ar: "الطباعة عبر فيلم | شيرتات", en: "Direct-to-film printing | Shirtat" },
  shopLinks: [
    {
      href: "/products/habibi-call-me-senator-cap",
      label: { ar: "قبعة Habibi, Call Me Senator", en: "Habibi, Call Me Senator cap" },
    },
  ],
  shopNote: {
    ar: "هذه القبعة مطبوعة عبر فيلم. قبعات الخط الأخرى في المتجر مطرّزة.",
    en: "This cap is printed direct to film. The other calligraphy caps in the shop are embroidered.",
  },
  slug: "dtf",
  status: { ar: "في المتجر", en: "In the shop" },
};

const EMBROIDERY: PrintMethod = {
  card: {
    ar: "يُخاط التصميم بالخيط. قبعات البيني وقبعات الكاب المطرّزة في المتجر مصنوعة بهذه الطريقة.",
    en: "The design is stitched in thread. The beanies and the embroidered dad caps in the shop are made this way.",
  },
  id: "embroidery",
  name: { ar: "التطريز", en: "Embroidery" },
  path: "/print-methods/embroidery",
  sections: [
    {
      body: [
        {
          ar: "تخيط الآلة التصميم بالخيط في النسيج أو في لوحة القبعة. لا حبر في العلامة. قبعات البيني من الأكريليك، والغرز على الحافة المطوية. وقبعات الكاب القطنية ذات الخط العربي مطرّزة على اللوحة الأمامية. مساحة الخيط رقعة صغيرة، لا طباعة صدر كاملة.",
          en: "A machine stitches the design with thread into the knit or the cap panel. There is no ink in the mark. The beanies are acrylic, with the stitching on the folded cuff. The calligraphy dad caps are cotton, embroidered on the front panel. The stitch field is a small patch, not a full chest print.",
        },
      ],
      heading: { ar: "كيف تعمل", en: "How it works" },
      id: "how",
    },
    {
      body: [
        {
          ar: "للخيط ارتفاع. تلتقط العلامة الضوء وتُحس بارزة. تناسب كلمة قصيرة أو علامة كوفية صغيرة. وبيت الشعر الطويل لا يناسبها، لأن لكل غرزة سُمكًا لا تصغر عنه.",
          en: "Thread has height. The mark catches the light and feels raised. It suits a short word or a compact Kufic mark. A long line of poetry is a poor fit, because each stitch has a minimum thickness.",
        },
      ],
      heading: { ar: "الشكل والملمس", en: "Look and feel" },
      id: "look",
    },
    {
      body: [
        {
          ar: "تناسب قبعات البيني وقبعات الكاب، وأي علامة صغيرة تريدها خيطًا لا حبرًا.",
          en: "It suits beanies and dad caps, and any small mark you want as thread rather than ink.",
        },
      ],
      heading: { ar: "الأنسب لها", en: "Best for" },
      id: "best",
    },
    {
      body: [
        {
          ar: "تناسب تريكو قبعات البيني وتويل قبعات الكاب القطنية. والتصميم الكبير على تيشيرت جرسي رقيق قد يجعّد القماش، لذلك يبقى التطريز في شيرتات على هذه القبعات.",
          en: "It suits beanie knit and the cotton twill of a dad cap. A large design on a thin jersey tee can pucker the cloth, so Shirtat keeps embroidery on these caps.",
        },
      ],
      heading: { ar: "القماش المناسب", en: "Fabric" },
      id: "fabric",
    },
    {
      body: [
        {
          ar: "يعيش الخيط أطول من أكثر الطباعات. لا يبهت كما يبهت الحبر، ولا يتشقق. وقد تسحب عقبة في القماش غرزة، وهكذا يتآكل في العادة.",
          en: "Thread outlasts most prints. It does not fade the way ink can, and it does not crack. A snag can pull a stitch, and that is the usual way it wears.",
        },
      ],
      heading: { ar: "المتانة", en: "Durability" },
      id: "durability",
    },
    {
      body: [
        {
          ar: "اغسلها بماء بارد، مقلوبة، وعلى دورة لطيفة. لا تستخدم المبيّض. عدّل شكل قبعة البيني وهي ندية وجففها مسطحة، أو جففها على حرارة منخفضة. لا تكوِ الغرز. لا تنظّفها تنظيفًا جافًا.",
          en: "Wash cold, inside out, on a gentle cycle. Do not use bleach. Reshape a beanie while it is damp and dry it flat, or tumble dry low. Do not iron the stitching. Do not dry clean.",
        },
      ],
      heading: { ar: "الغسل والعناية", en: "Care" },
      id: "care",
    },
  ],
  seoDescription: {
    ar: "كيف تطرّز شيرتات قبعات البيني وقبعات الكاب بالخيط، وأي قماش يناسبها، وكيف تُغسل الغرز.",
    en: "How Shirtat embroiders beanies and dad caps with thread, which fabrics suit it, and how to wash the stitching.",
  },
  seoTitle: { ar: "التطريز على القبعات | شيرتات", en: "Embroidery on caps and beanies | Shirtat" },
  shopLinks: [
    {
      href: "/collections/caps-beanies",
      label: { ar: "قبعات وطواقي", en: "Caps & beanies" },
    },
  ],
  shopNote: {
    ar: "قبعات البيني وقبعات الكاب المطرّزة في هذه المجموعة. قبعة Habibi, Call Me Senator في المجموعة نفسها نقل فيلم، لا تطريز.",
    en: "The beanies and embroidered dad caps are in this collection. The Habibi, Call Me Senator cap there is a film transfer, not stitching.",
  },
  slug: "embroidery",
  status: { ar: "في المتجر", en: "In the shop" },
};

const AOP: PrintMethod = {
  card: {
    ar: "يلتحم الصباغ بالبوليستر أو بسطح مطلي، فيمكن للتصميم أن يغطي القطعة. أكواب المتجر مطبوعة بالتسامي بهذه الطريقة.",
    en: "Dye bonds into polyester or a coated surface, so a design can cover the piece. The mugs in the shop are sublimated this way.",
  },
  id: "aop",
  name: { ar: "الطباعة على كامل القطعة (التسامي)", en: "All-over print (sublimation)" },
  path: "/print-methods/aop",
  sections: [
    {
      body: [
        {
          ar: "يُطبع الصباغ ثم يُسخَّن حتى يصير غازًا ويلتحم بألياف البوليستر، أو بطبقة البوليمر على الكوب، فيصبح اللون جزءًا من السطح. وعلى قطعة مفصّلة للطباعة الشاملة يمكن للصورة أن تمتد على اللوحة كلها، لا في مربع على الصدر. وعلى الكوب المطلي تلتف الصورة حول الفنجان. حقائب شيرتات القطنية ليست من هذه الطريقة. هي طباعة مباشرة على القماش.",
          en: "Dye is printed, then heated until it becomes a gas and bonds with polyester fibres, or with the polymer coating on a mug, so the colour becomes part of the surface. On a garment cut for all-over print, the image can run across a whole panel instead of sitting in a square on the chest. On a coated mug, the same process wraps the artwork around the cup. Shirtat's cotton tote bags are not made this way. They are direct-to-garment prints.",
        },
      ],
      heading: { ar: "كيف تعمل", en: "How it works" },
      id: "how",
    },
    {
      body: [
        {
          ar: "لا طبقة حبر ولا حافة بارزة. على البوليستر تُحس الطباعة كالقماش نفسه. وعلى الكوب تكون ملساء لامعة. ويمكن للون أن يكون زاهيًا، ومنها النقش الذي يملأ السطح. والقطن لا يمسك هذا الصباغ.",
          en: "There is no ink film and no raised edge. On polyester the print feels like the fabric. On a mug it is smooth and glossy. Colour can be vivid, including a pattern that fills the surface. Cotton will not take this dye.",
        },
      ],
      heading: { ar: "الشكل والملمس", en: "Look and feel" },
      id: "look",
    },
    {
      body: [
        {
          ar: "تناسب الرسم الذي يملأ السطح، والنقش المتكرر، وأواني الشرب المطلية. أكواب المتجر طباعة بالتسامي. والقطعة ذات الطباعة الشاملة تستخدم الفكرة نفسها حين تكون في الكتالوج. ولا توجد الآن قطعة ملابس بطباعة شاملة.",
          en: "It suits artwork that fills the surface, a repeating pattern, and coated drinkware. The mugs in the shop are dye-sublimation. An all-over garment uses the same idea when it is in the catalog. No all-over garment is in the shop right now.",
        },
      ],
      heading: { ar: "الأنسب لها", en: "Best for" },
      id: "best",
    },
    {
      body: [
        {
          ar: "البوليستر، أو سطح مهيأ للتسامي مثل الأكواب الخزفية اللامعة. أما قماش الحقائب القطني وجرسي القطن فيُطبعان مباشرة على القماش.",
          en: "Polyester, or a surface prepared for sublimation, such as the glossy ceramic mugs. Cotton canvas totes and cotton jersey are printed direct to garment instead.",
        },
      ],
      heading: { ar: "القماش المناسب", en: "Fabric" },
      id: "fabric",
    },
    {
      body: [
        {
          ar: "على الكوب تبقى الصورة إذا لم تُفرك بلوح خشن. وعلى البوليستر يكون الصباغ داخل الألياف ولا يتقشّر. والمكواة الحارة على الطباعة قد تحرق البوليستر.",
          en: "On a mug the image stays if you do not scrub it with a rough pad. On polyester the dye is in the fibre and does not peel. A hot iron on the print can scorch polyester.",
        },
      ],
      heading: { ar: "المتانة", en: "Durability" },
      id: "durability",
    },
    {
      body: [
        {
          ar: "كوب المتجر موصوف بأنه آمن لغسّالة الصحون والميكروويف. ومع ذلك لا تنقعه طويلًا ولا تفرك الطباعة. ولقطعة بوليستر بطباعة شاملة: اغسلها بماء بارد مقلوبة وعلى دورة لطيفة، بلا مبيّض وعلى حرارة منخفضة، ولا تكوها على الطباعة.",
          en: "The mug in the shop is described as dishwasher and microwave safe. Even so, do not soak it for a long time or scrub the print. For an all-over polyester piece: wash cold, inside out, on a gentle cycle, with no bleach and low heat, and do not iron the print.",
        },
      ],
      heading: { ar: "الغسل والعناية", en: "Care" },
      id: "care",
    },
  ],
  seoDescription: {
    ar: "كيف يلتحم صباغ التسامي بالبوليستر أو بالكوب المطلي، وأي قطع شيرتات تُصنع بهذه الطريقة.",
    en: "How dye-sublimation bonds a design into polyester or a coated mug, and which Shirtat pieces use it.",
  },
  seoTitle: {
    ar: "الطباعة على كامل القطعة والتسامي | شيرتات",
    en: "All-over print and sublimation | Shirtat",
  },
  shopLinks: [
    { href: "/collections/mugs", label: { ar: "أكواب", en: "Mugs" } },
    {
      href: "/print-methods/dtg",
      label: { ar: "حقائب القطن، طباعة مباشرة", en: "Cotton totes, direct to garment" },
    },
  ],
  shopNote: {
    ar: "تسوّق الأكواب المطبوعة بالتسامي. حقائب القطن في صفحة الطباعة المباشرة على القماش.",
    en: "Shop the sublimated mugs. Cotton totes are on the direct-to-garment page.",
  },
  slug: "aop",
  status: { ar: "في المتجر", en: "In the shop" },
};

export const PRINT_METHODS = [DTG, DTF, EMBROIDERY, AOP] as const;

export const PRINT_METHOD_PATHS = [
  PRINT_METHOD_INDEX.path,
  ...PRINT_METHODS.map((method) => method.path),
] as const;

export const PRINT_METHOD_LASTMOD = "2026-11-12";

const BY_SLUG = new Map(PRINT_METHODS.map((method) => [method.slug, method]));

export function getPrintMethod(slug: string): PrintMethod | undefined {
  return BY_SLUG.get(slug);
}

/** The DTF cap says "not embroidery", so that phrase is removed before stitch matching. */
function methodText(product: PrintMethodProduct): string {
  return `${product.handle}\n${product.title}\n${product.productType}\n${product.description}`
    .toLowerCase()
    .replaceAll("not embroidery", "")
    .replaceAll("وليس تطريزاً", "")
    .replaceAll("وليس تطريزا", "")
    .replaceAll("وليس تطريز", "");
}

function isEmbroidered(text: string): boolean {
  return (
    text.includes("embroider") ||
    text.includes("مطرّز") ||
    text.includes("مطرز") ||
    text.includes("تطريز")
  );
}

function isDtf(text: string): boolean {
  return /\bdtf\b/.test(text);
}

function isSublimation(text: string): boolean {
  return text.includes("sublimat") || text.includes("تسامي") || text.includes("all-over");
}

function isDtgGarment(handle: string): boolean {
  return DTG_SUFFIXES.some((suffix) => handle.endsWith(suffix));
}

export function methodForProduct(product: PrintMethodProduct): PrintMethod["id"] | null {
  if (product.handle.startsWith("custom-calligraphy-") || product.tags.includes("example")) {
    return null;
  }
  const text = methodText(product);
  if (product.handle.endsWith("-mug") || /\bmug\b/i.test(product.productType)) return "aop";
  if (isSublimation(text)) return "aop";
  if (/dtf transfer|printed dtf|تقنية dtf/.test(text) || (isDtf(text) && !isEmbroidered(text))) {
    return "dtf";
  }
  if (
    isEmbroidered(text) ||
    product.handle.endsWith("-beanie") ||
    /\bbeanie\b/i.test(product.productType)
  ) {
    return "embroidery";
  }
  if (isDtgGarment(product.handle)) return "dtg";
  return null;
}

function diversify<T extends PrintMethodProduct>(
  products: T[],
  groups: Array<(product: T) => boolean>,
  limit: number,
): T[] {
  const picked: T[] = [];
  const used = new Set<string>();
  for (const group of groups) {
    const found = products.find((product) => !used.has(product.handle) && group(product));
    if (!found) continue;
    picked.push(found);
    used.add(found.handle);
    if (picked.length >= limit) return picked;
  }
  for (const product of products) {
    if (used.has(product.handle)) continue;
    picked.push(product);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function productsForMethod<T extends PrintMethodProduct>(
  products: T[],
  id: PrintMethod["id"],
  limit = 4,
): T[] {
  const matched = products.filter((product) => methodForProduct(product) === id);
  if (id === "dtg") {
    return diversify(
      matched,
      [
        (product) =>
          product.handle.endsWith("-t-shirt") && !product.handle.endsWith("-kids-t-shirt"),
        (product) => product.handle.endsWith("-hoodie"),
        (product) => product.handle.endsWith("-sweatshirt"),
        (product) => product.handle.endsWith("-tote-bag"),
      ],
      limit,
    );
  }
  if (id === "embroidery") {
    return diversify(
      matched,
      [
        (product) => product.handle.endsWith("-beanie"),
        (product) => product.handle.endsWith("-cap"),
      ],
      limit,
    );
  }
  return matched.slice(0, limit);
}

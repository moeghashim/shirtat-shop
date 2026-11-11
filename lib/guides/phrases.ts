import type { Guide } from "./types";

const DESIGN = {
  href: "/design",
  label: { ar: "اكتب عبارتك", en: "Write your own phrase" },
};

const INDEX = {
  href: "/glossary",
  label: { ar: "معجم العبارات", en: "Phrase glossary" },
};

export const PHRASE_GUIDES: Guide[] = [
  {
    empty: {
      ar: "المعجم يشرح العبارة. المنتجات تظهر في صفحة كل كلمة.",
      en: "The glossary explains each phrase. Products are listed on that phrase's page.",
    },
    h1: { ar: "معجم عبارات تُلبس", en: "A glossary of phrases people wear" },
    intro: [
      {
        ar: "هذه صفحات قصيرة لعبارات عربية يكثر طلبها على الملابس: المعنى، والنطق، والاستعمال.",
        en: "These are short pages for Arabic phrases people ask to wear: the meaning, the pronunciation, and how the phrase is used.",
      },
      {
        ar: "المنتج يُدرج في صفحة العبارة فقط إذا كان عنوانه أو رابطه أو وصفه يحمل الكلمة. البحث في المتجر واسع، ولا يُعتمد وحده.",
        en: "A product is listed on a phrase page only when its title, handle or description contains the word. The shop search is broad and is not used as proof.",
      },
      {
        ar: "إذا لم توجد قطعة جاهزة، فصفحة التصميم تكتب العبارة على تيشيرت أو هودي أو كوب، والسعر يظهر قبل السلة.",
        en: "If no ready-made piece uses the phrase, the design page can put it on a t-shirt, hoodie or mug, and it shows the price before the cart.",
      },
    ],
    links: [
      { href: "/glossary/habibi", label: { ar: "حبيبي", en: "Habibi" } },
      { href: "/glossary/yalla", label: { ar: "يلا", en: "Yalla" } },
      { href: "/glossary/inshallah", label: { ar: "إن شاء الله", en: "Inshallah" } },
      { href: "/glossary/yalla-habibi", label: { ar: "يلا حبيبي", en: "Yalla habibi" } },
      { href: "/glossary/khalas", label: { ar: "خلاص", en: "Khalas" } },
      { href: "/glossary/mashallah", label: { ar: "ما شاء الله", en: "Mashallah" } },
    ],
    match: { kind: "none" },
    path: "/glossary",
    sections: [],
    seoDescription: {
      ar: "معاني حبيبي ويلا وإن شاء الله ويلا حبيبي وخلاص وما شاء الله، مع النطق ورابط إلى القطعة إن وُجدت.",
      en: "Meanings of habibi, yalla, inshallah, yalla habibi, khalas and mashallah, with pronunciation and a product only when the shop's text uses the phrase.",
    },
    seoTitle: { ar: "معجم العبارات العربية | شيرتات", en: "Arabic Phrase Glossary | Shirtat" },
  },
  {
    empty: {
      ar: "لا منتج حالي يحمل «حبيبي» في عنوانه أو رابطه أو وصفه. يمكن كتابة الكلمة من صفحة التصميم.",
      en: "No current product has “habibi” in its title, handle or description. The word can be written from the design page.",
    },
    h1: { ar: "معنى حبيبي", en: "What habibi means" },
    intro: [
      {
        ar: "حَبيبي تعني «عزيزي» أو «محبوبي». هي حبيب مضافًا إليها ياء المتكلم. والمؤنث حبيبتي.",
        en: "Habibi, حَبيبي, means “my dear” or “my beloved”. It is habib plus the possessive ending. The feminine is habibti, حبيبتي.",
      },
      {
        ar: "النطق: ها-بي-بي، مع مدّ على المقطع الأوسط، وha-BEE-bee باللاتينية.",
        en: "Pronunciation: ha-BEE-bee, with the stress on the middle syllable. The Arabic is حَبيبي.",
      },
    ],
    links: [
      DESIGN,
      INDEX,
      { href: "/glossary/yalla-habibi", label: { ar: "يلا حبيبي", en: "Yalla habibi" } },
    ],
    match: { kind: "needles", needles: ["habibi", "حبيبي", "حبيبتي"] },
    path: "/glossary/habibi",
    sections: [
      {
        heading: { ar: "كيف تُقال", en: "How it is used" },
        paragraphs: [
          {
            ar: "في الشام ومصر تُقال في المودة اليومية، بين الأصحاب والأهل، وليست حكرًا على الغزل.",
            en: "In Levantine and Egyptian speech it is everyday affection, between friends and family, not only a romantic word.",
          },
          {
            ar: "ليست صيغة دينية. هي نداء قريب.",
            en: "It is not a religious formula. It is a close form of address.",
          },
        ],
      },
      {
        heading: { ar: "على الملابس", en: "On a garment" },
        paragraphs: [
          {
            ar: "ما يظهر أدناه هو كل منتج حالي يحمل الكلمة. وإذا كان من خط «Habibi, Call Me Senator» فهو محاكاة ساخرة بطابع جامعي، وليس حملة ولا تأييدًا لسياسي أو حزب.",
            en: "The list below is every current product whose title, handle or description contains the word. A Habibi, Call Me Senator piece is a collegiate parody. It is not a campaign and it is not an endorsement of a politician or a party.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "حبيبي تعني عزيزي. تُقال في المودة اليومية، والمؤنث حبيبتي. المنتجات أدناه فقط إن حملت الكلمة.",
      en: "Habibi means my dear. It is everyday affection, and the feminine is habibti. Products are listed only when their text contains the word.",
    },
    seoTitle: { ar: "معنى حبيبي | شيرتات", en: "What Habibi Means | Shirtat" },
  },
  {
    empty: {
      ar: "لا منتج حالي يحمل «يلا» في نصه. يمكن طلبها من صفحة التصميم.",
      en: "No current product has “yalla” in its text. It can be ordered from the design page.",
    },
    h1: { ar: "معنى يلا", en: "What yalla means" },
    intro: [
      {
        ar: "يلا، وتُكتب أيضًا ياللا، معناها في الكلام «هيّا» أو «لنذهب». أصلها يا الله، لكنها في الاستعمال اليومي ليست دعاء.",
        en: "Yalla, يلا, also written ياللا, means “let’s go” or “come on” in ordinary speech. It comes from يا الله, but in daily use it is not a prayer.",
      },
      {
        ar: "النطق: يالّا، وYAH-lah باللاتينية.",
        en: "Pronunciation: YAH-lah. The Arabic is يلا or ياللا.",
      },
    ],
    links: [
      DESIGN,
      INDEX,
      { href: "/glossary/yalla-habibi", label: { ar: "يلا حبيبي", en: "Yalla habibi" } },
    ],
    match: { kind: "needles", needles: ["yalla", "yallah", "يلا", "ياللا"] },
    path: "/glossary/yalla",
    sections: [
      {
        heading: { ar: "ما ليست هي", en: "What it is not" },
        paragraphs: [
          {
            ar: "لا تُطابق هذه الصفحة عبارة يا الله وحدها، لأن ذلك النداء أوسع من «يلا». ولا ننسب الكلمة إلى أغنية أو ترتيب في قائمة.",
            en: "This page does not treat يا الله on its own as yalla, because that invocation is wider than the colloquial word. It also does not tie the word to a song or a chart.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "يلا تعني هيّا أو لنذهب. أصلها يا الله، وهي في الكلام اليومي ليست دعاء. النطق يالّا.",
      en: "Yalla means let’s go or come on. It comes from ya Allah and is not a prayer in daily speech. Pronounced YAH-lah.",
    },
    seoTitle: { ar: "معنى يلا | شيرتات", en: "What Yalla Means | Shirtat" },
  },
  {
    empty: {
      ar: "لا منتج حالي يحمل «إن شاء الله» في نصه. يمكن كتابتها من صفحة التصميم.",
      en: "No current product has “inshallah” in its text. It can be written from the design page.",
    },
    h1: { ar: "معنى إن شاء الله", en: "What inshallah means" },
    intro: [
      {
        ar: "إن شاء الله تعني «إذا أراد الله». تُقال لما هو آتٍ. ورد تعليق الأمر بالمشيئة في سورة الكهف، الآيتان 23 و24.",
        en: "Inshallah, إن شاء الله, means “if God wills”. It is said about what is still to come. Leaving a plan to God’s will is in Quran 18:23–24.",
      },
      {
        ar: "النطق الشائع: إن شاء الله، وin-SHAA-lah باللاتينية. وتُكتب inshallah أو insha'allah.",
        en: "A common pronunciation is in-SHAA-lah. It is written inshallah or insha'allah. The Arabic is إن شاء الله.",
      },
    ],
    links: [
      DESIGN,
      INDEX,
      { href: "/glossary/mashallah", label: { ar: "ما شاء الله", en: "Mashallah" } },
    ],
    match: {
      kind: "needles",
      needles: ["inshallah", "insha'allah", "in sha allah", "إن شاء الله", "ان شاء الله"],
    },
    path: "/glossary/inshallah",
    sections: [
      {
        heading: { ar: "من يقولها، وبأي معنى", en: "Who says it, and in what sense" },
        paragraphs: [
          {
            ar: "يقولها المسلمون، ويقولها مسيحيون عرب أيضًا. قد تكون عزمًا صادقًا، وقد تكون «سنرى» بلطف. السياق هو الذي يفرّق.",
            en: "Muslims say it, and so do Arab Christians. It can be a sincere intention, or a soft “we’ll see”. Context tells them apart.",
          },
          {
            ar: "ليست ما شاء الله. تلك للشيء الحسن الذي وقع، وهذه لما لم يقع بعد.",
            en: "It is not mashallah. That phrase is for something good that is already there. Inshallah is for what has not happened yet.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "إن شاء الله تعني إذا أراد الله، وتُقال للمستقبل. قد تكون عزمًا أو «سنرى»، وليست ما شاء الله.",
      en: "Inshallah means if God wills, and it is said about the future. It can be sincere or a soft “we’ll see”. It is not mashallah.",
    },
    seoTitle: { ar: "معنى إن شاء الله | شيرتات", en: "What Inshallah Means | Shirtat" },
  },
  {
    empty: {
      ar: "لا منتج حالي يجمع «يلا» و«حبيبي» في نصه. يمكن كتابة العبارتين من صفحة التصميم.",
      en: "No current product has both “yalla” and “habibi” in its text. The two words can be written from the design page.",
    },
    h1: { ar: "معنى يلا حبيبي", en: "What yalla habibi means" },
    intro: [
      {
        ar: "يلا حبيبي تعني «هيّا يا عزيزي». هي جمع عادي بين يلا وحبيبي، لا اصطلاحًا له قصة مستقلة.",
        en: "Yalla habibi means “come on, my dear”. It is an ordinary pairing of yalla and habibi, not a set phrase with a separate story.",
      },
      {
        ar: "النطق: يالّا حَبيبي، وYAH-lah ha-BEE-bee باللاتينية.",
        en: "Pronunciation: YAH-lah ha-BEE-bee. The Arabic is يلا حبيبي.",
      },
    ],
    links: [
      DESIGN,
      INDEX,
      { href: "/glossary/yalla", label: { ar: "يلا", en: "Yalla" } },
      { href: "/glossary/habibi", label: { ar: "حبيبي", en: "Habibi" } },
    ],
    match: {
      groups: [
        ["yalla", "yallah", "يلا", "ياللا"],
        ["habibi", "حبيبي", "حبيبتي"],
      ],
      kind: "all",
    },
    path: "/glossary/yalla-habibi",
    sections: [
      {
        heading: { ar: "ما لا ننسبه إليها", en: "What we do not attach to it" },
        paragraphs: [
          {
            ar: "لا نربط العبارة بأغنية أو ترتيب في قائمة. من يريد المعنى الأصلي يرجع إلى صفحتي يلا وحبيبي.",
            en: "This page does not connect the phrase to a song or a chart. The separate pages for yalla and habibi carry the meaning of each word.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "يلا حبيبي تعني هيّا يا عزيزي. جمع عادي بين العبارتين، بلا قصة أغنية مخترعة.",
      en: "Yalla habibi means come on, my dear. It is an ordinary pairing of the two phrases, with no invented song story.",
    },
    seoTitle: { ar: "معنى يلا حبيبي | شيرتات", en: "What Yalla Habibi Means | Shirtat" },
  },
  {
    empty: {
      ar: "لا منتج حالي يحمل «خلاص» في نصه. يمكن كتابتها من صفحة التصميم.",
      en: "No current product has “khalas” in its text. It can be written from the design page.",
    },
    h1: { ar: "معنى خلاص", en: "What khalas means" },
    intro: [
      {
        ar: "خَلاص تعني «كفى» أو «انتهى» أو «توقّف». الجذر خ-ل-ص، ومنه الخلوص والانتهاء.",
        en: "Khalas, خَلاص, means “enough”, “it’s done”, or “stop”. The root is خ-ل-ص, the same root as finishing and being clear of something.",
      },
      {
        ar: "النطق: خَلاص، والخاء كالـch في كلمة loch الاسكتلندية. وباللاتينية KHA-las.",
        en: "Pronunciation: KHA-las. The kh is the sound in Scottish “loch”, not an English k. The Arabic is خلاص.",
      },
    ],
    links: [DESIGN, INDEX],
    match: { kind: "needles", needles: ["khalas", "khalaas", "خلاص"] },
    path: "/glossary/khalas",
    sections: [
      {
        heading: { ar: "النبرة تغيّر المعنى", en: "Tone changes the meaning" },
        paragraphs: [
          {
            ar: "قد تكون ارتياحًا لأن الأمر انتهى، أو طلبًا بالتوقّف، أو حسمًا. النبرة وسياق الجملة يحملان الفرق، لا رسم الكلمة وحدها.",
            en: "It can be relief that something is over, a request to stop, or a decision. Tone and the sentence around it carry the difference, not the spelling alone.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "خلاص تعني كفى أو انتهى أو توقّف. الخاء كصوت loch، والنبرة هي التي تحدد المعنى.",
      en: "Khalas means enough, it’s done, or stop. The kh is the loch sound, and tone decides the meaning.",
    },
    seoTitle: { ar: "معنى خلاص | شيرتات", en: "What Khalas Means | Shirtat" },
  },
  {
    empty: {
      ar: "لا منتج حالي يحمل «ما شاء الله» في نصه. يمكن كتابتها من صفحة التصميم.",
      en: "No current product has “mashallah” in its text. It can be written from the design page.",
    },
    h1: { ar: "معنى ما شاء الله", en: "What mashallah means" },
    intro: [
      {
        ar: "ما شاء الله تعني «ما أراده الله». تُقال لشيء حسن وقع أو هو قائم، لا لوعدٍ مستقبل.",
        en: "Mashallah, ما شاء الله, means “what God has willed”. It is said about something good that is already there, not about a future promise.",
      },
      {
        ar: "النطق: ما شاء الله، وmaa-SHAA-allah باللاتينية. وردت العبارة في سورة الكهف، الآية 39.",
        en: "Pronunciation: maa-SHAA-allah. The phrase is in Quran 18:39. The Arabic is ما شاء الله.",
      },
    ],
    links: [
      DESIGN,
      INDEX,
      { href: "/glossary/inshallah", label: { ar: "إن شاء الله", en: "Inshallah" } },
    ],
    match: { kind: "needles", needles: ["mashallah", "masha'allah", "ما شاء الله", "ماشاء الله"] },
    path: "/glossary/mashallah",
    sections: [
      {
        heading: {
          ar: "العين والفرق عن إن شاء الله",
          en: "The evil eye, and the difference from inshallah",
        },
        paragraphs: [
          {
            ar: "في العادة تُقال أيضًا لنسبة الفضل إلى الله، ودفعًا للإصابة بالعين. هذا عرف واسع، لا حكمًا نفتي به هنا.",
            en: "In custom it is also said to credit God for the good thing, and against the evil eye. That is a widespread custom, not a ruling given on this page.",
          },
          {
            ar: "إن شاء الله لما سيأتي. ما شاء الله لما هو حسن الآن.",
            en: "Inshallah is for what is coming. Mashallah is for what is already good.",
          },
        ],
      },
    ],
    seoDescription: {
      ar: "ما شاء الله تُقال لشيء حسن قائم، ومعناها ما أراده الله. ليست إن شاء الله، وتُنسب في العرف إلى دفع العين.",
      en: "Mashallah is said about something already good, and it means what God has willed. It is not inshallah. Custom also says it against the evil eye.",
    },
    seoTitle: { ar: "معنى ما شاء الله | شيرتات", en: "What Mashallah Means | Shirtat" },
  },
];

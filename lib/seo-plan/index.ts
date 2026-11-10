import { z } from "zod/v4";

import { reviewAccess, type ReviewSession } from "@/lib/chat-review";
import { type Locale } from "@/lib/i18n";

import {
  SEO_AREAS,
  SEO_OWNERS,
  SEO_PHASES,
  SEO_STATUSES,
  SEO_TOOLS,
  type ProgressSlice,
  type SeoApproval,
  type SeoArea,
  type SeoCopy,
  type SeoKeyword,
  type SeoKpi,
  type SeoPhase,
  type SeoPlan,
  type SeoTask,
  type SeoTimelineRow,
  type SeoTitle,
  type SeoTool,
  type TaskFilter,
  type TaskRow,
} from "./types";

function text(en: string, ar: string): SeoCopy {
  return { ar, en };
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const copySchema = z.strictObject({
  ar: z.string().min(1),
  en: z.string().min(1),
});

const httpsUrl = z.string().url().startsWith("https://");

export const seoTaskSchema = z
  .strictObject({
    action: copySchema,
    approval: copySchema,
    approvalNeeded: z.boolean(),
    area: z.enum(SEO_AREAS),
    evidence: copySchema.nullable(),
    id: z.string().min(1),
    link: httpsUrl.nullable(),
    measure: copySchema,
    owner: z.enum(SEO_OWNERS),
    phase: z.enum(SEO_PHASES),
    status: z.enum(SEO_STATUSES),
    updated: isoDate,
  })
  .superRefine((task, ctx) => {
    if (task.status === "done" && !task.evidence) {
      ctx.addIssue({ code: "custom", message: "A done task needs evidence.", path: ["evidence"] });
    }
  });

const approvalSchema = z
  .strictObject({
    id: z.string().min(1),
    meta: copySchema.nullable(),
    state: z.enum(["granted", "pending"]),
    text: copySchema,
    updated: isoDate.nullable(),
  })
  .superRefine((approval, ctx) => {
    if (approval.state === "granted" && !approval.updated) {
      ctx.addIssue({
        code: "custom",
        message: "A granted approval needs a date.",
        path: ["updated"],
      });
    }
  });

const kpiSchema = z.strictObject({
  baseline: copySchema,
  cadence: copySchema,
  checkpoint: copySchema,
  id: z.string().min(1),
  name: copySchema,
  source: copySchema,
});

const timelineSchema = z.strictObject({
  focus: copySchema,
  window: copySchema,
});

const keywordSchema = z.strictObject({
  cluster: copySchema,
  examples: copySchema,
  intent: copySchema,
  lang: z.string().min(1),
  priority: copySchema,
  target: copySchema,
});

const titleSchema = z.strictObject({
  current: copySchema,
  page: copySchema,
  proposed: copySchema,
});

export const seoPlanSchema = z
  .strictObject({
    approvals: z.array(approvalSchema).min(1),
    keywords: z.array(keywordSchema),
    kpis: z.array(kpiSchema).min(1),
    tasks: z.array(seoTaskSchema).min(1),
    timeline: z.array(timelineSchema).min(1),
    titles: z.array(titleSchema),
  })
  .superRefine((plan, ctx) => {
    const ids = plan.tasks.map((task) => task.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Task ids must be unique.", path: ["tasks"] });
    }
    for (let number = 1; number <= 24; number += 1) {
      if (!ids.includes(String(number))) {
        ctx.addIssue({
          code: "custom",
          message: `Task ${number} is missing.`,
          path: ["tasks"],
        });
      }
    }
  });

const AREA_LABEL: Record<SeoArea, SeoCopy> = {
  Backlinks: text("Backlinks", "الروابط الخلفية"),
  Content: text("Content", "المحتوى"),
  International: text("International", "الدولي"),
  Keywords: text("Keywords", "الكلمات المفتاحية"),
  Linking: text("Linking", "الربط الداخلي"),
  Measurement: text("Measurement", "القياس"),
  "On-page": text("On-page", "داخل الصفحة"),
  Shopping: text("Shopping", "التسوّق"),
  Technical: text("Technical", "التقني"),
};

const PHASE_LABEL: Record<SeoPhase, SeoCopy> = {
  dec: text("December", "ديسمبر"),
  foundation: text("Already in the storefront", "موجود في المتجر"),
  now: text("Quick wins, Nov 10–30", "مكاسب سريعة، 10–30 نوفمبر"),
  q1: text("Q1 2027", "الربع الأول 2027"),
};

const PHASE_ORDER: SeoPhase[] = ["foundation", "now", "dec", "q1"];

// Statuses, owners, links and dates are edited here. The dashboard reads this file and does not write it.
export const seoPlan: SeoPlan = {
  approvals: [
    {
      id: "search-console",
      meta: text(
        "Done 10 Nov 2026. Read-only access can see sc-domain:shirtat.co.",
        "تم في 10 نوفمبر 2026. الوصول للقراءة فقط يرى sc-domain:shirtat.co.",
      ),
      state: "granted",
      text: text(
        "Re-authorize read-only Search Console access",
        "إعادة تفويض الوصول إلى Search Console للقراءة فقط",
      ),
      updated: "2026-11-10",
    },
    {
      id: "merchant-center",
      meta: null,
      state: "pending",
      text: text(
        "Create a Google Merchant Center account and install Shopify's Google & YouTube channel, which shares product data with Google",
        "إنشاء حساب Google Merchant Center وتثبيت قناة Google & YouTube في Shopify، وهي التي تشارك بيانات المنتجات مع Google",
      ),
      updated: null,
    },
    {
      id: "product-type-collections",
      meta: null,
      state: "pending",
      text: text(
        "The 9 product-type collections in English and Arabic, and the homepage link change",
        "مجموعات أنواع المنتجات التسع بالإنجليزية والعربية، وتغيير روابط الصفحة الرئيسية",
      ),
      updated: null,
    },
    {
      id: "title-templates",
      meta: null,
      state: "pending",
      text: text(
        "Title and description templates, answer capsules, and first-viewport product facts, using the samples below",
        "قوالب العناوين والأوصاف، وفقرة الإجابة، وحقائق المنتج في أول الشاشة، باستخدام النماذج أدناه",
      ),
      updated: null,
    },
    {
      id: "sitemap-cleanup",
      meta: null,
      state: "pending",
      text: text(
        "Sitemap and redirect cleanup, including removing or filling /blogs/news and /pages/contact, and noindexing account.shirtat.co and checkout.shirtat.co product URLs",
        "تنظيف خريطة الموقع وإعادات التوجيه، بما في ذلك إزالة أو ملء /blogs/news و /pages/contact، ومنع فهرسة روابط المنتجات على account.shirtat.co و checkout.shirtat.co",
      ),
      updated: null,
    },
    {
      id: "content-calendar",
      meta: null,
      state: "pending",
      text: text(
        "The content calendar, and who reviews Arabic copy (a native reviewer, not machine translation)",
        "تقويم المحتوى، ومن يراجع النص العربي (مراجع لغته الأم، لا ترجمة آلية)",
      ),
      updated: null,
    },
    {
      id: "glossary",
      meta: text("New, from the Sanity example", "جديد، من مثال Sanity"),
      state: "pending",
      text: text(
        "A bilingual phrase-meaning glossary page set (for example habibi, yalla, inshallah, yalla habibi, khalas, mashallah)",
        "مجموعة صفحات معجم ثنائي اللغة لمعاني العبارات (مثل حبيبي، يلا، إن شاء الله، يلا حبيبي، خلاص، ما شاء الله)",
      ),
      updated: null,
    },
    {
      id: "unique-photos",
      meta: text("New, from the image SEO checklist", "جديد، من قائمة تحسين صور البحث"),
      state: "pending",
      text: text(
        "Unique lifestyle or flat-lay photography for best sellers, so Shirtat is not only using shared Printify mockups",
        "تصوير أسلوب حياة أو مسطّح فريد للأكثر مبيعًا، حتى لا تعتمد شيرتات على نماذج Printify المشتركة فقط",
      ),
      updated: null,
    },
    {
      id: "outreach",
      meta: null,
      state: "pending",
      text: text(
        "The outreach list and each draft before it is sent; nothing goes out without you",
        "قائمة التواصل وكل مسودة قبل إرسالها؛ لا يخرج شيء من دونك",
      ),
      updated: null,
    },
    {
      id: "middle-east-shipping",
      meta: text(
        "Image search is already getting impressions from Egypt, Saudi Arabia, Morocco, the UAE and Iraq",
        "بحث الصور يسجّل ظهورًا من مصر والسعودية والمغرب والإمارات والعراق",
      ),
      state: "pending",
      text: text(
        "Whether Shirtat ships to the Middle East today, which decides regional targeting",
        "هل تشحن شيرتات إلى الشرق الأوسط اليوم، وهذا ما يقرر الاستهداف الإقليمي",
      ),
      updated: null,
    },
    {
      id: "dataforseo",
      meta: text(
        "Connected 10 Nov 2026 as the keyword data source. No volumes are shown here until a query returns them.",
        "تم الربط في 10 نوفمبر 2026 كمصدر بيانات الكلمات. لا تُعرض أحجام بحث هنا قبل أن يُرجعها استعلام.",
      ),
      state: "granted",
      text: text(
        "OpenSEO or DataForSEO spend, to verify English and Arabic keyword volumes",
        "إنفاق OpenSEO أو DataForSEO للتحقق من أحجام البحث الإنجليزية والعربية",
      ),
      updated: "2026-11-10",
    },
    {
      id: "seoskill",
      meta: text("New. No connection until you say yes.", "جديد. لا ربط قبل موافقتك."),
      state: "pending",
      text: text(
        "Connect seoskill.dev as a data layer on Search Console, Analytics and Bing. It is free to start.",
        "ربط seoskill.dev كطبقة بيانات على Search Console وAnalytics وBing. البدء مجاني.",
      ),
      updated: null,
    },
    {
      id: "public-designs",
      meta: text("New, optional, and not a 2026 requirement", "جديد واختياري وليس مطلوبًا في 2026"),
      state: "pending",
      text: text(
        "Whether customer-made designs may become public, indexable pages, with quality gates so they do not turn into thin or scaled content",
        "هل يجوز أن تصبح تصاميم العملاء صفحات عامة قابلة للفهرسة، مع بوابات جودة حتى لا تتحول إلى محتوى ضعيف أو مُنتَج على نطاق واسع",
      ),
      updated: null,
    },
  ],
  keywords: [
    {
      cluster: text("Garment + Arabic calligraphy", "قطعة ملابس + خط عربي"),
      examples: text(
        "arabic calligraphy t shirt, arabic calligraphy hoodie, arabic sweatshirt, arabic tote bag",
        "arabic calligraphy t shirt, arabic calligraphy hoodie, arabic sweatshirt, arabic tote bag",
      ),
      intent: text("Buy", "شراء"),
      lang: "EN",
      priority: text("High", "عالية"),
      target: text(
        "New product-type collections and intent pages",
        "مجموعات أنواع المنتجات الجديدة وصفحات النية",
      ),
    },
    {
      cluster: text("Arabic-script garment", "ملابس بالخط العربي"),
      examples: text(
        "تيشيرت بالخط العربي، هودي مكتوب عليه عربي، ملابس بالخط العربي",
        "تيشيرت بالخط العربي، هودي مكتوب عليه عربي، ملابس بالخط العربي",
      ),
      intent: text("Buy", "شراء"),
      lang: "AR",
      priority: text("High", "عالية"),
      target: text("/ar product-type collections", "مجموعات أنواع المنتجات في /ar"),
    },
    {
      cluster: text("Custom name", "اسم مخصص"),
      examples: text(
        "arabic name shirt, custom arabic calligraphy shirt, name in arabic hoodie, اسمك بالخط العربي على تيشيرت",
        "arabic name shirt, custom arabic calligraphy shirt, name in arabic hoodie, اسمك بالخط العربي على تيشيرت",
      ),
      intent: text("Buy", "شراء"),
      lang: "EN/AR",
      priority: text("High", "عالية"),
      target: text(
        "/design, /ar/design, and a custom-name intent page",
        "/design و /ar/design وصفحة نية للاسم المخصص",
      ),
    },
    {
      cluster: text("Gifts, now", "هدايا، الآن"),
      examples: text(
        "arabic gifts, gifts for arab friends, arabic calligraphy gift, arabic mug",
        "arabic gifts, gifts for arab friends, arabic calligraphy gift, arabic mug",
      ),
      intent: text("Buy", "شراء"),
      lang: "EN",
      priority: text("High", "عالية"),
      target: text("Holiday gift guide", "دليل هدايا العطلة"),
    },
    {
      cluster: text("Phrase meanings", "معاني العبارات"),
      examples: text(
        "habibi meaning, yalla meaning, inshallah meaning, yalla habibi, khalas meaning, mashallah meaning, and Arabic-script equivalents",
        "habibi meaning, yalla meaning, inshallah meaning, yalla habibi, khalas meaning, mashallah meaning، وما يقابلها بالخط العربي",
      ),
      intent: text("Learn, then buy", "تعلّم ثم شراء"),
      lang: "EN/AR",
      priority: text("High, compounding", "عالية، وتتراكم"),
      target: text("New glossary pages, linking to products", "صفحات معجم جديدة تربط بالمنتجات"),
    },
    {
      cluster: text("Transliterated phrases", "عبارات منقولة حرفيًا"),
      examples: text(
        "habibi shirt, habibi hoodie, habibi cap, tafakkar shirt",
        "habibi shirt, habibi hoodie, habibi cap, tafakkar shirt",
      ),
      intent: text("Buy", "شراء"),
      lang: "EN",
      priority: text("Medium", "متوسطة"),
      target: text(
        "Product pages and Politics/Humor collections",
        "صفحات المنتجات ومجموعات السياسة والفكاهة",
      ),
    },
    {
      cluster: text("Poetry and quotes", "الشعر والاقتباسات"),
      examples: text(
        "arabic poetry shirt, arabic quote shirt, funny arabic shirts; Image search already shows «لاحظ ان كلامك جارح» and other verses",
        "arabic poetry shirt, arabic quote shirt, funny arabic shirts؛ وبحث الصور يعرض أصلًا «لاحظ ان كلامك جارح» وأبياتًا أخرى",
      ),
      intent: text("Buy", "شراء"),
      lang: "EN/AR",
      priority: text("Medium, already in Image search", "متوسطة، وموجودة في بحث الصور"),
      target: text("Poetry and Humor collections", "مجموعات الشعر والفكاهة"),
    },
    {
      cluster: text("Kids and baby", "الأطفال والرضّع"),
      examples: text(
        "arabic baby onesie, arabic kids shirt, ملابس أطفال بالعربي",
        "arabic baby onesie, arabic kids shirt, ملابس أطفال بالعربي",
      ),
      intent: text("Buy", "شراء"),
      lang: "EN/AR",
      priority: text("Medium", "متوسطة"),
      target: text("Kids and Baby collections", "مجموعات الأطفال والرضّع"),
    },
    {
      cluster: text("Ramadan and Eid", "رمضان والعيد"),
      examples: text(
        "ramadan gifts, eid gifts, eid outfit kids, eid gift t-shirt, هدايا رمضان، هدايا العيد",
        "ramadan gifts, eid gifts, eid outfit kids, eid gift t-shirt, هدايا رمضان، هدايا العيد",
      ),
      intent: text("Buy, seasonal", "شراء موسمي"),
      lang: "EN/AR",
      priority: text("High for Jan–Mar", "عالية من يناير إلى مارس"),
      target: text(
        "Ramadan/Eid 2027 collection and intent pages",
        "مجموعة رمضان والعيد 2027 وصفحات النية",
      ),
    },
    {
      cluster: text("Script styles", "أنواع الخط"),
      examples: text(
        "thuluth, kufic calligraphy, diwani script, خط الثلث، الخط الكوفي، الخط الديواني",
        "thuluth, kufic calligraphy, diwani script, خط الثلث، الخط الكوفي، الخط الديواني",
      ),
      intent: text("Learn", "تعلّم"),
      lang: "EN/AR",
      priority: text("Medium, links and authority", "متوسطة، للروابط والمرجعية"),
      target: text("Script guides", "أدلة الخطوط"),
    },
    {
      cluster: text("Meanings on products", "المعاني على المنتجات"),
      examples: text(
        "tafakkar meaning, al adab meaning, لا غنى كالعقل",
        "tafakkar meaning, al adab meaning, لا غنى كالعقل",
      ),
      intent: text("Learn", "تعلّم"),
      lang: "EN/AR",
      priority: text("Low to medium", "منخفضة إلى متوسطة"),
      target: text(
        "Expanded product design sections, plus the glossary",
        "أقسام معنى التصميم في صفحة المنتج، مع المعجم",
      ),
    },
  ],
  kpis: [
    {
      baseline: text(
        "Sitemap API reports 0 indexed, with the caveat that this figure is often incomplete; only 4 URLs have web impressions",
        "واجهة خرائط الموقع تُبلغ عن 0 مفهرسة، مع أن هذا الرقم غالبًا ناقص؛ و4 روابط فقط لها ظهور في بحث الويب",
      ),
      cadence: text("Weekly", "أسبوعيًا"),
      checkpoint: text(
        "Nearly all product and collection URLs indexed in both languages; no account or checkout hosts in the index",
        "فهرسة كل روابط المنتجات والمجموعات تقريبًا باللغتين؛ ولا مضيفات حساب أو دفع في الفهرس",
      ),
      id: "indexed-urls",
      name: text("Indexed URLs vs the sitemap", "الروابط المفهرسة مقابل خريطة الموقع"),
      source: text(
        "Search Console, Pages report and sitemaps API",
        "Search Console، تقرير الصفحات وواجهة خرائط الموقع",
      ),
    },
    {
      baseline: text(
        "3 impressions, 0 clicks, average position 4; no query rows. 10 Aug–9 Nov 2026",
        "3 ظهورات، 0 نقرات، متوسط ترتيب 4؛ ولا صفوف استعلامات. 10 أغسطس–9 نوفمبر 2026",
      ),
      cadence: text("Weekly", "أسبوعيًا"),
      checkpoint: text(
        "Rising week over week from this baseline",
        "ارتفاع أسبوعًا بعد أسبوع من هذا الخط الأساس",
      ),
      id: "web-search",
      name: text(
        "Non-brand web impressions and clicks",
        "ظهورات ونقرات بحث الويب غير المرتبطة بالعلامة",
      ),
      source: text("Search Console, web search", "Search Console، بحث الويب"),
    },
    {
      baseline: text(
        "55 impressions, 0 clicks, average position 40.8, mostly Arabic phrases. 30 Oct–9 Nov 2026",
        "55 ظهورًا، 0 نقرات، متوسط ترتيب 40.8، ومعظمها عبارات عربية. 30 أكتوبر–9 نوفمبر 2026",
      ),
      cadence: text("Weekly", "أسبوعيًا"),
      checkpoint: text(
        "More impressions on https://shirtat.co URLs only; rising CTR after alt text and filenames",
        "مزيد من الظهور على روابط https://shirtat.co فقط؛ وارتفاع نسبة النقر بعد النص البديل وأسماء الملفات",
      ),
      id: "image-search",
      name: text("Image search impressions and clicks", "ظهورات ونقرات بحث الصور"),
      source: text("Search Console, image search", "Search Console، بحث الصور"),
    },
    {
      baseline: text("Not live", "غير متاح"),
      cadence: text("Weekly", "أسبوعيًا"),
      checkpoint: text("Live and receiving clicks", "يعمل ويتلقى نقرات"),
      id: "free-listings",
      name: text("Free-listing clicks", "نقرات الإدراج المجاني"),
      source: text("Merchant Center", "Merchant Center"),
    },
    {
      baseline: text("Not set from GSC (0 clicks)", "غير محسوب من Search Console (0 نقرات)"),
      cadence: text("Weekly", "أسبوعيًا"),
      checkpoint: text("Reported as a share of the $10,000", "يُعرض كحصة من 10,000 دولار"),
      id: "organic-orders",
      name: text(
        "Organic sessions, orders and revenue",
        "الجلسات والطلبات والإيراد من البحث العضوي",
      ),
      source: text(
        "GA4 via Tag Manager; Shopify sessions by referrer",
        "GA4 عبر Tag Manager؛ وجلسات Shopify حسب المُحيل",
      ),
    },
    {
      baseline: text("Not yet tracked with volumes", "لا تُتتبَّع بأحجام بحث بعد"),
      cadence: text("Weekly", "أسبوعيًا"),
      checkpoint: text(
        "Tracked from the week a tool is approved, or from the first GSC query rows",
        "تُتتبَّع من أسبوع الموافقة على الأداة، أو من أول صفوف استعلامات Search Console",
      ),
      id: "rankings",
      name: text("Rankings for about 20 target queries", "ترتيب نحو 20 استعلامًا مستهدفًا"),
      source: text(
        "DataForSEO when a query is run; otherwise GSC as queries appear",
        "DataForSEO عند تشغيل استعلام؛ وإلا Search Console حين تظهر الاستعلامات",
      ),
    },
    {
      baseline: text("Not yet tested", "لم يُختبَر بعد"),
      cadence: text(
        "After the November on-page fixes, then monthly",
        "بعد إصلاحات نوفمبر داخل الصفحة، ثم شهريًا",
      ),
      checkpoint: text(
        "At least one successful path recorded, with sources, blocks and ranking notes",
        "مسار ناجح واحد على الأقل، مع المصادر والعوائق وملاحظات الترتيب",
      ),
      id: "agent-offer",
      name: text("Agent reached a usable offer", "وصل الوكيل إلى عرض قابل للاستخدام"),
      source: text(
        "Manual test log from fresh shopping-agent accounts",
        "سجل اختبار يدوي من حسابات وكلاء تسوّق جديدة",
      ),
    },
    {
      baseline: text("No query rows to mine", "لا صفوف استعلامات تُستخرج"),
      cadence: text("Monthly, once data exists", "شهريًا، بعد وجود البيانات"),
      checkpoint: text(
        "High-impression, low-click questions answered at the top of the ranking page",
        "الإجابة عن الأسئلة كثيرة الظهور قليلة النقر في أعلى الصفحة التي تترتب",
      ),
      id: "long-queries",
      name: text("Long queries answered", "الاستعلامات الطويلة التي أُجيب عنها"),
      source: text(
        "GSC regex for 8+ word queries, including Arabic",
        "تعبير Search Console لاستعلامات من 8 كلمات فأكثر، بما فيها العربية",
      ),
    },
    {
      baseline: text("Not refreshed in this update", "لم يُحدَّث في هذه المراجعة"),
      cadence: text("Monthly", "شهريًا"),
      checkpoint: text("First quality links in place", "أول روابط جيدة في مكانها"),
      id: "referring-domains",
      name: text("Referring domains", "النطاقات المُحيلة"),
      source: text(
        "Ahrefs Webmaster Tools (free) or OpenSEO if approved",
        "Ahrefs Webmaster Tools (مجاني) أو OpenSEO إذا وُوفق عليه",
      ),
    },
    {
      baseline: text("Product lab LCP 3.2 s", "LCP المختبري لصفحة المنتج 3.2 ث"),
      cadence: text("Monthly", "شهريًا"),
      checkpoint: text("Product LCP under 2.5 s in lab", "LCP المنتج أقل من 2.5 ث في المختبر"),
      id: "core-web-vitals",
      name: text("Core Web Vitals", "مؤشرات أداء الويب الأساسية"),
      source: text(
        "Search Console CWV report, Lighthouse",
        "تقرير CWV في Search Console، وLighthouse",
      ),
    },
    {
      baseline: text("Not yet rechecked after reconnect", "لم يُعَد فحصه بعد إعادة الربط"),
      cadence: text("After each release", "بعد كل إصدار"),
      checkpoint: text(
        "No Product or merchant listing errors",
        "لا أخطاء في المنتج أو إدراج التاجر",
      ),
      id: "rich-results",
      name: text("Rich results", "النتائج المنسّقة"),
      source: text("Search Console enhancement reports", "تقارير التحسينات في Search Console"),
    },
  ],
  tasks: [
    {
      action: text(
        "Language hreflang is emitted for en, ar and x-default on storefront pages and in the sitemap.",
        "يُرسَل hreflang للغتين en و ar و x-default في صفحات المتجر وفي خريطة الموقع.",
      ),
      approval: text("No", "لا"),
      approvalNeeded: false,
      area: "Technical",
      evidence: text(
        "buildAlternates in lib/seo/index.ts sets en, ar and x-default. app/sitemap/[shard]/route.ts repeats those xhtml:link alternates. Arabic titles are still task 3.",
        "buildAlternates في lib/seo/index.ts يضبط en و ar و x-default. و app/sitemap/[shard]/route.ts يكرر روابط xhtml:link نفسها. العناوين العربية ما زالت المهمة 3.",
      ),
      id: "hreflang",
      link: null,
      measure: text(
        "Reciprocal hreflang on checked pages and in the sitemap",
        "hreflang متبادل في الصفحات المفحوصة وفي خريطة الموقع",
      ),
      owner: "bot",
      phase: "foundation",
      status: "done",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Storefront pages set a self-referencing canonical on shirtat.co.",
        "صفحات المتجر تضبط عنوانًا أساسيًا يشير إلى نفسه على shirtat.co.",
      ),
      approval: text("No", "لا"),
      approvalNeeded: false,
      area: "Technical",
      evidence: text(
        "buildAlternates sets the canonical. Product option URLs are canonicalized in lib/product/index.ts before Shopify sees them. account.shirtat.co and checkout.shirtat.co still serve the Shopify theme.",
        "buildAlternates يضبط العنوان الأساسي. وتُوحَّد روابط خيارات المنتج في lib/product/index.ts قبل أن تراها Shopify. وما زال account.shirtat.co و checkout.shirtat.co يعرضان قالب Shopify.",
      ),
      id: "canonicals",
      link: null,
      measure: text(
        "Self-referencing canonicals on the main host",
        "عناوين أساسية تشير إلى نفسها على المضيف الرئيسي",
      ),
      owner: "bot",
      phase: "foundation",
      status: "done",
      updated: "2026-11-10",
    },
    {
      action: text(
        "The sitemap index lists English and Arabic URLs, each with hreflang alternates.",
        "فهرس خريطة الموقع يعرض الروابط الإنجليزية والعربية، وكل منها مع بدائل hreflang.",
      ),
      approval: text("No", "لا"),
      approvalNeeded: false,
      area: "Technical",
      evidence: text(
        "app/sitemap.xml/route.ts is the index. Each child urlset emits both locales. After pull request 19 the live sitemap lists 200 final URLs.",
        "app/sitemap.xml/route.ts هو الفهرس. وكل urlset فرعي يُصدر اللغتين. بعد طلب السحب 19 تعرض خريطة الموقع الحية 200 رابطًا نهائيًا.",
      ),
      id: "sitemap",
      link: null,
      measure: text(
        "Sitemap index plus localized urlsets",
        "فهرس خريطة الموقع مع مجموعات روابط محلية",
      ),
      owner: "bot",
      phase: "foundation",
      status: "done",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Turn on Google Merchant Center free listings via Shopify's Google & YouTube channel (POD items: identifier_exists = no). Title, image, price, size availability and stock in the feed must match the site.",
        "تشغيل الإدراج المجاني في Google Merchant Center عبر قناة Google & YouTube في Shopify (منتجات الطباعة عند الطلب: identifier_exists = no). يجب أن يطابق العنوان والصورة والسعر وتوفر المقاس والمخزون في الخلاصة ما يظهر في الموقع.",
      ),
      approval: text("Yes, new account", "نعم، حساب جديد"),
      approvalNeeded: true,
      area: "Shopping",
      evidence: null,
      id: "1",
      link: null,
      measure: text(
        "Free-listing clicks and orders (Merchant Center, GA4)",
        "نقرات وطلبات الإدراج المجاني (Merchant Center و GA4)",
      ),
      owner: "moe",
      phase: "now",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Create 9 product-type collections in EN and AR (tees, hoodies, sweatshirts, totes, prints, caps & beanies, mugs, kids, baby) and point Shop by product to them, not /search",
        "إنشاء 9 مجموعات لأنواع المنتجات بالإنجليزية والعربية (تيشيرتات، هوديز، سويتشرت، حقائب، مطبوعات، قبعات وطواقي، أكواب، أطفال، رضّع) وتوجيه «تسوّق حسب المنتج» إليها لا إلى /search",
      ),
      approval: text("Yes", "نعم"),
      approvalNeeded: true,
      area: "On-page",
      evidence: null,
      id: "2",
      link: null,
      measure: text(
        "Impressions on garment queries (GSC)",
        "الظهور في استعلامات الملابس (Search Console)",
      ),
      owner: "moe",
      phase: "now",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Rewrite homepage, collection and /design titles and descriptions. Start each collection and product page with 2 to 4 quotable sentences an agent can cite. Give /ar pages Arabic titles, not Latin-only ones.",
        "إعادة كتابة عناوين وأوصاف الصفحة الرئيسية والمجموعات و /design. ابدأ كل مجموعة وصفحة منتج بجملتين إلى أربع يمكن لوكيل اقتباسها. أعطِ صفحات /ar عناوين عربية لا عناوين لاتينية فقط.",
      ),
      approval: text("Yes, copy", "نعم، النص"),
      approvalNeeded: true,
      area: "On-page",
      evidence: null,
      id: "3",
      link: null,
      measure: text(
        "CTR by page (GSC); /ar titles in the index",
        "نسبة النقر حسب الصفحة (Search Console)؛ وعناوين /ar في الفهرس",
      ),
      owner: "moe",
      phase: "now",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Product title and description template: design + script + garment + Arabic calligraphy; fix the doubled Arabic word in descriptions. Put first-viewport facts (material, print method, fit, sizes, price, stock, shipping, returns) in server-rendered HTML, with schema matching the visible text.",
        "قالب عنوان المنتج ووصفه: التصميم + الخط + القطعة + الخط العربي؛ وإصلاح الكلمة العربية المكررة في الأوصاف. ضع حقائق أول الشاشة (الخامة، طريقة الطباعة، القصة، المقاسات، السعر، المخزون، الشحن، الإرجاع) في HTML يُرسم على الخادم، مع بيانات منظمة تطابق النص الظاهر.",
      ),
      approval: text("Yes, template", "نعم، القالب"),
      approvalNeeded: true,
      area: "On-page",
      evidence: null,
      id: "4",
      link: null,
      measure: text(
        "CTR and impressions on product URLs; an agent can read a usable offer without executing apps",
        "نسبة النقر والظهور على روابط المنتجات؛ ويستطيع الوكيل قراءة عرض قابل للاستخدام من دون تشغيل التطبيقات",
      ),
      owner: "moe",
      phase: "now",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Sitemap cleanup: drop the 6 custom-calligraphy URLs that 307 to /design; fill or remove the empty Shopify defaults /blogs/news and /pages/contact; use 301/308 for permanent redirects. Noindex or canonicalise product URLs on account.shirtat.co and checkout.shirtat.co, and stop ?variant= and ?Size=&Color= URLs appearing in Image search.",
        "تنظيف خريطة الموقع: إسقاط روابط الخط المخصص الستة التي تعيد التوجيه 307 إلى /design؛ وملء أو إزالة افتراضيات Shopify الفارغة /blogs/news و /pages/contact؛ واستخدام 301/308 لإعادات التوجيه الدائمة. امنع فهرسة روابط المنتجات على account.shirtat.co و checkout.shirtat.co أو وحّدها، وأوقف ظهور روابط ?variant= و ?Size=&Color= في بحث الصور.",
      ),
      approval: text("Yes", "نعم"),
      approvalNeeded: true,
      area: "Technical",
      evidence: text(
        "Pull request 19 dropped the six custom-calligraphy URLs (they 308 to /design), the empty news blog, and /pages/contact (noindex, 308 to /contact). Product cards link to the clean product URL, and the live sitemap lists 200 URLs. account.shirtat.co and checkout.shirtat.co still serve the Shopify theme.",
        "طلب السحب 19 أسقط روابط الخط المخصص الستة (تعيد التوجيه 308 إلى /design)، ومدونة الأخبار الفارغة، و /pages/contact (noindex، و308 إلى /contact). بطاقات المنتجات تربط بالرابط النظيف، وخريطة الموقع الحية تعرض 200 رابطًا. وما زال account.shirtat.co و checkout.shirtat.co يعرضان قالب Shopify.",
      ),
      id: "5",
      link: "https://github.com/moeghashim/shirtat-shop/pull/19",
      measure: text(
        "Zero sitemap warnings; no redirecting or checkout/account URLs in the index",
        "صفر تحذيرات في خريطة الموقع؛ ولا روابط تعيد التوجيه أو روابط دفع/حساب في الفهرس",
      ),
      owner: "bot",
      phase: "now",
      status: "done",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Holiday gift guide in EN and AR (gifts for him, her, kids; custom name gifts; price bands), linked from the homepage, with the Printify holiday cutoff stated",
        "دليل هدايا العطلة بالإنجليزية والعربية (هدايا له ولها وللأطفال؛ هدايا الاسم المخصص؛ شرائح السعر)، مربوط من الصفحة الرئيسية، مع ذكر موعد Printify النهائي للعطلة",
      ),
      approval: text("Yes, copy", "نعم، النص"),
      approvalNeeded: true,
      area: "Content",
      evidence: null,
      id: "6",
      link: null,
      measure: text("Sessions and orders from the guide", "الجلسات والطلبات القادمة من الدليل"),
      owner: "moe",
      phase: "now",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Make /design rank for custom intent: intro copy, examples, FAQ, and Product schema with offers. Keep add to cart inspectable, with no forced account before totals.",
        "اجعل /design يظهر لنية التخصيص: مقدمة وأمثلة وأسئلة شائعة وبيانات Product مع العروض. أبقِ الإضافة إلى السلة قابلة للفحص، من دون إجبار على حساب قبل الإجمالي.",
      ),
      approval: text("Yes", "نعم"),
      approvalNeeded: true,
      area: "On-page",
      evidence: null,
      id: "7",
      link: null,
      measure: text("Impressions on custom name queries", "الظهور في استعلامات الاسم المخصص"),
      owner: "moe",
      phase: "now",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Image SEO: descriptive filenames; compress images; bilingual keyword-rich alt text for the 16 empty-alt homepage images and 34 on /design; ImageObject schema. Unique lifestyle or flat-lay shots for best sellers need approval.",
        "تحسين الصور: أسماء ملفات وصفية؛ وضغط الصور؛ ونص بديل ثنائي اللغة غني بالكلمات للصور الـ16 بلا نص بديل في الصفحة الرئيسية والـ34 في /design؛ وبيانات ImageObject. صور أسلوب الحياة أو الصور المسطحة الفريدة للأكثر مبيعًا تحتاج موافقة.",
      ),
      approval: text(
        "Alt and filenames: no. Unique photos: yes",
        "النص البديل وأسماء الملفات: لا. الصور الفريدة: نعم",
      ),
      approvalNeeded: true,
      area: "On-page",
      evidence: text(
        "Pull request 19 gives homepage and /design images bilingual alt text from the title, colour, and shot type, and product data uses ImageObject with that caption. Three decorative marks that sit beside their names stay empty. Filenames are still the Shopify and Printify names. Unique lifestyle photos still need approval.",
        "طلب السحب 19 يعطي صور الصفحة الرئيسية و /design نصًا بديلًا ثنائي اللغة من العنوان واللون ونوع اللقطة، وبيانات المنتج تستخدم ImageObject بذلك الوصف. ثلاث علامات زخرفية تقف بجانب أسمائها تبقى فارغة. أسماء الملفات ما زالت أسماء Shopify و Printify. صور أسلوب الحياة الفريدة ما زالت تحتاج موافقة.",
      ),
      id: "8",
      link: "https://github.com/moeghashim/shirtat-shop/pull/19",
      measure: text(
        "Image search impressions and CTR (GSC); fewer generic Printify filenames",
        "ظهور بحث الصور ونسبة النقر (Search Console)؛ وعدد أقل من أسماء ملفات Printify العامة",
      ),
      owner: "bot",
      phase: "now",
      status: "done",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Add Bing Webmaster Tools and IndexNow; resubmit the sitemap after cleanup",
        "إضافة Bing Webmaster Tools و IndexNow؛ وإعادة إرسال خريطة الموقع بعد التنظيف",
      ),
      approval: text("Moe signs in to Bing", "Moe يسجّل الدخول إلى Bing"),
      approvalNeeded: true,
      area: "Measurement",
      evidence: null,
      id: "9",
      link: null,
      measure: text(
        "Indexed URLs out of the sitemap",
        "الروابط المفهرسة من أصل روابط خريطة الموقع",
      ),
      owner: "moe",
      phase: "now",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Structured data upgrade: shippingDetails, hasMerchantReturnPolicy, sku, collection level in product breadcrumbs, ItemList on collections, alternateName شيرتات on Organization. Keep Product, Offer, FAQPage and Organization in sync with visible text.",
        "ترقية البيانات المنظمة: shippingDetails و hasMerchantReturnPolicy و sku ومستوى المجموعة في مسارات المنتج و ItemList في المجموعات و alternateName شيرتات على Organization. أبقِ Product و Offer و FAQPage و Organization متوافقة مع النص الظاهر.",
      ),
      approval: text("Yes", "نعم"),
      approvalNeeded: true,
      area: "Technical",
      evidence: null,
      id: "10",
      link: null,
      measure: text(
        "Rich Results Test pass; GSC merchant listing report errors = 0",
        "اجتياز اختبار النتائج المنسّقة؛ وأخطاء تقرير إدراج التاجر في Search Console = 0",
      ),
      owner: "moe",
      phase: "dec",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Script guides in EN and AR for Thuluth, Kufic and Diwani; link the homepage script cards (they link nowhere now) and each guide to products in that script",
        "أدلة خطوط بالإنجليزية والعربية للثلث والكوفي والديواني؛ وربط بطاقات الخطوط في الصفحة الرئيسية (لا تربط إلى شيء الآن) وكل دليل بالمنتجات بذلك الخط",
      ),
      approval: text("Yes, copy", "نعم، النص"),
      approvalNeeded: true,
      area: "Content",
      evidence: text(
        "Pull request 19 links Thuluth and Diwani to /design#thuluth and /design#diwani, which the builder reads, and Kufic to search (كوفي in Arabic). The bilingual script-guide pages are not in that pull request.",
        "طلب السحب 19 يربط الثلث والديواني بـ /design#thuluth و /design#diwani، والأداة تقرأ ذلك الرابط، والكوفي ببحث (كوفي بالعربية). صفحات أدلة الخطوط الثنائية ليست في ذلك الطلب.",
      ),
      id: "11",
      link: "https://github.com/moeghashim/shirtat-shop/pull/19",
      measure: text(
        "Impressions on script queries; clicks to products",
        "الظهور في استعلامات الخطوط؛ والنقرات إلى المنتجات",
      ),
      owner: "bot",
      phase: "dec",
      status: "done",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Bilingual phrase-meaning glossary: pages such as ‘What does habibi mean?’, yalla, inshallah, yalla habibi, khalas and mashallah, each explaining the phrase and its culture and linking to products that carry it. Expand each design's The design section with translation, transliteration, pronunciation and source.",
        "معجم ثنائي اللغة لمعاني العبارات: صفحات مثل «ماذا يعني حبيبي؟» ويلا وإن شاء الله ويلا حبيبي وخلاص وما شاء الله، كل منها يشرح العبارة وثقافتها ويربط بالمنتجات التي تحملها. وسّع قسم «التصميم» في كل تصميم بالترجمة والنقل الحرفي والنطق والمصدر.",
      ),
      approval: text("Yes, glossary set and copy", "نعم، مجموعة المعجم والنص"),
      approvalNeeded: true,
      area: "Content",
      evidence: null,
      id: "12",
      link: null,
      measure: text(
        "Impressions on ‘meaning’ queries; clicks through to products",
        "الظهور في استعلامات «المعنى»؛ والنقرات إلى المنتجات",
      ),
      owner: "moe",
      phase: "dec",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Intent landing pages for exact deliverables: ‘custom Arabic name shirt’, ‘Eid gift t-shirt’, ‘Arabic calligraphy hoodie’, leading into the /design builder or a filtered collection. Write EN and AR natively.",
        "صفحات هبوط للنية لمنتج محدد: «تيشيرت اسم عربي مخصص» و«تيشيرت هدية العيد» و«هودي بالخط العربي»، وتقود إلى أداة /design أو مجموعة مُرشَّحة. اكتب الإنجليزية والعربية كتابة أصلية.",
      ),
      approval: text("Yes, copy", "نعم، النص"),
      approvalNeeded: true,
      area: "Content",
      evidence: null,
      id: "13",
      link: null,
      measure: text("Impressions and clicks on those queries", "الظهور والنقرات على تلك الاستعلامات"),
      owner: "moe",
      phase: "dec",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Ramadan and Eid 2027 collection plus gift guide, published by early January so it is indexed before Ramadan (expected Feb 8, 2027)",
        "مجموعة رمضان والعيد 2027 مع دليل الهدايا، تُنشر في أوائل يناير لتُفهرس قبل رمضان (المتوقع 8 فبراير 2027)",
      ),
      approval: text("Yes", "نعم"),
      approvalNeeded: true,
      area: "Content",
      evidence: null,
      id: "14",
      link: null,
      measure: text(
        "Indexed by mid-January; seasonal impressions",
        "مفهرسة بحلول منتصف يناير؛ وظهور موسمي",
      ),
      owner: "moe",
      phase: "dec",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Internal links: making-of and roadmap entries link to the products they mention; Shop this script modules; related collections on product pages; glossary and intent pages link to live products",
        "روابط داخلية: مقالات كواليس الصنع وخارطة الطريق تربط بالمنتجات التي تذكرها؛ ووحدات «تسوّق هذا الخط»؛ والمجموعات ذات الصلة في صفحات المنتجات؛ وصفحات المعجم والنية تربط بمنتجات منشورة",
      ),
      approval: text("No, low risk", "لا، خطر منخفض"),
      approvalNeeded: false,
      area: "Linking",
      evidence: null,
      id: "15",
      link: null,
      measure: text(
        "Crawl depth; clicks from content to products",
        "عمق الزحف؛ والنقرات من المحتوى إلى المنتجات",
      ),
      owner: "bot",
      phase: "dec",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Product page LCP: preload and right-size the hero image (lab LCP 3.2 s on mobile)",
        "LCP صفحة المنتج: التحميل المسبق لصورة البطل بالحجم المعروض (LCP المختبري 3.2 ث على الجوال)",
      ),
      approval: text("No, low risk", "لا، خطر منخفض"),
      approvalNeeded: false,
      area: "Technical",
      evidence: null,
      id: "16",
      link: null,
      measure: text(
        "Lab LCP under 2.5 s; CWV report in GSC",
        "LCP المختبري أقل من 2.5 ث؛ وتقرير CWV في Search Console",
      ),
      owner: "bot",
      phase: "dec",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Link building round 1, drafts only until approved: designer profiles linking back, Arab and Muslim-owned business directories, diaspora lifestyle media, the built-with-AI making-of story for maker communities",
        "الجولة الأولى لبناء الروابط، مسودات فقط حتى الموافقة: ملفات المصممين تربط إلينا، وأدلة الأعمال العربية والمملوكة لمسلمين، وإعلام أسلوب حياة المهجر، وقصة الصنع بالذكاء الاصطناعي لمجتمعات الصنّاع",
      ),
      approval: text("Yes, every send", "نعم، كل إرسال"),
      approvalNeeded: true,
      area: "Backlinks",
      evidence: null,
      id: "17",
      link: null,
      measure: text(
        "Referring domains (Ahrefs Webmaster Tools or OpenSEO, if approved)",
        "النطاقات المُحيلة (Ahrefs Webmaster Tools أو OpenSEO إذا وُوفق عليه)",
      ),
      owner: "moe",
      phase: "dec",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Agent conversion tests: from a fresh account, run searches such as ‘funny Arabic t-shirt gift’ in shopping agents. Record sources, blocks, ranking variables, and whether the agent reached a usable Shirtat offer, not just a mention. Do not bot-block shopping agents.",
        "اختبارات تحويل الوكلاء: من حساب جديد، شغّل عمليات بحث مثل «هدية تيشيرت عربي طريفة» في وكلاء التسوّق. سجّل المصادر والعوائق ومتغيرات الترتيب، وهل وصل الوكيل إلى عرض شيرتات قابل للاستخدام لا مجرد ذكر. لا تحجب وكلاء التسوّق.",
      ),
      approval: text(
        "No spend; do not use a personal account",
        "من دون إنفاق؛ ولا تستخدم حسابًا شخصيًا",
      ),
      approvalNeeded: false,
      area: "Measurement",
      evidence: null,
      id: "18",
      link: null,
      measure: text(
        "Agent reached a usable offer (pass/fail log)",
        "وصل الوكيل إلى عرض قابل للاستخدام (سجل نجاح/فشل)",
      ),
      owner: "bot",
      phase: "dec",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Bilingual blog cadence, 1 to 2 posts a week, written for each language rather than machine-translated",
        "إيقاع مدونة ثنائي اللغة، منشور إلى منشورين في الأسبوع، مكتوبين لكل لغة لا مترجمين آليًا",
      ),
      approval: text("Yes, calendar", "نعم، التقويم"),
      approvalNeeded: true,
      area: "Content",
      evidence: null,
      id: "19",
      link: null,
      measure: text(
        "Non-brand clicks; posts indexed",
        "نقرات غير مرتبطة بالعلامة؛ والمنشورات مفهرسة",
      ),
      owner: "moe",
      phase: "q1",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Monthly Search Console review, including the 8+ word regex for English and Arabic queries. Pick high-impression, low-click questions and answer them at the top of the ranking page. Expand Arabic-script and transliterated keywords from real GSC data.",
        "مراجعة شهرية لـ Search Console، بما فيها تعبير الاستعلامات من 8 كلمات فأكثر للإنجليزية والعربية. اختر الأسئلة كثيرة الظهور قليلة النقر وأجب عنها في أعلى الصفحة التي تترتب. ووسّع كلمات الخط العربي والمنقولة حرفيًا من بيانات Search Console الفعلية.",
      ),
      approval: text("No, once impressions exist", "لا، بعد وجود الظهور"),
      approvalNeeded: false,
      area: "Keywords",
      evidence: null,
      id: "20",
      link: null,
      measure: text(
        "New long queries answered; rising CTR on those pages",
        "استعلامات طويلة جديدة أُجيب عنها؛ وارتفاع نسبة النقر في تلك الصفحات",
      ),
      owner: "bot",
      phase: "q1",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Reviews: collect post-purchase reviews; add aggregateRating only from real reviews",
        "المراجعات: اجمع مراجعات ما بعد الشراء؛ وأضف aggregateRating من مراجعات حقيقية فقط",
      ),
      approval: text("Yes, app", "نعم، تطبيق"),
      approvalNeeded: true,
      area: "Technical",
      evidence: null,
      id: "21",
      link: null,
      measure: text("Review stars in results", "نجوم المراجعات في النتائج"),
      owner: "moe",
      phase: "q1",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Regional pages only if Shopify Markets adds GBP/EUR prices (then en-GB, en-IE etc.); otherwise keep language-only hreflang. A French homepage is a later test for France and North Africa, not a 2026 task.",
        "صفحات إقليمية فقط إذا أضافت Shopify Markets أسعار GBP/EUR (ثم en-GB و en-IE وغيرهما)؛ وإلا أبقِ hreflang على اللغة فقط. الصفحة الرئيسية الفرنسية اختبار لاحق لفرنسا وشمال أفريقيا، وليست مهمة 2026.",
      ),
      approval: text("Yes", "نعم"),
      approvalNeeded: true,
      area: "International",
      evidence: text(
        "Language-only hreflang is already what the storefront emits. This task stays not started: no GBP/EUR market pages, and no French homepage.",
        "hreflang حسب اللغة هو ما يرسله المتجر أصلًا. تبقى هذه المهمة غير مبدوءة: لا صفحات سوق بالجنيه أو اليورو، ولا صفحة رئيسية فرنسية.",
      ),
      id: "22",
      link: null,
      measure: text("Clicks by country (GSC)", "النقرات حسب البلد (Search Console)"),
      owner: "moe",
      phase: "q1",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Digital PR around Ramadan and Arab American Heritage Month (April)",
        "علاقات عامة رقمية حول رمضان وشهر التراث العربي الأمريكي (أبريل)",
      ),
      approval: text("Yes, every send", "نعم، كل إرسال"),
      approvalNeeded: true,
      area: "Backlinks",
      evidence: null,
      id: "23",
      link: null,
      measure: text(
        "Referring domains; brand searches",
        "النطاقات المُحيلة؛ وعمليات البحث عن العلامة",
      ),
      owner: "moe",
      phase: "q1",
      status: "not-started",
      updated: "2026-11-10",
    },
    {
      action: text(
        "Optional: customer designs as public, indexable pages, only with quality gates so they do not become thin or scaled content.",
        "اختياري: تصاميم العملاء كصفحات عامة قابلة للفهرسة، فقط مع بوابات جودة حتى لا تصبح محتوى ضعيفًا أو مُنتَجًا على نطاق واسع.",
      ),
      approval: text("Yes, and quality rules", "نعم، وقواعد الجودة"),
      approvalNeeded: true,
      area: "Content",
      evidence: null,
      id: "24",
      link: null,
      measure: text(
        "Indexed design URLs that get impressions without quality flags",
        "روابط تصاميم مفهرسة تحصل على ظهور من دون علامات جودة",
      ),
      owner: "moe",
      phase: "q1",
      status: "not-started",
      updated: "2026-11-10",
    },
  ],
  timeline: [
    {
      focus: text(
        "Search Console is connected. Remaining approvals, including tools and the glossary. Merchant Center setup. Titles, answer capsules and first-viewport facts. Start fixing account/checkout and variant URLs.",
        "Search Console مربوط. الموافقات المتبقية، بما فيها الأدوات والمعجم. إعداد Merchant Center. العناوين وفقرة الإجابة وحقائق أول الشاشة. والبدء بإصلاح روابط الحساب/الدفع والمتغيرات.",
      ),
      window: text("Nov 10–16", "10–16 نوفمبر"),
    },
    {
      focus: text(
        "Product-type collections; gift guide live; sitemap cleanup and resubmit; Bing and IndexNow.",
        "مجموعات أنواع المنتجات؛ ونشر دليل الهدايا؛ وتنظيف خريطة الموقع وإعادة إرسالها؛ وBing و IndexNow.",
      ),
      window: text("Nov 17–23", "17–23 نوفمبر"),
    },
    {
      focus: text(
        "/design content; image alt text and filenames; Black Friday (Nov 27) and Cyber Monday (Nov 30) pages indexed.",
        "محتوى /design؛ والنص البديل للصور وأسماء الملفات؛ وفهرسة صفحات الجمعة البيضاء (27 نوفمبر) والإثنين الإلكتروني (30 نوفمبر).",
      ),
      window: text("Nov 24–30", "24–30 نوفمبر"),
    },
    {
      focus: text(
        "Structured data upgrade; script guides; product LCP fix; first outreach drafts; start the glossary and intent pages if approved; first agent-conversion test.",
        "ترقية البيانات المنظمة؛ وأدلة الخطوط؛ وإصلاح LCP المنتج؛ وأول مسودات التواصل؛ وبدء المعجم وصفحات النية إذا وُوفق عليها؛ وأول اختبار تحويل للوكلاء.",
      ),
      window: text("Dec 1–15", "1–15 ديسمبر"),
    },
    {
      focus: text(
        "Ramadan and Eid hub drafted; design meanings; KPI review against the 10 Nov baseline.",
        "مسودة محور رمضان والعيد؛ ومعاني التصاميم؛ ومراجعة المؤشرات مقابل خط أساس 10 نوفمبر.",
      ),
      window: text("Dec 16–31", "16–31 ديسمبر"),
    },
    {
      focus: text(
        "Ramadan hub live by early January; blog cadence; reviews; monthly long-query mining once queries exist; digital PR; optional public customer-design pages only if approved.",
        "محور رمضان منشور في أوائل يناير؛ وإيقاع المدونة؛ والمراجعات؛ واستخراج الاستعلامات الطويلة شهريًا بعد ظهورها؛ والعلاقات العامة الرقمية؛ وصفحات تصاميم العملاء العامة فقط إذا وُوفق عليها.",
      ),
      window: text("Jan–Mar 2027", "يناير–مارس 2027"),
    },
  ],
  titles: [
    {
      current: text("Shirtat", "Shirtat"),
      page: text("Home EN", "الرئيسية EN"),
      proposed: text(
        "Arabic Calligraphy T-Shirts, Hoodies & Gifts | Shirtat",
        "Arabic Calligraphy T-Shirts, Hoodies & Gifts | Shirtat",
      ),
    },
    {
      current: text("Shirtat", "Shirtat"),
      page: text("Home AR", "الرئيسية AR"),
      proposed: text(
        "تيشيرتات وهوديز بالخط العربي وهدايا | شيرتات",
        "تيشيرتات وهوديز بالخط العربي وهدايا | شيرتات",
      ),
    },
    {
      current: text("Design your own | Shirtat", "Design your own | Shirtat"),
      page: text("/design EN", "/design EN"),
      proposed: text(
        "Custom Arabic Name & Calligraphy Shirts | Shirtat",
        "Custom Arabic Name & Calligraphy Shirts | Shirtat",
      ),
    },
    {
      current: text("(same pattern)", "(النمط نفسه)"),
      page: text("/design AR", "/design AR"),
      proposed: text(
        "اكتب اسمك بالخط العربي على تيشيرت أو هودي | شيرتات",
        "اكتب اسمك بالخط العربي على تيشيرت أو هودي | شيرتات",
      ),
    },
    {
      current: text("Poetry | Shirtat", "Poetry | Shirtat"),
      page: text("Poetry EN", "الشعر EN"),
      proposed: text(
        "Arabic Poetry Shirts, Hoodies & Prints | Shirtat",
        "Arabic Poetry Shirts, Hoodies & Prints | Shirtat",
      ),
    },
    {
      current: text("شعر | Shirtat", "شعر | Shirtat"),
      page: text("Poetry AR", "الشعر AR"),
      proposed: text(
        "ملابس وهدايا بأبيات الشعر العربي | شيرتات",
        "ملابس وهدايا بأبيات الشعر العربي | شيرتات",
      ),
    },
    {
      current: text(
        "Tafakkar – Reflect (تفكّر) T-shirt | Shirtat",
        "Tafakkar – Reflect (تفكّر) T-shirt | Shirtat",
      ),
      page: text("Tafakkar tee EN", "تيشيرت تفكّر EN"),
      proposed: text(
        "Tafakkar (تفكّر) Kufic Arabic Calligraphy T-Shirt | Shirtat",
        "Tafakkar (تفكّر) Kufic Arabic Calligraphy T-Shirt | Shirtat",
      ),
    },
    {
      current: text("تيشيرت «تفكّر» | Shirtat", "تيشيرت «تفكّر» | Shirtat"),
      page: text("Tafakkar tee AR", "تيشيرت تفكّر AR"),
      proposed: text("تيشيرت «تفكّر» بالخط الكوفي | شيرتات", "تيشيرت «تفكّر» بالخط الكوفي | شيرتات"),
    },
  ],
};

function pick(copy: SeoCopy, locale: Locale): string {
  return copy[locale];
}

function known(values: readonly string[], value: string | null | undefined): string {
  if (!value || value === "all") return "all";
  return values.includes(value) ? value : value;
}

export function parseSeoTool(value: string | null): SeoTool | null {
  return SEO_TOOLS.find((tool) => tool === value) ?? null;
}

export function parseTaskFilter(input: {
  area?: string | null;
  owner?: string | null;
  phase?: string | null;
  status?: string | null;
}): TaskFilter {
  return {
    area: known(SEO_AREAS, input.area),
    owner: known(SEO_OWNERS, input.owner),
    phase: known(SEO_PHASES, input.phase),
    status: known(SEO_STATUSES, input.status),
  };
}

export function filterTasks(tasks: readonly SeoTask[], filter: TaskFilter): SeoTask[] {
  return tasks.filter((task) => {
    if (filter.phase !== "all" && task.phase !== filter.phase) return false;
    if (filter.area !== "all" && task.area !== filter.area) return false;
    if (filter.status !== "all" && task.status !== filter.status) return false;
    if (filter.owner !== "all" && task.owner !== filter.owner) return false;
    return true;
  });
}

function slice(id: string, label: string, tasks: readonly SeoTask[]): ProgressSlice {
  const done = tasks.filter((task) => task.status === "done").length;
  return {
    done,
    id,
    label,
    percent: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
    total: tasks.length,
  };
}

export function progressOf(tasks: readonly SeoTask[], locale: Locale) {
  const done = tasks.filter((task) => task.status === "done").length;
  return {
    areas: SEO_AREAS.map((area) =>
      slice(
        area,
        pick(AREA_LABEL[area], locale),
        tasks.filter((task) => task.area === area),
      ),
    ).filter((item) => item.total > 0),
    blocked: tasks.filter((task) => task.status === "blocked-on-approval").length,
    done,
    inProgress: tasks.filter((task) => task.status === "in-progress").length,
    notStarted: tasks.filter((task) => task.status === "not-started").length,
    percent: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
    phases: PHASE_ORDER.map((phase) =>
      slice(
        phase,
        pick(PHASE_LABEL[phase], locale),
        tasks.filter((task) => task.phase === phase),
      ),
    ).filter((item) => item.total > 0),
    total: tasks.length,
  };
}

export function presentTasks(locale: Locale, filter: TaskFilter): TaskRow[] {
  return filterTasks(seoPlan.tasks, filter).map((task) => ({
    action: pick(task.action, locale),
    approval: pick(task.approval, locale),
    approvalNeeded: task.approvalNeeded,
    area: pick(AREA_LABEL[task.area], locale),
    evidence: task.evidence ? pick(task.evidence, locale) : null,
    id: task.id,
    link: task.link,
    measure: pick(task.measure, locale),
    owner: task.owner,
    phase: pick(PHASE_LABEL[task.phase], locale),
    status: task.status,
    updated: task.updated,
  }));
}

export function presentApprovals(locale: Locale) {
  const items = seoPlan.approvals.map((item: SeoApproval) => ({
    id: item.id,
    meta: item.meta ? pick(item.meta, locale) : null,
    state: item.state,
    text: pick(item.text, locale),
    updated: item.updated,
  }));
  return {
    granted: items.filter((item) => item.state === "granted").length,
    items,
    pending: items.filter((item) => item.state === "pending").length,
  };
}

export function presentTimeline(locale: Locale) {
  return seoPlan.timeline.map((row: SeoTimelineRow) => ({
    focus: pick(row.focus, locale),
    window: pick(row.window, locale),
  }));
}

export function presentReference(locale: Locale) {
  return {
    keywords: seoPlan.keywords.map((row: SeoKeyword) => ({
      cluster: pick(row.cluster, locale),
      examples: pick(row.examples, locale),
      intent: pick(row.intent, locale),
      lang: row.lang,
      priority: pick(row.priority, locale),
      target: pick(row.target, locale),
    })),
    titles: seoPlan.titles.map((row: SeoTitle) => ({
      current: pick(row.current, locale),
      page: pick(row.page, locale),
      proposed: pick(row.proposed, locale),
    })),
  };
}

export function presentKpiDefinitions(locale: Locale) {
  return seoPlan.kpis.map((kpi: SeoKpi) => ({
    baseline: pick(kpi.baseline, locale),
    cadence: pick(kpi.cadence, locale),
    checkpoint: pick(kpi.checkpoint, locale),
    id: kpi.id,
    name: pick(kpi.name, locale),
    source: pick(kpi.source, locale),
  }));
}

export function seoDashboardAccess(session: ReviewSession | null): session is ReviewSession {
  return reviewAccess(session);
}

/** Logged-out and non-owner requests get the same 404 the chat export uses. */
export function seoDashboardHttpStatus(session: ReviewSession | null): 200 | 404 {
  return seoDashboardAccess(session) ? 200 : 404;
}

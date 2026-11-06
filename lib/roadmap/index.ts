import type { Bilingual } from "@/lib/log";

export type RoadmapStatus = "done" | "in-progress" | "next";

export interface RoadmapPhase {
  title: Bilingual;
  status: RoadmapStatus;
  summary: Bilingual;
}

/** Each phase carries its title and summary in English and Arabic. */
export const roadmapPhases: RoadmapPhase[] = [
  {
    title: { en: "Store setup", ar: "إعداد المتجر" },
    status: "done",
    summary: {
      en: "Connected the Shopify store and cleared out the old products to start fresh.",
      ar: "ربطنا متجر Shopify وأفرغناه من المنتجات القديمة لنبدأ من جديد.",
    },
  },
  {
    title: { en: "Storefront", ar: "الواجهة" },
    status: "done",
    summary: {
      en: "Built the site from Vercel's Shop template and deployed it live on Vercel.",
      ar: "بنينا الموقع من قالب Shop من Vercel ونشرناه مباشرةً على Vercel.",
    },
  },
  {
    title: { en: "Branding", ar: "الهوية البصرية" },
    status: "in-progress",
    summary: {
      en: "Calligraphy logo added; next comes the colours, fonts, and overall look of the brand.",
      ar: "أُضيف شعار الخط العربي؛ والخطوة التالية هي الألوان والخطوط والمظهر العام للعلامة.",
    },
  },
  {
    title: { en: "Products", ar: "المنتجات" },
    status: "done",
    summary: {
      en: "Arabic calligraphy and poetry shirts, hoodies, sweatshirts, tote bags, prints and mugs are live, with redesigned product pages, solid fabric-colour swatches and new designs like Ana Ibn Jala.",
      ar: "تيشيرتات وهوديز وسويتشيرتات وحقائب قماشية ولوحات وأكواب بالخط العربي والشعر متاحة الآن، مع صفحات منتجات مُعاد تصميمها وعيّنات ألوان مصمتة بلون القماش الحقيقي وتصاميم جديدة مثل «أنا ابن جلا».",
    },
  },
  {
    title: { en: "Supplier and product workflow", ar: "المورّد وسير عمل المنتجات" },
    status: "done",
    summary: {
      en: "Printify connected with prices at cost × 3. Designs become Printify products with mockups and Shopify drafts; paid orders go to Printify on hold and are sent to production when the order is tagged approve-pod.",
      ar: "ربطنا Printify بأسعار التكلفة × 3. تتحول التصاميم إلى منتجات Printify بصورها التوضيحية ومسودات Shopify؛ وتذهب الطلبات المدفوعة إلى Printify قيد الانتظار وتُرسل إلى الإنتاج عند وسم الطلب بـ approve-pod.",
    },
  },
  {
    title: { en: "Shop by designer", ar: "تسوّق حسب المصمم" },
    status: "done",
    summary: {
      en: "Designer pages at /designers in English and Arabic, with each designer's logo or photo and products.",
      ar: "صفحات المصممين في /designers بالإنجليزية والعربية، مع شعار كل مصمم أو صورته ومنتجاته.",
    },
  },
  {
    title: { en: "Payments and launch", ar: "الدفع والإطلاق" },
    status: "done",
    summary: {
      en: "Checkout on checkout.shirtat.co, worldwide shipping at $12.99, and the first order received.",
      ar: "إتمام الشراء على checkout.shirtat.co، وشحن إلى أنحاء العالم بسعر 12.99 دولارًا، واستلام أول طلب.",
    },
  },
  {
    title: { en: "Creator program", ar: "برنامج المصممين" },
    status: "done",
    summary: {
      en: "Creators apply with their designs, Moe approves them, and approved creators earn 15–20% of net sales with a dashboard to track it.",
      ar: "يقدّم المصممون تصاميمهم ويعتمدهم Moe، ويحصل المعتمدون على 15–20% من صافي المبيعات مع لوحة لمتابعتها.",
    },
  },
  {
    title: { en: "Custom domain", ar: "النطاق المخصص" },
    status: "done",
    summary: {
      en: "shirtat.co now points at the live store.",
      ar: "يشير shirtat.co الآن إلى المتجر المباشر.",
    },
  },
  {
    title: { en: "Approval email", ar: "رسالة الاعتماد" },
    status: "done",
    summary: {
      en: "When Moe approves a creator, they automatically get an email with a link to their creator details form.",
      ar: "عندما يعتمد Moe مصممًا، يصله تلقائيًا بريد برابط إلى نموذج بياناته.",
    },
  },
  {
    title: { en: "Design uploads", ar: "رفع التصاميم" },
    status: "done",
    summary: {
      en: "Creators upload designs that go to the store as drafts, which Moe publishes in one click.",
      ar: "يرفع المصممون تصاميم تصل إلى المتجر مسودات ينشرها Moe بنقرة واحدة.",
    },
  },
  {
    title: { en: "Product types", ar: "أنواع المنتجات" },
    status: "done",
    summary: {
      en: "Creators pick a T-shirt, hoodie, sweatshirt, tote bag or print, plus colours. Categories are set up in Shopify, and each draft carries its type, sizes and colours.",
      ar: "يختار المصممون تيشيرتًا أو هوديًا أو سويتشيرتًا أو حقيبة قماشية أو لوحة، مع الألوان. تُعدّ الأقسام في Shopify، وتحمل كل مسودة نوعها ومقاساتها وألوانها.",
    },
  },
  {
    title: { en: "Creators admin performance", ar: "أداء إدارة المصممين" },
    status: "done",
    summary: {
      en: "A performance section in the creators admin showing sales, activity and status for each creator.",
      ar: "قسم أداء في إدارة المصممين يعرض المبيعات والنشاط والحالة لكل مصمم.",
    },
  },
  {
    title: { en: "Creator payouts", ar: "مدفوعات المصممين" },
    status: "next",
    summary: {
      en: "Automated or half-automated payouts at 15% or 20%, with a $25 minimum, in USD at the order-day exchange rate.",
      ar: "مدفوعات آلية أو شبه آلية بنسبة 15% أو 20%، بحدّ أدنى 25 دولارًا، بالدولار الأمريكي بسعر الصرف في يوم الطلب.",
    },
  },
  {
    title: { en: "Order monitoring", ar: "مراقبة الطلبات" },
    status: "done",
    summary: {
      en: "An hourly check that every paid order reaches Printify, with alerts for orders stuck on hold or unfulfilled.",
      ar: "فحص كل ساعة يتأكد من وصول كل طلب مدفوع إلى Printify، مع تنبيهات للطلبات العالقة قيد الانتظار أو غير المنفَّذة.",
    },
  },
  {
    title: { en: "Mobile performance", ar: "أداء الجوال" },
    status: "in-progress",
    summary: {
      en: "Desktop Lighthouse is near 100; pushing the mobile performance score higher.",
      ar: "درجة Lighthouse على سطح المكتب قريبة من 100؛ ونعمل على رفع درجة الجوال.",
    },
  },
  {
    title: { en: "Kids and Baby", ar: "الأطفال والرضّع" },
    status: "done",
    summary: {
      en: "A kids T-shirt and a baby bodysuit for every design, with their own Kids and Baby categories in English and Arabic.",
      ar: "تيشيرت للأطفال وبدلة بودي للرضّع لكل تصميم، مع قسمي «الأطفال» و«الرضّع» بالإنجليزية والعربية.",
    },
  },
  {
    title: { en: "Product details and printing", ar: "تفاصيل المنتج والطباعة" },
    status: "done",
    summary: {
      en: "Every product page shows fabric, fit, sizes, care, origin and how it is printed, in English and Arabic, taken from the print partner.",
      ar: "تعرض كل صفحة منتج القماش والقصّة والمقاسات والعناية والمنشأ وطريقة الطباعة، بالإنجليزية والعربية، مأخوذة من شريك الطباعة.",
    },
  },
  {
    title: { en: "Hover gallery cards", ar: "بطاقات المعرض عند التمرير" },
    status: "done",
    summary: {
      en: "Product cards show the calligraphy design on hover with arrows to flip through photos, five per row on desktop.",
      ar: "تعرض بطاقات المنتجات التصميم الخطي عند التمرير مع أسهم لتصفّح الصور، خمس بطاقات في الصف على سطح المكتب.",
    },
  },
  {
    title: { en: "Analytics", ar: "التحليلات" },
    status: "done",
    summary: {
      en: "Google Tag Manager and Ahrefs Web Analytics on every page, loaded on first interaction so speed scores hold.",
      ar: "Google Tag Manager وAhrefs Web Analytics على كل صفحة، يُحمَّلان عند أول تفاعل لتبقى درجات السرعة.",
    },
  },
  {
    title: { en: "More print partners", ar: "شركاء طباعة إضافيون" },
    status: "next",
    summary: {
      en: "Adding Wearform and Tapstitch as print-on-demand options and comparing their prices to pick the best partner for each product.",
      ar: "إضافة Wearform وTapstitch خيارين للطباعة عند الطلب ومقارنة أسعارهما لاختيار أفضل شريك لكل منتج.",
    },
  },
  {
    title: { en: "Saudi Arabia shipping", ar: "الشحن إلى السعودية" },
    status: "next",
    summary: {
      en: "Getting shipping options to show at checkout for Saudi Arabia.",
      ar: "إظهار خيارات الشحن عند إتمام الشراء للمملكة العربية السعودية.",
    },
  },
  {
    title: { en: "Customer account link", ar: "رابط حساب العميل" },
    status: "next",
    summary: {
      en: "An Account link on the site for customers to sign in and see their orders.",
      ar: "رابط «الحساب» في الموقع ليسجّل العملاء الدخول ويروا طلباتهم.",
    },
  },
  {
    title: { en: "Shopping assistant", ar: "مساعد التسوق" },
    status: "in-progress",
    summary: {
      en: "A shopping chat in English and Arabic is on the site, with product cards, the cart, and Shopify checkout. Model replies are moving from Vercel AI Gateway to OpenAI directly and stay off until the server key is set.",
      ar: "دردشة تسوّق بالإنجليزية والعربية موجودة على الموقع، مع بطاقات المنتجات والسلة وإتمام الشراء على Shopify. تنتقل ردود النموذج من Vercel AI Gateway إلى OpenAI مباشرة وتبقى متوقفة إلى أن يُضبط مفتاح الخادم.",
    },
  },
  {
    title: { en: "Customer support", ar: "دعم العملاء" },
    status: "in-progress",
    summary: {
      en: "Customer emails are answered automatically, with refunds and complaints checked by Moe; a support chat in English and Arabic is in testing.",
      ar: "تُجاب رسائل العملاء تلقائيًا، مع مراجعة Moe لحالات الاسترداد والشكاوى؛ ودردشة الدعم بالإنجليزية والعربية قيد الاختبار.",
    },
  },
  {
    title: { en: "Designer discount codes", ar: "رموز خصم المصممين" },
    status: "next",
    summary: {
      en: "Every new designer gets their own 15% discount code when their account is created, to share with their followers.",
      ar: "يحصل كل مصمم جديد على رمز خصم خاص به بنسبة 15% عند إنشاء حسابه، ليشاركه مع متابعيه.",
    },
  },
  {
    title: { en: "Creator video ads", ar: "إعلانات الفيديو مع صنّاع المحتوى" },
    status: "next",
    summary: {
      en: "A small group of hand-picked creators making video ads, starting with free shirts and a fixed fee, then moving to a share of sales.",
      ar: "مجموعة صغيرة من صنّاع المحتوى المختارين بعناية يصنعون إعلانات فيديو، بدءًا بقمصان مجانية وأجر ثابت، ثم الانتقال إلى حصة من المبيعات.",
    },
  },
  {
    title: { en: "Search visibility", ar: "الظهور في البحث" },
    status: "in-progress",
    summary: {
      en: "Google Search Console is connected and the sitemap lists every page in English and Arabic; next is watching search results and improving how products show up.",
      ar: "ربطنا Google Search Console وتُدرج خريطة الموقع كل صفحة بالإنجليزية والعربية؛ والخطوة التالية متابعة نتائج البحث وتحسين ظهور المنتجات.",
    },
  },
  {
    title: { en: "Design your own", ar: "صمّم بنفسك" },
    status: "done",
    summary: {
      en: "Customers order a T-shirt, hoodie or mug with their own text in Arabic calligraphy, picking a style and a ready-made sentence or typing their own, linked from the homepage. The page follows the product-page layout, with a large preview that stays in view on desktop and mobile.",
      ar: "يطلب العملاء تيشيرتًا أو هوديًا أو كوبًا بنصّهم الخاص بالخط العربي، باختيار نمط وجملة جاهزة أو كتابة جملتهم، مع رابط من الصفحة الرئيسية. وتتبع الصفحة تخطيط صفحات المنتجات، بمعاينة كبيرة تبقى ظاهرة على سطح المكتب والجوال.",
    },
  },
  {
    title: { en: "Mugs", ar: "الأكواب" },
    status: "done",
    summary: {
      en: "Mugs in the shop, shipping to the US, Europe and the UK with their own lower shipping rates.",
      ar: "أكواب في المتجر، تُشحن إلى الولايات المتحدة وأوروبا والمملكة المتحدة بأسعار شحن أقل خاصة بها.",
    },
  },
  {
    title: { en: "Custom hoodie and women's fit", ar: "الهودي المخصص والقصّة النسائية" },
    status: "done",
    summary: {
      en: "A custom hoodie in the builder and a Men's or Women's fit choice, with a real women's cut where the print partner offers one.",
      ar: "هودي مخصص في أداة التصميم وخيار القصّة الرجالية أو النسائية، بقصّة نسائية حقيقية حيثما توفّرها شركة الطباعة الشريكة.",
    },
  },
  {
    title: { en: "Real product previews", ar: "معاينات منتجات حقيقية" },
    status: "done",
    summary: {
      en: "The builder previews the design on real product photos in the chosen colour and in the calligraphy style picked, with light ink on dark garments.",
      ar: "تعاين الأداة التصميم على صور منتجات حقيقية باللون المختار وبنمط الخط الذي اختاره العميل، مع حبر فاتح على الملابس الداكنة.",
    },
  },
  {
    title: { en: "Free-shipping promotions", ar: "عروض الشحن المجاني" },
    status: "done",
    summary: {
      en: "Promotions can now cover shipping as well as the items.",
      ar: "يمكن للعروض الآن أن تغطي الشحن إضافةً إلى المنتجات.",
    },
  },
  {
    title: { en: "Marketplace expansion", ar: "التوسّع في الأسواق" },
    status: "next",
    summary: {
      en: "Selling on marketplaces in Europe, the US and Asia to reach more shoppers before the end of the year.",
      ar: "البيع في أسواق إلكترونية في أوروبا والولايات المتحدة وآسيا للوصول إلى مزيد من المتسوقين قبل نهاية العام.",
    },
  },
  {
    title: { en: "Ads", ar: "الإعلانات" },
    status: "next",
    summary: {
      en: "Paid ads toward the end-of-year sales goal, tracked daily and weekly and adjusted based on results.",
      ar: "إعلانات مدفوعة نحو هدف مبيعات نهاية العام، تُتابَع يوميًا وأسبوعيًا وتُعدَّل وفق النتائج.",
    },
  },
  {
    title: { en: "Affiliates and influencers", ar: "الشركاء والمؤثرون" },
    status: "next",
    summary: {
      en: "Working with affiliates and influencers to bring new customers to Shirtat.",
      ar: "العمل مع الشركاء والمؤثرين لجلب عملاء جدد إلى شيرتات.",
    },
  },
  {
    title: { en: "Arabic website", ar: "الموقع بالعربية" },
    status: "done",
    summary: {
      en: "A full right-to-left Arabic version of every page at shirtat.co/ar, with a language switch in the header.",
      ar: "نسخة عربية كاملة من اليمين إلى اليسار لكل صفحة على shirtat.co/ar، مع زر لتبديل اللغة في أعلى الصفحة.",
    },
  },
  {
    title: { en: "New designs every day", ar: "تصاميم جديدة كل يوم" },
    status: "next",
    summary: {
      en: "Many new designs added daily across every category, such as humour from different cultures, with more product styles like stylish tees and jackets, so there is always something new.",
      ar: "إضافة تصاميم جديدة كثيرة يوميًا في كل الأقسام، مثل الفكاهة من ثقافات مختلفة، مع أنواع منتجات أكثر كالتيشيرتات الأنيقة والجاكيتات، ليكون هناك دائمًا ما هو جديد.",
    },
  },
  {
    title: { en: "Launch posts and videos", ar: "منشورات وفيديوهات الإطلاق" },
    status: "next",
    summary: {
      en: "Every new product announced on each Shirtat social channel with a post and a creative product video.",
      ar: "الإعلان عن كل منتج جديد على كل حسابات شيرتات في وسائل التواصل بمنشور وفيديو إبداعي للمنتج.",
    },
  },
];

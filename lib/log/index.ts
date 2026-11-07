/** One bilingual string. Write `en` and `ar` together; the Arabic is Modern Standard Arabic. */
export interface Bilingual {
  en: string;
  ar: string;
}

export interface LogDay {
  /** ISO date, e.g. 2026-10-20 */
  date: string;
  entries: Bilingual[];
}

/** Newest day first. Add new days to the top, each entry with both languages. */
export const logDays: LogDay[] = [
  {
    date: "2026-11-07",
    entries: [
      {
        en: "A Politics item is live in the menu, in English and Arabic, and opens the Politics collection.",
        ar: "عنصر «سياسة» حيّ في القائمة، بالإنجليزية والعربية، ويفتح مجموعة السياسة.",
      },
      {
        en: "Habibi, Call Me Senator is live: the T-shirt, hoodie, cap and mug are in the shop with real supplier product photos, and the homepage section shows each piece's shop photo, price and link. The English phrase stays as written.",
        ar: "قسم Habibi, Call Me Senator حيّ: التيشيرت والهودي والقبعة والكوب في المتجر بصور منتجات حقيقية من المورّد، ويعرض قسم الصفحة الرئيسية صورة المتجر والسعر والرابط لكل قطعة. وتبقى العبارة الإنجليزية كما كُتبت.",
      },
      {
        en: "A physical print sample has not been proofed yet.",
        ar: "لم تُجرَ بعد تجربة طباعة فعلية على عيّنة.",
      },
    ],
  },
  {
    date: "2026-11-06",
    entries: [
      {
        en: "A Politics item in the menu, in English and Arabic, is in review and is not on the live site. The homepage has a section titled Habibi, Call Me Senator. The cap, hoodie, mug and T-shirt are not in the shop yet. An illustrative concept is in review and is not a product photo, so the section does not show a price, inventory, or a buy button. The cap still needs digitizing, and the pieces still need a print proof. The English phrase stays as written.",
        ar: "عنصر «سياسة» في القائمة، بالإنجليزية والعربية، قيد المراجعة وليس على الموقع الحي. في الصفحة الرئيسية قسم عنوانه Habibi, Call Me Senator. القبعة والهودي والكوب والتيشيرت ليست في المتجر بعد. المفهوم التوضيحي قيد المراجعة وليس صورة منتج، لذلك لا يعرض القسم سعرًا ولا مخزونًا ولا زر شراء. ما زالت القبعة تحتاج إلى تجهيز رقمي، وما زالت القطع تحتاج إلى تجربة طباعة. وتبقى العبارة الإنجليزية كما كُتبت.",
      },
      {
        en: "The shopping assistant is on the site in English and Arabic. It shows product cards, a size and colour picker, and the cart, and checkout continues on Shopify. Browsers that expose Shopify's model-context tools load them; every other browser keeps the normal cart.",
        ar: "مساعد التسوق موجود على الموقع بالإنجليزية والعربية. يعرض بطاقات المنتجات واختيار المقاس واللون والسلة، ويُكمل الشراء على Shopify. المتصفحات التي تتيح أدوات سياق النموذج من Shopify تحمّلها، ويبقي غيرها السلة العادية.",
      },
      {
        en: "The assistant calls OpenAI directly as gpt-6-luna with medium reasoning. Replies in English and Arabic are live. The key stays on the server and never goes to the browser.",
        ar: "ينادي المساعد OpenAI مباشرة بالنموذج gpt-6-luna وبجهد تفكير متوسط. الردود بالإنجليزية والعربية تعمل على الموقع الحي. يبقى المفتاح على الخادم ولا يصل إلى المتصفح.",
      },
      {
        en: "The shopping assistant uses a warm paper panel, with shopper notes in small bubbles and larger product photos.",
        ar: "يستخدم مساعد التسوق لوحة بلون الورق الدافئ، وملاحظات المتسوق في فقاعات صغيرة، وصور منتجات أكبر.",
      },
      {
        en: "Product recommendations in the shopping chat now use a compact card: the picture stays whole, the price is the shop price, and View product opens the product page. One reply can show several cards without filling the panel. Cards the shop has already confirmed stay visible after the assistant finishes, even if the reply is incomplete.",
        ar: "صارت توصيات المنتجات في دردشة التسوق تستخدم بطاقة مدمجة: تبقى الصورة كاملة، والسعر هو سعر المتجر، و«عرض المنتج» يفتح صفحة المنتج. يمكن لرد واحد أن يعرض عدة بطاقات دون أن تملأ اللوحة. وتبقى البطاقات التي أكدها المتجر ظاهرة بعد أن ينتهي المساعد، حتى لو كان الرد ناقصًا.",
      },
      {
        en: "An owner-only review of shopping chats is live. It can freeze one turn, record what should have happened, and export pass/fail checks. Frozen and saved turns are kept for 30 days. It does not train the model. Automatic copies of every chat stay off until the owner turns them on.",
        ar: "مراجعة محادثات التسوق لصاحب المتجر فقط أصبحت حيّة. يمكنها تثبيت دورة واحدة، وتسجيل ما كان ينبغي أن يحدث، وتصدير فحوص النجاح والفشل. تُحفظ الدورات المثبّتة والمحفوظة لمدة 30 يومًا. وهي لا تدرّب النموذج. تبقى النسخ التلقائية لكل محادثة متوقفة إلى أن يفعّلها صاحب المتجر.",
      },
    ],
  },
  {
    date: "2026-11-03",
    entries: [
      {
        en: "Shirtat now has a full Arabic version at shirtat.co/ar, laid out right to left, with a language switch in the header. Every page is covered, including product titles, options and descriptions, the cart, search, menu, error pages, the making-of log, the roadmap and the sales page.",
        ar: "أصبح لشيرتات نسخة عربية كاملة على shirtat.co/ar، بتخطيط من اليمين إلى اليسار، مع زر لتبديل اللغة في أعلى الصفحة. وتشمل كل الصفحات، بما فيها عناوين المنتجات وخياراتها وأوصافها، والسلة، والبحث، والقائمة، وصفحات الأخطاء، وسجل صناعة شيرتات، وخريطة الطريق، وصفحة المبيعات.",
      },
      {
        en: "Redesigned the Design your own page to match the product pages: a large preview on one side that stays in view while you scroll on desktop, with the options on the other. On mobile, a compact preview stays pinned at the top and opens full size with a tap.",
        ar: "أعدنا تصميم صفحة «صمّم بنفسك» لتشبه صفحات المنتجات: معاينة كبيرة في جانب تبقى ظاهرة أثناء التمرير على سطح المكتب، والخيارات في الجانب الآخر. وعلى الجوال تبقى معاينة مصغّرة مثبّتة في الأعلى وتُفتح بحجمها الكامل بلمسة.",
      },
      {
        en: "Made the Design your own page faster and smoother: example and style images load only when they are about to appear and are much smaller, the text fits the preview without jumping, and the page now appears in one step.",
        ar: "جعلنا صفحة «صمّم بنفسك» أسرع وأكثر سلاسة: صور الأمثلة والأنماط لا تُحمَّل إلا حين توشك أن تظهر وصارت أصغر بكثير، ويتناسب النص مع المعاينة دون أن يقفز، وتظهر الصفحة الآن دفعة واحدة.",
      },
    ],
  },
  {
    date: "2026-11-02",
    entries: [
      {
        en: "Launched Design your own: customers can order a T-shirt or mug with their own text in Arabic calligraphy, choosing a style and either picking one of the ready-made example sentences or typing their own. A new Design your own section on the homepage links to the builder.",
        ar: "أطلقنا «صمّم بنفسك»: يمكن للعملاء الآن طلب تيشيرت أو كوب بنصّهم الخاص بالخط العربي، باختيار نمط الخط ثم إما اختيار إحدى الجمل الجاهزة أو كتابة جملتهم. وأضفنا إلى الصفحة الرئيسية قسم «صمّم بنفسك» الذي يقود إلى أداة التصميم.",
      },
      {
        en: "Added mugs to the shop, shipping to the US, Europe and the UK with their own lower mug shipping rates.",
        ar: "أضفنا الأكواب إلى المتجر، وتُشحن إلى الولايات المتحدة وأوروبا والمملكة المتحدة بأسعار شحن أقل مخصّصة لها.",
      },
      {
        en: "Added a custom hoodie to the builder, plus a Men's or Women's fit choice, using a real women's cut where the print partner offers one.",
        ar: "أضفنا هودي مخصّصًا إلى أداة التصميم، مع خيار القصّة الرجالية أو النسائية، بقصّة نسائية حقيقية حيثما توفّرها شركة الطباعة الشريكة.",
      },
      {
        en: "The builder preview now shows the design on real product photos in the colour the customer picks, and shows the calligraphy style they actually chose, with the ready-made artwork and a sample card for each style. Dark garments get a light-ink version of the design. Fixed right-to-left text being clipped and words breaking mid-letter in the preview.",
        ar: "تعرض معاينة أداة التصميم الآن التصميم على صور منتجات حقيقية باللون الذي يختاره العميل، وتُظهر نمط الخط الذي اختاره فعلًا، مع العمل الفني الجاهز وبطاقة نموذجية لكل نمط. وتحصل الملابس الداكنة على نسخة من التصميم بحبر فاتح. وأصلحنا قصّ النص من اليمين إلى اليسار وانكسار الكلمات في منتصف الحروف في المعاينة.",
      },
      {
        en: "Custom text now shows on the cart line, every colour, size and region combination now works, the page reserves space while the builder loads so nothing jumps, and the builder loads faster.",
        ar: "صار النص المخصّص يظهر في سطر السلة، وتعمل الآن كل تركيبات اللون والمقاس والمنطقة، وتحجز الصفحة مساحتها أثناء تحميل أداة التصميم فلا يقفز المحتوى، وأصبح تحميل الأداة أسرع.",
      },
      {
        en: "Added support for free-shipping promotions, so a promotion can cover shipping as well as the items.",
        ar: "أضفنا دعم عروض الشحن المجاني، بحيث يمكن للعرض أن يغطي الشحن إضافةً إلى المنتجات.",
      },
      {
        en: "Customer support emails and an hourly check on new orders keep running behind the scenes.",
        ar: "تستمر رسائل دعم العملاء وفحص كل ساعة للطلبات الجديدة في العمل خلف الكواليس.",
      },
    ],
  },
  {
    date: "2026-11-01",
    entries: [
      {
        en: "Connected Google Search Console with read-only access, so we can see how shirtat.co shows up in Google search.",
        ar: "ربطنا Google Search Console بصلاحية القراءة فقط، لنرى كيف يظهر shirtat.co في بحث Google.",
      },
      {
        en: "Helped search engines find the Arabic site: the sitemap now lists every page in both English and Arabic, with each page pointing to its other-language version, and more pages are included, like the designers, making-of and legal pages. Shop pages, policies and blog posts now name the right language version as their main address.",
        ar: "ساعدنا محركات البحث على اكتشاف الموقع العربي: تُدرج خريطة الموقع الآن كل صفحة بالإنجليزية والعربية، وتشير كل صفحة إلى نسختها باللغة الأخرى، وأُضيفت صفحات أخرى مثل المصممين وكواليس الصنع والصفحات القانونية. وصارت صفحات المتجر والسياسات والمقالات تحدّد نسخة اللغة الصحيحة عنوانًا رئيسيًا لها.",
      },
      {
        en: "Added a row of category links and a link to the other language in the footer, so shoppers and search engines can reach every collection from any page.",
        ar: "أضفنا إلى التذييل صفًّا من روابط الأقسام ورابطًا إلى اللغة الأخرى، ليصل المتسوقون ومحركات البحث إلى كل مجموعة من أي صفحة.",
      },
    ],
  },
  {
    date: "2026-10-29",
    entries: [
      {
        en: "Set up a dedicated customer support inbox that answers customer emails on its own, using the shop's real product, size and shipping information. Refunds and complaints are checked with Moe before anyone replies.",
        ar: "أنشأنا صندوق بريد مخصّصًا لدعم العملاء يردّ على رسائلهم تلقائيًا، اعتمادًا على معلومات المتجر الفعلية عن المنتجات والمقاسات والشحن. وتُراجَع حالات الاسترداد والشكاوى مع Moe قبل أي ردّ.",
      },
      {
        en: "Built a support chat for shirtat.co in English and Arabic. It answers sizing, shipping and returns questions from the shop's policies, can look up an order's status, and passes anything it can't solve to Moe by email. It only loads when you tap it, so pages stay fast, and it is being tested on a preview before it goes live.",
        ar: "بنينا دردشة دعم لموقع shirtat.co بالإنجليزية والعربية. تجيب عن أسئلة المقاسات والشحن والإرجاع من سياسات المتجر، ويمكنها الاستعلام عن حالة الطلب، وتحيل ما تعجز عن حلّه إلى Moe بالبريد الإلكتروني. لا تُحمَّل إلا عند النقر عليها فتبقى الصفحات سريعة، وهي قيد الاختبار على نسخة تجريبية قبل إطلاقها.",
      },
    ],
  },
  {
    date: "2026-10-25",
    entries: [
      {
        en: "Added an automated check that uses the site the way a shopper does, in English and Arabic: the homepage, Kids and Baby, a product page with its colours, details and printing info, adding to the cart, and the making-of and roadmap pages. It also confirms the analytics tags wait for the first tap or scroll, and runs Lighthouse three times per page on mobile and desktop, failing if a score slips below the last measured median. It never goes to checkout or places an order.",
        ar: "أضفنا فحصًا آليًا يستخدم الموقع كما يفعل المتسوق، بالإنجليزية والعربية: الصفحة الرئيسية، والأطفال والرضّع، وصفحة منتج بألوانه وتفاصيله ومعلومات طباعته، والإضافة إلى السلة، وصفحتي كواليس الصنع وخارطة الطريق. ويتأكد أيضًا من أن وسوم التحليلات تنتظر أول نقرة أو تمرير، ويشغّل Lighthouse ثلاث مرات لكل صفحة على الجوال وسطح المكتب، ويفشل إذا انخفضت أي درجة عن آخر وسيط مقيس. ولا ينتقل أبدًا إلى إتمام الشراء ولا يُجري أي طلب.",
      },
    ],
  },
  {
    date: "2026-10-24",
    entries: [
      {
        en: "Product cards now swap to a second image on hover (the on-model photo, or the flat calligraphy artwork once one is added), with arrows to flip through each product's photos. The extra photos only load when you hover, arrows work with the keyboard and flip direction in Arabic, and taps on phones still open the product.",
        ar: "صارت بطاقات المنتجات تتبدّل إلى صورة ثانية عند التمرير فوقها (صورة العارضة، أو العمل الخطي المسطّح حين يُضاف)، مع أسهم لتصفّح صور كل منتج. لا تُحمَّل الصور الإضافية إلا عند التمرير، وتعمل الأسهم بلوحة المفاتيح وينعكس اتجاهها في العربية، ويبقى النقر على الهاتف يفتح المنتج.",
      },
      {
        en: "Smaller product cards: five per row on desktop, four on tablets, three on small tablets and two on phones.",
        ar: "بطاقات منتجات أصغر: خمس في الصف على سطح المكتب، وأربع على الأجهزة اللوحية، وثلاث على الأجهزة اللوحية الصغيرة، واثنتان على الهواتف.",
      },
      {
        en: "Added an image style skill for Shirtat photography, and brought the repo's agent skills in line with the agentskills.io format.",
        ar: "أضفنا مهارة لأسلوب تصوير شيرتات، وواءمنا مهارات الوكيل في المستودع مع صيغة agentskills.io.",
      },
      {
        en: "Homepage new arrivals now use the same hover gallery cards, ten products in two rows of five, and every product image sits on a light grey tile so items stand out on the white page.",
        ar: "صارت «وصل حديثًا» في الصفحة الرئيسية تستخدم بطاقات المعرض نفسها: عشرة منتجات في صفّين من خمسة، وكل صورة منتج على بلاطة رمادية فاتحة لتبرز القطع على الصفحة البيضاء.",
      },
      {
        en: "Added the flat calligraphy design to every product. Hovering a card on desktop shows the pure design on the grey tile, and on phones the first tap shows the design and a second tap opens the product.",
        ar: "أضفنا التصميم الخطي المسطّح إلى كل منتج. عند التمرير فوق البطاقة على سطح المكتب يظهر التصميم الصافي على البلاطة الرمادية، وعلى الهواتف تُظهر النقرة الأولى التصميم وتفتح الثانية المنتج.",
      },
      {
        en: "Product pages now have Details and Printing sections in English and Arabic, taken from each product's print partner: fabric, weight, fit, sizes, size chart, care and origin, plus the print method, placement and print area. Anything the vendor doesn't publish is marked unknown.",
        ar: "صار لصفحات المنتجات قسما «التفاصيل» و«الطباعة» بالإنجليزية والعربية، مأخوذان من شريك الطباعة لكل منتج: القماش والوزن والقصّة والمقاسات وجدول المقاسات والعناية والمنشأ، إضافةً إلى طريقة الطباعة وموضعها ومساحتها. وأي معلومة لا ينشرها المورّد تُوسم بأنها غير معروفة.",
      },
      {
        en: "Launched Kids and Baby: a kids T-shirt and a baby bodysuit for each of the eight designs, printed with the same calligraphy, plus new Kids and Baby categories in English and Arabic. Also launched the Bayni wa Baynak range in eight styles. New arrivals now show one newest product per design so every new range appears.",
        ar: "أطلقنا قسمي الأطفال والرضّع: تيشيرت للأطفال وبدلة بودي للرضّع لكل تصميم من التصاميم الثمانية، بالخط نفسه، مع قسمي «الأطفال» و«الرضّع» الجديدين بالإنجليزية والعربية. وأطلقنا أيضًا مجموعة «بيني وبينك» بثمانية أنماط. وتعرض «وصل حديثًا» الآن أحدث منتج واحد لكل تصميم لتظهر كل مجموعة جديدة.",
      },
      {
        en: "Added Google Tag Manager to every page in English and Arabic. It loads after the page is ready so speed scores hold, with the no-JavaScript fallback in place. Google Analytics keeps loading directly until it is set up inside Tag Manager. Added Ahrefs Web Analytics to every page. Tag Manager and Ahrefs load on the first tap, click, scroll or key press, so they never slow the first view.",
        ar: "أضفنا Google Tag Manager إلى كل صفحة بالإنجليزية والعربية. يُحمَّل بعد جاهزية الصفحة حتى تبقى درجات السرعة، مع البديل لحالة تعطيل JavaScript. ويستمر Google Analytics بالتحميل مباشرة إلى حين إعداده داخل Tag Manager. وأضفنا Ahrefs Web Analytics إلى كل صفحة. يُحمَّل Tag Manager وAhrefs عند أول نقرة أو لمسة أو تمرير أو ضغطة مفتاح، فلا يبطئان العرض الأول أبدًا.",
      },
      {
        en: "Colour swatches on product pages are now solid circles in each real fabric colour, from heather and natural to apricot, oat gray and a camo pattern, instead of tiny photos or blank circles. Light colours have a visible border, the selected colour has a clear ring and its name, and swatches work with screen readers and the keyboard.",
        ar: "صارت عيّنات الألوان في صفحات المنتجات دوائر مصمتة بلون القماش الحقيقي، من الرمادي المخلوط والطبيعي إلى المشمشي والشوفاني الرمادي ونقشة التمويه، بدل الصور الصغيرة أو الدوائر الفارغة. للألوان الفاتحة حدّ ظاهر، وللون المختار حلقة واضحة واسمه، وتعمل العيّنات مع قارئات الشاشة ولوحة المفاتيح.",
      },
      {
        en: "New design: Ana Ibn Jala (أنا ابن جلا وطلاع الثنايا), the famous line by Suhaym ibn Wathil, on six products: a T-shirt, sweatshirt, tote bag and print with black calligraphy on light colours, and a hoodie and kids T-shirt with white calligraphy on dark colours, each with its design story, details and printing info in English and Arabic.",
        ar: "تصميم جديد: «أنا ابن جلا» (أنا ابن جلا وطلاع الثنايا)، البيت المشهور لسُحيم بن وثيل، على ستة منتجات: تيشيرت وسويتشيرت وحقيبة قماشية ولوحة بخط أسود على الألوان الفاتحة، وهودي وتيشيرت أطفال بخط أبيض على الألوان الداكنة، لكل منها قصة التصميم وتفاصيله ومعلومات الطباعة بالإنجليزية والعربية.",
      },
    ],
  },
  {
    date: "2026-10-22",
    entries: [
      {
        en: "Received the first order on shirtat.co.",
        ar: "تلقّينا أول طلب على shirtat.co.",
      },
      {
        en: "Connected checkout.shirtat.co as the store's primary checkout domain, so checkout stays on a Shirtat address and the logo at checkout returns to shirtat.co instead of the default Shopify store.",
        ar: "ربطنا checkout.shirtat.co نطاقًا أساسيًا لإتمام الشراء في المتجر، فيبقى الدفع على عنوان شيرتات ويعيد الشعار في صفحة الدفع إلى shirtat.co بدل متجر Shopify الافتراضي.",
      },
      {
        en: "Replaced the default Shopify theme with a redirect theme: anyone landing on the Shopify store address is sent to shirtat.co, while checkout, account and cart keep working.",
        ar: "استبدلنا قالب Shopify الافتراضي بقالب تحويل: كل من يصل إلى عنوان متجر Shopify يُحوَّل إلى shirtat.co، بينما يستمر عمل الدفع والحساب والسلة.",
      },
      {
        en: "Connected account.shirtat.co for customer accounts.",
        ar: "ربطنا account.shirtat.co لحسابات العملاء.",
      },
      {
        en: "Added worldwide shipping with a flat $12.99 standard rate per order, fixing the 'not available for delivery' message at checkout for the US and other countries.",
        ar: "أضفنا شحنًا إلى أنحاء العالم بسعر قياسي ثابت قدره 12.99 دولارًا للطلب، ما أنهى رسالة «غير متاح للتوصيل» عند الدفع للولايات المتحدة وبلدان أخرى.",
      },
      {
        en: "Added an approval step for print orders: paid orders are created in Printify on hold, and adding the approve-pod tag to the order in Shopify sends it to production automatically through a verified webhook. Orders can't be sent twice, sent orders are tagged pod:sent, and any failure sends an alert email.",
        ar: "أضفنا خطوة موافقة لطلبات الطباعة: تُنشأ الطلبات المدفوعة في Printify قيد الانتظار، وعند إضافة الوسم approve-pod إلى الطلب في Shopify يُرسَل تلقائيًا إلى الإنتاج عبر webhook موثَّق. لا يمكن إرسال الطلب مرتين، وتُوسم الطلبات المرسلة بـ pod:sent، وأي إخفاق يرسل بريد تنبيه.",
      },
      {
        en: "Set up an hourly order monitor that checks every paid order reaches Printify and flags anything stuck on hold or unfulfilled.",
        ar: "أعددنا مراقبًا ساعيًا للطلبات يتحقق من وصول كل طلب مدفوع إلى Printify ويبلّغ عن أي طلب عالق قيد الانتظار أو غير منفَّذ.",
      },
      {
        en: "Performance work for Lighthouse: product pages send the main image in the first response, Google Analytics loads after the page, layout shift on product pages fixed, responsive image sizes with AVIF, and a Lighthouse check of 99+ on every update.",
        ar: "عملنا على الأداء لدرجات Lighthouse: ترسل صفحات المنتجات الصورة الرئيسية في أول استجابة، ويُحمَّل Google Analytics بعد الصفحة، وأصلحنا انزياح التخطيط في صفحات المنتجات، وأحجام صور متجاوبة بصيغة AVIF، وفحص Lighthouse بدرجة 99+ عند كل تحديث.",
      },
      {
        en: "Redesigned product pages: main image with thumbnails, the design story below the buy box, accordions, a trust row, and more-from-this-design and you-may-also-like rows. The gallery shows the selected colour first and a model photo second.",
        ar: "أعدنا تصميم صفحات المنتجات: صورة رئيسية مع صور مصغّرة، وقصة التصميم أسفل مربع الشراء، وقوائم قابلة للطيّ، وصف ثقة، وصفّان «المزيد من هذا التصميم» و«قد يعجبك أيضًا». ويعرض المعرض اللون المختار أولًا ثم صورة العارضة.",
      },
      {
        en: "Added a 'Where it's from' section to product pages with the source clips behind each design (YouTube and Facebook videos, loaded on click).",
        ar: "أضفنا قسم «من أين جاء» إلى صفحات المنتجات مع المقاطع المصدرية خلف كل تصميم (فيديوهات YouTube وFacebook تُحمَّل عند النقر).",
      },
      {
        en: "Homepage: newest arrivals grid, product-type tiles, and a hanging rack of six real Shirtat garments with front and side views that turn as you browse, sized for phones.",
        ar: "الصفحة الرئيسية: شبكة «وصل حديثًا»، وبلاطات أنواع المنتجات، وحامل ملابس معلّق بست قطع شيرتات حقيقية بمنظر أمامي وجانبي تدور أثناء التصفّح، ومقاسة للهواتف.",
      },
      {
        en: "Mobile fixes: bigger tap targets, sticky add-to-cart, larger size pills and no horizontal overflow.",
        ar: "إصلاحات للجوال: أهداف نقر أكبر، وزر «أضف إلى السلة» ثابت، وأزرار مقاسات أكبر، ولا تمرير أفقي زائد.",
      },
      {
        en: "Added Shirtat share images for links in English and Arabic.",
        ar: "أضفنا صور مشاركة شيرتات للروابط بالإنجليزية والعربية.",
      },
      {
        en: "Footer: one row of links, X, Instagram and Facebook links, and a shipping coverage line; Shop and Sell on Shirtat moved to the footer.",
        ar: "التذييل: صف واحد من الروابط، وروابط X وInstagram وFacebook، وسطر عن تغطية الشحن؛ ونُقل «تسوّق» و«بِع على شيرتات» إلى التذييل.",
      },
      {
        en: "Products can belong to more than one category, and Poetry is only given to designs marked as poetry.",
        ar: "يمكن أن ينتمي المنتج إلى أكثر من قسم، ولا يُمنح قسم «شعر» إلا للتصاميم الموسومة بأنها شعر.",
      },
      {
        en: "Changed the contact email to shirtat@10claws.com across the site and emails.",
        ar: "غيّرنا بريد التواصل إلى shirtat@10claws.com في الموقع والرسائل.",
      },
      {
        en: "Made an internal map comparing the products we use with equivalents at other print-on-demand providers, including baby and occasion items.",
        ar: "أعددنا خريطة داخلية تقارن المنتجات التي نستخدمها بما يماثلها لدى مزوّدي طباعة عند الطلب آخرين، بما في ذلك منتجات الرضّع والمناسبات.",
      },
    ],
  },
  {
    date: "2026-10-21",
    entries: [
      {
        en: "Connected Printify through its API with real catalog costs: Bella+Canvas 3001 tee, Gildan 18500 hoodie and 18000 sweatshirt from Printify Choice (US), AS Colour tote from The Print Bar and a matte poster from Printify Choice. Prices are cost × 3 per variant, rounded up to .99. Applying a design now creates the Printify product first and puts its mockups and variant SKUs on the Shopify draft; paid orders are passed to Printify, held until sent to production.",
        ar: "ربطنا Printify عبر واجهته البرمجية بتكاليف الكتالوج الحقيقية: تيشيرت Bella+Canvas 3001، وهودي Gildan 18500 وسويتشيرت 18000 من Printify Choice (الولايات المتحدة)، وحقيبة AS Colour القماشية من The Print Bar، ولوحة مطفية من Printify Choice. الأسعار هي التكلفة × 3 لكل خيار، مقرّبة إلى .99. وصار تطبيق التصميم ينشئ منتج Printify أولًا ويضع صوره التوضيحية ورموز خياراته على مسودة Shopify؛ وتُمرَّر الطلبات المدفوعة إلى Printify وتبقى قيد الانتظار حتى تُرسل إلى الإنتاج.",
      },
      {
        en: "Added Shirtat as the in-house designer on /designers, with the Shirtat logo, and the option to hide test designers from the directory.",
        ar: "أضفنا شيرتات مصمّمًا داخليًا في /designers مع شعار شيرتات، وخيار إخفاء المصممين التجريبيين من الدليل.",
      },
      {
        en: "Chose Printify as the print-on-demand supplier (Shopify app, public API, no minimums, US and international print providers, puff and other special prints) and set prices to supplier cost × 3, rounded up to .99: T-shirt $32.99, sweatshirt $53.99, hoodie $64.99, tote bag $28.99, print $14.99.",
        ar: "اخترنا Printify مورّدًا للطباعة عند الطلب (تطبيق Shopify، وواجهة برمجية عامة، ولا حدّ أدنى للكمية، ومزوّدو طباعة في الولايات المتحدة ودوليًا، وطباعة بارزة وأنواع خاصة أخرى) وحدّدنا الأسعار بتكلفة المورّد × 3 مقرّبة إلى .99: تيشيرت 32.99 دولارًا، وسويتشيرت 53.99، وهودي 64.99، وحقيبة قماشية 28.99، ولوحة 14.99.",
      },
      {
        en: "Added a product workflow to the admin page: upload a design or pick a designer's submission, get an automatic category suggestion (Poetry, Humor, Cultures, Occasions) that can be overridden, choose product types and colours, and create Shopify drafts tagged with the category and designer. Designers now only suggest types and colours.",
        ar: "أضفنا سير عمل للمنتجات في صفحة الإدارة: رفع تصميم أو اختيار مشاركة مصمّم، واقتراح تلقائي للقسم (شعر، فكاهة، ثقافات، مناسبات) يمكن تغييره، واختيار أنواع المنتجات والألوان، وإنشاء مسودات Shopify موسومة بالقسم والمصمم. ويقترح المصممون الآن الأنواع والألوان فقط.",
      },
      {
        en: "Renamed creators to designers across the site in English and Arabic, retitled the program page Sell on Shirtat (also at /sell), and added Shop by designer pages at /designers with each designer's products.",
        ar: "أعدنا تسمية «المبدعين» إلى «المصممين» في أنحاء الموقع بالإنجليزية والعربية، وغيّرنا عنوان صفحة البرنامج إلى «بِع على شيرتات» (وهي متاحة أيضًا على /sell)، وأضفنا صفحات «تسوّق حسب المصمم» في /designers مع منتجات كل مصمم.",
      },
      {
        en: "Designers now upload a logo or profile picture when they apply; approved designers without one see a prompt on their dashboard and show initials until they add it.",
        ar: "صار المصممون يرفعون شعارًا أو صورة شخصية عند التقديم؛ ويرى المصممون المعتمدون الذين لم يفعلوا ذلك تنبيهًا في لوحتهم وتظهر الأحرف الأولى من أسمائهم إلى أن يضيفوها.",
      },
      {
        en: "Added a new favicon set: a bold white S from the SHIRTAT wordmark on a black tile for browser tabs, with the full SHIRTAT wordmark on larger app icons.",
        ar: "أضفنا مجموعة أيقونات جديدة: حرف S أبيض عريض من شعار SHIRTAT على بلاطة سوداء لعلامات المتصفح، وشعار SHIRTAT كاملًا على أيقونات التطبيقات الأكبر.",
      },
      {
        en: "Made the SHIRTAT wordmark in the logo slightly bolder.",
        ar: "جعلنا شعار SHIRTAT في الشعار أكثر سماكة قليلًا.",
      },
      {
        en: "Launched an Arabic version of the storefront at /ar, with right-to-left layout, an Arabic font and an EN / العربية switcher. The roadmap, sales and daily log stay in English.",
        ar: "أطلقنا النسخة العربية من المتجر على /ar، بتخطيط من اليمين إلى اليسار وخط عربي ومبدّل EN / العربية. وكانت خارطة الطريق والمبيعات والسجل اليومي بالإنجليزية في ذلك الوقت، وهي اليوم متاحة بالعربية أيضًا.",
      },
      {
        en: "Switched the Arabic pages to the El Messiri font and fixed it so the font always loads.",
        ar: "انتقلنا بالصفحات العربية إلى خط El Messiri وأصلحنا الأمر ليُحمَّل الخط دائمًا.",
      },
      {
        en: "Combined the footer credits into one sentence: the project is part of 10claws and fully managed by Grok Bot.",
        ar: "دمجنا شكر التذييل في جملة واحدة: المشروع جزء من 10claws ويُديره Grok Bot بالكامل.",
      },
      {
        en: "Launched the Shirtat creator program: public program page and application form (English and Arabic), creator accounts with manual approval, an admin page for Moe, and a creator dashboard with sales and earnings.",
        ar: "أطلقنا برنامج مصممي شيرتات: صفحة عامة للبرنامج ونموذج تقديم (بالإنجليزية والعربية)، وحسابات للمصممين باعتماد يدوي، وصفحة إدارة لـ Moe، ولوحة للمصممين فيها المبيعات والأرباح.",
      },
      {
        en: "Set the creator program to US dollars: dashboard figures use the USD order amount when available, otherwise convert from the shop currency at the order-date exchange rate.",
        ar: "ضبطنا برنامج المصممين على الدولار الأمريكي: تستخدم أرقام اللوحة مبلغ الطلب بالدولار عند توفره، وإلا فتُحوَّل من عملة المتجر بسعر الصرف في يوم الطلب.",
      },
      {
        en: "Added product categories to the Shopify store (T-Shirts, Hoodies, Sweatshirts, Tote Bags, Posters & Prints) and a creator details form that approved creators get a secure link to.",
        ar: "أضفنا فئات المنتجات إلى متجر Shopify (تيشيرتات، هوديز، سويتشيرتات، حقائب قماشية، لوحات ومطبوعات) ونموذج بيانات للمصممين يحصل عليه المعتمدون عبر رابط آمن.",
      },
      {
        en: "Creators can now upload designs from their dashboard, choosing the product type and colours. Each upload is set up to become a draft product in the store that Moe publishes in one click, once the store connection has product permissions.",
        ar: "صار بإمكان المصممين رفع التصاميم من لوحتهم باختيار نوع المنتج والألوان. وكل عملية رفع مهيّأة لتصبح منتجًا مسودة في المتجر ينشره Moe بنقرة واحدة، متى صارت لاتصال المتجر صلاحيات المنتجات.",
      },
      {
        en: "Connected creator uploads to the store and tested the whole flow live: a test creator applied, was approved, filled in their details and uploaded a hoodie design, which became a draft product with sizes and colours, went live on shirtat.co in one click, and was then removed.",
        ar: "ربطنا رفع المصممين بالمتجر واختبرنا المسار كاملًا مباشرةً: قدّم مصمم تجريبي طلبه، واعتُمد، وملأ بياناته، ورفع تصميم هودي صار منتجًا مسودة بمقاساته وألوانه، ونُشر على shirtat.co بنقرة واحدة، ثم أُزيل.",
      },
      {
        en: "Creator approval emails are now queued by the site and sent from the Grok Bot inbox, with their status shown on the admin page.",
        ar: "صارت رسائل اعتماد المصممين تُصَفّ من الموقع وتُرسل من صندوق Grok Bot، مع عرض حالتها في صفحة الإدارة.",
      },
      {
        en: "Added a performance section to the creators admin: program totals and a sortable table of each creator's status, rate, sales, refunds, earnings owed, designs and recent activity.",
        ar: "أضفنا قسم أداء إلى إدارة المصممين: إجماليات البرنامج وجدولًا قابلًا للفرز بحالة كل مصمم ونسبته ومبيعاته ومرتجعاته وأرباحه المستحقة وتصاميمه ونشاطه الأخير.",
      },
      {
        en: "Refunds are now deducted from creator sales and earnings, shown as their own line on the dashboard, and the creator terms say so.",
        ar: "تُخصم المبالغ المستردة الآن من مبيعات المصممين وأرباحهم، وتظهر بندًا مستقلًا في اللوحة، وتنص شروط المصممين على ذلك.",
      },
      {
        en: "Added password reset for creators (a one-hour, single-use link sent by email) and a change-password option when signed in.",
        ar: "أضفنا إعادة تعيين كلمة المرور للمصممين (رابط يُرسل بالبريد صالح ساعة واحدة ولمرة واحدة) وخيار تغيير كلمة المرور عند تسجيل الدخول.",
      },
      {
        en: "Switched every price on the site to US dollars: the storefront and cart show USD at the daily exchange rate, sales totals are converted at each order date's rate, and creator product prices start at $30 for a T-shirt, $55 for a hoodie, $50 for a sweatshirt, $22 for a tote bag and $25 for a print.",
        ar: "حوّلنا كل الأسعار في الموقع إلى الدولار الأمريكي: يعرض المتجر والسلة الدولار بسعر الصرف اليومي، وتُحوَّل إجماليات المبيعات بسعر صرف يوم كل طلب، وتبدأ أسعار منتجات المصممين من 30 دولارًا للتيشيرت، و55 للهودي، و50 للسويتشيرت، و22 للحقيبة القماشية، و25 للّوحة.",
      },
      {
        en: "Added About, Contact, Shipping, Refund & Returns, Terms & Conditions, Privacy and Creator Terms pages in English and Arabic, linked from the footer.",
        ar: "أضفنا صفحات «عن شيرتات» و«تواصل معنا» و«الشحن» و«الاسترداد والإرجاع» و«الشروط والأحكام» و«الخصوصية» و«شروط المصممين» بالإنجليزية والعربية، مرتبطة من التذييل.",
      },
      {
        en: "Creator approval and password reset emails now send directly from creators@shirtat.co through Cloudflare Email Service, and are queued if sending fails.",
        ar: "صارت رسائل اعتماد المصممين وإعادة تعيين كلمة المرور تُرسل مباشرة من creators@shirtat.co عبر Cloudflare Email Service، وتُصَفّ إذا تعذّر الإرسال.",
      },
      {
        en: "The Shopify store now runs in US dollars, so the site shows Shopify's own USD prices and checkout charges in dollars. Older pound orders are still converted at the order-date rate for sales and creator figures.",
        ar: "يعمل متجر Shopify الآن بالدولار الأمريكي، فيعرض الموقع أسعار Shopify بالدولار ويُحصَّل الدفع بالدولار. وما زالت الطلبات القديمة بالجنيه تُحوَّل بسعر يوم الطلب لأرقام المبيعات والمصممين.",
      },
      {
        en: "Changed the public contact email to contact@shirtat.co on all pages and in creator emails, which now reply to that address.",
        ar: "غيّرنا بريد التواصل العام إلى contact@shirtat.co في كل الصفحات ورسائل المصممين، التي صارت تردّ إلى هذا العنوان.",
      },
      {
        en: "Installed the Google Analytics tag (G-6DT5S4QRGT) on every page in English and Arabic.",
        ar: "ركّبنا وسم Google Analytics (G-6DT5S4QRGT) على كل صفحة بالإنجليزية والعربية.",
      },
      {
        en: "Replaced the store categories with four themes: Poetry, Humor (Arab street slang), Cultures and Occasions (Eid, birthdays, engagement nights and more), with Arabic names on /ar. Creators now pick one of these categories when uploading a design. The product-type collections are kept in Shopify but no longer shown as categories.",
        ar: "استبدلنا أقسام المتجر بأربعة محاور: شعر، وفكاهة (عامية الشارع العربي)، وثقافات، ومناسبات (عيد، وأعياد ميلاد، وليالي خطوبة وغيرها)، بأسماء عربية على /ar. وصار المصممون يختارون أحد هذه الأقسام عند رفع التصميم. وأُبقيت مجموعات أنواع المنتجات في Shopify لكنها لا تُعرض أقسامًا.",
      },
      {
        en: "Added Poetry, Humor, Cultures and Occasions to the main menu on desktop and mobile, in English and Arabic, and made category page titles and descriptions fully Arabic on /ar.",
        ar: "أضفنا شعر وفكاهة وثقافات ومناسبات إلى القائمة الرئيسية على سطح المكتب والجوال بالإنجليزية والعربية، وجعلنا عناوين صفحات الأقسام ووصفها عربية بالكامل على /ar.",
      },
      {
        en: "Replaced the homepage banner with an interactive clothing rail: nine example garments on wooden hangers that turn and lift on hover, open into a close-up view with arrows on click, a Shop now button and a scrolling ticker, in English and Arabic.",
        ar: "استبدلنا لافتة الصفحة الرئيسية بحامل ملابس تفاعلي: تسع قطع نموذجية على علّاقات خشبية تدور وترتفع عند التمرير، وتُفتح بنقرة في عرض مقرَّب بأسهم، مع زر «تسوّق الآن» وشريط متحرك، بالإنجليزية والعربية.",
      },
    ],
  },
  {
    date: "2026-10-20",
    entries: [
      {
        en: "Archived the 42 old grocery products.",
        ar: "أرشفنا 42 منتجًا قديمًا من البقالة.",
      },
      {
        en: "Set up the repo from Vercel's Shop template.",
        ar: "جهّزنا المستودع من قالب Shop من Vercel.",
      },
      {
        en: "Added the homepage message and the footer making-of link.",
        ar: "أضفنا رسالة الصفحة الرئيسية ورابط «كواليس الصنع» في التذييل.",
      },
      {
        en: "Created the Shopify Storefront token (Headless).",
        ar: "أنشأنا رمز Shopify Storefront (Headless).",
      },
      {
        en: "Connected Vercel.",
        ar: "ربطنا Vercel.",
      },
      {
        en: "First live deploy.",
        ar: "أول نشر مباشر.",
      },
      {
        en: "Connected live sales figures to the sales page.",
        ar: "ربطنا أرقام المبيعات المباشرة بصفحة المبيعات.",
      },
      {
        en: "Designed logo concepts and chose the Thuluth calligraphy wordmark.",
        ar: "صمّمنا مقترحات للشعار واخترنا شعار خط الثلث.",
      },
      {
        en: "Refined the logo by removing the Alef, the dot and the swash, then converted it to SVG.",
        ar: "صقلنا الشعار بإزالة الألف والنقطة والزخرفة المنسابة، ثم حوّلناه إلى SVG.",
      },
      {
        en: "Added the logo to the header, made it bigger, and enlarged the English wordmark.",
        ar: "أضفنا الشعار إلى الترويسة وكبّرناه، وكبّرنا الشعار الإنجليزي.",
      },
      {
        en: "Turned the roadmap into a Kanban board.",
        ar: "حوّلنا خارطة الطريق إلى لوحة كانبان.",
      },
      {
        en: "Added an inspiration section to the homepage.",
        ar: "أضفنا قسم الإلهام إلى الصفحة الرئيسية.",
      },
      {
        en: "Added Grok Bot and 10claws credits to the footer.",
        ar: "أضفنا شكر Grok Bot و10claws إلى التذييل.",
      },
      {
        en: "Merged the daily log into the making-of page.",
        ar: "دمجنا السجل اليومي في صفحة كواليس الصنع.",
      },
      {
        en: "Connected the custom domain shirtat.co (live on Vercel).",
        ar: "ربطنا النطاق المخصص shirtat.co (يعمل على Vercel).",
      },
    ],
  },
];

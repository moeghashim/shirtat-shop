/**
 * Legal and info pages (EN/AR). Template text based on standard print-on-demand apparel policies.
 * It should be reviewed by a lawyer before being relied on.
 */
export const COMPANY = {
  address: "1228 Wilcrest Green Drive, Houston, TX 77042, USA",
  email: "shirtat@10claws.com",
  name: "10claws Inc",
};
export const LAST_UPDATED = { ar: "آخر تحديث: 21 أكتوبر 2026", en: "Last updated 21 Oct 2026" };

export interface LegalSection {
  body: string[];
  heading: string;
}
export interface LegalPage {
  intro: string;
  sections: LegalSection[];
  title: string;
}
export type LegalSlug =
  | "about"
  | "terms"
  | "refunds"
  | "privacy"
  | "shipping"
  | "contact"
  | "designer-terms";

const A = COMPANY.address;
const E = COMPANY.email;

export const LEGAL: Record<
  LegalSlug,
  { ar: LegalPage; en: LegalPage; legal: boolean; path: string }
> = {
  about: {
    legal: false,
    path: "/about",
    en: {
      title: "About Shirtat",
      intro:
        "Shirtat makes apparel and prints featuring Arabic calligraphy. Every piece is printed to order, so nothing sits in a warehouse and every design gets a chance.",
      sections: [
        {
          heading: "What we do",
          body: [
            "We turn Arabic calligraphy into everyday clothing: T-shirts, hoodies, sweatshirts, tote bags and prints. Designs come from our own studio and from independent calligraphers and artists in our designer program, who earn a share of every sale.",
          ],
        },
        {
          heading: "Who we are",
          body: [
            `Shirtat is operated by ${COMPANY.name}, ${A}. The project is part of 10claws and is fully managed by Grok Bot.`,
          ],
        },
        { heading: "Get in touch", body: [`Questions, ideas or collaborations: ${E}.`] },
      ],
    },
    ar: {
      title: "عن شيرتات",
      intro:
        "تصنع شيرتات ملابس ولوحات مطبوعة تحمل الخط العربي. تُطبع كل قطعة حسب الطلب، فلا مخزون مكدّس، ولكل تصميم فرصته.",
      sections: [
        {
          heading: "ماذا نفعل",
          body: [
            "نحوّل الخط العربي إلى ملابس يومية: تيشيرتات وهوديز وسويتشيرتات وحقائب قماشية ولوحات. تأتي التصاميم من الاستوديو الخاص بنا ومن خطاطين وفنانين مستقلين في برنامج المصممين، ويحصلون على نسبة من كل عملية بيع.",
          ],
        },
        {
          heading: "من نحن",
          body: [
            `تُدار شيرتات من قِبل شركة ${COMPANY.name}، ${A}. والمشروع جزء من 10claws، ويُديره Grok Bot بالكامل.`,
          ],
        },
        { heading: "تواصل معنا", body: [`للأسئلة والأفكار والتعاون: ${E}.`] },
      ],
    },
  },
  terms: {
    legal: true,
    path: "/terms",
    en: {
      title: "Terms & Conditions",
      intro: `These terms govern your use of shirtat.co and any purchase you make. The site is operated by ${COMPANY.name} ("Shirtat", "we", "us"), ${A}. By using the site or placing an order you agree to these terms.`,
      sections: [
        {
          heading: "1. Products",
          body: [
            "All products are made to order. Colours on screen may differ slightly from the printed result, and print placement and size can vary slightly between items. Product images may be mockups.",
          ],
        },
        {
          heading: "2. Orders and pricing",
          body: [
            "Prices are shown in US dollars. An order is accepted when we send a confirmation email. We may refuse or cancel any order, for example if a product is mispriced or unavailable, and we will refund any payment in full. Taxes and shipping are calculated at checkout.",
          ],
        },
        {
          heading: "3. Payment",
          body: [
            "Payment is taken at checkout through our payment provider. You confirm you are authorised to use the payment method you provide.",
          ],
        },
        {
          heading: "4. Shipping, returns and refunds",
          body: [
            "Delivery is covered by our Shipping Policy, and returns by our Refund & Returns Policy. Both form part of these terms.",
          ],
        },
        {
          heading: "5. Intellectual property",
          body: [
            "All designs, text, logos and images on the site belong to Shirtat or its designers and are protected by copyright and trademark law. You may not copy, reproduce or resell them without written permission. Buying a product does not transfer any rights in its design.",
          ],
        },
        {
          heading: "6. Custom and designer-submitted designs",
          body: [
            "Designs from our designers are submitted under our Designer Terms. If you believe any design infringes your rights, email us and we will review it promptly.",
          ],
        },
        {
          heading: "7. Acceptable use",
          body: [
            "You agree not to misuse the site, interfere with its operation, attempt unauthorised access, or use it for anything unlawful.",
          ],
        },
        {
          heading: "8. Disclaimers and limitation of liability",
          body: [
            "The site and products are provided as is, to the extent permitted by law. Our total liability for any claim relating to an order is limited to the amount you paid for that order. We are not liable for indirect or consequential losses. Nothing in these terms limits liability that cannot be limited by law.",
          ],
        },
        {
          heading: "9. Governing law",
          body: [
            "These terms are governed by the laws of the State of Texas and the federal laws of the United States. Any dispute will be resolved in the state or federal courts located in Harris County, Texas, unless the law of your country of residence gives you the right to bring proceedings elsewhere.",
          ],
        },
        {
          heading: "10. Changes",
          body: [
            "We may update these terms. The version published on the site at the time of your order applies to that order.",
          ],
        },
        { heading: "11. Contact", body: [`${COMPANY.name}, ${A}. Email: ${E}.`] },
      ],
    },
    ar: {
      title: "الشروط والأحكام",
      intro: `تحكم هذه الشروط استخدامك لموقع shirtat.co وأي عملية شراء تجريها. يُشغّل الموقعَ شركةُ ${COMPANY.name} ("شيرتات" أو "نحن")، ${A}. باستخدامك الموقع أو تقديم طلب فإنك توافق على هذه الشروط.`,
      sections: [
        {
          heading: "1. المنتجات",
          body: [
            "تُصنع جميع المنتجات حسب الطلب. قد تختلف الألوان على الشاشة قليلًا عن النتيجة المطبوعة، وقد يتفاوت موضع الطباعة وحجمها قليلًا بين القطع. قد تكون صور المنتجات نماذج توضيحية.",
          ],
        },
        {
          heading: "2. الطلبات والأسعار",
          body: [
            "تُعرض الأسعار بالدولار الأمريكي. يُعدّ الطلب مقبولًا عند إرسالنا رسالة تأكيد بالبريد الإلكتروني. يحق لنا رفض أي طلب أو إلغاؤه، كأن يكون السعر خاطئًا أو المنتج غير متاح، وسنرد أي مبلغ مدفوع كاملًا. تُحتسب الضرائب والشحن عند الدفع.",
          ],
        },
        {
          heading: "3. الدفع",
          body: [
            "يُحصَّل المبلغ عند الدفع عبر مزوّد الدفع لدينا، وتؤكد أنك مخوّل باستخدام وسيلة الدفع التي تقدمها.",
          ],
        },
        {
          heading: "4. الشحن والإرجاع والاسترداد",
          body: [
            "تخضع عملية التوصيل لسياسة الشحن، والإرجاع لسياسة الاسترداد والإرجاع، وكلتاهما جزء من هذه الشروط.",
          ],
        },
        {
          heading: "5. الملكية الفكرية",
          body: [
            "جميع التصاميم والنصوص والشعارات والصور على الموقع مملوكة لشيرتات أو للمصممين، ومحمية بقوانين حقوق النشر والعلامات التجارية. لا يجوز نسخها أو إعادة إنتاجها أو بيعها دون إذن كتابي. ولا ينقل شراء المنتج أي حقوق في تصميمه.",
          ],
        },
        {
          heading: "6. تصاميم المصممين",
          body: [
            "تُقدَّم تصاميم المصممين وفق شروط المصممين. إذا رأيت أن أي تصميم ينتهك حقوقك، فراسلنا وسنراجعه سريعًا.",
          ],
        },
        {
          heading: "7. الاستخدام المقبول",
          body: [
            "توافق على عدم إساءة استخدام الموقع أو تعطيل عمله أو محاولة الوصول غير المصرّح به أو استخدامه لأي غرض غير قانوني.",
          ],
        },
        {
          heading: "8. إخلاء المسؤولية وحدودها",
          body: [
            "يُقدَّم الموقع والمنتجات كما هي في حدود ما يسمح به القانون. تقتصر مسؤوليتنا الإجمالية عن أي مطالبة تتعلق بطلب على المبلغ الذي دفعته مقابله، ولا نتحمل المسؤولية عن الخسائر غير المباشرة أو التبعية. ولا يحدّ شيء في هذه الشروط من مسؤولية لا يجوز تحديدها قانونًا.",
          ],
        },
        {
          heading: "9. القانون الحاكم",
          body: [
            "تخضع هذه الشروط لقوانين ولاية تكساس والقوانين الفيدرالية للولايات المتحدة، وتُحل أي نزاعات أمام المحاكم المختصة في مقاطعة هاريس بولاية تكساس، ما لم يمنحك قانون بلد إقامتك حق التقاضي في مكان آخر.",
          ],
        },
        {
          heading: "10. التعديلات",
          body: ["قد نحدّث هذه الشروط، وتسري على كل طلب النسخةُ المنشورة وقت تقديمه."],
        },
        { heading: "11. التواصل", body: [`${COMPANY.name}، ${A}. البريد الإلكتروني: ${E}.`] },
      ],
    },
  },
  refunds: {
    legal: true,
    path: "/refunds",
    en: {
      title: "Refund & Returns Policy",
      intro:
        "Every Shirtat item is printed to order for you. Because of that, we can't accept returns for change of mind or wrong size, but we will always put things right if something is wrong with your order.",
      sections: [
        {
          heading: "Defects, misprints and damage",
          body: [
            "If your item arrives defective, misprinted or damaged, or you received the wrong item, email us within 30 days of delivery with your order number and a photo of the problem. We will send a free replacement or a full refund, your choice. You do not need to send the item back unless we ask.",
          ],
        },
        {
          heading: "Change of mind and sizing",
          body: [
            "Made-to-order items can't be returned or exchanged for change of mind or wrong size. Please check the size guide before ordering. If you're unsure, email us before you order and we'll help.",
          ],
        },
        {
          heading: "Lost parcels",
          body: [
            "If tracking shows no movement for 14 days, or your parcel is marked delivered but hasn't arrived, contact us within 30 days of the expected delivery date and we will reship or refund. Parcels returned to us because of an incorrect address can be reshipped at your cost.",
          ],
        },
        {
          heading: "Cancellations",
          body: [
            "You can cancel within 12 hours of placing your order for a full refund. After that, your item may already be in production.",
          ],
        },
        {
          heading: "How refunds are paid",
          body: [
            "Approved refunds go back to your original payment method within 5–10 business days.",
          ],
        },
        { heading: "Contact", body: [`Email ${E} with your order number.`] },
      ],
    },
    ar: {
      title: "سياسة الاسترداد والإرجاع",
      intro:
        "تُطبع كل قطعة من شيرتات خصيصًا لك حسب الطلب، لذا لا نقبل الإرجاع بسبب تغيّر الرأي أو المقاس، لكننا نصحح الأمر دائمًا إذا كان هناك خطأ في طلبك.",
      sections: [
        {
          heading: "العيوب وأخطاء الطباعة والتلف",
          body: [
            "إذا وصلتك القطعة معيبة أو بطباعة خاطئة أو تالفة، أو وصلك منتج غير الذي طلبته، فراسلنا خلال 30 يومًا من الاستلام مع رقم الطلب وصورة للمشكلة. سنرسل بديلًا مجانًا أو نرد المبلغ كاملًا حسب اختيارك، ولا حاجة لإعادة القطعة ما لم نطلب ذلك.",
          ],
        },
        {
          heading: "تغيّر الرأي والمقاسات",
          body: [
            "لا يمكن إرجاع القطع المصنوعة حسب الطلب أو استبدالها بسبب تغيّر الرأي أو المقاس الخاطئ. يُرجى مراجعة دليل المقاسات قبل الطلب، وإن لم تكن متأكدًا فراسلنا قبل الطلب وسنساعدك.",
          ],
        },
        {
          heading: "الطرود المفقودة",
          body: [
            "إذا لم يتحرك التتبع لمدة 14 يومًا، أو ظهر الطرد كمُسلَّم ولم يصلك، فتواصل معنا خلال 30 يومًا من موعد التسليم المتوقع وسنعيد الشحن أو نرد المبلغ. أما الطرود المرتجعة إلينا بسبب عنوان غير صحيح فيمكن إعادة شحنها على نفقتك.",
          ],
        },
        {
          heading: "الإلغاء",
          body: [
            "يمكنك إلغاء الطلب خلال 12 ساعة من تقديمه واسترداد المبلغ كاملًا، وبعد ذلك قد تكون القطعة قيد الإنتاج.",
          ],
        },
        {
          heading: "طريقة رد المبالغ",
          body: ["تُرد المبالغ المعتمدة إلى وسيلة الدفع الأصلية خلال 5 إلى 10 أيام عمل."],
        },
        { heading: "التواصل", body: [`راسلنا على ${E} مع رقم الطلب.`] },
      ],
    },
  },
  privacy: {
    legal: true,
    path: "/privacy",
    en: {
      title: "Privacy Policy",
      intro: `This policy explains how ${COMPANY.name} ("Shirtat", "we") collects and uses personal information when you visit shirtat.co, buy from us, or join our designer program.`,
      sections: [
        {
          heading: "What we collect",
          body: [
            "Order information: name, email, shipping and billing address, phone number and order details. Payment details are handled by our payment provider; we don't store full card numbers.",
            "Designer program: account email, a hashed password, application details, payout and tax details, and the designs you upload.",
            "Usage data: basic analytics such as pages visited, device and approximate location, collected through cookies and similar technologies.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To process and deliver orders, provide customer support, pay creators, prevent fraud, improve the site, and meet legal and tax obligations. We only send marketing emails if you agree, and you can unsubscribe at any time.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "Service providers that help us run the store, such as Shopify (commerce and checkout), Vercel (hosting), print and fulfilment partners, shipping carriers, payment and payout providers, and email services. They may only use your information to provide their services. We do not sell your personal information.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use essential cookies to keep your cart and sign-in working, and analytics cookies to understand how the site is used. You can control cookies in your browser settings.",
          ],
        },
        {
          heading: "Retention",
          body: [
            "We keep order records for as long as needed for tax and accounting (typically up to 7 years) and designer records while your account is active and as required afterwards.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Depending on where you live (for example under the GDPR, UK GDPR or US state laws such as the CCPA), you may have the right to access, correct, delete or port your information, and to object to or limit some processing. Email us to make a request; we won't discriminate against you for exercising your rights.",
          ],
        },
        {
          heading: "International transfers",
          body: [
            "We are based in the United States and our providers may process data in other countries, with appropriate safeguards where required.",
          ],
        },
        {
          heading: "Children",
          body: [
            "The site is not directed at children under 13, and we do not knowingly collect their information.",
          ],
        },
        { heading: "Contact", body: [`${COMPANY.name}, ${A}. Email: ${E}.`] },
      ],
    },
    ar: {
      title: "سياسة الخصوصية",
      intro: `توضح هذه السياسة كيف تجمع شركة ${COMPANY.name} ("شيرتات" أو "نحن") معلوماتك الشخصية وتستخدمها عند زيارتك shirtat.co أو الشراء منا أو انضمامك إلى برنامج المصممين.`,
      sections: [
        {
          heading: "ما الذي نجمعه",
          body: [
            "بيانات الطلب: الاسم والبريد الإلكتروني وعنوان الشحن والفوترة ورقم الهاتف وتفاصيل الطلب. يتولى مزوّد الدفع بيانات الدفع، ولا نحتفظ بأرقام البطاقات كاملة.",
            "برنامج المصممين: بريد الحساب، وكلمة مرور مشفّرة، وتفاصيل الطلب، وبيانات الدفع والضرائب، والتصاميم التي ترفعها.",
            "بيانات الاستخدام: تحليلات أساسية مثل الصفحات التي زرتها والجهاز والموقع التقريبي، تُجمع عبر ملفات تعريف الارتباط وتقنيات مشابهة.",
          ],
        },
        {
          heading: "كيف نستخدمها",
          body: [
            "لتنفيذ الطلبات وتوصيلها، وتقديم الدعم، ودفع أرباح المصممين، ومنع الاحتيال، وتحسين الموقع، والوفاء بالالتزامات القانونية والضريبية. ولا نرسل رسائل تسويقية إلا بموافقتك، ويمكنك إلغاء الاشتراك في أي وقت.",
          ],
        },
        {
          heading: "مع من نشاركها",
          body: [
            "مع مزوّدي الخدمات الذين يساعدوننا في تشغيل المتجر، مثل Shopify (التجارة والدفع) وVercel (الاستضافة) وشركاء الطباعة والتجهيز وشركات الشحن ومزوّدي الدفع والبريد الإلكتروني، ولا يجوز لهم استخدام معلوماتك إلا لتقديم خدماتهم. ولا نبيع معلوماتك الشخصية.",
          ],
        },
        {
          heading: "ملفات تعريف الارتباط",
          body: [
            "نستخدم ملفات أساسية لعمل السلة وتسجيل الدخول، وملفات تحليلية لفهم استخدام الموقع، ويمكنك التحكم فيها من إعدادات المتصفح.",
          ],
        },
        {
          heading: "مدة الاحتفاظ",
          body: [
            "نحتفظ بسجلات الطلبات للمدة اللازمة لأغراض الضرائب والمحاسبة (عادةً حتى 7 سنوات)، وبسجلات المصممين ما دام الحساب نشطًا وبعده حسب ما يقتضيه القانون.",
          ],
        },
        {
          heading: "حقوقك",
          body: [
            "بحسب مكان إقامتك (مثل اللائحة العامة لحماية البيانات أو قوانين الولايات الأمريكية كقانون CCPA)، قد يحق لك الوصول إلى معلوماتك أو تصحيحها أو حذفها أو نقلها، والاعتراض على بعض المعالجة أو تقييدها. راسلنا لتقديم طلبك، ولن نميّز ضدك لممارستك حقوقك.",
          ],
        },
        {
          heading: "النقل الدولي",
          body: [
            "مقرّنا في الولايات المتحدة، وقد يعالج مزوّدونا البيانات في دول أخرى مع ضمانات مناسبة عند الحاجة.",
          ],
        },
        {
          heading: "الأطفال",
          body: ["الموقع غير موجّه للأطفال دون 13 عامًا، ولا نجمع معلوماتهم عن قصد."],
        },
        { heading: "التواصل", body: [`${COMPANY.name}، ${A}. البريد الإلكتروني: ${E}.`] },
      ],
    },
  },
  shipping: {
    legal: true,
    path: "/shipping",
    en: {
      title: "Shipping Policy",
      intro: "Every item is printed to order, then shipped to you with tracking.",
      sections: [
        {
          heading: "Where we ship",
          body: [
            "We ship to every country covered by our print-on-demand partners. If we can deliver to your address, you'll see shipping options at checkout.",
          ],
        },
        {
          heading: "Production time",
          body: [
            "Orders are usually printed and dispatched within 2–5 business days. Busy periods may take a little longer.",
          ],
        },
        {
          heading: "Delivery times",
          body: [
            "After dispatch, delivery usually takes 3–7 business days for domestic routes and 7–20 business days for international destinations, depending on where your order is printed and where it's going. These are estimates, not guarantees.",
          ],
        },
        {
          heading: "Shipping costs",
          body: ["Shipping costs are calculated at checkout based on your address and order."],
        },
        {
          heading: "Tracking",
          body: ["You'll receive a tracking link by email once your order ships."],
        },
        {
          heading: "Customs and duties",
          body: [
            "International orders may be subject to import duties and taxes charged by the destination country. These are the recipient's responsibility unless stated otherwise at checkout.",
          ],
        },
        {
          heading: "Address accuracy",
          body: [
            "Please check your address carefully. We aren't responsible for parcels delayed or lost because of an incorrect address, but we'll help where we can.",
          ],
        },
        {
          heading: "Problems with delivery",
          body: [
            "See our Refund & Returns Policy for lost or damaged parcels, or email " + E + ".",
          ],
        },
      ],
    },
    ar: {
      title: "سياسة الشحن",
      intro: "تُطبع كل قطعة حسب الطلب، ثم تُشحن إليك مع رقم تتبع.",
      sections: [
        {
          heading: "وجهات الشحن",
          body: [
            "نشحن إلى كل الدول التي يغطيها شركاؤنا في الطباعة حسب الطلب. إذا كان التوصيل إلى عنوانك متاحًا، ستظهر لك خيارات الشحن عند الدفع.",
          ],
        },
        {
          heading: "مدة الإنتاج",
          body: [
            "تُطبع الطلبات وتُشحن عادةً خلال 2 إلى 5 أيام عمل، وقد تطول المدة قليلًا في أوقات الذروة.",
          ],
        },
        {
          heading: "مدة التوصيل",
          body: [
            "بعد الشحن، يستغرق التوصيل عادةً من 3 إلى 7 أيام عمل للشحن المحلي، ومن 7 إلى 20 يوم عمل للوجهات الدولية، حسب مكان طباعة الطلب ووجهته. وهذه تقديرات وليست ضمانات.",
          ],
        },
        { heading: "تكلفة الشحن", body: ["تُحتسب تكلفة الشحن عند الدفع حسب عنوانك وطلبك."] },
        { heading: "التتبع", body: ["ستصلك رسالة بريد إلكتروني برابط التتبع عند شحن طلبك."] },
        {
          heading: "الجمارك والرسوم",
          body: [
            "قد تخضع الطلبات الدولية لرسوم استيراد وضرائب تفرضها دولة الوجهة، ويتحملها المستلم ما لم يُذكر خلاف ذلك عند الدفع.",
          ],
        },
        {
          heading: "صحة العنوان",
          body: [
            "يُرجى التحقق من عنوانك جيدًا. لسنا مسؤولين عن الطرود المتأخرة أو المفقودة بسبب عنوان غير صحيح، لكننا سنساعد قدر الإمكان.",
          ],
        },
        {
          heading: "مشكلات التوصيل",
          body: [
            "راجع سياسة الاسترداد والإرجاع بخصوص الطرود المفقودة أو التالفة، أو راسلنا على " +
              E +
              ".",
          ],
        },
      ],
    },
  },
  contact: {
    legal: false,
    path: "/contact",
    en: {
      title: "Contact",
      intro: "We'd love to hear from you. We usually reply within 1–2 business days.",
      sections: [
        { heading: "Email", body: [E] },
        { heading: "Company", body: [`${COMPANY.name}`, A] },
        {
          heading: "Orders",
          body: [
            "For order questions, please include your order number. For defects or misprints, add a photo of the problem.",
          ],
        },
      ],
    },
    ar: {
      title: "تواصل معنا",
      intro: "يسعدنا أن نسمع منك، ونرد عادةً خلال يوم إلى يومي عمل.",
      sections: [
        { heading: "البريد الإلكتروني", body: [E] },
        { heading: "الشركة", body: [`${COMPANY.name}`, A] },
        {
          heading: "الطلبات",
          body: [
            "للاستفسار عن طلب، يُرجى ذكر رقم الطلب، وفي حالة العيوب أو أخطاء الطباعة أرفق صورة للمشكلة.",
          ],
        },
      ],
    },
  },
  "designer-terms": {
    legal: true,
    path: "/creators/terms",
    en: {
      title: "Designer Terms",
      intro: `These terms apply to designers who submit designs to Shirtat, operated by ${COMPANY.name}, ${A}. By applying or submitting a design you agree to them.`,
      sections: [
        {
          heading: "1. Eligibility and approval",
          body: [
            "You must be at least 18. We review every application and design by hand and may accept or decline at our discretion.",
          ],
        },
        {
          heading: "2. Your designs and rights",
          body: [
            "You confirm you created each design and own all rights to it, and that it does not infringe anyone else's rights. You keep ownership. You grant Shirtat a worldwide, non-exclusive licence to print, sell, display and promote products with your approved designs for as long as they are listed, plus a reasonable period to fulfil existing orders. You can sell your work elsewhere.",
          ],
        },
        {
          heading: "3. Revenue share",
          body: [
            "You earn 15% of the net item price of each sale of your products, or 20% in any calendar quarter in which you sell 50 or more units. Net item price is what the customer paid for your product after discounts, excluding tax and shipping. Refunded items are deducted from net sales and earnings, and cancelled orders are not paid. All figures are in US dollars; sales in other currencies are converted at the order-date exchange rate.",
          ],
        },
        {
          heading: "4. Payouts",
          body: [
            "Earnings are held for 30 days, then paid monthly by the 15th via PayPal or Wise once your balance is at least $25. Smaller balances roll over. You are responsible for your own taxes, and we may ask for tax information before paying.",
          ],
        },
        {
          heading: "5. Removal",
          body: [
            "You can ask us to remove a design at any time; we'll delist it within 14 days and still pay earnings already made. We may remove any design, for example after an infringement complaint.",
          ],
        },
        {
          heading: "6. Conduct",
          body: [
            "Designs must not be hateful, misleading or unlawful, and must respect the dignity of the Arabic script and of religious texts.",
          ],
        },
        {
          heading: "7. Changes",
          body: [
            "We give at least 60 days' notice of changes. Changes are never retroactive, and the base rate never drops below 15%.",
          ],
        },
        {
          heading: "8. Governing law",
          body: [
            "These terms are governed by the laws of the State of Texas and the federal laws of the United States, with disputes resolved in the courts of Harris County, Texas.",
          ],
        },
        { heading: "9. Contact", body: [`Email ${E}.`] },
      ],
    },
    ar: {
      title: "شروط المصممين",
      intro: `تسري هذه الشروط على المصممين الذين يقدّمون تصاميمهم إلى شيرتات، التي تُديرها شركة ${COMPANY.name}، ${A}. بتقديم طلبك أو تصميمك فإنك توافق عليها.`,
      sections: [
        {
          heading: "1. الأهلية والقبول",
          body: [
            "يجب ألا يقل عمرك عن 18 عامًا. نراجع كل طلب وتصميم يدويًا، ولنا أن نقبل أو نرفض وفق تقديرنا.",
          ],
        },
        {
          heading: "2. تصاميمك وحقوقك",
          body: [
            "تؤكد أنك صممت كل تصميم وتملك جميع حقوقه، وأنه لا ينتهك حقوق أحد. تبقى الملكية لك، وتمنح شيرتات ترخيصًا عالميًا غير حصري لطباعة المنتجات التي تحمل تصاميمك المعتمدة وبيعها وعرضها والترويج لها ما دامت معروضة، إضافة إلى مدة معقولة لتنفيذ الطلبات القائمة. ويمكنك بيع أعمالك في أماكن أخرى.",
          ],
        },
        {
          heading: "3. نسبة الأرباح",
          body: [
            "تحصل على 15% من صافي سعر كل منتج يُباع من منتجاتك، أو 20% في أي ربع سنة تبيع فيه 50 قطعة أو أكثر. صافي سعر المنتج هو ما دفعه العميل بعد الخصومات، دون الضرائب والشحن. تُخصم المنتجات المستردة من صافي المبيعات والأرباح، ولا تُحتسب الطلبات الملغاة. جميع المبالغ بالدولار الأمريكي، وتُحوَّل المبيعات بالعملات الأخرى بسعر الصرف في تاريخ الطلب.",
          ],
        },
        {
          heading: "4. الدفع",
          body: [
            "تُحتجز الأرباح 30 يومًا، ثم تُدفع شهريًا بحلول اليوم الخامس عشر عبر PayPal أو Wise متى بلغ رصيدك 25 دولارًا على الأقل، وتُرحَّل الأرصدة الأقل. أنت مسؤول عن ضرائبك، وقد نطلب معلوماتك الضريبية قبل الدفع.",
          ],
        },
        {
          heading: "5. الإزالة",
          body: [
            "يمكنك طلب إزالة أي تصميم في أي وقت، وسنزيله خلال 14 يومًا مع دفع الأرباح المستحقة. ويحق لنا إزالة أي تصميم، كما في حال وجود شكوى انتهاك.",
          ],
        },
        {
          heading: "6. السلوك",
          body: [
            "يجب ألا تتضمن التصاميم كراهية أو تضليلًا أو مخالفة للقانون، وأن تحترم مكانة الخط العربي والنصوص الدينية.",
          ],
        },
        {
          heading: "7. التعديلات",
          body: [
            "نُخطرك بأي تعديل قبل 60 يومًا على الأقل، ولا تسري التعديلات بأثر رجعي، ولا تقل النسبة الأساسية أبدًا عن 15%.",
          ],
        },
        {
          heading: "8. القانون الحاكم",
          body: [
            "تخضع هذه الشروط لقوانين ولاية تكساس والقوانين الفيدرالية للولايات المتحدة، وتُحل النزاعات أمام محاكم مقاطعة هاريس بولاية تكساس.",
          ],
        },
        { heading: "9. التواصل", body: [`راسلنا على ${E}.`] },
      ],
    },
  },
};

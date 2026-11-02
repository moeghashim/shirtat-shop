export type RoadmapStatus = "done" | "in-progress" | "next";

export interface RoadmapPhase {
  title: string;
  status: RoadmapStatus;
  summary: string;
}

export const roadmapPhases: RoadmapPhase[] = [
  {
    title: "Store setup",
    status: "done",
    summary: "Connected the Shopify store and cleared out the old products to start fresh.",
  },
  {
    title: "Storefront",
    status: "done",
    summary: "Built the site from Vercel's Shop template and deployed it live on Vercel.",
  },
  {
    title: "Branding",
    status: "in-progress",
    summary:
      "Calligraphy logo added; next comes the colours, fonts, and overall look of the brand.",
  },
  {
    title: "Products",
    status: "done",
    summary:
      "Arabic calligraphy and poetry shirts, hoodies, sweatshirts, tote bags, prints and mugs are live, with redesigned product pages, solid fabric-colour swatches and new designs like Ana Ibn Jala.",
  },
  {
    title: "Supplier and product workflow",
    status: "done",
    summary:
      "Printify connected with prices at cost × 3. Designs become Printify products with mockups and Shopify drafts; paid orders go to Printify on hold and are sent to production when the order is tagged approve-pod.",
  },
  {
    title: "Shop by designer",
    status: "done",
    summary:
      "Designer pages at /designers in English and Arabic, with each designer's logo or photo and products.",
  },
  {
    title: "Payments and launch",
    status: "done",
    summary:
      "Checkout on checkout.shirtat.co, worldwide shipping at $12.99, and the first order received.",
  },
  {
    title: "Creator program",
    status: "done",
    summary:
      "Creators apply with their designs, Moe approves them, and approved creators earn 15–20% of net sales with a dashboard to track it.",
  },
  {
    title: "Custom domain",
    status: "done",
    summary: "shirtat.co now points at the live store.",
  },
  {
    title: "Approval email",
    status: "done",
    summary:
      "When Moe approves a creator, they automatically get an email with a link to their creator details form.",
  },
  {
    title: "Design uploads",
    status: "done",
    summary:
      "Creators upload designs that go to the store as drafts, which Moe publishes in one click.",
  },
  {
    title: "Product types",
    status: "done",
    summary:
      "Creators pick a T-shirt, hoodie, sweatshirt, tote bag or print, plus colours. Categories are set up in Shopify, and each draft carries its type, sizes and colours.",
  },
  {
    title: "Creators admin performance",
    status: "done",
    summary:
      "A performance section in the creators admin showing sales, activity and status for each creator.",
  },
  {
    title: "Creator payouts",
    status: "next",
    summary:
      "Automated or half-automated payouts at 15% or 20%, with a $25 minimum, in USD at the order-day exchange rate.",
  },
  {
    title: "Order monitoring",
    status: "done",
    summary:
      "An hourly check that every paid order reaches Printify, with alerts for orders stuck on hold or unfulfilled.",
  },
  {
    title: "Mobile performance",
    status: "in-progress",
    summary: "Desktop Lighthouse is near 100; pushing the mobile performance score higher.",
  },
  {
    title: "Kids and Baby",
    status: "done",
    summary:
      "A kids T-shirt and a baby bodysuit for every design, with their own Kids and Baby categories in English and Arabic.",
  },
  {
    title: "Product details and printing",
    status: "done",
    summary:
      "Every product page shows fabric, fit, sizes, care, origin and how it is printed, in English and Arabic, taken from the print partner.",
  },
  {
    title: "Hover gallery cards",
    status: "done",
    summary:
      "Product cards show the calligraphy design on hover with arrows to flip through photos, five per row on desktop.",
  },
  {
    title: "Analytics",
    status: "done",
    summary:
      "Google Tag Manager and Ahrefs Web Analytics on every page, loaded on first interaction so speed scores hold.",
  },
  {
    title: "More print partners",
    status: "next",
    summary:
      "Adding Wearform and Tapstitch as print-on-demand options and comparing their prices to pick the best partner for each product.",
  },
  {
    title: "Saudi Arabia shipping",
    status: "next",
    summary: "Getting shipping options to show at checkout for Saudi Arabia.",
  },
  {
    title: "Customer account link",
    status: "next",
    summary: "An Account link on the site for customers to sign in and see their orders.",
  },
  {
    title: "Customer support",
    status: "in-progress",
    summary:
      "Customer emails are answered automatically, with refunds and complaints checked by Moe; a support chat in English and Arabic is in testing.",
  },
  {
    title: "Designer discount codes",
    status: "next",
    summary:
      "Every new designer gets their own 15% discount code when their account is created, to share with their followers.",
  },
  {
    title: "Creator video ads",
    status: "next",
    summary:
      "A small group of hand-picked creators making video ads, starting with free shirts and a fixed fee, then moving to a share of sales.",
  },
  {
    title: "Search visibility",
    status: "in-progress",
    summary:
      "Google Search Console is connected and the sitemap lists every page in English and Arabic; next is watching search results and improving how products show up.",
  },
  {
    title: "Design your own",
    status: "done",
    summary:
      "Customers order a T-shirt, hoodie or mug with their own text in Arabic calligraphy, picking a style and a ready-made sentence or typing their own, linked from the homepage.",
  },
  {
    title: "Mugs",
    status: "done",
    summary:
      "Mugs in the shop, shipping to the US, Europe and the UK with their own lower shipping rates.",
  },
  {
    title: "Custom hoodie and women's fit",
    status: "done",
    summary:
      "A custom hoodie in the builder and a Men's or Women's fit choice, with a real women's cut where the print partner offers one.",
  },
  {
    title: "Real product previews",
    status: "done",
    summary:
      "The builder previews the design on real product photos in the chosen colour and in the calligraphy style picked, with light ink on dark garments.",
  },
  {
    title: "Free-shipping promotions",
    status: "done",
    summary: "Promotions can now cover shipping as well as the items.",
  },
  {
    title: "Marketplace expansion",
    status: "next",
    summary:
      "Selling on marketplaces in Europe, the US and Asia to reach more shoppers before the end of the year.",
  },
  {
    title: "Ads",
    status: "next",
    summary:
      "Paid ads toward the end-of-year sales goal, tracked daily and weekly and adjusted based on results.",
  },
  {
    title: "Affiliates and influencers",
    status: "next",
    summary: "Working with affiliates and influencers to bring new customers to Shirtat.",
  },
];

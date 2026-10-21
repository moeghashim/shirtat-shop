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
    status: "next",
    summary: "Adding the first shirts featuring Arabic calligraphy.",
  },
  {
    title: "Payments and launch",
    status: "next",
    summary: "Setting up checkout and payments, then opening the store.",
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
    status: "in-progress",
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
      "Automated or half-automated payouts at 15% or 20%, with a $25 minimum, in USD converted from GBP at the order-day rate.",
  },
];

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
];

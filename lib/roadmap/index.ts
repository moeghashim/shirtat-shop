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
    summary: "Homepage message, story pages, and the look and feel of the brand.",
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
    title: "Custom domain",
    status: "next",
    summary: "Pointing shirtat.co at the live store.",
  },
];

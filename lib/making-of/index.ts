export interface MakingOfMilestone {
  date: string;
  title: string;
}

/** Append new milestones to the end; the page renders them in order. */
export const makingOfMilestones: MakingOfMilestone[] = [
  {
    date: "2026-10-20",
    title:
      "Connected the existing Shopify store and cleared out old placeholder products to start fresh with shirts.",
  },
  {
    date: "2026-10-20",
    title: "Created this storefront from Vercel's open-source Shop template.",
  },
  {
    date: "2026-10-20",
    title: "Set the homepage message and added this making-of page.",
  },
];

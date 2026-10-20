export interface LogDay {
  /** ISO date, e.g. 2026-10-20 */
  date: string;
  entries: string[];
}

/** Newest day first. Add new days to the top. */
export const logDays: LogDay[] = [
  {
    date: "2026-10-20",
    entries: [
      "Archived the 42 old grocery products.",
      "Set up the repo from Vercel's Shop template.",
      "Added the homepage message and the footer making-of link.",
      "Created the Shopify Storefront token (Headless).",
      "Connected Vercel.",
      "First live deploy.",
      "Connected live sales figures to the sales page.",
      "Added the Shirtat calligraphy logo.",
      "Enlarged the logo and added an inspiration section to the homepage.",
    ],
  },
];

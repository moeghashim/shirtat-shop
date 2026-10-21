export interface LogDay {
  /** ISO date, e.g. 2026-10-20 */
  date: string;
  entries: string[];
}

/** Newest day first. Add new days to the top. */
export const logDays: LogDay[] = [
  {
    date: "2026-10-21",
    entries: [
      "Added a new favicon set: a bold white S from the SHIRTAT wordmark on a black tile for browser tabs, with the full SHIRTAT wordmark on larger app icons.",
      "Made the SHIRTAT wordmark in the logo slightly bolder.",
      "Launched an Arabic version of the storefront at /ar, with right-to-left layout, an Arabic font and an EN / العربية switcher. The roadmap, sales and daily log stay in English.",
    ],
  },
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
      "Designed logo concepts and chose the Thuluth calligraphy wordmark.",
      "Refined the logo by removing the Alef, the dot and the swash, then converted it to SVG.",
      "Added the logo to the header, made it bigger, and enlarged the English wordmark.",
      "Turned the roadmap into a Kanban board.",
      "Added an inspiration section to the homepage.",
      "Added Grok Bot and 10claws credits to the footer.",
      "Merged the daily log into the making-of page.",
      "Connected the custom domain shirtat.co (live on Vercel).",
    ],
  },
];

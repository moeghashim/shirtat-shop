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
      "Chose Printify as the print-on-demand supplier (Shopify app, public API, no minimums, US and international print providers, puff and other special prints) and set prices to supplier cost × 3, rounded up to .99: T-shirt $32.99, sweatshirt $53.99, hoodie $64.99, tote bag $28.99, print $14.99.",
      "Added a product workflow to the admin page: upload a design or pick a designer's submission, get an automatic category suggestion (Poetry, Humor, Cultures, Occasions) that can be overridden, choose product types and colours, and create Shopify drafts tagged with the category and designer. Designers now only suggest types and colours.",
      "Renamed creators to designers across the site in English and Arabic, retitled the program page Sell on Shirtat (also at /sell), and added Shop by designer pages at /designers with each designer's products.",
      "Designers now upload a logo or profile picture when they apply; approved designers without one see a prompt on their dashboard and show initials until they add it.",
      "Added a new favicon set: a bold white S from the SHIRTAT wordmark on a black tile for browser tabs, with the full SHIRTAT wordmark on larger app icons.",
      "Made the SHIRTAT wordmark in the logo slightly bolder.",
      "Launched an Arabic version of the storefront at /ar, with right-to-left layout, an Arabic font and an EN / العربية switcher. The roadmap, sales and daily log stay in English.",
      "Switched the Arabic pages to the El Messiri font and fixed it so the font always loads.",
      "Combined the footer credits into one sentence: the project is part of 10claws and fully managed by Grok Bot.",
      "Launched the Shirtat creator program: public program page and application form (English and Arabic), creator accounts with manual approval, an admin page for Moe, and a creator dashboard with sales and earnings.",
      "Set the creator program to US dollars: dashboard figures use the USD order amount when available, otherwise convert from the shop currency at the order-date exchange rate.",
      "Added product categories to the Shopify store (T-Shirts, Hoodies, Sweatshirts, Tote Bags, Posters & Prints) and a creator details form that approved creators get a secure link to.",
      "Creators can now upload designs from their dashboard, choosing the product type and colours. Each upload is set up to become a draft product in the store that Moe publishes in one click, once the store connection has product permissions.",
      "Connected creator uploads to the store and tested the whole flow live: a test creator applied, was approved, filled in their details and uploaded a hoodie design, which became a draft product with sizes and colours, went live on shirtat.co in one click, and was then removed.",
      "Creator approval emails are now queued by the site and sent from the Grok Bot inbox, with their status shown on the admin page.",
      "Added a performance section to the creators admin: program totals and a sortable table of each creator's status, rate, sales, refunds, earnings owed, designs and recent activity.",
      "Refunds are now deducted from creator sales and earnings, shown as their own line on the dashboard, and the creator terms say so.",
      "Added password reset for creators (a one-hour, single-use link sent by email) and a change-password option when signed in.",
      "Switched every price on the site to US dollars: the storefront and cart show USD at the daily exchange rate, sales totals are converted at each order date's rate, and creator product prices start at $30 for a T-shirt, $55 for a hoodie, $50 for a sweatshirt, $22 for a tote bag and $25 for a print.",
      "Added About, Contact, Shipping, Refund & Returns, Terms & Conditions, Privacy and Creator Terms pages in English and Arabic, linked from the footer.",
      "Creator approval and password reset emails now send directly from creators@shirtat.co through Cloudflare Email Service, and are queued if sending fails.",
      "The Shopify store now runs in US dollars, so the site shows Shopify's own USD prices and checkout charges in dollars. Older pound orders are still converted at the order-date rate for sales and creator figures.",
      "Changed the public contact email to contact@shirtat.co on all pages and in creator emails, which now reply to that address.",
      "Replaced the store categories with four themes: Poetry, Humor (Arab street slang), Cultures and Occasions (Eid, birthdays, engagement nights and more), with Arabic names on /ar. Creators now pick one of these categories when uploading a design. The product-type collections are kept in Shopify but no longer shown as categories.",
      "Added Poetry, Humor, Cultures and Occasions to the main menu on desktop and mobile, in English and Arabic, and made category page titles and descriptions fully Arabic on /ar.",
      "Replaced the homepage banner with an interactive clothing rail: nine example garments on wooden hangers that turn and lift on hover, open into a close-up view with arrows on click, a Shop now button and a scrolling ticker, in English and Arabic.",
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

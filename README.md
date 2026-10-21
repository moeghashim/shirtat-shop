<p align="center">
  <img src="public/shirtat-logo.svg" alt="Shirtat" width="220" />
</p>

# Shirtat

Shirtat (شيرتات, “t-shirts” in Arabic) is an apparel brand that puts Arabic calligraphy on clothing: Thuluth, Kufic, Diwani and words chosen for their meaning. This repository is the storefront for **[shirtat.co](https://shirtat.co)**.

## Live links

| Page | URL |
| --- | --- |
| Store (English) | https://shirtat.co |
| Store (Arabic) | https://shirtat.co/ar |
| The making of Shirtat and the daily log | https://shirtat.co/making-of |
| Roadmap (Kanban board) | https://shirtat.co/roadmap |
| Sales totals | https://shirtat.co/sales |

## Stack

- **Next.js 16** (App Router, Cache Components), built from the [Vercel Shop](https://vercel.shop) template
- **Shopify Storefront API** for products, collections, cart and checkout. The store is `shirtatco.myshopify.com`.
- **Shopify Admin API** (read-only `read_orders`) for the public sales totals
- **Vercel** hosting. Every push to `main` deploys to production automatically.

## Features

- **English and Arabic.** English is at `/` and Arabic is at `/ar`.
  - Arabic pages are right-to-left (`dir="rtl"`) and use the El Messiri font through `next/font`.
  - The header has an EN / العربية switcher, and pages carry hreflang alternates.
  - Product data asks Shopify for Arabic content and falls back to English.
- **Public sales totals.** `/sales` shows order totals for the last 30 and 60 days. The server gets its own short-lived Admin API token with Shopify's client-credentials grant, so no long-lived admin token is stored.
- **Daily log.** `/making-of` tells how the store is being built, with a newest-first log kept in `lib/log/index.ts` (English only).
- **Kanban roadmap.** `/roadmap` shows Done, In progress and Next columns, with data in `lib/roadmap`.
- **Brand assets.** The stacked logo (Thuluth calligraphy over SHIRTAT) and a full favicon and app-icon set with a web manifest.

## Creator program

Creators submit Arabic calligraphy designs and earn a share of sales: **15%** of the net item price (after discounts, excluding tax and shipping), or **20%** for creators with 50+ units in a calendar quarter. Earnings are held 30 days, paid monthly by the 15th via PayPal or Wise, with a $25 minimum.

| Page | Purpose |
| --- | --- |
| `/creators` (and `/ar/creators`) | Program overview, rates, terms and FAQ |
| `/creators/apply` | Application form, which also creates the creator account (email and password) |
| `/creators/signin` | Sign in for creators and the admin |
| `/creators/dashboard` | Approved creators: units, net sales, earnings, pending vs payable, tier progress and per-product breakdown; design uploads with status |
| `/creators/details?t=…` | Creator details form (legal name, display name, payout, tax country/address, socials, bio, avatar), opened from a single-use link that expires after 14 days |
| `/admin/creators` | Admin only (moe@10claws.com): approve or reject, assign handle, set tier override, see creator details and email status, resend the details link, publish or reject designs, delete |

- **Linking products to a creator:** in Shopify admin, add the product tag `creator:<handle>` (for example `creator:layla`). The handle is the one assigned in `/admin/creators`.
- **Data:** creator accounts, applications and uploads are stored in a private Vercel Blob store (`shirtat-creators`). Passwords are hashed with scrypt, and sessions are signed, httpOnly cookies.
- **Admin sign-in:** the admin email cannot be registered publicly; it signs in with the password whose hash is in `ADMIN_PASSWORD_HASH`.
- **Emails (approval and password reset):** sent directly through Cloudflare Email Service (`CLOUDFLARE_EMAIL_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `EMAIL_FROM`), or Resend (`RESEND_API_KEY`) if configured instead. If sending fails or nothing is configured, the email is queued in Blob (`email-queue/`) and exposed at `GET /api/creators/email-queue` (bearer `EMAIL_QUEUE_TOKEN`; `POST {id, from}` marks one sent). The admin page shows sent/queued status and the details link as a fallback.
- **Design uploads:** creators pick a product type and colours (config in `lib/creators/product-types.ts`: type, Shopify standard category, sizes, colours, starting GBP price), then upload a PNG or SVG. The upload creates a `DRAFT` Shopify product tagged `creator:<handle>` with Size and Color variants; matching smart collections (`t-shirts`, `hoodies`, `sweatshirts`, `tote-bags`, `posters-prints`) pick it up by product type. "Publish to store" sets it `ACTIVE` and publishes it to the Shirtat Vercel headless channel; "Reject" archives it. Shopify fetches the image through a signed, expiring URL (`/api/creators/asset`). This needs the Admin app to have `write_products`, `read_products` and `write_publications` scopes; until then uploads are saved and the admin can create the draft later.
- **Admin performance:** `/admin/creators` opens with program totals and a sortable per-creator table (status, tier/rate, units and net sales for 60 days and quarter-to-date, refunds, owed/pending/payable, designs submitted/live/rejected, last sign-in and upload).
- **Passwords:** `/creators/forgot` queues a bilingual reset email (single-use link, 1 hour) in the same email queue, without revealing whether the account exists; `/creators/reset` sets the new password. Signed-in users can change their password on the dashboard. Admin resets go to moe@10claws.com, and the new admin hash is stored in Blob (`admin/password.json`), overriding `ADMIN_PASSWORD_HASH`.
- **Limitations:** sales come from the last 60 days of orders only (Shopify `read_orders` without `read_all_orders`), so quarterly tier progress counts orders within that window. Refunds (Shopify refund line items) are deducted from net sales and earnings. There are no new-application notifications; the admin page shows the pending count.

## Info and legal pages

`/about`, `/contact`, `/shipping`, `/refunds`, `/terms`, `/privacy` and `/creators/terms` (EN at `/…`, AR at `/ar/…`), with content in `lib/legal/content.ts` (10claws Inc, Houston, Texas law, last updated 21 Oct 2026). The text is a print-on-demand template and should be reviewed by a lawyer.

## Currency

The Shopify store currency stays GBP. The site shows USD everywhere: storefront prices convert at the latest daily ECB rate (`lib/money/fx.ts`), `/sales` and creator figures convert at each order date's rate. Checkout charges GBP until a USD market can be enabled in Shopify (needs Shopify Payments or a gateway that supports multiple currencies).

## Project structure

```
app/
  [locale]/            Storefront routes; en is served at / and ar at /ar
    page.tsx           Homepage (hero + Inspiration section)
    making-of/         Story and daily log
    roadmap/  sales/   English-only pages
    products/  collections/  search/  cart/ ...
  api/  md/  sitemap/  Non-localized handlers
components/            UI (nav, footer, home, cart, product, collections, ...)
lib/
  i18n/                Locales, Arabic messages, locale helpers
  log/                 Daily log entries
  roadmap/  sales/     Roadmap data and Admin API sales totals
  shopify/             Storefront API operations
proxy.ts               Shopify route handling and locale routing (/ to /en internally, /ar)
public/                Logo, favicons, site.webmanifest, credit logos
```

## Local development

Requires Node 24 and pnpm.

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

Environment variables (names only; never commit values):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Shopify store domain |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Storefront API token (Headless channel) |
| `NEXT_PUBLIC_SHOPIFY_SHOP_ID` | Shopify shop ID |
| `SHOPIFY_ADMIN_CLIENT_ID` | Admin app client ID for sales totals (server only) |
| `SHOPIFY_ADMIN_CLIENT_SECRET` | Admin app client secret for sales totals (server only) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store for creator data and uploads (set by the Blob integration) |
| `AUTH_SECRET` | Secret that signs creator session cookies (32+ characters) |
| `ADMIN_PASSWORD_HASH` | scrypt hash of the admin password |

Other optional variables are listed in `.env.example`.

## Deployment

- The Vercel project is `shirtat-shop`. Pushing to `main` builds and deploys to production.
- Secrets live only in Vercel environment variables (encrypted). Never commit them.
- The domain `shirtat.co` is pointed at Vercel through DNS records at name.com, and `www` redirects to the apex.

## Credits

This project is part of [10claws](https://10claws.com/) and is fully managed by Grok Bot.

Built on the [Vercel Shop](https://vercel.shop) template (MIT, see [LICENSE](LICENSE)).

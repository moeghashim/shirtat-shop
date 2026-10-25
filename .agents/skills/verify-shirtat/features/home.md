# Home (EN `/`, AR `/ar`)
## Sub-features
New Arrivals section (grouped by design), product links, banner/logo (never change), RTL Arabic, GTM-TDX7NTW3 + Ahrefs lazy-loaded on first interaction, GA G-6DT5S4QRGT (loads on interaction or after 4 s).
## How to get to it (user POV)
Open https://shirtat.co or /ar.
## Driving it with Playwright
journeys.mjs records requests; checks no `gtm.js`/`analytics.ahrefs.com` before interaction, then scrolls + clicks and waits 5 s, expects `gtm.js?id=GTM-TDX7NTW3`, `analytics.ahrefs.com/analytics.js`, a request containing `G-6DT5S4QRGT`. `/ar` expects `<html dir="rtl">`.
## Gotchas
New Arrivals is a home section, not a collection: `/collections/new-arrivals` is 404. Home cards don't use `data-slot=product-card`; check `a[href*="/products/"]`. When GA moves into Tag Manager (components/analytics/google-tag.tsx deleted), the GA check still passes via GTM.

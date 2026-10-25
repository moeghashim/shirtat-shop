---
name: verify-shirtat
description: Verify the Shirtat storefront (headless Next.js + Shopify, https://shirtat.co and Arabic /ar) the way a shopper uses it, on production or a Vercel preview URL. Use after any storefront, product, analytics or performance change, before calling the change done or merging to main.
---

# Verify Shirtat

Drives the real site in headless Chrome (Playwright) and runs Lighthouse. Nothing to launch locally: the target is a deployed URL (production `https://shirtat.co` or a preview such as `https://shirtat-shop-<hash>-bannaa.vercel.app`).

## Hard rules
- Never click Checkout, never enter payment details, never use test-mode payments, never place an order. Add to cart and view `/cart` only.
- Never print or commit secrets (Shopify/Vercel tokens, bypass secrets, Tapstitch credentials).
- Never edit the logo or homepage banner to make a check pass. Never lower `baseline.json` or targets to make a run pass.

## Setup (once per box)
`bash .agents/skills/verify-shirtat/scripts/setup.sh` installs `playwright-core` and `@lhci/cli` into `~/.cache/verify-shirtat` (outside the repo; no package.json change). Uses `/usr/bin/google-chrome`.

## Doctor (read-only, run first)
`bash .agents/skills/verify-shirtat/scripts/doctor.sh [BASE_URL]` — every key route must return 200 and Chrome must exist. If a preview returns 401/403 it is protected: use the `access-protected-vercel-deployment` skill to get a bypass secret and export it as `VERCEL_BYPASS` (never echo it).

## Run
```bash
bash .agents/skills/verify-shirtat/scripts/run.sh https://shirtat.co            # journeys + Lighthouse (~7 min)
bash .agents/skills/verify-shirtat/scripts/run.sh <preview-url> --no-lighthouse # journeys only (~1 min)
```
Env: `VERIFY_PRODUCT` (default `/products/ana-ibn-jala-t-shirt`), `VERIFY_LH_PAGES` (default `/ /ar /products/ana-ibn-jala-t-shirt`), `VERIFY_OUT`, `VERCEL_BYPASS`. Exit 0 and `VERIFY PASS` means everything passed.

## What it checks
- `scripts/journeys.mjs` (see `features/`): home EN (New Arrivals section, product links), /ar RTL + Arabic text, Kids and Baby collections (EN, AR RTL), product page (gallery `[data-slot=pdp-carousel]`, swatches `[data-slot=swatch]` solid colour + hover name, Details and Printing sections, Add to Cart opens cart), `/cart` holds the item, AR product RTL, /making-of, /roadmap, /ar/making-of. No console errors on any page (third-party tag noise ignored). Analytics: GTM-TDX7NTW3 in the page, Tag Manager and Ahrefs NOT requested before interaction and requested after scroll/click; GA G-6DT5S4QRGT requested.
- `scripts/lighthouse.sh` + `lh-summary.mjs`: 3 runs per page, mobile and desktop, median. Targets: mobile performance ≥85 on `/` and `/ar` (product pages: baseline only), desktop performance ≥99, accessibility/best-practices/SEO 100 everywhere; and no score more than 2 points under `baseline.json`.

## Evidence
`/workspace/verify-shirtat-evidence/<timestamp>/` (outside the repo, survives cleanup): `doctor.txt`, `journeys.json`, screenshots per page incl. `product-added.png`, `lighthouse/*.json` and `lighthouse/summary.json`. Quote the PASS/FAIL lines and scores; a real failure is reported, not hidden.

Lighthouse on mobile varies ±3 between runs. If one score is just under, rerun with `VERIFY_LH_PAGES=/` before calling it a regression; report both runs.

## Cleanup
The scripts start only their own headless Chrome and close it. The test cart lives in the throwaway browser context; nothing to undo in Shopify. Keep the evidence folder; delete old timestamps by hand if space matters.

## Maintenance
When routes, selectors or products change, update `features/` and `journeys.mjs` (use `maintain-verification-skill`). If the default product is unpublished, set `VERIFY_PRODUCT` and update the default.

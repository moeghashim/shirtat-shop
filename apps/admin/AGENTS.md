# Shirtat admin

This app lives in `apps/admin` and deploys to its own Vercel project. Read `docs/deploy.md` for the root directory, build, and env vars. The storefront is a separate Next.js app; do not import its React tree or apply this theme outside `apps/admin`. Shared SEO plan data is imported from the shop `lib/seo-plan` module through the `@shop/*` alias.

`/` redirects to `/dashboard/seo` after the auth check. Designers have no SEO access. New designer dashboards start with `npm run new:dashboard`.

# Building with tenboards

Maintaining tenboards upstream? Read dev/MAINTAINERS.md first.

## Stack and map

Use Node 22+, npm, strict TypeScript, React 19, TanStack Start (SSR), Tailwind v4,
shadcn/Base UI, TanStack Table v9 and Recharts. Reuse installed dependencies.
Read DESIGN.md for tokens and PRODUCT.md for product context.

- `src/routes/(external)/index.tsx` + adjacent `-components/`: public homepage; `README.md` documents restoring the app redirect.
- `src/routes/(main)/dashboard/<slug>/`: dashboard and app routes; feature code in `-components/`.
- `src/components/blocks/`: public cards, headings, tables and chart API; `/dashboard/kit` has live examples.
- `src/components/ui/` and `src/components/calendar/`: existing primitives; inspect wrappers, do not edit them to style a page.
- `src/server/data/`: typed demo/database reads and parity registry.
- `src/server/db/`: schema, additive migrations, canonical fixtures and seed.
- `src/navigation/`: sidebar and shared route catalog.
- `scripts/templates/`: generator templates; `docs/data-layer.md` explains database integration.
- `.agents/skills/`: canonical Agent Skills; `.claude/skills/` contains relative mirrors.

## Build loop

1. Use `tenboards-build-ui` for dashboard/page/KPI/chart/table work; use
   `tenboards-connect-data` for database reads, fixtures, migrations and parity.
2. Inspect a local example and the relevant block props before editing.
3. Scaffold with `npm run new:dashboard sales` or `npm run new:page vendors`.
   Both create `/dashboard/<slug>`, navigation/catalog entries, guarded loaders,
   typed reads and illustrative fixtures. Existing slugs are rejected, never overwritten.
4. Adapt the generated types, fixtures and route-local components to the requested
   domain. Import presentation from `@/components/blocks`; chart primitives can
   also come from `@/components/blocks/charts`. Do not rebuild equivalent cards/tables.
5. Keep data behind typed reads and guarded server functions. The generated DB
   implementation is an explicit illustrative stub, not a real database query.
   Use the data skill before connecting live data; never silently fall back on DB errors.
6. Run `npm run build`, `npm run check`, `npm run typecheck`, then
   `npm run verify:page -- /dashboard/<slug>` (optionally `--base-url http://127.0.0.1:3000`).
   `check` includes `check:design` and `check:skills`. Fix failures and rerun affected checks.
7. Inspect light/dark × desktop/mobile renders, keyboard access and empty states.
   `verify/` reports contain axe and console/hydration results; keep generated evidence out of source commits.

## Invariants

- Use named semantic tokens and spacing/type scales. No raw color literals or
  arbitrary color/size/spacing/type values in page/block code; do not add design exceptions for new pages.
- Preserve compact density: body/table text ≥13px, metadata ≥12px, targets ≥24px;
  keep mobile input text readable and preserve visible focus/reduced motion.
- Use `useChartMotion()` on animated marks and tooltips. Keep series labels and
  an accessible data alternative; color alone must not carry meaning.
- SSR and first client render must match. Serialize a request clock for date-based
  data, or start live clocks after hydration. Browser APIs belong in effects or
  guarded client code; do not add `use client`, disable SSR or suppress hydration errors.
- Route groups such as `(main)` add no URL segment; `route.tsx` defines layouts,
  `$param` names dynamic segments, and `-` files are excluded from route generation.
  Never hand-edit `src/routeTree.gen.ts`; use dev/build or `npm run generate-routes`.
- Keep fixtures server-side; components consume loader data and type-only contracts.
  Every app-data server function calls `requireSession()` independently of the route guard.
- No environment variables are needed for demo mode. A configured failing database
  must produce a visible error. Never put credentials in client code or committed files.

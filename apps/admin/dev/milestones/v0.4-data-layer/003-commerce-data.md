---
id: "003"
title: Connect products, invoice and the E-commerce dashboard
milestone: v0.4-data-layer
status: review
category: data
files: ["src/routes/(main)/dashboard/products/", "src/routes/(main)/dashboard/invoice/", "src/routes/(main)/dashboard/ecommerce/", "src/server/data/products.ts", "src/server/data/invoices.ts", "src/server/data/ecommerce.ts", "src/server/db/", "scripts/data-parity.ts", "README.md", "dev/milestones.json"]
---

## Goal and scope

Move the product catalog, invoice draft/reference data and entire E-commerce dashboard behind read functions, including order records, product summaries, reviews, inventory and chart metrics.

## Files and ownership

- `src/routes/(main)/dashboard/products/`
- `src/routes/(main)/dashboard/invoice/`
- `src/routes/(main)/dashboard/ecommerce/`
- `src/server/data/products.ts`
- `src/server/data/invoices.ts`
- `src/server/data/ecommerce.ts`
- `src/server/db/`
- `scripts/data-parity.ts`
- `README.md`
- `dev/milestones.json`

The [ownership matrix](README.md#fixture-and-route-ownership-matrix) defines exact existing fixtures, inline values and route boundaries. Shared database, migration, seed and parity paths contain only this task's additions; do not rewrite prior task migrations. README/status updates accompany verified work.

## Before implementation

Prefactor inspection: Products initializes local state from imported fixtures; change only its initial-data boundary. Invoice data.ts mixes fixtures, types, calculations and paper geometry: separate pure calculations/presentation from fixture values before loader wiring, preserving numeric behavior and print layout.

## Acceptance criteria

- [x] Normalize catalog products/categories, invoice parties/addresses/line items/tax options, orders and their actual related records, reviews and inventory records. Use stable IDs, ordered relationships and explicit monetary precision; do not join unrelated product/order fixture sets by similar names or reconcile their intentionally distinct totals.
- [x] Move all E-commerce embedded business values, KPI series/buckets, traffic sources, inventory summary/gauge inputs, top-product/category rows and review summaries through ecommerce.ts. Store aggregate-only series in typed metric points, not component constants or JSON blobs; retain UI chart config locally.
- [x] Implement products.ts, invoices.ts and ecommerce.ts demo/db reads, seed additions, registry entries and parity for every read. Product filters/categories and invoice client/tax selectors consume loaded data; no component or form initializes from fixture imports.
- [x] Preserve Invoice request-scoped renderedAt/UTC civil-date defaults (+14-day due date), serialized loader values and local editable dates. Seed typed draft/date-offset definitions rather than a permanently stale seed-time date; both sources resolve the same request context without separate clocks. Include month/year/leap-day boundaries in parity.
- [x] Preserve product local edit/duplicate behavior and validation-only Add, invoice local calculations/reorder/editor/preview/print, order filters/pagination and every current chart/range control. No database write endpoint, persistence, upload, payment, Save or Send behavior is added.
- [x] Before/after and demo/DB screenshots match for all three routes and meaningful variants; invoice print page-fit and totals remain identical. No hydration suppression or SSR disabling.

## Tests

- Run new migrations plus full seed twice and data:parity for every commerce read, including missing IDs/empty results, money/ordering and request-date cases.
- Run existing Products and Invoice interactions in both modes; verify duplicated/edited local records do not persist after a reload and do not mutate seed fixtures.
- Capture /dashboard/products, /dashboard/invoice and /dashboard/ecommerce in four states, plus invoice print and order/filter variants. Run delayed direct/refresh Invoice hydration in America/Chicago and Pacific/Kiritimati on dev (demo/DB) and Workers demo.

## Execution order

Hard dependency: 001. Default merge order: after 002; owns the entire E-commerce dashboard so 006/007 do not touch its fixtures.

## Common gates and delivery

- [x] All [milestone test-floor gates](README.md#test-floor-and-evidence) pass for this task: build/check/typecheck; zero-env demo and actual Docker Postgres reads; parity for owned reads; dev `/dashboard/default` plus owned-route smoke; Workers demo version preview.
- [x] Capture and inspect incumbent → demo after → seeded DB for owned routes in light/dark × desktop (1440×900)/mobile (390×844), including listed variants. Attach four-state comparisons; no visual change is expected. Keep evidence on `pr-assets` or PR attachments, never main.
- [x] README reflects verified commands/behavior/status and the PR states `README: updated (sections …)` or `README: no change needed (reason)`. Update task acceptance and `dev/milestones.json` only from evidence; leave in review until merged.

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), inspect affected code before implementation, and read current official TanStack docs before framework/loader changes. UI edits use global Impeccable in Operate mode, context once per session, incumbent inspection and craft floor immediately before edits. Preserve keyboard access, names, focus, reduced motion and all four presets. No token/preset edits are planned; if approved, record actual contrast evidence. Keep `src/components/ui/`, `src/components/calendar/`, generated route/Worker files, font/preferences registries and PLAN.md intact.

One approved task per branch `feat/v0.4/NNN-slug` and PR targeting main. Prefer merged predecessors; declare any stack/base PR/merge order/layer compare URL. Use Conventional Commits, `git commit -s` (`Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>`) and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Include version-specific preview and alias via `npm run preview:deploy -- --preview-alias pr-NNN`; never `npm run deploy`. Claude Opus 5.5 reviews and holds merge/rebase/redeploy/release authority; GPT-6-Astra never merges. Escalate conflicts, missing access/assets, any other new runtime dependency or scope/auth/destructive change in `dev/open-questions.md`, pause dependent work and finish independent work. This breakdown does not start implementation.

---
id: "004"
title: Restyle Finance and Finance V1 and fix hydration
milestone: v0.2-dashboards
status: merged
category: ui
files: ["src/routes/(main)/dashboard/finance/", "src/routes/(main)/dashboard/(legacy)/finance-v1/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/finance`, `/dashboard/finance-v1`.

- Restyle Finance KPIs, income breakdown, notifications, transactions chart, balance distribution, wallet, upcoming transactions and quick actions; restyle Finance V1 KPIs, cash flow, spending, income reliability and card overview.
- Preserve enabled/disabled tabs and existing placeholder views; use shared chart styling, consistent currency/percentage precision, compact legends and semantic signed values.
- Investigate and fix SSR/initial-client date or locale differences in finance/route.tsx, upcoming-transactions.tsx and legacy card-overview.tsx. dev/open-questions.md records the Workers reproduction; date usage is an inspection lead, not proof of the complete cause.

## Before implementation

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once from the repo root per session, inspect incumbent renders/local components, and read `reference/craft-floor.md` immediately before UI edits.

Prefactor inspection: Inspect date/number formatting and repeated KPI formatting before edits; isolate route-local deterministic formatting or fixture seams only when they reduce the hydration fix risk.

## Acceptance criteria

- [x] Finance (`/dashboard/finance`): no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile.
- [x] Finance V1 (`/dashboard/finance-v1`): no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile.
- [x] Verify direct SSR loads and refreshes using actual runtime dates/timezones; use deterministic demo values or a shared stable initial snapshot where needed. Do not suppress hydration warnings, disable SSR for the page, or freeze the test clock to hide mismatches.
- [x] Replace Arham Khan on the legacy mock payment card and audit both routes for upstream-author names/handles; retain masked demo account data and do not add real financial behavior.
- [x] Capture and inspect before/after screenshots with `npm run screenshots` for every affected route in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table for each route. Store PNGs, reports and logs only on `pr-assets` or PR attachments, never main. Include meaningful interactive states beyond the initial capture.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass; report inherited warnings separately from failures.
- [x] Dev-server `/dashboard/default` smoke and all affected-route smoke checks pass without console errors; verify the same routes on the Workers version preview and retain diagnostics. Do not waive inherited errors on a route this task owns.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (NNN is the actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy` or merge as implementer.
- [x] Update root README.md for the verified behavior/screens/usage/status delivered by this task; PR body states `README: updated (sections …)`. Update task acceptance and `dev/milestones.json` only from verification.
- [x] Preserve keyboard access, accessible names, visible focus and reduced motion. Verify all four presets in light/dark on affected content; record contrast evidence for changed chart/status/token pairings. Inspect existing Base UI wrappers; keep `src/components/ui/`, `src/components/calendar/`, shell/preferences and out-of-scope app pages intact.
- [x] Audit mock data, greeting copy, names, handles, emails and author-linked demo references in every owned route; replace `Arham Khan`/`Arham`/`arhamkhnz` identity references with neutral demo names and safe example addresses, preserving related fixture consistency. Record a scoped search even if no matches exist; leave out-of-scope pages and legal attribution unchanged.

## Execution order

Depends on 001; execute after 003, before later boards, to clear two known hydration risks early. Resolve the paired finance hydration gates while standardizing financial data displays.

One task per PR targeting main; declare any stack and layer compare URL. Claude Opus 5.5 reviews and holds delegated squash-merge authority. Implementation starts only when approved; this breakdown does not start it.

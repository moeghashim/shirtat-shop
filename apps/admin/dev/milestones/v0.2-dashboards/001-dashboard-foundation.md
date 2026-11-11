---
id: "001"
title: Establish shared chart theme and dashboard primitives
milestone: v0.2-dashboards
status: merged
category: ui
files: ["src/lib/charts/", "src/routes/(main)/dashboard/-components/dashboard/", "src/routes/(main)/dashboard/default/-components/metric-cards.tsx", "src/routes/(main)/dashboard/default/-components/performance-overview.tsx", "DESIGN.md", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/default` (limited foundation integration only).

- Build `src/lib/charts/` with typed Recharts configuration/helpers composing the existing `src/components/ui/chart.tsx` exports: token-derived series, axes, grids, cursors, tooltip and legend styling, numeric formatting, tabular numerals, responsive sizing, and SSR-safe reduced-motion behavior.
- Build KPI/stat card, section header, and compact/standard card-density primitives under `src/routes/(main)/dashboard/-components/dashboard/`. This is the common dashboard ancestor, justified by repeated metric/header/card structures across Default, CRM, Finance, Academy and other boards; do not move domain widgets into it. Keep `src/components/ui/` intact.
- Use a narrowly scoped, behavior-preserving integration in Default metric cards and one performance chart to prove consumption. Preserve data, interactions and composition; task 002 owns the full Default restyle. Do not migrate other dashboards in this foundation PR.
- Document the usage contract in DESIGN.md and README. Preserve the font/preferences registries and all four presets; prefer existing semantic/chart tokens over global token changes.

## Before implementation

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once from the repo root per session, inspect incumbent renders/local components, and read `reference/craft-floor.md` immediately before UI edits.

Prefactor inspection: Inspect repeated metric markup and existing ChartConfig/ChartContainer/tooltip/legend extension points first. Extract only the shared styling and prop contracts needed by these known consumers; do not build a generic dashboard engine.

## Acceptance criteria

- [x] The shared theme covers Recharts colors from tokens for Default, Graphite, Pine and Iris in both light and dark, plus axis/grid/tooltip/legend styling, tabular numerals and reduced motion.
- [x] Series remain distinguishable when token values coincide (Default chart-1 and chart-3 currently match): use deliberate token selection and labels/dashes/markers, not color alone. Record contrast evidence for chart text and meaningful marks against their actual surfaces; decorative grids are not the only data cue.
- [x] KPI/stat card, section header and card-density primitives have typed composition APIs, semantic headings, optional trend/help/actions, long-label handling and responsive values. Do not force specialist map or waveform views into KPI cards.
- [x] Reduced motion disables Recharts JS animations as well as CSS motion, handles preference changes in guarded client code, and uses matching server/initial-client output. Existing chart tooltips/legends remain readable and keyboard access is preserved.
- [x] Inspect the Default integration in all four presets × light/dark × desktop/mobile, including tooltip and legend states; run the existing contrast script for all presets. No global shell/app-page restyle or primitive-wrapper edit.
- [x] Capture and inspect before/after screenshots with `npm run screenshots` for every affected route in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table for each route. Store PNGs, reports and logs only on `pr-assets` or PR attachments, never main. Include meaningful interactive states beyond the initial capture.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass; report inherited warnings separately from failures.
- [x] Dev-server `/dashboard/default` smoke and all affected-route smoke checks pass without console errors; verify the same routes on the Workers version preview and retain diagnostics. Do not waive inherited errors on a route this task owns.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (NNN is the actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy` or merge as implementer.
- [x] Update root README.md for the verified behavior/screens/usage/status delivered by this task; PR body states `README: updated (sections …)`. Update task acceptance and `dev/milestones.json` only from verification.
- [x] Preserve keyboard access, accessible names, visible focus and reduced motion. Verify all four presets in light/dark on affected content; record contrast evidence for changed chart/status/token pairings. Inspect existing Base UI wrappers; keep `src/components/ui/`, `src/components/calendar/`, shell/preferences and out-of-scope app pages intact.

## Execution order

001 has no v0.2 dependency; v0.1 is merged. Create the shared chart and compact card contracts before dashboard composition changes.

One task per PR targeting main; declare any stack and layer compare URL. Claude Opus 5.5 reviews and holds delegated squash-merge authority. Implementation starts only when approved; this breakdown does not start it.

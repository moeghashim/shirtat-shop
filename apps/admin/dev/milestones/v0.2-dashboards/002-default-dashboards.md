---
id: "002"
title: Restyle Default and Default V1
milestone: v0.2-dashboards
status: merged
category: ui
files: ["src/routes/(main)/dashboard/default/", "src/routes/(main)/dashboard/(legacy)/default-v1/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/default`, `/dashboard/default-v1`.

- Restyle Default metric cards, performance overview, subscribers and recent-customers table; restyle Default V1 section cards, interactive area chart and proposal-sections table.
- Replace decorative KPI gradients with the neutral compact card language, align metric/trend hierarchy, and preserve each variant's distinct data and table functions. Integrate the chart theme throughout these two routes.

## Before implementation

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once from the repo root per session, inspect incumbent renders/local components, and read `reference/craft-floor.md` immediately before UI edits.

Prefactor inspection: Inspect metric-cards.tsx, section-cards.tsx and chart/table wrappers for repeated display-only fragments; reuse 001 and keep table/domain logic local.

## Acceptance criteria

- [x] Both overview compositions retain every existing section; chart range controls, table sorting/filtering/pagination/selection and any existing row/detail actions still work.
- [x] Dense tables use deliberate local horizontal scrolling on narrow screens; card metrics, chart labels and controls do not clip or cause page-wide overflow.
- [x] Capture and inspect before/after screenshots with `npm run screenshots` for every affected route in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table for each route. Store PNGs, reports and logs only on `pr-assets` or PR attachments, never main. Include meaningful interactive states beyond the initial capture.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass; report inherited warnings separately from failures.
- [x] Dev-server `/dashboard/default` smoke and all affected-route smoke checks pass without console errors; verify the same routes on the Workers version preview and retain diagnostics. Do not waive inherited errors on a route this task owns.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (NNN is the actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy` or merge as implementer.
- [x] Update root README.md for the verified behavior/screens/usage/status delivered by this task; PR body states `README: updated (sections …)`. Update task acceptance and `dev/milestones.json` only from verification.
- [x] Preserve keyboard access, accessible names, visible focus and reduced motion. Verify all four presets in light/dark on affected content; record contrast evidence for changed chart/status/token pairings. Inspect existing Base UI wrappers; keep `src/components/ui/`, `src/components/calendar/`, shell/preferences and out-of-scope app pages intact.
- [x] Audit mock data, greeting copy, names, handles, emails and author-linked demo references in every owned route; replace `Arham Khan`/`Arham`/`arhamkhnz` identity references with neutral demo names and safe example addresses, preserving related fixture consistency. Record a scoped search even if no matches exist; leave out-of-scope pages and legal attribution unchanged.

## Execution order

Depends on 001. Prove the shared foundation on the reference overview and its legacy sibling.

One task per PR targeting main; declare any stack and layer compare URL. Claude Opus 5.5 reviews and holds delegated squash-merge authority. Implementation starts only when approved; this breakdown does not start it.

---
id: "006"
title: Restyle Productivity and fix hydration
milestone: v0.2-dashboards
status: merged
category: ui
files: ["src/routes/(main)/dashboard/productivity/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/productivity`.

- Restyle greeting, summary cards, tasks, projects, quick actions, quote, focus card, recent notes, weekly summary and the embedded calendar panel.
- Fix the route's hydration mismatch, inspecting calendar-panel.tsx startOfToday/month initialization and module-time dates in projects-section.tsx/recent-notes-card.tsx. Keep any fix at the route usage/fixture boundary; `src/components/ui/` and `src/components/calendar/` remain intact.
- Replace the Arham greeting and any author-identifying mock values with neutral demo names. This does not authorize edits to the separate Tasks, Calendar or Kanban app pages.

## Before implementation

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once from the repo root per session, inspect incumbent renders/local components, and read `reference/craft-floor.md` immediately before UI edits.

Prefactor inspection: Inspect date initialization and local card/header repetition; isolate a stable demo-date seam if needed, without modifying protected calendar wrappers.

## Acceptance criteria

- [x] Productivity (`/dashboard/productivity`): no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile.
- [x] Direct SSR loads/refreshes have stable first-render dates and calendar state without suppressHydrationWarning, blanket SSR removal or frozen-clock-only verification.
- [x] Existing task/project controls, focus interactions and calendar selection/month navigation remain usable by keyboard; the secondary column flows logically on mobile.
- [x] Capture and inspect before/after screenshots with `npm run screenshots` for every affected route in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table for each route. Store PNGs, reports and logs only on `pr-assets` or PR attachments, never main. Include meaningful interactive states beyond the initial capture.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass; report inherited warnings separately from failures.
- [x] Dev-server `/dashboard/default` smoke and all affected-route smoke checks pass without console errors; verify the same routes on the Workers version preview and retain diagnostics. Do not waive inherited errors on a route this task owns.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (NNN is the actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy` or merge as implementer.
- [x] Update root README.md for the verified behavior/screens/usage/status delivered by this task; PR body states `README: updated (sections …)`. Update task acceptance and `dev/milestones.json` only from verification.
- [x] Preserve keyboard access, accessible names, visible focus and reduced motion. Verify all four presets in light/dark on affected content; record contrast evidence for changed chart/status/token pairings. Inspect existing Base UI wrappers; keep `src/components/ui/`, `src/components/calendar/`, shell/preferences and out-of-scope app pages intact.
- [x] Audit mock data, greeting copy, names, handles, emails and author-linked demo references in every owned route; replace `Arham Khan`/`Arham`/`arhamkhnz` identity references with neutral demo names and safe example addresses, preserving related fixture consistency. Record a scoped search even if no matches exist; leave out-of-scope pages and legal attribution unchanged.

## Execution order

Depends on 001; execute after 005 to reuse shared metrics and trend styling. Unify the personal work overview and clear its required hydration gate.

One task per PR targeting main; declare any stack and layer compare URL. Claude Opus 5.5 reviews and holds delegated squash-merge authority. Implementation starts only when approved; this breakdown does not start it.

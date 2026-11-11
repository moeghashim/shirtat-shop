---
id: "008"
title: Restyle Academy
milestone: v0.2-dashboards
status: in_review
category: ui
files: ["src/routes/(main)/dashboard/academy/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/academy`.

- Restyle Academy header/actions, KPI cards, class schedule, assignment status, performance highlights and upcoming events.
- Use semantic schedule/assignment statuses and shared chart styling; preserve event dates, existing actions and content. This does not authorize changes to the Calendar app page.

## Before implementation

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once from the repo root per session, inspect incumbent renders/local components, and read `reference/craft-floor.md` immediately before UI edits.

Prefactor inspection: Inspect schedule/status rows and chart labels for local display helpers; avoid abstracting calendar/domain behavior into shared dashboard primitives.

## Acceptance criteria

- [x] Schedule times, assignment categories and performance labels stay legible with long course names at mobile width; status is communicated by text as well as color.
- [x] Audit current-date generation in class-schedule.tsx/upcoming-events.tsx for stable first rendering, and preserve the existing schedule/event behavior.
- [x] Capture and inspect before/after screenshots with `npm run screenshots` for every affected route in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table for each route. Store PNGs, reports and logs only on `pr-assets` or PR attachments, never main. Include meaningful interactive states beyond the initial capture.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass; report inherited warnings separately from failures.
- [x] Dev-server `/dashboard/default` smoke and all affected-route smoke checks pass without console errors; verify the same routes on the Workers version preview and retain diagnostics. Do not waive inherited errors on a route this task owns.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (NNN is the actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy` or merge as implementer.
- [x] Update root README.md for the verified behavior/screens/usage/status delivered by this task; PR body states `README: updated (sections …)`. Update task acceptance and `dev/milestones.json` only from verification.
- [x] Preserve keyboard access, accessible names, visible focus and reduced motion. Verify all four presets in light/dark on affected content; record contrast evidence for changed chart/status/token pairings. Inspect existing Base UI wrappers; keep `src/components/ui/`, `src/components/calendar/`, shell/preferences and out-of-scope app pages intact.
- [x] Audit mock data, greeting copy, names, handles, emails and author-linked demo references in every owned route; replace `Arham Khan`/`Arham`/`arhamkhnz` identity references with neutral demo names and safe example addresses, preserving related fixture consistency. Record a scoped search even if no matches exist; leave out-of-scope pages and legal attribution unchanged.

## Execution order

Depends on 001; execute after 007 to reuse validated KPI and semantic status treatments. Adapt shared primitives to schedules, assignments and learning performance.

One task per PR targeting main; declare any stack and layer compare URL. Claude Opus 5.5 reviews and holds delegated squash-merge authority. Implementation starts only when approved; this breakdown does not start it.

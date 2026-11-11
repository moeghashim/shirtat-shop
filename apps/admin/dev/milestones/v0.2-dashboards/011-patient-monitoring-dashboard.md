---
id: "011"
title: Restyle Patient Monitoring and fix hydration
milestone: v0.2-dashboards
status: in_review
category: ui
files: ["src/routes/(main)/dashboard/patient-monitoring/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/patient-monitoring`.

- Restyle monitoring header/status, patient grid/cards, patient detail/trends, vital waveforms and footer controls while retaining all simulated values, units and existing alarm/state labels.
- Fix the confirmed render-time new Date() clock mismatch in patient-monitoring/route.tsx (recorded in dev/open-questions.md); inspect realtime hooks for matching initial server/client output.
- Use shared chart tokens, typography and grid conventions while preserving signal identity and meaningful severity distinctions; keep waveform generation/ticks local. This is a demo, not a change to clinical calculations or alert semantics.

## Before implementation

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once from the repo root per session, inspect incumbent renders/local components, and read `reference/craft-floor.md` immediately before UI edits.

Prefactor inspection: Inspect clock formatting, use-realtime-tick/use-patient-vital-series and chart-grid for a narrow stable-initial-state seam; do not centralize patient simulation into the shared chart theme.

## Acceptance criteria

- [x] Patient Monitoring (`/dashboard/patient-monitoring`): no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile.
- [x] Direct navigation/refresh and delayed hydration across a second boundary show stable initial clock/vitals without suppressing warnings, disabling page SSR or freezing the validation clock.
- [x] Patient selection/detail navigation and footer controls remain accessible; units, values and status text do not truncate in mobile layouts.
- [x] Reduced motion handles continuous waveform/tick behavior, not only Recharts entrance animation; preserve access to current numeric readings and verify normal-motion updates separately.
- [x] Capture and inspect before/after screenshots with `npm run screenshots` for every affected route in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table for each route. Store PNGs, reports and logs only on `pr-assets` or PR attachments, never main. Include meaningful interactive states beyond the initial capture.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass; report inherited warnings separately from failures.
- [x] Dev-server `/dashboard/default` smoke and all affected-route smoke checks pass without console errors; verify the same routes on the Workers version preview and retain diagnostics. Do not waive inherited errors on a route this task owns.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (NNN is the actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy` or merge as implementer.
- [x] Update root README.md for the verified behavior/screens/usage/status delivered by this task; PR body states `README: updated (sections …)`. Update task acceptance and `dev/milestones.json` only from verification.
- [x] Preserve keyboard access, accessible names, visible focus and reduced motion. Verify all four presets in light/dark on affected content; record contrast evidence for changed chart/status/token pairings. Inspect existing Base UI wrappers; keep `src/components/ui/`, `src/components/calendar/`, shell/preferences and out-of-scope app pages intact.
- [x] Audit mock data, greeting copy, names, handles, emails and author-linked demo references in every owned route; replace `Arham Khan`/`Arham`/`arhamkhnz` identity references with neutral demo names and safe example addresses, preserving related fixture consistency. Record a scoped search even if no matches exist; leave out-of-scope pages and legal attribution unchanged.

## Execution order

Depends on 001; execute after 010 with the common chart/accessibility contract established. Complete the most specialized realtime view with explicit clock and motion verification.

One task per PR targeting main; declare any stack and layer compare URL. Claude Opus 5.5 reviews and holds delegated squash-merge authority. Implementation starts only when approved; this breakdown does not start it.

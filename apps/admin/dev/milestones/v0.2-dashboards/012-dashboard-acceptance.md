---
id: "012"
title: Verify v0.2 dashboard acceptance
milestone: v0.2-dashboards
status: in_review
category: tooling
files: ["CHANGELOG.md", "DESIGN.md", "dev/open-questions.md", "dev/milestones/v0.2-dashboards/README.md", "README.md", "dev/milestones.json"]
---

## Scope

Routes: All 14 routes in the milestone README matrix.

- Audit the integrated 14-route dashboard matrix against PLAN §7, DESIGN.md and this milestone DoD. Correct only scoped v0.2 regressions; do not start v0.3 app-page work.
- Add a CHANGELOG.md v0.2 entry for verified changes and retained limitations. Update README screens/status and DESIGN.md only to reflect the implemented dashboard/chart contract.
- Reconcile the four dashboard hydration resolutions in dev/open-questions.md with linked evidence; leave Calendar, Invoice and Auth V2 fixes explicitly assigned to v0.3. Update dev/milestones.json and this README from verified acceptance/review state.

## Before implementation

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once from the repo root per session, inspect incumbent renders/local components, and read `reference/craft-floor.md` immediately before UI edits.

Prefactor inspection: Inspect integration failures before editing; favor narrow usage-site fixes and reopen the owning task for larger issues. This is acceptance, not a new redesign or test-platform project.

## Acceptance criteria

- [x] All 14 routes in the milestone route matrix pass direct dev and Workers preview navigation in light/dark × desktop/mobile (56 cases per environment), with no console/page errors, failed captures, removed routes or hidden failures.
- [x] Finance, Finance V1, Productivity and Patient Monitoring each satisfy: no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile. The v0.1 waiver does not apply to v0.2 completion.
- [x] Run the full 14-route screenshot matrix for Default, Graphite, Pine and Iris on dev and Workers preview (224 cases per environment); inspect all default-preset renders and spot-check every distinct chart/status treatment in the other presets.
- [x] Run contrast/a11y spot checks across all four presets and both themes: supported text pairs >=4.5:1, control/focus/meaningful graphic boundaries >=3:1 where applicable; verify chart labels/markers, keyboard tabs/menus/tables, visible focus, accessible names, tooltip/legend access and reduced motion. Record actual checks and measured pairs, not an unsupported blanket accessibility claim.
- [x] Search all in-scope dashboard fixtures/rendered demo identities for Arham Khan, Arham and arhamkhnz references; none remain. Upstream copyright, LICENSE and README provenance remain intact.
- [x] CHANGELOG.md contains a v0.2 entry; README.md lists all current and legacy dashboard screens and accurate milestone status; acceptance checkboxes and dev/milestones.json reflect evidence. Mark merged/done only after the authorized review/merge, never in advance.
- [x] Capture and inspect before/after screenshots with `npm run screenshots` for every affected route in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table for each route. Store PNGs, reports and logs only on `pr-assets` or PR attachments, never main. Include meaningful interactive states beyond the initial capture.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass; report inherited warnings separately from failures.
- [x] Dev-server `/dashboard/default` smoke and all affected-route smoke checks pass without console errors; verify the same routes on the Workers version preview and retain diagnostics. Do not waive inherited errors on a route this task owns.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (NNN is the actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy` or merge as implementer.
- [x] Update root README.md for the verified behavior/screens/usage/status delivered by this task; PR body states `README: updated (sections …)`. Update task acceptance and `dev/milestones.json` only from verification.
- [x] Preserve keyboard access, accessible names, visible focus and reduced motion. Verify all four presets in light/dark on affected content; record contrast evidence for changed chart/status/token pairings. Inspect existing Base UI wrappers; keep `src/components/ui/`, `src/components/calendar/`, shell/preferences and out-of-scope app pages intact.

## Execution order

Depends on all tasks 001–011. Close the milestone only after every dashboard and integration gate is verified.

One task per PR targeting main; declare any stack and layer compare URL. Claude Opus 5.5 reviews and holds delegated squash-merge authority. Implementation starts only when approved; this breakdown does not start it.

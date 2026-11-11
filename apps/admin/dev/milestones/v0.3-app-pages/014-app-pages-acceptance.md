---
id: "014"
title: Verify complete v0.3 app and route acceptance
milestone: v0.3-app-pages
status: review
category: qa
files: ["README.md", "CHANGELOG.md", "dev/milestones/v0.3-app-pages/", "dev/milestones.json", "dev/open-questions.md", "scripts/ (only narrow QA support if needed)"]
---

## Scope

Routes: Every route in the app: the 38 current catalog entries, all query/tab variants below, root not-found and root error. Reconcile against generated route metadata at execution time.

- Run the full retained-route matrix on dev and a version-specific Workers preview for Default, Graphite, Pine and Iris × light/dark × desktop/mobile. Include all 14 current/legacy dashboards and every app page/alias, layout and entry redirect. The current catalog has 38 entries: 608 cases per environment (1,216 total), before supplemental boundary/variant/interaction tests; regenerate the expected count if routes change.
- Reconcile planned ownership against `src/routes/`, `src/routeTree.gen.ts` and `src/navigation/route-catalog.ts`; never hand-edit generated routes. Require zero missing or silently skipped cases. Preserve failures and exact rerun evidence, never only a passing summary.
- Check query/tab/overlay/print states from every task and supplement root not-found plus controlled RootError captures on both environments. Regress shell navigation, palette, settings, preference persistence and reduced motion without redesigning them.
- Add CHANGELOG v0.3 notes and update README screens, commands where changed, hydration status and milestone status. Reconcile `dev/open-questions.md`: every inherited hydration entry must link a verified resolution, including prior v0.2 resolutions, without deleting history.
- Audit the entire src tree for author references, not just page directories. Residual cleanup belongs to its owning page task; reopen/return that task rather than hiding omissions with a broad acceptance refactor. No package version bump, tag, release, merge or production deployment by the implementer.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Review coverage/report gaps before adding helpers. Only narrow QA seams are allowed here; route-specific visual/behavioral fixes return to their owning task. No implementation prefactor is needed merely to update acceptance docs.

## Acceptance criteria

- [x] All 38 current catalog entries pass on dev and Workers across four presets × light/dark × desktop/mobile, with coverage manifest, exact counts and no unexplained skips or unexpected console/page errors. All 14 dashboards remain covered.
- [x] Calendar, Invoice, Auth V2 login and Auth V2 register each have no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile; root-cause fixes verified with real clocks, refresh/delay/timezone evidence. No suppressHydrationWarning, no SSR disabling, no frozen clocks are used as fixes.
- [x] Whole-tree command `rg -n -i "arham|arhamkhnz" src` produces no matches (expected exit 1, not a scan failure); retain command/output evidence. This intentionally catches Arham Khan, arhamKhan, taskOwners.arham, emails and bio references. LICENSE, README and docs attribution stay intact.
- [x] Root not-found and controlled root-error/recovery pass supplemental dev/Workers cases with expected injected diagnostics isolated. Exercise Mail/Chat iframe contents; File Manager grid/list, Kanban board/list/table, Profile six tabs, Roles tabs, four auth forms, Invoice print and existing form/table/overlay states.
- [x] Document keyboard/name/focus/heading, mobile overflow, form errors, table scrolling, iframe/drawer/sheet focus and reduced-motion spot checks. Run supported-token contrast checks for all presets/themes and measure changed status/event/chart/selection pairs on actual surfaces; report scope honestly, not a complete accessibility certification.
- [x] CHANGELOG v0.3 entry, README screens/status/hydration information, milestone README/task boxes and milestones.json reflect evidence and actual review state. Every hydration open-question entry is reconciled as resolved; any independent blocker remains explicit.
- [ ] Claude reviews each task and owns squash-merge, stack rebases, production redeploy and milestone release. Record in-review until authorized merges occur; do not mark this milestone done prematurely.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

Hard dependency: 001–013 verified. Close coverage and documentation only after every owned page and hydration gate passes.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

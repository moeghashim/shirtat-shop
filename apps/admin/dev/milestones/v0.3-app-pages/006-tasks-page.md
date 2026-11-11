---
id: "006"
title: Restyle Tasks and its filtering workflow
milestone: v0.3-app-pages
status: merged
category: ui
files: ["src/routes/(main)/dashboard/tasks/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/tasks`.

- Apply the page-header contract to Tasks, restyle the toolbar, status/priority filters, row selection, table, column visibility controls and pagination. Keep current task fixtures and local table state.
- Make statuses/priorities legible with labels plus semantic colors. Review zero-result/clear-filter states, long titles, selected count, first/last page and page-size choices.
- Audit and replace any upstream-author fixtures in owned files, including names, handles and emails; no matches were found here in the planning scan.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect `tasks.tsx`, columns, toolbar, status/priority filters and existing pagination helpers. Reuse them; extract presentation helpers only if demonstrated repetition makes the change safer.

## Acceptance criteria

- [x] Search, combined status/priority filters, sorting, selection, column visibility, pagination and page-size changes preserve their current results and state behavior.
- [x] No-result state and clear filters remain useful; long rows reflow or scroll locally without losing fields, labels, controls or selected-count feedback.
- [x] Page heading and toolbar use the established density and hierarchy; all owned identity fixtures pass the source audit.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 005 by default (hard dependency 001). Carry status and density conventions into the table workflow without coupling the two data models.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

## Verification — batch A

Shared PageHeader, compact wrapping rows, semantic labelled states and mobile column visibility are verified. Existing status/priority registries now own presentation classes (small prefactor); local table state/data remain intact. Corrected inherited Base UI onSelect usage for sorting/clear and label grouping; kept placeholder row actions. No owned author matches found.

All four presets pass keyboard filter/search/selection/visibility/pagination scenarios. Verified TASK-7839 for combined search/Todo/High, page selection counts, known Asc/Desc first IDs, reset and both clear actions. Empty-state recovery stays within the mobile viewport. Dev smoke and Workers final direct/refresh pass all four states, including default-route smoke. Build/check/typecheck and 280 semantic contrast pairs pass. Evidence: pr-assets/v03-006; version https://87905fb3-tenboards.mohanadgh.workers.dev; alias v03-006 per batch brief. README Tasks section updated; no dependencies, token or protected-wrapper edits.

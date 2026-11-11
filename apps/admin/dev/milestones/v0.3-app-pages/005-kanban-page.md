---
id: "005"
title: Restyle Kanban board, list and table
milestone: v0.3-app-pages
status: merged
category: ui
files: ["src/routes/(main)/dashboard/kanban/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/kanban` including `?view=board`, `?view=list`, `?view=table`.

- Restyle the shared toolbar, columns, task cards, owner avatars, priority/status labels, drag overlay, list and table presentations. Keep query-selected views and all local board/column/table ordering behavior.
- Preserve drag-and-drop, cancellation rollback and existing table edits; do not rebuild the drag engine or implement placeholder search/filter/create services. Use semantic colors with textual priority/status cues.
- Replace `taskOwners.arham`, its fixture key and every reference with a neutral owner identity consistently across all three views. Keep other record IDs stable where possible.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect the existing typed drag guards, move/cancel handlers, task-status/task-priority modules and all three view adapters. Reuse their existing seams; no generic work-management model.

## Acceptance criteria

- [x] All three query-addressable views render and refresh correctly. Exercise task/column moves, cancellation, table ordering and existing status changes with keyboard/pointer paths supported by the current engine.
- [x] Long cards, crowded and empty columns, drag overlays and horizontal board scrolling fit mobile without whole-document overflow; controls keep visible focus and accessible names.
- [x] Neutral owner key/name/initials replace every author reference in the board, list, table and overlay.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 004 by default (hard dependency 001 only). Settle multi-view task/status presentation before the simpler Tasks ledger.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

## Verification — batch A

All three query views pass direct/refresh on dev and Workers. Keyboard task/column/list/table ordering, Escape rollback, desktop pointer movement and status edits pass; moving QA tasks to Shipped verifies the empty column. All four presets pass light/dark desktop/mobile interaction captures after correcting evidence-tool drag timing (active overlay screenshots preserve animations/viewport; column drop waits for target announcement). Existing drag/move/rollback handlers remain unchanged. Neutral Jordan Lee key/name/initials source audit passes.

Build/check/typecheck and 280 existing semantic token contrast pairs pass. A Workers table refresh logged two HTTP 502 responses; complete retry passes 8/8. No dependency/protected-wrapper/token edits. Prefactor inspection reused typed drag guards and priority/status modules; no generic model extraction needed. README Kanban/query capture sections updated. Evidence: pr-assets/v03-005; version https://ca3f6e06-tenboards.mohanadgh.workers.dev; alias v03-005 per batch brief.

---
id: "009"
title: Restyle Products and product editors
milestone: v0.3-app-pages
status: review
category: ui
files: ["src/routes/(main)/dashboard/products/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/products`.

- Restyle the catalog table, filter toolbar, status/stock/price fields, add drawer, edit form and image field using the established header/density system. Preserve existing local add/edit/duplicate behavior and validation, not a real CRUD backend.
- Keep record IDs, filter semantics and pagination behavior. Cover image previews, missing images, long product names/SKUs, stock/price boundaries and draft/active states.
- Audit all owned fixtures for upstream-author identity, replacing any matches with neutral demo data; none found here in the planning scan.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect current callback/column seams, shared ProductForm, add drawer and image field. Keep state in its owning route; do not generalize a cross-page CRUD abstraction.

## Acceptance criteria

- [x] Search, status/category filters, clear filters, selection and pagination work; exercise add/edit validation and duplication-to-draft with unchanged local semantics.
- [x] Drawer/form opening, Escape, focus trapping/return, errors and image controls are keyboard accessible; mobile form actions and table content are reachable.
- [x] Product labels, stock/status signals and prices use semantic tokens/tabular numerals with measured contrast, and the owned fixture audit is clean.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 008 by default (hard dependency 001). Apply the established inventory/table language to the more interactive catalog editors.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

---
id: "010"
title: Restyle Users and Roles
milestone: v0.3-app-pages
status: review
category: ui
files: ["src/routes/(main)/dashboard/users/", "src/routes/(main)/dashboard/roles/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/users` and `/dashboard/roles`.

- Restyle the directory and role tables, page/card headings, filter controls, selection summaries, row actions, roles tabs and placeholder permission-set/access-review panels as one tightly related admin group.
- Preserve role/team/status/workspace/owner/type filter behavior, selection and pagination. Display permissions as demo information; do not implement RBAC, authorization, invitations or backend mutations.
- Audit names, owners, emails, avatars and row action details for upstream-author identity; replace any matches neutrally, while retaining existing record relationships.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect the two table/column implementations, owner/group filters and existing shared data-table features. Share only genuinely repeated presentation; keep schemas, filters and domain behavior local.

## Acceptance criteria

- [x] Users filters/search/selection/pagination and Roles search/type/owner/status filters retain exact result behavior; empty and selected states remain clear.
- [x] Roles, Permission Sets and Access Reviews tabs preserve their implemented/placeholder distinction; no new permission or auth behavior.
- [x] All rows and actions remain accessible on mobile; keyboard menus, tabs and filter labels work, and all owned identity fixtures pass the audit.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 009 by default (hard dependency 001). Apply proven table/form conventions to the related identity and permission-demo screens together.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

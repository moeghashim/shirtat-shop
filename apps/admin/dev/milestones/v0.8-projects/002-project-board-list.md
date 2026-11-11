---
id: "002"
title: Project shell and re-scoped Board/List views
milestone: v0.8-projects
status: in-review
category: ui
files: ["src/routes/(main)/dashboard/projects/", "src/routes/(main)/dashboard/kanban/", "src/routes/(main)/dashboard/tasks/", "src/navigation/route-catalog.ts", "src/server/data/", "scripts/", "README.md", "dev/milestones.json"]
---

## Goal and scope

Add working project Board and List routes that share canonical tasks. Reuse current Kanban cards/columns and Tasks table/filter/pagination. Leave old standalone app URLs working until 005; do not expose unfinished view links.

Follow the [milestone contract](README.md), PLAN Decisions and AGENTS. All acceptance below is pending implementation.

## Files and ownership

- `src/routes/(main)/dashboard/projects/`
- `src/routes/(main)/dashboard/kanban/`
- `src/routes/(main)/dashboard/tasks/`
- `src/navigation/route-catalog.ts`
- `src/server/data/`
- `scripts/`
- `README.md`
- `dev/milestones.json`

Changes stay within the named task. Shared route metadata is generated only by the existing tool; protected UI/calendar wrappers and PLAN stay intact. README/status changes belong to the same PR.

## Before implementation

Inspect Kanban getRouteApi coupling and DnD state, task cards/status helpers, Tasks columns/toolbars and protected wrappers. Separate route/search ownership from presentation before relocation, and add narrow read-only adapters. Keep components in the project route owning -components directory; preserve old compositions through adapters until consolidation.

Run Impeccable context once from the task worktree, inspect incumbent renders and local components, and read reference/craft-floor.md immediately before UI edits. Use Operate mode and the merged v0.6.2 DESIGN scale. Read current official TanStack documentation before route/framework changes.

## Acceptance criteria

- [x] Add /dashboard/projects/$projectId layout plus /board and /list with guarded GET loaders; project validation returns authorized not-found for missing IDs. All server functions use requireSession and validated project input.
- [x] Reuse existing presentation through small adapters with canonical statuses, IDs, assignees, labels, due dates, subtasks and comment counts. Board and List show the same scoped dataset and consistent counts, including canceled and unassigned tasks.
- [x] Implement project identity/breadcrumb and only links to completed views. No unfinished Overview index redirect or dead tab. Static route inventory gains concrete default-project capture paths and secondary/empty/missing supplemental checks; generate routeTree, never hand-edit it.
- [x] Search/status/assignee/priority/label filters, stable sorting and bounded pagination/continuation work without mutating source records. Scope local state by project so navigation cannot retain another project's tasks.
- [x] Remove DnD, completion checkboxes, Add/Edit/Delete and inert mutation controls from project views; read-only task detail disclosure is named, keyboard reachable and returns focus. Keep old URL behavior until 005.
- [x] Board scrolls locally or stacks/filter-narrows on mobile with all tasks reachable; List preserves labeled fields and readable rows. Empty/loading/error/long-title/many-label cases are usable and do not cause page overflow.
- [x] Use merged compact tokens, semantic status text, visible focus and reduced motion; preserve protected UI/calendar wrappers, preferences and SSR. No new dependency.
- [x] Capture before/after existing Kanban/Tasks plus new destinations and default shell in light/dark desktop/mobile, inspect renders and record no hydration/console errors. New-route before evidence is labeled shell/404, not a fabricated earlier design.
- [x] README states these project views are available directly while consolidation/navigation remains pending; status and evidence match this layer.

## Tests

Run common build/check/typecheck/default smoke and npm run screenshots for old Kanban/Tasks, new concrete Board/List paths and shell in four states. Add project switching, filter/page boundaries, keyboard details/focus, bounded large data and direct denied RPC tests. Verify demo/DB IDs and totals agree. Publish isolated demo preview/evidence.

Every task passes `npm run build`, `npm run check`, `npm run typecheck` and dev `/dashboard/default` smoke without console errors. Attach a demo-only immutable preview and alias; use only `npm run preview:deploy -- --preview-alias pr-NNN`. Evidence stays on pr-assets/PR attachments. Report inherited warnings separately.

## Dependencies and handoff

Depends on merged 001 and v0.6.2. Blocks 003. Hand off reusable project shell/task presentation and guarded loaders. The old app routes are temporary compatibility consumers, not duplicate new data domains.

One approved task per branch/PR; declare any stack and layer compare URL. Conventional commit with DCO sign-off and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Claude reviews and alone merges.

Round 2 verification: [evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v08-002-round2). Build/check/typecheck, 448 Node auth scenarios, 29 reads / 208 Node/Worker parity scenarios, Worker auth/security, Node/Worker project access, project/migration checks and 96 redirects pass. Four-state dev and immutable-preview captures plus filters, debounced search, dialog focus and paging checks pass. Preview: https://2198d241-tenboards-preview.mohanadgh.workers.dev (alias pr-69). Remains in review.


### Round 4 integration — 2026-10-25

Replayed on the v0.7-integrated foundation. Board now reads all matching tasks (117 Operations tasks) through bounded, independently guarded server reads; List retains pagination. Default search values are omitted from canonical links, and absent subtasks display an em dash. Shared progress presentation states done/eligible counts and canceled exclusions. Four-state keyboard/filter/pagination/detail checks, Node RPC scope/denial/revocation and default-route smoke pass; build/check/typecheck pass with inherited diagnostics only. The final stack report supplies current before/after evidence. Status remains in review.

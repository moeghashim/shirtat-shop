---
id: "004"
title: Connect Kanban, Tasks, Calendar and File Manager
milestone: v0.4-data-layer
status: review
category: data
files: ["src/routes/(main)/dashboard/kanban/", "src/routes/(main)/dashboard/tasks/", "src/routes/(main)/dashboard/calendar/", "src/routes/(main)/dashboard/file-manager/", "src/server/data/kanban.ts", "src/server/data/tasks.ts", "src/server/data/calendar.ts", "src/server/data/files.ts", "src/server/db/", "scripts/data-parity.ts", "README.md", "dev/milestones.json"]
---

## Goal and scope

Load all four workspace pages through normalized records and typed reads while preserving their local views, gestures, state and date semantics.

## Files and ownership

- `src/routes/(main)/dashboard/kanban/`
- `src/routes/(main)/dashboard/tasks/`
- `src/routes/(main)/dashboard/calendar/`
- `src/routes/(main)/dashboard/file-manager/`
- `src/server/data/kanban.ts`
- `src/server/data/tasks.ts`
- `src/server/data/calendar.ts`
- `src/server/data/files.ts`
- `src/server/db/`
- `scripts/data-parity.ts`
- `README.md`
- `dev/milestones.json`

The [ownership matrix](README.md#fixture-and-route-ownership-matrix) defines exact existing fixtures, inline values and route boundaries. Shared database, migration, seed and parity paths contain only this task's additions; do not rewrite prior task migrations. README/status updates accompany verified work.

## Before implementation

Prefactor inspection: Separate Kanban column/owner records from tag/icon styling and its utility imports; separate Tasks schema/filter presentation from task rows. Calendar needs a typed event-template/read boundary so the existing local-time transition never imports fixtures. Keep protected calendar adapters intact.

## Acceptance criteria

- [x] Normalize Kanban columns, ordered tasks, owners/tags/insights, Tasks ledger rows, Calendar event definitions and File Manager files/folders/owners/shares. Kanban, Tasks and later Productivity tasks stay distinct fixture collections unless an actual relationship exists; do not silently combine them.
- [x] Add kanban.ts, tasks.ts, calendar.ts and files.ts reads with demo/db implementations, migrations, seed contributors and exhaustive registry/parity cases. Preserve stable board/list/table ordering, IDs, optional fields, labels, and initial selection/filter results.
- [x] Replace direct fixture imports in routes, components and state initializers with server-function loader results; move icon/class mappings and pure types to UI-safe modules where necessary.
- [x] Model Calendar month-relative day/time/all-day/end/group/display definitions as typed columns and reconstruct from one serialized request reference. Preserve UTC initial SSR and post-hydration browser-local civil-time/month behavior, including birthday and multi-day/background events. A source-independent transformation of loaded definitions may run client-side; it must not consult fixtures or fetch separately during hydration.
- [x] Retain real Today/now marker and month/week/day navigation; parity covers same reference across month/year boundaries, leap years and opposite browser/server zones. No frozen application clock, suppressHydrationWarning, SSR disabling or protected src/components/calendar/ edits.
- [x] Kanban drag/reorder/status changes, Tasks search/filter/selection, File Manager view-local stars and all placeholder actions remain as-is and do not write to Postgres. Loaded records are copied into local state without mutating a shared fixture object or leaking state across SSR requests.

## Tests

- Migrate/seed Postgres and run data:parity for every workspace read and prior domains, including empty boards/lists, missing records, stable ordering and all Calendar reference/timezone cases.
- Run existing Kanban, Tasks, Calendar and File Manager interaction captures in demo and DB: board/list/table drag/cancel, filters/pagination, month/week/day/Today/popovers and grid/list/stars.
- Capture all four owned routes in four states. Run Calendar delayed direct/refresh hydration on dev demo/DB and Workers demo in America/Chicago and Pacific/Kiritimati; prove the real clock advances.

## Execution order

Hard dependency: 001. Default merge order: after 003.

## Common gates and delivery

- [x] All [milestone test-floor gates](README.md#test-floor-and-evidence) pass for this task: build/check/typecheck; zero-env demo and actual Docker Postgres reads; parity for owned reads; dev `/dashboard/default` plus owned-route smoke; Workers demo version preview.
- [x] Capture and inspect incumbent → demo after → seeded DB for owned routes in light/dark × desktop (1440×900)/mobile (390×844), including listed variants. Attach four-state comparisons; no visual change is expected. Keep evidence on `pr-assets` or PR attachments, never main.
- [x] README reflects verified commands/behavior/status and the PR states `README: updated (sections …)` or `README: no change needed (reason)`. Update task acceptance and `dev/milestones.json` only from evidence; leave in review until merged.

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), inspect affected code before implementation, and read current official TanStack docs before framework/loader changes. UI edits use global Impeccable in Operate mode, context once per session, incumbent inspection and craft floor immediately before edits. Preserve keyboard access, names, focus, reduced motion and all four presets. No token/preset edits are planned; if approved, record actual contrast evidence. Keep `src/components/ui/`, `src/components/calendar/`, generated route/Worker files, font/preferences registries and PLAN.md intact.

One approved task per branch `feat/v0.4/NNN-slug` and PR targeting main. Prefer merged predecessors; declare any stack/base PR/merge order/layer compare URL. Use Conventional Commits, `git commit -s` (`Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>`) and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Include version-specific preview and alias via `npm run preview:deploy -- --preview-alias pr-NNN`; never `npm run deploy`. Claude Opus 5.5 reviews and holds merge/rebase/redeploy/release authority; GPT-6-Astra never merges. Escalate conflicts, missing access/assets, any other new runtime dependency or scope/auth/destructive change in `dev/open-questions.md`, pause dependent work and finish independent work. This breakdown does not start implementation.

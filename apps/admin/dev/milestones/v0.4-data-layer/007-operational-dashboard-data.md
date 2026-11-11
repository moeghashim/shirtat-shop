---
id: "007"
title: Connect Productivity, Academy, Logistics, Infrastructure and Patient Monitoring
milestone: v0.4-data-layer
status: review
category: data
files: ["src/routes/(main)/dashboard/productivity/", "src/routes/(main)/dashboard/academy/", "src/routes/(main)/dashboard/logistics/", "src/routes/(main)/dashboard/infrastructure/", "src/routes/(main)/dashboard/patient-monitoring/", "src/server/data/productivity.ts", "src/server/data/academy.ts", "src/server/data/logistics.ts", "src/server/data/infrastructure.ts", "src/server/data/patients.ts", "src/server/db/", "scripts/data-parity.ts", "README.md", "dev/milestones.json"]
---

## Goal and scope

Connect the remaining five dashboards, including inline schedule rows, projects/notes, shipment detail, environment resources and patient metadata. Preserve the explicit client-signal exception for simulated monitoring waveforms.

## Files and ownership

- `src/routes/(main)/dashboard/productivity/`
- `src/routes/(main)/dashboard/academy/`
- `src/routes/(main)/dashboard/logistics/`
- `src/routes/(main)/dashboard/infrastructure/`
- `src/routes/(main)/dashboard/patient-monitoring/`
- `src/server/data/productivity.ts`
- `src/server/data/academy.ts`
- `src/server/data/logistics.ts`
- `src/server/data/infrastructure.ts`
- `src/server/data/patients.ts`
- `src/server/db/`
- `scripts/data-parity.ts`
- `README.md`
- `dev/milestones.json`

The [ownership matrix](README.md#fixture-and-route-ownership-matrix) defines exact existing fixtures, inline values and route boundaries. Shared database, migration, seed and parity paths contain only this task's additions; do not rewrite prior task migrations. README/status updates accompany verified work.

## Before implementation

Prefactor inspection: Extract Academy schedule JSX into plain seed records and Productivity inline summaries into data props without layout changes. Logistics selection currently reads an imported list; inject loaded shipments. Patient Monitoring already takes patient props: preserve its signal hook boundary.

## Acceptance criteria

- [x] Normalize Productivity projects/tasks/notes/goals/focus/quote data; Academy classes/rooms/schedule/events/performance; Logistics customer/contact/shipment/package/tracking/location rows; Infrastructure projects/groups/environments/resources; Patient identities/beds/clinical metadata/baseline vitals/alarm records. Retain natural relationships and exact order; do not merge unrelated workspace fixtures.
- [x] Implement productivity.ts, academy.ts, logistics.ts, infrastructure.ts and patients.ts reads with demo/db implementations, migrations, seeds and registry/parity cases. Move every business literal/KPI/summary into entity fields or typed metric points, including Infrastructure header totals and Academy schedule JSX.
- [x] Retain Productivity civil-date labels and calendar behavior with serialized UTC/civil-date contracts; no server-local date reconstruction drift. Source data travels through server-function route loaders and typed props, including Logistics initial selection.
- [x] Keep waveform-data.ts templates, realtime-utils.ts, use-patient-vital-series.ts and use-realtime-tick.ts as client simulation, not database time-series storage. Only simulated waveforms/trends/live clocks are exempt; all persistent patient records and baseline inputs go through patients.ts. Audit and document the exact exception without allowing ordinary chart data to bypass the layer.
- [x] Preserve real monitoring clock/ticks, stable SSR initial snapshots, alarm acknowledgement/local selection, reduced-motion behavior and patient trend/detail panels. No real medical feed, realtime backend, CRUD or alert delivery.
- [x] Preserve shipment map geometry/remote world-atlas presentation asset, details/mobile sheet, Infrastructure empty groups/tabs, Productivity interactions and Academy schedule content. Screens remain visually unchanged.

## Tests

- Run migrations, repeat seed and data:parity for every operational read; verify nested order/relations, empty groups, missing IDs, numeric values and patient baselines.
- Compare all five routes before → demo → DB in four states and their meaningful variants. Use the same QA request reference and simulated tick/animation phase for captures; separately prove production live clocks still advance. Document any narrow live-clock masks, never mask business data.
- Run Productivity and Patient Monitoring delayed hydration/timezone checks in demo/DB and Workers demo, and existing reduced-motion/alarm/selection, shipment detail/map/mobile and environment expansion checks.

## Execution order

Hard dependency: 001. Default merge order: after 006; all schema/seed/registry changes are applied in migration order.

## Common gates and delivery

- [x] All [milestone test-floor gates](README.md#test-floor-and-evidence) pass for this task: build/check/typecheck; zero-env demo and actual Docker Postgres reads; parity for owned reads; dev `/dashboard/default` plus owned-route smoke; Workers demo version preview.
- [x] Capture and inspect incumbent → demo after → seeded DB for owned routes in light/dark × desktop (1440×900)/mobile (390×844), including listed variants. Attach four-state comparisons; no visual change is expected. Keep evidence on `pr-assets` or PR attachments, never main.
- [x] README reflects verified commands/behavior/status and the PR states `README: updated (sections …)` or `README: no change needed (reason)`. Update task acceptance and `dev/milestones.json` only from evidence; leave in review until merged.

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), inspect affected code before implementation, and read current official TanStack docs before framework/loader changes. UI edits use global Impeccable in Operate mode, context once per session, incumbent inspection and craft floor immediately before edits. Preserve keyboard access, names, focus, reduced motion and all four presets. No token/preset edits are planned; if approved, record actual contrast evidence. Keep `src/components/ui/`, `src/components/calendar/`, generated route/Worker files, font/preferences registries and PLAN.md intact.

One approved task per branch `feat/v0.4/NNN-slug` and PR targeting main. Prefer merged predecessors; declare any stack/base PR/merge order/layer compare URL. Use Conventional Commits, `git commit -s` (`Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>`) and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Include version-specific preview and alias via `npm run preview:deploy -- --preview-alias pr-NNN`; never `npm run deploy`. Claude Opus 5.5 reviews and holds merge/rebase/redeploy/release authority; GPT-6-Astra never merges. Escalate conflicts, missing access/assets, any other new runtime dependency or scope/auth/destructive change in `dev/open-questions.md`, pause dependent work and finish independent work. This breakdown does not start implementation.

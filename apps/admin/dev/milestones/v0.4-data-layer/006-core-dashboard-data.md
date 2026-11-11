---
id: "006"
title: Connect Default, CRM, Finance and Analytics, including V1
milestone: v0.4-data-layer
status: review
category: data
files: ["src/routes/(main)/dashboard/default/", "src/routes/(main)/dashboard/crm/", "src/routes/(main)/dashboard/finance/", "src/routes/(main)/dashboard/analytics/", "src/routes/(main)/dashboard/(legacy)/", "src/routes/(main)/dashboard/-components/finance-demo-dates.ts", "src/server/data/default.ts", "src/server/data/crm.ts", "src/server/data/finance.ts", "src/server/data/analytics.ts", "src/server/db/", "scripts/data-parity.ts", "README.md", "dev/milestones.json"]
---

## Goal and scope

Connect all eight Default/CRM/Finance/Analytics routes (current and V1) without losing their distinct records, KPIs, inline summaries or range-dependent charts.

## Files and ownership

- `src/routes/(main)/dashboard/default/`
- `src/routes/(main)/dashboard/crm/`
- `src/routes/(main)/dashboard/finance/`
- `src/routes/(main)/dashboard/analytics/`
- `src/routes/(main)/dashboard/(legacy)/`
- `src/routes/(main)/dashboard/-components/finance-demo-dates.ts`
- `src/server/data/default.ts`
- `src/server/data/crm.ts`
- `src/server/data/finance.ts`
- `src/server/data/analytics.ts`
- `src/server/db/`
- `scripts/data-parity.ts`
- `README.md`
- `dev/milestones.json`

The [ownership matrix](README.md#fixture-and-route-ownership-matrix) defines exact existing fixtures, inline values and route boundaries. Shared database, migration, seed and parity paths contain only this task's additions; do not rewrite prior task migrations. README/status updates accompany verified work.

## Before implementation

Prefactor inspection: Most chart/KPI fixtures are embedded in components or crm.config.ts. Extract plain fixture values and deterministic data builders before adding prop seams; keep chart config, colors, icons and controls local. Inspect every JSX literal carrying a business value, not just arrays or files named data.

## Acceptance criteria

- [x] Implement default.ts, crm.ts, finance.ts and analytics.ts typed reads with distinct current/V1 result shapes or explicit variant inputs; register every function and supported parameter scenario. Route loaders/server functions supply every business-data consumer; no fixture reads hidden inside chart/card components.
- [x] Normalize Default customers and V1 proposal sections; CRM opportunities/leads/activities/reminders/project and region records; Finance accounts/cards/holdings/contacts/transactions/payments; Analytics page/source/campaign/referrer records and V1 risk ledger/intervention/coverage records. Preserve actual relations and order; avoid inventing a single universal entity or deduplicating unrelated demo records.
- [x] Move aggregate KPI values, deltas, revenue/forecast/quality/traffic/finance series, totals and other inline business summaries into typed metric points or their natural entity fields. Preserve units, precision, series ordering and current/V1 differences; no whole-fixture JSON.
- [x] Explicitly cover legacy analytics buildRevenueChartData and its date-range updates, current CRM request-relative pipeline dates, default/current legacy chart time ranges and all Finance date labels. Initial and changed ranges must use loaded data or a typed read with validated inputs; deterministic chart generation is not exempt as a live waveform. Keep pure data transformations source-independent and based on loaded typed records, with parity cases for initial and non-default ranges.
- [x] Preserve finance-demo-dates UTC statement semantics and all existing hydration fixes. All dates are serialized through loaders and UI reconstruction is explicit; no locale-dependent server/client defaults, module-startup clocks, suppressHydrationWarning or SSR disabling.
- [x] Maintain every table filter/sort/pagination, chart range/control, risk view, account/wallet tab and demo action. No change to chart geometry, formatting, status semantics, shell, tokens, or persistence.

## Tests

- Migrate fresh/incremental local Postgres, seed twice, run data:parity for every core-dashboard function/variant and non-default parameter scenario, preserving exact amounts, series values and ordering.
- Compare all eight URLs before → demo → DB in four states; capture representative table/filter and every data-changing chart/range variant. Empty or missing results must behave safely without fixture fallback.
- Run direct/refresh and delayed hydration on Finance/Finance V1 plus the date-sensitive current/legacy charts in dev demo/DB and Workers demo, including America/Chicago and Pacific/Kiritimati.

## Execution order

Hard dependency: 001. Default merge order: after 005; shared schema/seed/registry edits remain serial. No ownership of E-commerce (003) or operational dashboards (007).

## Common gates and delivery

- [x] All [milestone test-floor gates](README.md#test-floor-and-evidence) pass for this task: build/check/typecheck; zero-env demo and actual Docker Postgres reads; parity for owned reads; dev `/dashboard/default` plus owned-route smoke; Workers demo version preview.
- [x] Capture and inspect incumbent → demo after → seeded DB for owned routes in light/dark × desktop (1440×900)/mobile (390×844), including listed variants. Attach four-state comparisons; no visual change is expected. Keep evidence on `pr-assets` or PR attachments, never main.
- [x] README reflects verified commands/behavior/status and the PR states `README: updated (sections …)` or `README: no change needed (reason)`. Update task acceptance and `dev/milestones.json` only from evidence; leave in review until merged.

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), inspect affected code before implementation, and read current official TanStack docs before framework/loader changes. UI edits use global Impeccable in Operate mode, context once per session, incumbent inspection and craft floor immediately before edits. Preserve keyboard access, names, focus, reduced motion and all four presets. No token/preset edits are planned; if approved, record actual contrast evidence. Keep `src/components/ui/`, `src/components/calendar/`, generated route/Worker files, font/preferences registries and PLAN.md intact.

One approved task per branch `feat/v0.4/NNN-slug` and PR targeting main. Prefer merged predecessors; declare any stack/base PR/merge order/layer compare URL. Use Conventional Commits, `git commit -s` (`Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>`) and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Include version-specific preview and alias via `npm run preview:deploy -- --preview-alias pr-NNN`; never `npm run deploy`. Claude Opus 5.5 reviews and holds merge/rebase/redeploy/release authority; GPT-6-Astra never merges. Escalate conflicts, missing access/assets, any other new runtime dependency or scope/auth/destructive change in `dev/open-questions.md`, pause dependent work and finish independent work. This breakdown does not start implementation.

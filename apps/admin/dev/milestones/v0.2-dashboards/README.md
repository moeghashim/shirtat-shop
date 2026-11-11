# v0.2 — Dashboards

Status: **implementation verified; tasks 007–012 in review**. Tasks 001–006 (PRs #14–#19) are approved, merged and deployed; the remaining stack awaits Claude review/merge. v0.1 is closed. The integration gate passes 224/224 cases on dev and 224/224 on Workers, including 56/56 default-preset cases per environment. Two initial Workers Analytics navigation timeouts passed full four-state retries; original failures remain visible in the coverage report. Evidence: [v02-012](https://github.com/moeghashim/tenboards/tree/pr-assets/v02-012). PLAN.md and its Decisions log remain authoritative.

## Brief and boundaries

Developers evaluating/cloning the starter need coherent, scannable demonstration dashboards with preserved interactions and zero-config mock data. **Operate mode**: use v0.1 Geist typography, tabular metrics, neutral surfaces, one action accent, semantic status colors, crisp borders, restrained depth and compact density. Prioritize clear metric → chart → detail hierarchy. Mobile layouts restructure grids and toolbars and provide intentional table/pane scrolling; do not hide data to fit.

Restyle all ten current dashboards and four legacy variants. Keep each legacy route and its distinct content; pairing its task with the current version does not consolidate routes. Preserve existing empty/disabled/placeholder states, filter results, selection, long labels, signed/zero values, legends and demo realtime behavior. No new CRUD, service integrations or invented production capabilities.

Out of scope (v0.3): Calendar, Chat, Mail, Kanban, Tasks, Invoice, File Manager, Products, Users, Roles, Profile, Auth, Coming Soon and error pages. A calendar widget inside Productivity, orders inside E-commerce or a project label linking to another page does not expand scope to that app page. Keep the v0.1 shell, font/preferences registries, `src/components/ui/` and `src/components/calendar/` intact. Never edit PLAN.md or generated route/Worker files; no new runtime dependencies without escalation.

## Definition of Done

- [x] Shared `src/lib/charts/` theme provides token-driven Recharts colors, axis/grid/tooltip/legend conventions, tabular numerals and SSR-safe reduced motion for Default, Graphite, Pine and Iris in light/dark.
- [x] Shared dashboard KPI/stat card, section header and card-density primitives live at the common route ancestor, with justified cross-dashboard reuse and no changes to protected UI wrappers.
- [x] All 14 routes below are restyled in the established product-UI language, retain their content and interactions, and remain available at their existing URLs.
- [x] Every route has before/after light/dark × desktop/mobile evidence; final default-preset route matrices pass 56/56 on dev and 56/56 on Workers preview. All-preset final matrices pass 224/224 per environment. Evidence stays on `pr-assets` or PR attachments, never main.
- [x] Finance, Finance V1, Productivity and Patient Monitoring each have **no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile**. The v0.1 waiver expires for those routes when their v0.2 tasks are accepted; do not hide errors or disable page SSR.
- [x] Every dashboard's mock-data identities are audited and upstream-author references replaced with neutral demo identities. LICENSE notices, archived provenance and README attribution remain intact.
- [x] Every task passes build/check/typecheck, dev `/dashboard/default` and affected-route smoke without console errors, plus Workers preview smoke; its PR includes version-specific and reusable preview URLs.
- [x] Supported token/graphic pairs have measured contrast evidence; keyboard access, names, visible focus, responsive tables/panes, legends/tooltips and reduced motion pass documented spot checks.
- [x] Each task updates README for verified behavior/screens/status. Final acceptance adds CHANGELOG v0.2, updates README screens/status, reconciles dashboard hydration entries and records accurate milestone status without claiming v0.3 is done.
- [ ] Claude Opus 5.5 reviews every task PR and exercises delegated squash-merge authority only after approval. The implementer never merges or deploys production. All acceptance boxes/statuses are evidence-backed.

## Route and ownership matrix

Route groups do not add URL segments. Paths below are relative to `src/routes/(main)/dashboard/`.

| Task | Route | Owning directory | Locked hydration gate |
| --- | --- | --- | --- |
| 002 | `/dashboard/default` | `default/` | Normal error-free smoke |
| 002 | `/dashboard/default-v1` | `(legacy)/default-v1/` | Normal error-free smoke |
| 003 | `/dashboard/crm` | `crm/` | Normal error-free smoke |
| 003 | `/dashboard/crm-v1` | `(legacy)/crm-v1/` | Normal error-free smoke |
| 004 | `/dashboard/finance` | `finance/` | Required |
| 004 | `/dashboard/finance-v1` | `(legacy)/finance-v1/` | Required |
| 005 | `/dashboard/analytics` | `analytics/` | Normal error-free smoke |
| 005 | `/dashboard/analytics-v1` | `(legacy)/analytics-v1/` | Normal error-free smoke |
| 006 | `/dashboard/productivity` | `productivity/` | Required |
| 007 | `/dashboard/ecommerce` | `ecommerce/` | Normal error-free smoke |
| 008 | `/dashboard/academy` | `academy/` | Normal error-free smoke |
| 009 | `/dashboard/logistics` | `logistics/` | Normal error-free smoke |
| 010 | `/dashboard/infrastructure` | `infrastructure/` | Normal error-free smoke |
| 011 | `/dashboard/patient-monitoring` | `patient-monitoring/` | Required |

## Execution order and rationale

Task 001 is the hard dependency for tasks 002–011; 012 requires all prior tasks. Execute in the following order by default. Later dashboard tasks do not depend on another dashboard's domain code; prefer branches from updated main after predecessors merge. Any approved stack must declare its base, merge order and layer compare URL in a PR targeting main.

1. [001 — Establish shared chart theme and dashboard primitives](001-dashboard-foundation.md): Create the shared chart and compact card contracts before dashboard composition changes.
2. [002 — Restyle Default and Default V1](002-default-dashboards.md): Prove the shared foundation on the reference overview and its legacy sibling.
3. [003 — Restyle CRM and CRM V1](003-crm-dashboards.md): Apply the proven overview patterns to pipeline, opportunity and lead workflows.
4. [004 — Restyle Finance and Finance V1 and fix hydration](004-finance-dashboards.md): Resolve the paired finance hydration gates while standardizing financial data displays.
5. [005 — Restyle Analytics and Analytics V1](005-analytics-dashboards.md): Extend the chart contract to dense traffic, forecast and risk reporting.
6. [006 — Restyle Productivity and fix hydration](006-productivity-dashboard.md): Unify the personal work overview and clear its required hydration gate.
7. [007 — Restyle E-commerce](007-ecommerce-dashboard.md): Apply the established reporting language to sales, inventory and orders.
8. [008 — Restyle Academy](008-academy-dashboard.md): Adapt shared primitives to schedules, assignments and learning performance.
9. [009 — Restyle Logistics](009-logistics-dashboard.md): Handle the specialist split-pane and mobile shipment-detail workflow explicitly.
10. [010 — Restyle Infrastructure](010-infrastructure-dashboard.md): Apply compact density and status semantics to environment inventories.
11. [011 — Restyle Patient Monitoring and fix hydration](011-patient-monitoring-dashboard.md): Complete the most specialized realtime view with explicit clock and motion verification.
12. [012 — Verify v0.2 dashboard acceptance](012-dashboard-acceptance.md): Close the milestone only after every dashboard and integration gate is verified.

## Planning evidence and inspection findings

Baseline: main `307b8cf`, 2026-10-23. Impeccable context was loaded once from the repo root; PLAN/AGENTS, PRODUCT/DESIGN, all 14 route compositions, local component inventories and the existing chart wrapper were inspected. No code prefactor is needed for this documentation-only change; each implementation task names its own narrow inspection seam.

The scoped `npm run screenshots` capture covers all 14 routes in light/dark × desktop/mobile. Planning captures/logs are linked from the breakdown PR under `pr-assets/v0.2-breakdown`; they are incumbent evidence, not v0.2 acceptance. Date-dependent mock values and the development-tool overlay may differ between captures. The first attempt hit an IPv4/IPv6 localhost binding mismatch; restart with `npm run dev -- --host 0.0.0.0` for the IPv4 capture URL. Preserve the failed-attempt diagnostics separately. The local baseline initially passed 52/56 cases: three Patient Monitoring clock hydration failures and one Infrastructure font timeout. The Infrastructure four-state retry passed, leaving 53/56 with the three inherited hydration failures visible; `/dashboard/default` passed all four states without console/page errors.

| Evidence | Planning consequence |
| --- | --- |
| Default/Default V1 have tinted metric cards; metric/header structures repeat in CRM, Finance and Academy. | Standardize compact KPI/card/header presentation first; keep each board's domain model local. |
| Existing ChartContainer, tooltip and legend exports accept configuration/classes; `--chart-1` and `--chart-3` both resolve to blue in Default. | Compose protected wrappers; deliberately select series tokens and non-color distinctions. Do not assert arbitrary chart colors already pass contrast. |
| CRM/Analytics/E-commerce and legacy variants combine charts with long tables; mobile captures are much taller. | Review below-fold content and intentional local table scrolling, not only the first viewport. |
| Academy uses a schedule beside assignment bars; Productivity has a secondary calendar/focus column. | Preserve their specific workflows while unifying headers, status labels and density. |
| Logistics uses a list/map/detail split and a mobile sheet; Infrastructure uses grouped rows and an empty project state. | Test selection, sheet focus/scrolling, group menus and empty states, rather than imposing the overview-card layout. |
| Patient Monitoring uses vivid signal colors on neutral surfaces, live waveforms, a dense patient/detail layout and a render-time clock. | Verify actual signal contrast, non-color identity, reduced motion and clock stability explicitly. |
| Scoped identity scan finds Productivity's Arham greeting, Finance V1's Arham Khan card and CRM V1's Arham Khan fixture. | Audit every owned route, including greetings/handles/emails; clean fixtures in the owning task, never strip legal attribution. |

Finance/Finance V1/Productivity/Patient Monitoring have recorded Workers hydration failures in [open questions](../../open-questions.md). Patient Monitoring's `new Date()` seconds mismatch is confirmed. Other date/locale usages named in the tasks are investigation leads; confirm the actual mismatch before choosing a fix. A successful local capture does not clear a known Workers failure. Calendar/Invoice/Auth V2 remain v0.3 work.

## Workflow and evidence

The user explicitly authorized this planning addition to `dev/**` on `docs/v0.2-breakdown`. That historical planning approval was followed by explicit batch implementation authorization. Current acceptance boxes and task statuses now reflect verified evidence; the remaining reviewer approval/merge gate is unchecked.

For future tasks, follow dev/MAINTAINERS.md's one-task/one-PR workflow. Its literal `feat/v0.1/NNN-slug` branch example is historical to v0.1; use the milestone equivalent `feat/v0.2/NNN-slug` for these tasks. Copy the dev/MAINTAINERS.md PR template with this milestone's task link. Use Conventional Commits with a blank line followed by `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Every PR states `README: updated (sections …)` for its required README changes.

Before coding, inspect for a small behavior-preserving prefactor, apply it only if it makes the task safer/simpler, and document the result. Use Impeccable context once per session from the repo root, inspect incumbent renders/components, read craft-floor immediately before UI edits, then inspect final renders in all four required states.

Use `npm run screenshots -- --routes <comma-separated-routes> --output screenshots/<task>/before` and the corresponding `after` directory. Repeat with `--base-url <version-preview-url>` for Workers and `--preset default|graphite|pine|iris` for preset coverage. The final task owns the full 14-route, all-preset sweep. Preview alias numbers are actual PR numbers, not milestone task IDs. Only the reviewer redeploys production from main after merges.

Preserve original failure logs and distinguish inherited warnings, newly introduced failures and retries. In intermediate tasks, an inherited failure on an unowned dashboard remains visible and belongs to its assigned task; it does not excuse an owned route's failing acceptance. Record blockers in dev/open-questions.md, pause dependent work and finish independent work. Escalate PLAN conflicts, scope expansion, unavailable assets/access or unapproved runtime dependencies. Do not invent fixes in protected surfaces.

## Open questions

None blocking the breakdown. The existing hydration questions were answered by the locked decision assigning fixes to v0.2/v0.3; implementation must diagnose the remaining causes and provide the required evidence. No new approval or asset request is needed for planning.


## Integrated acceptance evidence (task 012)

The final [version preview](https://c87d1f88-tenboards.mohanadgh.workers.dev/dashboard/default) passes all 14 routes, four presets, two themes and two viewports. The [evidence directory](https://github.com/moeghashim/tenboards/tree/pr-assets/v02-012) retains matrices, logs, contrast measurements, interactive states, rendered/source identity audits and before/after comparisons. Finance comparison cards now share row bounds; the other 13 routes were checked for the same defect. No v0.3 surface or protected wrapper was changed.

Finance, Finance V1, Productivity and Patient Monitoring are resolved on the integrated review preview. Patient Monitoring also passes delayed direct/refresh hydration and normal/reduced-motion tests in task 011. Calendar, Invoice and Auth V2 remain required v0.3 work. Production contains only merged tasks; these acceptance results do not claim that the pending stack is deployed.

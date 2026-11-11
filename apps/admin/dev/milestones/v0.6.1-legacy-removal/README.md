# v0.6.1 — Legacy removal

Status: **done — tasks 001 (#63) and 002 (#64) merged; released as [v0.6.1](https://github.com/moeghashim/tenboards/releases/tag/v0.6.1)**.

## Tasks

| Task | Status | Contract |
| --- | --- | --- |
| 001 — Remove legacy dashboards and Auth V1 | Merged (#63) | Acceptance below |
| 002 — Collapsed header toggle | Merged (#64) | [Task contract](002-collapsed-header-toggle.md) |

Task 002 removes the duplicate header opener for desktop icon rails while preserving mobile and fully hidden off-canvas openers, focus, shortcuts and SSR. Build/check/typecheck, 96 hydrated combinations, 96 server-rendered cookie combinations and before/after screenshots pass. [PR #64](https://github.com/moeghashim/tenboards/pull/64) links the isolated version preview and [pr-assets evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v061-002).

## Task 001

Task: 001 — Remove legacy dashboards and Auth V1
Status: merged (#63)
Contract: PLAN.md Decisions log, “v0.6.1 legacy removal” (2026-10-24), approved base `f45e813`.

Remove the Legacy navigation group, four V1 dashboards and Auth V1 forms; Auth V2 is the only sign-in UI. Permanently redirect the six retired URLs to current equivalents with validated return queries. Remove only unused components/data, add a new migration for exclusive tables, preserve shared data and all v0.5 security properties. No merge or production deployment by the implementer.

## Acceptance criteria

- [x] Legacy sidebar/palette entries and four dashboard implementations removed; no retained screen loses shared components.
- [x] Auth V2 is canonical for guards, links, sign-out and error callbacks; validated return behavior and auth security retained.
- [x] All six retired URLs permanently redirect in demo/auth modes with validated redirect queries.
- [x] V1-only reads/payloads, fixtures, seeds and parity scenarios removed; 13 exclusive tables dropped by a new migration, shipped migrations unchanged.
- [x] Fresh and populated incremental migrate/seed, repeated execution, retained-data checks and 22 reads / 104 parity scenarios pass.
- [x] Build, check, typecheck, dev default smoke, auth:test, worker:test, worker:auth and worker:security pass on test-owned local Docker databases.
- [x] Before/after sidebar and Auth V2 light/dark × desktop/mobile evidence captured and uploaded only to pr-assets.
- [x] README screen count/sitemap/links, auth/data docs, draft changelog and route inventories updated; isolated version preview linked in PR.

## Implementation decisions

Prefactor inspection found the existing domain modules and `authSearch`/`authDestination` validator already isolate the change; no separate refactor or dependency is needed. Dashboard aliases use TanStack non-nested `dashboard_` routes so their 308 precedes the destination guard. Alias beforeLoad validates the query without a validateSearch normalization hop; the final page retains its normal search/guard behavior. Shared civil-date helpers and metric tables remain. Parity decreases from 130 to 104 by removing 8 Default, 6 CRM, 6 Finance and 6 Analytics V1-only cases; all 22 domain reads remain.

Claude Opus 5.5 reviews and has merge authority; the implementer never merges.

## Verification

Build, Biome and TypeScript pass. Node auth: 426/426 across 12 suites. Worker auth: 245 protection + 15 account + 12 security cases. Worker runtime: 17 checks including 22 reads/104 HTTP parity scenarios. Distributed Worker security: seven checks. Local redirects: 96/96; hosted preview: six aliases × safe/hostile queries and default SSR/browser smoke. Fresh and populated migration paths each pass 15 migrations, repeated migrate/seed, retained-row equality and parity.

Before/after screenshots and logs: [pr-assets/v061-001](https://github.com/moeghashim/tenboards/tree/pr-assets/v061-001). Sidebar captures settle collapsed panels; Auth V2 before/after captures are byte-identical. The single-result palette exposed cmdk's missing active-descendant reference; a cleanup-aware input ref synchronizes the rendered selection without editing shared wrappers. Original failures and successful retries are retained in evidence.

Preview: [version](https://644297e0-tenboards-preview.mohanadgh.workers.dev/dashboard/default), [alias](https://pr-63-tenboards-preview.mohanadgh.workers.dev/dashboard/default). Remote configuration is ASSETS-only with no secrets. Existing Base UI animation, Biome highlighter/nursery and build/dependency warnings are recorded separately; no token changes require new contrast measurements.

# Open questions

## 2026-10-24 — v0.6 production access and preview-rule reconciliation

**Status: resolved by PLAN's v0.6 template-readiness decision (2026-10-24, bb3c62a).** No project-owned Neon database will be provisioned; the live Worker stays demo-only. Task 004 is now [template deployment readiness](milestones/v0.6-production/004-production-cutover.md), explicitly authorized for implementation. No credential handoff blocks it. Hosted checks belong to adopters and are not claimed from local workerd evidence.

**Preview conflict: resolved by PLAN precedence and merged task 002 (PR #60).** Historical planning context: Current AGENTS/CONTRIBUTING and `preview:deploy` still describe version uploads on `tenboards`. The newer v0.6 previews decision requires `tenboards-preview` with no database bindings or secrets and wins immediately. Do not upload new PR versions to production using the stale command. This documentation-only planning PR cites an explicitly labeled existing immutable demo baseline. Task 001 must use an interim reviewed binding-free configuration targeting `tenboards-preview` for its version-preview gate, or record that gate as blocked; task 002 makes the isolated target permanent and updates contributor wording. No implementation or preview provisioning is authorized in this planning PR.

Technical gates belong to their tasks: 001 proves Nitro binding/request propagation and auth/DB lifetimes; 002 proves preview configuration isolation and shared limiter storage; 003 verifies remote migration opt-in and safe secret/deployment/rollback ordering. A failure requiring scope expansion or a new dependency must be logged here and pause dependent work. Existing trusted-origin and enabled in-memory limiter behavior are preserved/hardened, not treated as missing features. No change to PLAN is proposed.

## 2026-10-23 — v0.1 / 012 full-matrix clock hydration blocker

**Current status: resolved.** This historical finding is closed by the scoped v0.2/v0.3 fixes and the complete task 014 reconciliation below; original diagnosis and waiver history are retained.

Task 009 long-title capture exposed an inherited `new Date()` in `src/routes/(main)/dashboard/patient-monitoring/route.tsx:19`. Direct SSR navigation can render different seconds on the server/client, causing hydration recovery. The failure predates this batch (the page file is unchanged from main). Exact output is retained with task 009 evidence in `pr-assets/009/009-inherited-failure.log`.

Observed diff: client `04:55:30`, server `04:55:29`; a second smoke reproduced client `04:55:50`, server `04:55:49`. React reports: `Hydration failed because the server rendered text didn't match the client.`

Decision requested: authorize a narrow nonvisual clock hydration fix in 012, or leave the full-matrix acceptance criterion blocked. No page content edit made. Independent shell tasks continue; error-free full-route acceptance remains pending.

## 2026-10-23 — v0.1 / 012 Calendar Workers hydration blocker

**Current status: resolved.** This historical finding is closed by the scoped v0.2/v0.3 fixes and the complete task 014 reconciliation below; original diagnosis and waiver history are retained.

The complete task 012 Workers matrix reports a React HTML hydration mismatch on `/dashboard/calendar` in both themes at desktop/mobile. A separate four-state capture against the existing production deployment reproduces the same failure in all four cases, establishing that it predates this shell batch. Calendar source and primitives remain unchanged.

Exact output: `page: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings.` Logs/reports: `pr-assets/012/012-production-calendar.log` and `pr-assets/012/production-calendar/report.json`.

Decision required: authorize a narrowly scoped Calendar SSR/hydration investigation/fix (which may touch the protected calendar surface), or accept this as a documented upstream limitation and explicitly waive the clean full-route gate. Dependent acceptance remains blocked; no Calendar edit is made. Patient Monitoring's clock decision above also remains pending.

Other initial capture failures were an external Google font timeout on Calendar and a null `document.body` during a Finance capture. All eight Calendar/Finance local retry cases passed. Original logs remain in task 012 evidence; these retries do not clear the reproduced Workers Calendar or Patient Monitoring hydration issues.

Finance and Invoice also reproduce React text hydration error #418 in all four preview matrix cases and on the existing production deployment (see `pr-assets/012/012-production-baseline.log`). Their page content is unchanged in this batch. The same decision is required for these inherited non-shell SSR failures; no dashboard/app-page fix is included without authorization. Exact output is the Calendar message above with `args[]=text` instead of `args[]=HTML`.


## 2026-10-23 — v0.1 / 012 final acceptance status

**Current status: resolved.** This historical finding is closed by the scoped v0.2/v0.3 fixes and the complete task 014 reconciliation below; original diagnosis and waiver history are retained.

The final Workers matrix has 32 inherited hydration failures across eight routes: `/dashboard/calendar`, `/dashboard/finance`, `/dashboard/invoice`, `/dashboard/patient-monitoring`, `/dashboard/productivity`, `/dashboard/finance-v1`, `/auth/v2/login`, and `/auth/v2/register`. Each fails in light/dark at desktop/mobile and reproduces on the existing production deployment. Production logs and reports are retained in `pr-assets/012` under `production-calendar`, `production-baseline`, `production-productivity`, `production-finance-v1`, and `production-auth`. No page/auth/calendar implementation is changed.

Exact text error: `page: Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings.` Calendar uses `args[]=HTML` as recorded above.

Initial Workers results: 119/152 pass; a CRM light/mobile navigation timeout passed on a four-state retry, leaving 120/152 passing cases and the 32 hydration failures. Local results: 148/152 pass initially; eight Calendar/Finance retry cases pass, leaving two Patient Monitoring clock failures. Original reports are preserved alongside retries. Build, check, typecheck, default-route smoke, 16 local plus 16 Workers shell accessibility scenarios, and 280 contrast comparisons pass.

Task 012 is blocked, with the clean-captures acceptance box unchecked. Required decision: authorize scoped SSR/hydration fixes for these eight inherited routes (including protected Calendar/auth surfaces), or explicitly waive the inherited errors in the full-route gate. dev/MAINTAINERS.md requires escalation for scope expansion and protected surfaces; the approved batch is shell-only. No dependent fixes proceed without that decision. Full evidence: https://github.com/moeghashim/tenboards/tree/pr-assets/012.

**Resolution (2026-10-23, user via reviewer)**: Waived for v0.1. All three 012 hydration entries above are answered: each affected route's hydration fix becomes a required acceptance criterion in the v0.2/v0.3 task that restyles it (Finance, Finance V1, Productivity, Patient Monitoring → v0.2; Calendar, Invoice, Auth V2 → v0.3). **Status**: answered

### v0.2 task 004 verification

The Finance and Finance V1 portion of the inherited hydration finding is resolved on the task 004 version preview. Explicit demo statement dates and UTC formatting remove module-clock and timezone differences. Direct/refresh light/dark desktop/mobile pass in dev (Kiritimati server vs Chicago browser) and Workers (Chicago and Kiritimati browser zones). Evidence: `pr-assets/v02-004/after-timezone`, `workers`, `workers-kiritimati`. Other inherited routes remain for their scoped tasks; this does not change production.

### v0.2 task 006 verification

The Productivity portion of the inherited hydration finding is resolved on version preview https://c2ec54fc-tenboards.mohanadgh.workers.dev/dashboard/productivity. Explicit demo calendar fields remove runtime/module-clock differences from the calendar, project dues and notes. Direct/refresh light/dark desktop/mobile pass with a Kiritimati dev server against Chicago browser and on Workers with Chicago and Kiritimati browsers. No frozen clock, SSR removal or warning suppression. Evidence: `pr-assets/v02-006/after-timezone`, `workers`, `workers-kiritimati`; keyboard scenarios pass in dev and Workers using a local focus-ref adapter, leaving protected calendar wrappers intact. Remaining inherited routes retain their assigned tasks; production is unchanged. Status: answered.

### v0.2 tasks 001–006 — DCO sign-off check

GitHub's DCO app reports `ACTION_REQUIRED` on the stack: `There are 6 commits incorrectly signed off.` Each implementation layer lacks an author `Signed-off-by` trailer; the required GPT co-author trailer is present. Build, lint, typecheck, visual, interaction and owned-route hydration gates pass. Exact DCO output is retained at `pr-assets/v02-batch-001-006/dco.txt`.

Status: resolved — reviewer remediation completed; PRs #14–#19 are merged and deployed (verified GitHub merge state). The historical failure above is retained for provenance. Batch 007–012 commits use the authorized local author Signed-off-by trailer plus the required GPT co-author trailer; no DCO blocker remains on PRs #20–#24.


### v0.2 tasks 011–012 — dashboard hydration resolved

Status: resolved for all four v0.2 routes: `/dashboard/finance`, `/dashboard/finance-v1`, `/dashboard/productivity`, `/dashboard/patient-monitoring`. The integrated [task 012 preview](https://c87d1f88-tenboards.mohanadgh.workers.dev/dashboard/default) passes every one of these routes in all four presets, light/dark and desktop/mobile on dev and Workers, without React #418 or other console/page errors. [Full matrix evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v02-012).

Patient Monitoring's render-time clock was the remaining root cause: SSR and the hydrating client now render the same placeholder; a client effect starts the real UTC clock. Realtime stores retain the stable server snapshot and pause continuous subscriptions for reduced motion. Task 011 passes 8/8 delayed direct/refresh cases per environment with a real 1800 ms JavaScript delay; assertions prove the clock advances, traces pause for reduced motion and resume with normal motion. Workers was tested in Pacific/Kiritimati and dev in America/Chicago. No frozen clock, suppressHydrationWarning or page SSR removal. [Task 011 evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v02-011).

Calendar, Invoice and Auth V2 login/register remain assigned to v0.3 under the locked inherited-hydration decision. Their v0.1 waiver is historical and does not waive future v0.3 acceptance. No new blocker or scope question is open for v0.2; tasks 007–012 still await authorized review/merge and subsequent production deployment.


## 2026-10-23 — v0.3 breakdown baseline check failure

Status: answered — fixed by reviewer on main in `18096de` (style: restore biome formatting of package.json); `npm run check` passes again. On clean main `1815a6b` (v0.2.0), `npm run check` exits 1 with `package.json format`: `Formatter would have printed the following content`. Biome expects the `lint-staged` array on one line: `"*.{js,ts,jsx,tsx}": ["biome check --write --no-errors-on-unmatched"]`. The file's SHA-1 is `bc0ef2ba1f82442711a81c21f27487e42dcf445a` both in HEAD and the working tree. This is an inherited formatting failure, separate from the one highlighter warning and six informational diagnostics. Build/typecheck and the 100-case scoped dev screenshot smoke pass. Full output: [planning check log](https://github.com/moeghashim/tenboards/blob/pr-assets/v0.3-breakdown/check.log).

The approved step is task breakdown only, so package/source files remain unchanged. The reviewer must resolve this through an authorized change or explicitly record the docs-PR disposition; task 014 and every implementation task still require a passing build/check/typecheck gate. Independent planning, route inspection and documentation are complete; no v0.3 implementation has started.


### v0.3 task 004 Calendar verification

The inherited Calendar hydration finding is resolved on version preview https://12731e75-tenboards.mohanadgh.workers.dev/dashboard/calendar. FullCalendar's server-local today cell differed from the browser's local date. The route now shares a request timestamp and UTC initial timezone through hydration, then adopts browser-local time with a live clock; date fixtures derive from the same snapshot. No warning suppression, SSR disabling or frozen clock. Dev Chicago versus browser Kiritimati and Workers versus Chicago/Kiritimati pass direct/refresh with delayed JavaScript, all four light/dark desktop/mobile states. Today and the real now marker are verified. Evidence: https://github.com/moeghashim/tenboards/tree/pr-assets/v03-004 (`after`, `workers`, `workers-chicago`, `clock-dev`, `clock-workers`, `live-now.txt`). Reviewer pre-approval, v0.3 batch A brief was recorded; no protected calendar structural edits were needed. Invoice and Auth V2 remain assigned to their tasks. Status: answered.


### v0.3 task 007 Invoice verification

The inherited Invoice hydration finding is resolved on version preview https://0befc4c3-tenboards.mohanadgh.workers.dev/dashboard/invoice. Independent module clocks generated different civil dates in server Chicago and browser Kiritimati; request-scoped UTC civil defaults are now serialized by the route loader and retain editable dates. Dev and Workers pass delayed JavaScript/direct/refresh across light/dark desktop/mobile, with Workers browser zones Chicago and Kiritimati. No frozen clock, SSR disabling or suppression. Preview/print totals agree, and rendered one-page Letter PDFs verify long descriptions, addresses, total and neutral issuer. [Reports, baseline exact error and PDF evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-007). Status: answered. Auth V2 login/register retain their task 012 hydration gates; no batch A blocker remains.


### v0.3 task 012 — Auth V2 login resolved

Status: resolved. `/auth/v2/login` server HTML used `© 1970, tenboards.` while the browser rendered `© 2026, tenboards.`: APP_CONFIG evaluated the Worker module clock before a request. Copyright is now formatted from the real request's UTC year and serialized by the parent loader. No warning suppression, SSR disabling or frozen clock. Dev (Chicago server/Kiritimati browser) and [Workers version a9dd9c26](https://a9dd9c26-tenboards.mohanadgh.workers.dev/auth/v2/login) pass delayed-JavaScript direct/refresh in light/dark and desktop/mobile; Workers also passes Chicago browser time. [Exact baseline errors, SSR/client diff and passing reports](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-012) (`before-workers`, `ssr-copyright.json`, `client-copyright-before.json`, `ssr-copyright-after.json`, `after-final`, `workers-final`, `workers-chicago-final`). The historical v0.1 waiver is superseded for this route.

### v0.3 task 012 — Auth V2 register resolved

Status: resolved. `/auth/v2/register` independently reproduced the same server 1970/client 2026 text diff and React #418. It consumes the same serialized request-year loader data through the shared V2 form frame. Both browser timezones and every delayed direct/refresh light/dark desktop/mobile case pass on [Workers version a9dd9c26](https://a9dd9c26-tenboards.mohanadgh.workers.dev/auth/v2/register), with matching dev coverage. [Evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-012) includes separate raw register SSR before/after, real browser observation and route-specific report rows. V1 forms and bare layout-only V2 also pass. Auth remains a UI-only demo; Better Auth is v0.5. Together with the linked v0.2 dashboard, v0.3 Calendar and Invoice resolutions above, all eight historically affected routes now have scoped fixes; task 014 repeats the integrated matrix.


### v0.3 task 014 — complete hydration reconciliation

Status: resolved for every historical hydration finding. The historical reports and v0.1 waiver above remain intact; all eight routes now have verified scoped resolutions:

| Historical route | Root cause / resolution | Evidence |
| --- | --- | --- |
| Finance, Finance V1 | Module dates / explicit demo civil dates and UTC formatting | [v02-004](https://github.com/moeghashim/tenboards/tree/pr-assets/v02-004), [integrated v02-012](https://github.com/moeghashim/tenboards/tree/pr-assets/v02-012) |
| Productivity | Runtime calendar/project/note dates / explicit demo fields | [v02-006](https://github.com/moeghashim/tenboards/tree/pr-assets/v02-006) |
| Patient Monitoring | Render-time seconds / stable hydration placeholder then real UTC clock | [v02-011](https://github.com/moeghashim/tenboards/tree/pr-assets/v02-011) |
| Calendar | Server/browser local-today mismatch / shared request timestamp and initial UTC, then live browser time | [v03-004](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-004) |
| Invoice | Independent module clocks / serialized request UTC civil defaults | [v03-007](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-007) |
| Auth V2 login | Worker module year 1970 versus browser 2026 / serialized request UTC copyright | [v03-012 login rows and raw SSR](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-012) |
| Auth V2 register | Independently reproduced same year mismatch / shared request loader | [v03-012 register rows and raw SSR](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-012) |

The [v0.3 final matrix](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-014) verifies all 38 catalog routes across four presets, light/dark and desktop/mobile: 608 cases per environment, 1,216 total, with no remaining unexpected errors after documented retries. Supplemental real-clock delayed direct/refresh/timezone, boundary/reset and interaction checks pass. No warning suppression, frozen clocks or SSR disabling were introduced as fixes. Expected QA exceptions/404 diagnostics are isolated. No open product/access question remains; review and merge remain Claude's responsibility, and the milestone stays in review.


## 2026-10-24 — v0.7 Assistant planning reconciliations

Status: **answered in planning; no unresolved PLAN conflict or user/access decision**. Implementation remains pending planning review. Baseline cad4896; see the [milestone research and security contract](milestones/v0.7-assistant/README.md).

- **Intervening v0.6.1 dependency:** main advanced to f45e813 during planning with a locked legacy-removal row requiring that work before v0.7. Preserve cad4896 as this PR's inspection baseline, but make 001 depend on the v0.6.1 merge and reinspect current guards/catalog; Auth V2 becomes canonical. No competing decision or PLAN edit is needed, and no legacy implementation is included here.

- **Meta default and geography:** official current [models](https://dev.meta.ai/docs/models) recommend `muse-spark-1.3`; `muse-spark-1.1` and US-only public preview describe the [July launch](https://dev.meta.ai/resources/blog/build-with-muse-spark). [Current availability help](https://dev.meta.ai/help/accounts-and-login/supported-countries) describes supported Meta AI/billing countries, while the [product page](https://dev.meta.ai/products/meta-model-api) still uses preview labeling. Plan the documented `https://api.meta.ai/v1` Chat Completions integration with 1.3 and an env override. Do not assert US-only or universal/GA availability; adopters verify entitlement and geography. PLAN specifies Muse Spark, not a fixed version, so this is no conflict and requires no live account for mocked acceptance.
- **Preview isolation:** existing clean builds strip caller secrets and remote inventory permits ASSETS only. The explicit rejection regex does not name the new AI keys/models. Task 002 extends that rejection and adopter configuration tests; no new secret is set on the live demo or preview. This is scoped implementation of the locked isolation rule, not a reason to weaken it.
- **Limiter scope:** Better Auth HTTP middleware does not cover Assistant. The proposed contract uses namespaced atomic rows in existing `auth_rate_limit` with DB, bounded per-process/isolate IP buckets without DB, and explicit numeric caps/deadlines. No-DB limits do not guarantee a global paid budget across isolates/restarts. This satisfies the planned local rate-limit boundary without adding infrastructure; a stronger global-quota requirement would need an explicit storage/scope decision before dependent work. Adopters remain responsible for provider/ingress budgets on public paid deployments.
- **Dependency approval:** PLAN explicitly permits SDK/provider dependencies with versions chosen in planning. Eight exact direct pins and evaluated exclusions are in the milestone README; approval is part of review of this concrete planning PR. No install/lockfile change or implementation is included. An incompatible peer, size/runtime blocker or extra package found later must be logged and dependent work paused.


## 2026-10-24 — v0.8 Projects planning reconciliations

Status: **proposed implementation choices for planning review; no unresolved PLAN conflict or missing access**. Baseline `cc3c5e7`; see the [milestone contract](milestones/v0.8-projects/README.md). No implementation is authorized by these notes alone.

- **Authority and isolation:** the user explicitly assigned this documentation-only planning PR, its `docs/v0.8/000-milestone-plan` branch and new milestone/task files. That authorizes the new dev contracts despite the generic dev-only-status restriction. PLAN and existing task contracts remain untouched. Work uses `/Users/moeghashim/tenboards-v08`; the density agent's checkout/branch is not modified.
- **Locked scope:** PLAN's v0.8 workspace/consolidation/sequencing rows govern; its v0.6.2 row supersedes old density sizes. v0.6.2 merges first; v0.7 and v0.8 remain independent and reviewer-rebased, preserving Assistant next to Chat. Earlier v0.7 task wording does not negate the newer sequencing row.
- **Home versus default — resolved 2026-10-25:** PLAN’s locked “v0.8 landing page” row supersedes this proposal. `/`, `/dashboard`, `/dashboard/` and the missing/invalid auth return fallback now lead to `/dashboard/home` (layer005). Validated return destinations win; `/dashboard/default` remains the revenue dashboard. No outstanding approval is required.
- **Expanded state (proposal):** versioned, bounded project-ID-only localStorage with guarded post-hydration restoration, corrupt-storage fallback and active-project entry rules. Existing sidebar cookies and global preferences are preserved. This is an additive UI preference contract, not persistence of project edits or a new density setting.
- **Independent task domains (proposal):** normalize Kanban and ledger Tasks into one project-task model with namespaced source IDs and explicit mapping; retain canceled status and every original record. Additive backfill/seed preserve old tables and unrelated/auth rows. Board/List agree rather than maintaining incompatible datasets. Project members are sample metadata, not auth membership or ACLs. My tasks explicitly names a sample member in both modes.
- **Calendar and read-only consolidation (proposal):** Calendar remains accessible as Timeline's Calendar mode; `/dashboard/calendar` redirects there. CSS Gantt and a same-data table need no dependency. Existing mutating/inert demo controls are removed from project views under the locked read-only scope, not converted into real CRUD. Dependency arrows, sharing/upload/download services and favorite editing stay deferred.
- **Task order (proposal):** data → Board/List → Overview/Timeline/Files → Home/index → nested navigation/redirects → acceptance. This postpones consolidation until every target works; no broken intermediate alias or placeholder route. Shared conflicts are reviewer-owned unions of both milestones, not whole-file overwrites.
- **Reference boundary:** viewed only rendered reference patterns and the four user-supplied images. No source/assets/copy/data from either unlicensed Gr8r repository was read or reused. Original tenboards fixtures/components/tokens supply the implementation.
- **Existing context drift:** Impeccable reports a stale design sidecar; PRODUCT/DESIGN also contain historical milestone language. Neither overrides current PLAN/code. No unrelated context refresh is included; `impeccable document` can refresh the sidecar separately if requested.

Any runtime dependency, tenancy/auth-policy change, destructive migration, conflicting compact requirement or missing required access discovered during implementation must be recorded here and dependent work paused. Local isolated Postgres/workerd plus a demo-only preview suffice; no hosted database credential is required for this plan.

## 2026-10-24 — v0.7 review-round-2 local verification infrastructure

Resolved infrastructure interruption: host storage exhaustion caused ENOSPC screenshot writes and made Docker/Postgres unavailable during regression testing. No unrelated files or workspaces were deleted. After storage recovered, verification resumed using an isolated local PostgreSQL 17 cluster on 127.0.0.1:3189 with tenboards_v07_r2 and tenboards_v07_assistant_r2 databases. Interrupted logs remain in the PR evidence; successful reruns are identified separately. No application/backend change was made in response.

Preview verification interruption: Cloudflare initially returned error 100146 for newly uploaded version IDs, and one retry failed during inventory inspection. The guarded uploader was not weakened. Delayed read-only verification confirms the refreshed preview versions have only ASSETS and no secrets; hosted demo checks pass. Original failure logs and recovery evidence are retained on pr-assets. This affected preview verification only, not production.

## 2026-10-26 — v0.9 / 001 reviewer rebase handoff

Status: **resolved 2026-10-26 by reviewer rebase onto `f319101`** (CHANGELOG/milestones unioned; kit check now expects the Default landing, then visits Home; build/check/typecheck and 4/4 kit browser combinations pass on the rebased head). PR #77 was implemented from the requested `e659940` baseline while v0.8.1 ran in parallel. Main advanced through #76 (`890fa3e`) and the v0.8.1 release (`f319101`) before handoff. A read-only merge-tree check reports conflicts only in `CHANGELOG.md` and `dev/milestones.json`; preserve the separate v0.9 draft plus v0.8.1 release notes and union the milestone statuses. README and the route catalog merge automatically.

The milestone contract assigns merge-first/rebase sequencing to the reviewer. After rebasing, update the new `scripts/blocks-kit-check.ts` root expectation from Home to the newly approved Default landing, then explicitly visit Home for its smoke coverage. The recorded 144-before/148-after comparisons and preview verify the extraction against `e659940`; repeat root/landing and kit smoke on the rebased head and refresh the guarded preview before merge. No application redirect or auth behavior changed in this task. Independent implementation, design/documentation reviews, tests and evidence upload are complete. The implementer has not merged or rebased the reviewer-owned stack.

## 2026-10-26 — v0.9 / 002 generator verification

Status: resolved; no product/scope question is open. The collaborative preview twice returned `Preview automation snapshot timed out after 15000ms.`; verification uses the repository's Playwright capture workflow. Tests use a dedicated local PostgreSQL 17 cluster on `127.0.0.1:3293` / `tenboards_v09_002`, with no shared DB or production access. The first disposable-app harness used a dependency symlink, which Vite could not resolve outside its root. It now copies dependencies with independent caches; the incumbent dev server was restarted with forced dependency optimization after the earlier shared-cache run. Initial harness assertion/type/locator failures and successful reruns are retained in PR evidence. Generated DB reads are explicitly fixture-backed TODO stubs, as task 002 requires; they do not claim persistence. Task 003 owns `check:design`/`verify:page`; task 002 uses token-only templates and routes chart exports through `src/lib/charts` for that integration. Impeccable's existing stale sidecar is unchanged and can be refreshed separately with `impeccable document`.

## 2026-10-26 — v0.9 / 003 inherited accessibility audit

**Round 1 audit (historical): shell findings in A and all of D are resolved in review round 2 below; route-specific findings remain open.** `npm run verify:page -- --all --base-url http://127.0.0.1:3393` audited all 37 capture-catalog routes in light/dark × desktop/mobile (148 cases), using `@axe-core/playwright@4.14.0` and WCAG 2/2.1/2.2 A/AA tags. Result: 26 passing cases, 122 failing cases, **zero console/hydration/page/request errors**, exit 1. The command deliberately does not suppress inherited violations.

Evidence: [run index and per-route reports](https://github.com/moeghashim/tenboards/tree/pr-assets/v09-003/verify), [rule/route summary](https://github.com/moeghashim/tenboards/blob/pr-assets/v09-003/verify/inherited-summary.json), [verbatim audit output](https://github.com/moeghashim/tenboards/blob/pr-assets/v09-003/logs/verify-all.log). Reports include the exact theme/viewport, node targets, node HTML, failure summaries and remediation links. Counts below are rule occurrences across cases, not unique defects (cases can contain several rules).

| Logged issue | Cases / nodes | Affected surfaces and representative targets | Follow-up |
| --- | --- | --- | --- |
| V09-003-A: `label-content-name-mismatch` | 120 / 294 | 30 shell-backed routes; `.shell-search`, demo account trigger `#base-ui-_R_repaq_`, and screen-specific named controls (invoice/logistics/monitoring) | Include visible control text in accessible names without losing useful context |
| V09-003-B: `scrollable-region-focusable` | 4 / 4 | Analytics and project Timeline; `.overflow-x-auto` | Provide keyboard access to the overflowing data region |
| V09-003-C: `color-contrast` | 21 / 65 | Chat (standalone and iframe), Analytics, CRM, Ecommerce, Finance, Invoice, Logistics, Patient Monitoring, Products, Profile and Roles | Review the exact rendered foreground/background pair in each report before token/usage fixes; no claim that supported DESIGN.md pairs changed |
| V09-003-D: `button-name` | 16 / 32 | Default dashboard plus `/`, `/dashboard`, `/dashboard/` aliases; `#base-ui-_R_pj9aq_` and companion control | Give the two icon controls accessible names |
| V09-003-E: `aria-progressbar-name` | 4 / 4 | CRM; progress indicator with chart-2 styling | Supply an accessible metric label |
| V09-003-F: `aria-required-children` | 4 / 4 | Finance; `.group\/item-group` | Reconcile the item-group role and child semantics |

These findings predate this task: all 20 touched route modules have identical non-import AST statements to `c605e25`, tokens/markup are unchanged, and all 12 Default/Finance/Kit before/after captures are pixel-identical. Round 1 added only a chart export boundary and import rewiring in app code. The reviewer subsequently authorized shell-level A and landing-page D fixes in this PR so new pages can pass verification; other route-specific fixes remain separately scoped.

The seeded inaccessible fixture independently proves `button-name`, `label`, a hydration console diagnostic, four captures, JSON reporting and exit 1. Auto-start/reuse and owned-server cleanup were also verified. Ordinary inherited Base UI animation warnings are recorded separately from errors. Impeccable reported its existing stale design sidecar; no design-context repair was included.

### Review round 2 — shell baseline resolved; route-specific follow-up remains open

Final fresh catalog run: **105/148 cases pass (22/37 routes pass all four states), 43 cases retain route-specific axe findings, zero runtime errors, exit 1**. The original run had 26 passing and 122 failing cases. V09-003-A's shell search/account findings and all V09-003-D findings are resolved at usage sites. Default, Kit, and an uncommitted minimal PageHeader route inside the shell each pass four states. Eight Default/Kit before/after captures are pixel-identical. No route-specific A/B/C/E/F fixes were included.

Evidence: [full reports](https://github.com/moeghashim/tenboards/tree/pr-assets/v09-003/review2/verify), [verbatim output](https://github.com/moeghashim/tenboards/tree/pr-assets/v09-003/review2/logs/catalog.log), [summary](https://github.com/moeghashim/tenboards/tree/pr-assets/v09-003/review2/verify/inherited-summary.json). Current cases/nodes below exclude the resolved shell/landing controls.

| Logged issue | Remaining cases / nodes | Affected routes |
| --- | --- | --- |
| V09-003-A: `label-content-name-mismatch` | 20 / 114 | `/dashboard/assistant`, `/dashboard/academy`, `/dashboard/invoice`, `/dashboard/logistics`, `/dashboard/patient-monitoring` |
| V09-003-B: `scrollable-region-focusable` | 4 / 4 | `/dashboard/projects/$projectId/timeline`, `/dashboard/analytics` |
| V09-003-C: `color-contrast` | 21 / 65 | `/chat`, `/dashboard/analytics`, `/dashboard/chat`, `/dashboard/crm`, `/dashboard/ecommerce`, `/dashboard/finance`, `/dashboard/invoice`, `/dashboard/logistics`, `/dashboard/patient-monitoring`, `/dashboard/products`, `/dashboard/profile`, `/dashboard/roles` |
| V09-003-E: `aria-progressbar-name` | 4 / 4 | `/dashboard/crm` |
| V09-003-F: `aria-required-children` | 4 / 4 | `/dashboard/finance` |

V09-003-D: resolved (0 cases / 0 nodes). The Default controls were activity-period/segment Select triggers; their accessible names now include purpose and the current visible value. Screen-specific A includes Assistant suggestion buttons and Academy controls in addition to Invoice, Logistics and Patient Monitoring controls. The verifier has no inherited-failure suppression. Playwright caret injection caused one interrupted-run hydration diagnostic; preserving caret styles eliminated the tool-induced mutation, and the full fresh run has zero runtime errors. Inherited Base UI animation warnings remain recorded separately.


### Task 006 — route-specific findings resolved (2026-10-26)

Fresh `npm run verify:page -- --all --base-url http://127.0.0.1:3396`: **148/148 cases pass, 37/37 catalog routes pass all four states, zero axe violations and zero runtime errors, exit 0**. This supersedes the historical Review round 2 baseline above. No axe rules were suppressed or filtered.

Evidence: [verbatim catalog log](https://github.com/moeghashim/tenboards/blob/pr-assets/v09-006/logs/catalog.log), [full catalog/per-route reports](https://github.com/moeghashim/tenboards/tree/pr-assets/v09-006/verify), [summary](https://github.com/moeghashim/tenboards/blob/pr-assets/v09-006/catalog-summary.json), [four-preset before/after matrix](https://github.com/moeghashim/tenboards/blob/pr-assets/v09-006/README.md).

| Finding | Status | Verified repair |
| --- | --- | --- |
| V09-003-A | Resolved; 0 cases / 0 nodes | Visible content supplies Assistant, Academy, shipment and patient names; Invoice date names include the displayed date. Existing interaction locators follow the corrected names. |
| V09-003-B | Resolved; 0 cases / 0 nodes | Analytics and Timeline delegate table overflow to the named, focusable outer region. ArrowRight scrolls, focus is visible, and Tab exits in light/dark × desktop/mobile. |
| V09-003-C | Resolved; 0 cases / 0 nodes | Exact failing foreground/background pairs reviewed; inactive tabs use opaque text-muted, New badge uses success/success-surface. Unavailable CRM/Ecommerce pagination has disabled semantics, no tab stop and guarded activation. All 280 supported-pair checks pass across Default/Graphite/Pine/Iris; no token values change. |
| V09-003-E | Resolved; 0 cases / 0 nodes | CRM discovery-call progress has a metric name. |
| V09-003-F | Resolved; 0 cases / 0 nodes | Finance transaction Items have listitem roles under ItemGroup. |

Build, check (including check:design), typecheck, `/` → `/dashboard/default` → `/dashboard/home` navigation and keyboard smoke pass. All 240 before and 240 after captures pass; 124 pairs are pixel-identical, with no dimension changes. Intended tab/badge contrast, table scrollbar ownership and transient native scrollbar differences are documented in the evidence. Protected UI/calendar primitives and PLAN.md are untouched.

Inherited warnings remain separate: Biome reports 35 warnings/10 infos; bundling reports dependency module-level directives; the catalog records 133 Base UI animation warnings and one development-mode TanStack CSRF advisory (auth behavior is outside this task). One concurrent Patient Monitoring interaction capture reported `Reduced-motion waveform moved`; its isolated rerun passes 4/4. One Iris Academy capture missed a chart during the concurrent run; the isolated recapture is pixel-identical to baseline. Original anomalous captures/logs are retained. No unresolved task 006 questions or reviewer waivers are required.

## 2026-11-06 — v0.10 / 003 database cancellation gate

Status: **implementation paused at the spike cancellation gate** on baseline `0e9a82711b199610ae7e302f96959c3bf0e12668`. No dashboard tools, transport or refresh endpoint have been shipped; task acceptance remains unchecked. PLAN and the approved task files are unchanged.

A local probe used an isolated PostgreSQL 17 cluster and the actual `withRuntimeRequest` / `getDatabase` code with `db.execute(sql\`select pg_sleep(6)\`)`. It aborted the Request signal after approximately 100 ms. The Node probe supplied Worker-shaped request bindings to exercise the request-scoped client rather than the global Node pool. The workerd probe bundled these same source modules with Wrangler 4.152.0 and `nodejs_compat`; it was a local compiled harness, **not the compiled full application**. No provider keys, remote DB or production deployment were involved.

| Probe | Node | Compiled workerd harness |
| --- | --- | --- |
| Request abort only | query succeeded after 6,099 ms; abort at 186 ms | query succeeded after 6,035 ms; abort at 127 ms |
| Abort plus existing scope cleanup (`end({timeout:1})`) | read rejected after 1,129 ms | read rejected after 1,136 ms |

A repeated workerd forced-close probe rejected after 1,115 ms, but an independent `pg_stat_activity` query still found the backend **active / PgSleep at 5.35 seconds**. Thus closing the client and observing a rejected read does not establish database cancellation within the five-second tool ceiling. `Promise.race` would not repair this. Existing reads/session/admission calls do not consume the Request signal; cleanup currently runs when the request callback finishes.

This is evidence that the existing abort/cleanup primitive is insufficient, not proof that an explicit cancellation design cannot work. A follow-up must implement and verify actual per-request query cancellation (including session and rate-limit reads, queued work and Node isolation), await settlement before resource cleanup, and repeat the latency gate in the full compiled application before enabling tools. The installed postgres driver exposes pending-query cancellation, but Drizzle's current read interface does not expose that handle; driver-level cancellation has **not** been implemented or verified here. Budgets were not raised and no dependency pins changed.

Per the user's explicit instruction to stop and report a failing spike gate, dependent implementation stopped. Provider/tool mocks, first-content performance, full build/check/typecheck, parity, Assistant page verification and preview deployment remain unverified for task 003. No feature/privacy documentation claims or acceptance ticks were added. Local evidence is under `/tmp/tenboards-003-gate/`; the disposable harness is `.wrangler/003-gate/probe.ts` (gitignored).

### Round 2 — database-enforced cancellation (2026-11-06)

Baseline `088d2ea`; fresh branch `feat/v0.10/003-data-tools`. The old local branch was renamed to `feat/v0.10/003-data-tools-round-1` with explicit user approval; it was not pushed or deleted.

**Gate still fails the literal read-rejection ceiling; step 2 remains paused.** A candidate implementation now supplies transaction-local `statement_timeout` and `idle_in_transaction_session_timeout` equal to min(5,000 ms, remaining invocation/request deadline), tracks postgres pending queries below Drizzle, cancels them on abort/deadline, and awaits read/transaction settlement before request cleanup. `getDatabase()` uses an AsyncLocalStorage transaction override, leaving ordinary reads on their existing client. A shared, currently unwired `executeToolRead` independently guards and charges each invocation and checks abort/deadline before session, admission and data work. No feature endpoint has been enabled.

A temporary `/api/003-probe` route called this execution boundary with the real session and admission functions, followed by `getDatabase().execute(sql\`select pg_sleep(6) /* tenboards_003_round2 */\`)`. It used the disposable PostgreSQL 17 cluster on loopback port 35473 (migrated locally), no provider credentials. The abort case aborted the probe Request signal after 100 ms. The timeout case did not abort early. A separate postgres connection polled `pg_stat_activity` every 25 ms, excluding its own backend, and observed the marked query active before cancellation. Backend times below are measured from the observer's HTTP request start; rejection times are measured inside the handler before calling the guarded execution boundary. Cold Node route compilation is not included in handler timing.

| Runtime | Case | Read rejected at | Last observed active | First confirmed inactive |
| --- | --- | ---: | ---: | ---: |
| Node, full app (`npm run dev`, actual local node_modules) | abort at 100 ms | 105 ms | 167 ms | 192 ms |
| Node, full app | timeout only | **5,005 ms** | 4,989 ms | 5,015 ms |
| Full compiled app (`npm run build` + `npm run preview`, workerd) | abort at 100 ms | 109 ms | 175 ms | 202 ms |
| Full compiled app, workerd | timeout only | **5,003 ms** | 4,981 ms | 5,008 ms |

Both runtimes pass the backend-inactive bound of 5,500 ms and early-abort settlement, fixing the original still-active-backend failure. They do **not** pass the separate literal requirement to reject within 5,000 ms: statement cancellation, driver propagation and transaction rollback/settlement take several milliseconds beyond that deadline. No tolerance was silently introduced, budget raised, or early Promise.race rejection substituted for settlement. Reviewer decision is needed on reserving a small settlement margin inside the five-second budget versus explicitly accepting measured settlement overhead; the current decision specifies the timeout as min(5,000 ms, remaining deadline).

The temporary route was removed and routes regenerated; no debug route ships. Local probe source/observer are retained under `.wrangler/003-gate/` (gitignored); build and runtime logs are under `/tmp/tenboards-003-gate/round2-*`. The compiled probe build passed. Provider preflight, registry/projections/shared DTO, v2 SSE, refresh endpoint, adapter mocks, injection tests, parity, Assistant page verification and preview deployment are intentionally not implemented/claimed after this failed gate. Acceptance remains unchecked; PLAN and dependency pins are unchanged.

Post-probe verification after removing the temporary route: `npm run build`, `npm run check`, `npm run typecheck`, `npm run assistant:test` (1,047 assertions plus six reference fan-out attacks), and `git diff --check` passed. Check retains inherited diagnostics. README: no change needed because tools remain unwired and no user-visible behavior/commands are enabled; no completed-feature claims were added to README, assistant docs, CHANGELOG or milestone status. No PR or preview deployment was created at the failed gate. Candidate code and this evidence are retained locally for review; the test server and disposable database were stopped.

### Round 3 — settlement margin gate (2026-11-06)

Rebased round 2 onto `origin/main` (including task 002). Applied the reviewer's `min(4,750 ms, remaining deadline − 250 ms)` transaction timeout and skipped transaction reads with less than 500 ms remaining, checking again after acquiring the transaction. No budget was increased. The same temporary full-app route, real guarded `executeToolRead`, PostgreSQL 17 cluster, and independent 25 ms `pg_stat_activity` observer from round 2 were reused.

| Runtime | Case | Read rejected at | Last observed active | First confirmed inactive |
| --- | --- | ---: | ---: | ---: |
| Node, full app (`npm run dev`, local dependencies) | abort at 100 ms | 104 ms | 114 ms | 139 ms |
| Node, full app | timeout only | 4,760 ms | 4,750 ms | 4,780 ms |
| Full compiled app (`npm run build` + `npm run preview`, workerd) | abort at 100 ms | 104 ms | 157 ms | 189 ms |
| Full compiled app, workerd | timeout only | 4,752 ms | 4,742 ms | 4,769 ms |

**Gate passes**: rejection ≤ 5,000 ms and backend inactive ≤ 5,500 ms on both runtimes. Timings retain round-2 definitions (handler time for rejection, observer request start for backend times). Local evidence: `/tmp/tenboards-003-gate/round3-{node,worker}-results.jsonl`, `round3-probe-build.log`, `round3-node.log`, and `round3-preview.log`. No real provider keys or remote database were used. Passing this gate does not establish the remaining task 003 acceptance criteria.

#### Sequential statements expose a remaining cancellation failure — dependent work stopped

The required single-`pg_sleep(6)` probe above passes. However, inspection before wiring the registry showed that the existing typed adapters execute multiple statements sequentially. A follow-up used the **same guarded path**, adding an awaited `getDatabase().execute` of `select pg_sleep(0.3)` immediately before the marked six-second statement. This is two sequential reads within one invocation, not two tool invocations. The invocation's five-second ceiling must still hold.

| Runtime | Read rejected at | Last marked statement observed active | First confirmed inactive |
| --- | ---: | ---: | ---: |
| Node full app | **5,002 ms** | 4,989 ms | 5,017 ms |
| Full compiled app, workerd | **5,004 ms** | 5,008 ms | 5,035 ms |

The backend bounds pass, but the invocation rejection ceiling fails on both runtimes. `SET LOCAL statement_timeout` applies separately to each statement; setting it once at transaction entry does not reserve settlement time at the end of a multi-statement read. After the first 300 ms statement, the second statement still receives the original approximately 4,750 ms timeout. The driver cancellation timer fires at the five-second deadline and settlement lands after it. This is a different failure from the original single-statement round-2 overshoot. No artificial tolerance, Promise.race, or raised budget was introduced.

**Step 2 remains paused per the instruction to stop with evidence on a failed ceiling check.** A follow-up should recompute the remaining settlement budget before each statement (including queued acquisition), and reserve settlement time for the secondary cancellation path, then repeat both single- and multi-statement probes. No endpoint or refresh path is enabled. The short-lived registry draft was removed; task 002's shared contract is untouched. No feature acceptance boxes, README/assistant docs/CHANGELOG completion claims, PR, or deployment were created.

Reproduction: start the same temporary route from round 2 with two awaited `db.execute` calls inside `executeToolRead`, first `select pg_sleep(0.3)`, then `select pg_sleep(6) /* tenboards_003_round2 */`; run the independent observer against Node and a fresh `npm run build` + `npm run preview`. Probe source is retained in `.wrangler/003-gate/sequential-route-probe.txt`; local evidence is `/tmp/tenboards-003-gate/round3-sequential-{node,worker}-results.jsonl`, `round3-sequential-build.log` and `round3-sequential-preview.log`. The 100 ms abort follow-up rejects at 106 ms on both runtimes but precedes the marked second query, so it is not claimed as backend-observation evidence for that query. A transient Node hot-reload warm-up returned HTTP 500 (`getRequest is not a function`); the subsequent timed observations returned the explicit probe JSON shown above. All temporary routes were removed and routes regenerated before final checks.

Post-probe clean verification: `npm run build`, `npm run check` (inherited diagnostics), `npm run assistant:test` (1,047 assertions, blocks-library checks and six fan-out attacks), and `git diff --check` pass. `npm run typecheck` fails with twelve TS2339 diagnostics at `src/lib/assistant/language.ts:264`, where the three-key result-kind map is indexed by the full node-name union. This exact code is present on rebased main `6018dd41035c832789b356289fde3281eefb0c05` and was not modified here. Full adapter mocks, data parity, Assistant page verification, feature/privacy documentation and preview deployment remain unverified/unimplemented after the sequential-read failure. README: no change needed for this unwired cancellation candidate and evidence-only continuation.

### Round 4 — whole-call deadline and implementation (2026-11-06)

Rebased with sign-off onto `82403bd` (includes `7d3f848`); the inherited language typecheck error is resolved. The driver seam now serializes timeout setup with each statement, recomputes remaining call time minus 250 ms, refuses statements below 500 ms remaining, and retains cancellation/settlement before cleanup. PostgreSQL `server_version_num` gates `transaction_timeout` at version 17. Its budget is the full remaining call time; the statement timeout reserves settlement within it. Timeout failures have a safe visible timeout code.

The same real `executeToolRead` full-app probe ran against the isolated PostgreSQL 17.11 cluster, with single `pg_sleep(6)` and sequential `pg_sleep(0.3)` + marked `pg_sleep(6)` reads. Independent 25 ms activity observations ran serially per runtime. Two repeats of each case passed:

| Runtime | Case | Rejection ms | First confirmed inactive ms |
| --- | --- | --- | --- |
| Node full app | single | 4753, 4763 | 4785, 4778 |
| Node full app | sequential | 4753, 4753 | 4776, 4791 |
| Full build + preview, workerd | single | 4756, 4754 | 4844, 4762 |
| Full build + preview, workerd | sequential | 4753, 4754 | 4783, 4782 |

**Gate passes**: rejection ≤5000 ms and inactive ≤5500 ms. Rejection uses handler start; activity uses observer HTTP request start, as in prior rounds. Evidence: `/tmp/tenboards-003-gate/round4-{node,worker}-isolated-results.jsonl`, `round4-probe-build.log`, and `round4-preview-final.log`. Temporary probe source is `.wrangler/003-gate/route-probe.txt`; it was removed from routes and never deployed.

An initial candidate incorrectly gave transaction termination the same shortened budget as statement cancellation. Its warm-up could terminate the connection before statement settlement, producing a postgres driver write error and about 5.8 s HTTP completion. The final candidate keeps the transaction backstop at the full call budget and the statement/secondary-cancel settlement reserve at 250 ms. Isolated repeats above supersede that candidate. Earlier overlapping observers could see each other's identical markers; those observations were discarded, not counted as evidence. Initial Request-wrapper/HMR setup failures also did not reach the timed read.

Step 2 now implements the five projections, existing shared contract, independently guarded calls, native planning/final phases, v2 snapshots with v1 compatibility, normal source selection in recorded mode, and model-free refresh. Finance exposes audited expense observations without filling sparse income with invented zeros; CRM labels monthly observations as YYYY-MM. No dependency or SDK pins changed. The preparatory changes are limited to provider construction, bounded JSON input, and the existing transaction seam.

Verification: build/check/typecheck and Assistant tests pass, including new injection/schema/token/wire/transport checks. Five installed adapters pass fragmented native calls/results/final text on Node and the full compiled workerd endpoint; workerd also covers multiple calls, unknown/invalid/fifth-call rejection, forbidden final tool calls and aggregate wire overflow across planning/final. Five installed adapters separately reject aborted planning with late native calls on Node and compiled workerd. All five guarded projections match demo/DB, missing sessions reject, and configured DB errors remain visible. `data:parity`: 29 reads / 211 scenarios pass on the seeded disposable local DB. `/dashboard/assistant` passes light/dark × desktop/mobile with zero WCAG axe violations and zero runtime errors; recorded-chart interaction captures also pass WCAG/runtime checks. An unrestricted axe scan separately reports existing desktop sidebar `region` best-practice findings on the brand link and demo card, outside the affected content. Evidence is gitignored under `verify/` and `/tmp/tenboards-003-gate/round4-*`.

No real provider account, hosted Hyperdrive, or PostgreSQL <17 runtime was tested. Older-server support is version-gated in code. Canvas refresh controls and targeted editing remain task 004. PLAN, protected primitives, dependencies and production are unchanged.

Delivery: PR #86; isolated preview version `00e364fc-3be7-49e8-a1da-e50bba85dc18`, https://00e364fc-tenboards-preview.mohanadgh.workers.dev (alias https://pr-86-tenboards-preview.mohanadgh.workers.dev). `preview:deploy` verified remote ASSETS-only bindings and no secrets. A remote smoke confirmed Recorded demo, v2 demo-source revenue beginning at 4820, and successful finish. Production was not deployed.

## v0.10 / 004 — Remaining assistive-technology review (2026-11-06)

PR #87 implements the canvas and passes automated verification: 148 full-catalog four-state axe/runtime checks, hosted Assistant verification, keyboard controls, accessible names/regions/status announcements, reduced motion, recorded create/edit/refresh, five synthetic provider adapters, identity/stale-patch/Stop/session tests and all npm Assistant suites. The preview is recorded-only with ASSETS and no secrets.

A hands-on VoiceOver/NVDA interaction pass was not performed. The screen-reader portion of task 004's accessibility acceptance remains unchecked for reviewer verification; browser accessibility-tree inspection and axe are the available evidence, not a claim of an actual screen-reader session. No implementation decision or scope expansion is pending. Evidence: https://github.com/moeghashim/tenboards/tree/pr-assets/pr-87.

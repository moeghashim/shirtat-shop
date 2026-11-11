# v0.3 — App pages

Status: **in review — implementation and acceptance complete pending merge**. Tasks 001–007 (PRs #27–#33) are merged and deployed. Tasks 008–014 await Claude Opus 5.5 review and authorized squash merges in stack order. The milestone is not marked done; the reviewer owns stack rebases, production redeploy and release. PLAN.md and its Decisions log remain authoritative.

## Brief and boundaries

Developers evaluating or cloning tenboards need consistent app-page demos that preserve the complete screen catalog and current interactions. Use **Operate mode**, PLAN §7 and the established v0.1/v0.2 language: Geist typography, compact density, neutral surfaces, semantic status colors, one action accent, restrained depth, tabular data and purposeful 150–200ms motion. Restructure mobile layouts and scroll tables/panes locally; do not hide content to make screenshots fit.

One small foundation is justified by repeated title/description/action markup in File Manager, Products and Invoice. Task 001 adds a page header with h1 semantics and proves it on File Manager and Products only. Existing dashboard `SectionHeader` serves card h2/h3 semantics; retain it, `DashboardCard`, `StatCard` and the shared chart theme. Do not create competing primitives, a generic CRUD framework or decorative charts. Add no other shared app-page primitive without demonstrated reuse. Keep route-owned data and behavior local.

Preserve all URLs, standalone Mail/Chat and their dashboard iframe wrappers, query views, tabs, forms, mock data relationships, demo/placeholder actions and zero-config operation. No backend, Better Auth, RBAC, storage service or real CRUD expansion. No shell/sidebar/header/palette/settings redesign, font/preferences registry churn, new runtime dependency, generated-file edit or PLAN edit. Keep `src/components/ui/` intact.

Calendar may be restyled through tokens and usage sites without changing its behavior. **Structural edits inside `src/components/calendar/` require a specific proposed diff/rationale in task 004 and open questions, plus reviewer approval before that dependent work.** This is a narrow exception to the prior blanket calendar boundary, not approval to rewrite the component.

The external `/` currently redirects to `/dashboard/default`; it renders no landing UI. Task 013 verifies that behavior rather than inventing a landing-page task. Root error and root not-found are boundary components, not generated routes; they have explicit supplemental capture ownership.

## Definition of Done

- [x] Every app page and system state in the ownership matrix is restyled without dropping routes, content, variants or current interactions; dashboards and shell remain consistent.
- [x] Shared app-page header is small, typed and proven by real consumers; existing dashboard primitives/chart theme are reused where appropriate and protected UI wrappers remain intact.
- [x] Calendar, Invoice, Auth V2 login and Auth V2 register each have **no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile**. Fix demonstrated root causes only: no suppressHydrationWarning, no SSR disabling, no frozen clocks. Direct/refresh, real-time delayed hydration and timezone checks accompany the ordinary matrix.
- [x] Every remaining upstream-author identity in app-page fixtures is replaced by neutral demo data in its owning task, including names, handles, emails, initials, internal identifiers and profile prose. Final `rg -n -i 'arham|arhamkhnz' src` has zero matches. LICENSE, README and docs attribution remain intact.
- [x] Every task provides before/after light/dark × desktop/mobile screenshots for all affected URLs and meaningful interactive states, plus build/check/typecheck, error-free dev default/owned-route smoke, Workers smoke, version-specific preview and reusable alias.
- [x] Final acceptance covers every catalog route on dev and Workers across Default/Graphite/Pine/Iris × light/dark × desktop/mobile: currently 38 × 4 × 2 × 2 = **608 cases per environment, 1,216 total**, plus boundary and variant scenarios. Root not-found/root error, iframe contents and query/tab/print states cannot be omitted because they are absent from the base capture list.
- [x] Keyboard access, names, visible focus, heading structure, form feedback, responsive overflow, reduced motion and actual status/event/chart contrast pass documented spot checks. Run the existing supported-token audit across all presets/themes; do not claim a complete accessibility audit from scoped checks.
- [x] README is updated in every relevant task PR with `README: updated (sections …)`. Final acceptance adds CHANGELOG v0.3, updates README screens/status, records truthful milestone/task status, and reconciles every historical hydration entry with verified resolutions.
- [ ] Claude Opus 5.5 reviews every task PR and holds delegated squash-merge/rebase authority. Only the reviewer merges, redeploys production and performs the milestone version/tag/release. Implementers retain in-review status until merges occur.

## Route and ownership matrix

All paths below are exact filesystem paths relative to `src/routes/`; parenthesized groups do not create URL segments. All 38 catalog entries are listed, including 14 previously restyled dashboards for regression. “Gate” means the locked inherited-hydration requirement, not a waiver on other routes.

| URL / state | Owner | Source | Extra coverage |
| --- | --- | --- | --- |
| `/mail` | 002 | `(main)/mail/route.tsx`, `-components/` | Standalone resize/list/detail/mobile drawer |
| `/dashboard/mail` | 002 | `(main)/dashboard/mail/route.tsx` | Iframe content/theme/focus and new-tab link |
| `/chat` | 003 | `(main)/chat/route.tsx`, `-components/` | Thread/back/contact panel and sheet |
| `/dashboard/chat` | 003 | `(main)/dashboard/chat/route.tsx` | Iframe content/theme/focus and new-tab link |
| `/dashboard/calendar` | 004 | `(main)/dashboard/calendar/route.tsx`, `-components/` | **Hydration gate**; Month/Week/Day, Today, popovers |
| `/dashboard/kanban` | 005 | `(main)/dashboard/kanban/route.tsx`, `-components/` | `view=board/list/table`, drag/cancel/order |
| `/dashboard/tasks` | 006 | `(main)/dashboard/tasks/route.tsx`, `-components/` | Search/filters/selection/columns/pagination |
| `/dashboard/invoice` | 007 | `(main)/dashboard/invoice/route.tsx`, `-components/` | **Hydration gate**; editor/preview/print |
| `/dashboard/file-manager` | 008; 001 header only | `(main)/dashboard/file-manager/route.tsx`, `-components/` | `view=grid/list`, folders/metadata/actions |
| `/dashboard/products` | 009; 001 header only | `(main)/dashboard/products/route.tsx`, `-components/` | Filters/add/edit/duplicate/image field |
| `/dashboard/users` | 010 | `(main)/dashboard/users/route.tsx`, `-components/` | Directory filters/selection/actions |
| `/dashboard/roles` | 010 | `(main)/dashboard/roles/route.tsx`, `-components/` | Roles/Permission Sets/Access Reviews tabs |
| `/dashboard/profile` | 011 | `(main)/dashboard/profile/route.tsx`, `-components/` | Overview/Personal/Employment/Compensation/Time off/Documents |
| `/auth/v1/login` | 012 | `(main)/auth/v1/login/route.tsx` | Shared forms in `(main)/auth/-components/` |
| `/auth/v1/register` | 012 | `(main)/auth/v1/register/route.tsx` | Validation, password and social/demo states |
| `/auth/v2` | 012 | `(main)/auth/v2/route.tsx` | Bare layout-only path, no new redirect |
| `/auth/v2/login` | 012 | `(main)/auth/v2/login/route.tsx` | **Separate hydration gate** |
| `/auth/v2/register` | 012 | `(main)/auth/v2/register/route.tsx` | **Separate hydration gate** |
| `/dashboard/coming-soon` | 013 | `(main)/dashboard/coming-soon/route.tsx` | Correct inherited not-found heading |
| `/dashboard/$` | 013 | `(main)/dashboard/$.tsx` | Capture `/dashboard/capture-not-found` |
| `/unauthorized` | 013 | `(main)/unauthorized.tsx` | Recovery link; no auth behavior change |
| `/` | 013 verification | `(external)/index.tsx` | Redirect to `/dashboard/default`; no landing UI |
| `/dashboard` | 013 verification | `(main)/dashboard/route.tsx` | Existing dashboard redirect/layout |
| `/dashboard/` | 013 verification | `(main)/dashboard/index.tsx` | Existing index redirect |
| `/dashboard/default` | 014 regression | `(main)/dashboard/default/route.tsx` | Required smoke in every task |
| `/dashboard/default-v1` | 014 regression | `(main)/dashboard/(legacy)/default-v1/route.tsx` | Legacy content retained |
| `/dashboard/crm` | 014 regression | `(main)/dashboard/crm/route.tsx` | Charts/tables |
| `/dashboard/crm-v1` | 014 regression | `(main)/dashboard/(legacy)/crm-v1/route.tsx` | Legacy content retained |
| `/dashboard/finance` | 014 regression | `(main)/dashboard/finance/route.tsx` | Prior hydration resolution retained |
| `/dashboard/finance-v1` | 014 regression | `(main)/dashboard/(legacy)/finance-v1/route.tsx` | Prior hydration resolution retained |
| `/dashboard/analytics` | 014 regression | `(main)/dashboard/analytics/route.tsx` | Charts/tables |
| `/dashboard/analytics-v1` | 014 regression | `(main)/dashboard/(legacy)/analytics-v1/route.tsx` | Legacy content retained |
| `/dashboard/productivity` | 014 regression | `(main)/dashboard/productivity/route.tsx` | Prior hydration resolution retained |
| `/dashboard/ecommerce` | 014 regression | `(main)/dashboard/ecommerce/route.tsx` | Charts/order table |
| `/dashboard/academy` | 014 regression | `(main)/dashboard/academy/route.tsx` | Schedule/performance |
| `/dashboard/logistics` | 014 regression | `(main)/dashboard/logistics/route.tsx` | Shipment split panes/mobile sheet |
| `/dashboard/infrastructure` | 014 regression | `(main)/dashboard/infrastructure/route.tsx` | Grouped environments |
| `/dashboard/patient-monitoring` | 014 regression | `(main)/dashboard/patient-monitoring/route.tsx` | Prior hydration/live clock/reduced-motion resolution |
| Root not-found (additional state) | 013; 014 regression | `-components/not-found.tsx`, wired in `__root.tsx` | Unknown external path `/capture-not-found`; verify HTTP semantics |
| Root error (additional state) | 013; 014 regression | `-components/root-error.tsx`, wired in `__root.tsx` | Actual boundary via controlled QA fault, reset/recovery; no public error route |

Task 014 re-derives coverage from route files, generated metadata and `src/navigation/route-catalog.ts`. The root boundary wiring is inspected, not a reason to rewrite `__root.tsx`. Any supplemental fault harness remains QA-only; expected injected errors are recorded separately from unexpected smoke failures.

## Execution order and rationale

Task 001 is the shared foundation dependency; tasks 002–013 own independent page code after it. Their order below is the recommended sequence, not permission to introduce cross-page domain dependencies. Task 014 requires all prior tasks verified. Prefer one task from updated main at a time; any approved stack targets main and declares base PR, merge order and layer compare URL. Use `feat/v0.3/NNN-slug`, one commit per stacked layer, Conventional Commits, `git commit -s` and the required GPT-6-Astra co-author trailer.

1. [001 — Establish a small app-page header foundation](001-app-page-foundation.md): No v0.3 dependency; v0.1/v0.2 are merged. Establish the one demonstrated shared need before page composition work.
2. [002 — Restyle standalone and embedded Mail](002-mail-pages.md): After 001 by default. Resolve the split-pane communication pattern before the related Chat layout.
3. [003 — Restyle standalone and embedded Chat](003-chat-pages.md): After 002 by default. Reuse communication layout lessons while preserving Chat’s distinct thread/contact workflow.
4. [004 — Restyle Calendar and fix hydration](004-calendar-page.md): After 001; execute after communications by default. Address the protected-adapter boundary and mandatory hydration diagnosis early.
5. [005 — Restyle Kanban board, list and table](005-kanban-page.md): After 004 by default (hard dependency 001 only). Settle multi-view task/status presentation before the simpler Tasks ledger.
6. [006 — Restyle Tasks and its filtering workflow](006-tasks-page.md): After 005 by default (hard dependency 001). Carry status and density conventions into the table workflow without coupling the two data models.
7. [007 — Restyle Invoice and fix hydration](007-invoice-page.md): After 006 by default (hard dependency 001). Resolve the second date-heavy page and reuse the proven heading/form presentation conventions.
8. [008 — Restyle File Manager grid and list](008-file-manager-page.md): After 007 by default (hard dependency 001). Complete the first foundation consumer with paired card/table treatment.
9. [009 — Restyle Products and product editors](009-products-page.md): After 008 by default (hard dependency 001). Apply the established inventory/table language to the more interactive catalog editors.
10. [010 — Restyle Users and Roles](010-users-roles-pages.md): After 009 by default (hard dependency 001). Apply proven table/form conventions to the related identity and permission-demo screens together.
11. [011 — Restyle Profile and neutralize its demo identity](011-profile-page.md): After 010 by default (hard dependency 001). Complete the detailed identity surface after the directory/role hierarchy is settled.
12. [012 — Restyle Auth V1/V2 and fix V2 hydration](012-auth-pages.md): After 011 by default (hard dependency 001). Keep shared form/layout work together, with separate nonwaivable gates for each V2 child.
13. [013 — Restyle system states and verify entry redirects](013-system-pages.md): After 012 by default (hard dependency 001). Finish uncommon system/entry states and their evidence seams before the full-route gate.
14. [014 — Verify complete v0.3 app and route acceptance](014-app-pages-acceptance.md): Hard dependency: 001–013 verified. Close coverage and documentation only after every owned page and hydration gate passes.

## Planning inspection and evidence

Baseline: main `1815a6b`, 2026-10-23, package version 0.2.0. Root AGENTS/PLAN, PRODUCT/DESIGN were read in full; Impeccable context ran once from the repository root. This is a settled planning brief in Operate mode, with no UI edits and no need to read the craft floor until implementation. Affected route compositions, adapters, state seams and fixture identity references were inspected. No implementation prefactor was performed; each task names its narrow inspection seam.

`npm run screenshots` captured the 24 non-dashboard catalog entries plus `/dashboard/default` in Default light/dark × desktop/mobile: **100/100 dev cases pass** (92 primary plus 8 dashboard splat/index supplemental cases). Planning evidence, raw PNGs, contact sheets and logs are retained under [pr-assets/v0.3-breakdown](https://github.com/moeghashim/tenboards/tree/pr-assets/v0.3-breakdown). These are incumbent captures, not v0.3 acceptance. Before/after is not claimed because this PR changes no UI. Historical Workers hydration failures remain mandatory even though the ordinary local capture passes.

| Inspected evidence | Consequence for the plan |
| --- | --- |
| File Manager, Products and Invoice repeat page title/description/action groups; Tasks starts with a welcome h2. | One h1 page-header foundation; do not duplicate existing card header semantics or make every specialist screen use it. |
| Mail/Chat have standalone full-height panes and iframe wrappers; mobile initially shows lists and relies on drawers/sheets or sliding thread panels. | Each task owns both URLs and inner iframe behavior; test nested scrolling, responsive transitions and focus, not just the outer screenshot. |
| Calendar mobile compresses the month grid and event text; adapter has many configurable class/options hooks. | Prioritize actual event text/control contrast, crowding/popovers and supported options; separate any structural approval from styling. |
| Invoice has dense editable fields beside a fixed paper preview; mobile content is tall. Date defaults are constructed at module time. | Preserve editor/preview/print agreement and diagnose the recorded text mismatch; inspect below-fold controls and print output. |
| Kanban has independent board/list/table state; Products/Users/Roles/Tasks have distinct filtering/selection semantics. | Keep each domain state local, retain all variants and no-result states, standardize only presentation and accessible controls. |
| Profile visibly retains the author identity and long bio; Mail, Chat, Calendar, Kanban, Invoice and File Manager also contain author fixtures. | Assign seven concrete identity cleanups to their owning tasks and audit every other task, then scan the whole src tree at acceptance. |
| V1/V2 auth variants share forms; V2 has absolute top/bottom links and a large accent panel. Bare V2 is layout-only. | One tightly related Auth task, with five URL captures, narrow/short-height inspection and separate login/register hydration gates. |
| Coming Soon currently says “Page not found”; root error and not-found are separate components outside the generated catalog. | System-state task fixes the heading and adds supplemental boundary coverage rather than assuming base route screenshots cover errors. |

Root not-found and RootError source were inspected. The live production root not-found render was also inspected in the T3 browser (1280×800 light); its expected HTTP 404 and browser-host Electron preload diagnostics are kept separate from app smoke results. A controlled real root-error render was not induced during this no-code planning pass. Task 013 must capture both boundaries before editing, and task 014 must include them on dev and Workers. Ordinary capture does not exercise alternate tabs/query states or interactions; each owning task explicitly adds those states. No speculative root cause is treated as resolved.

Build and typecheck pass. Baseline `npm run check` fails on **one existing package.json formatting error** (the release-formatted `lint-staged` array); SHA comparison confirms the file is identical to HEAD. It separately reports one inherited `src/lib/highlighter.tsx` array-index-key warning and six informational diagnostics. Build emits inherited dependency `use client` directive warnings; dev emits the inherited Base UI mixed animation/transition warning. Exact logs accompany the PR. No code or package formatting is changed in this docs-only scope.

## Open questions and approval boundaries

Current disposition: the planning notes below are historical. The package-format issue was fixed on main; every hydration finding is resolved with evidence in `dev/open-questions.md`. No product/access blocker remains. Implementation and acceptance are complete, with batch B in review pending Claude’s merges.

- The inherited package.json formatting failure is recorded in [open questions](../../open-questions.md). Reviewer must resolve it in an authorized change or explicitly decide disposition for this docs PR; the failing check is not represented as a warning or pass.
- No new product/design question blocks this breakdown. Calendar structural work remains a conditional reviewer approval boundary, not a speculative required rewrite.
- Calendar/Invoice/Auth V2 hydration fixes are already required by the locked decision. Diagnosis remains implementation work in 004/007/012; no renewed waiver or frozen-clock workaround is planned. Final 014 reconciles all historical entries only after verified fixes.
- This PR stops at the task breakdown. It neither starts implementation nor requests merge/deploy/release action from the implementing agent.

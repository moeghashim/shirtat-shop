# Changelog

## v0.10.0 — Generative dashboards (2026-11-06)

Released as [v0.10.0](https://github.com/moeghashim/tenboards/releases/tag/v0.10.0).

### Blocks as the OpenUI library (002)

- Add strict public-block OpenUI wrappers, stable-ID panels, responsive grids, area charts and a read-only public table adapter. Preserve legacy recorded replies and the Stack root.
- Add bounded version-1 inert reference/result contracts and validated-tree/serializer seams, with eight-panel/four-reference caps and regression tests. No dependency upgrade, renderer fetching or native Query/Mutation.
- Add the illustrative “Show sample blocks” recorded example.

### Read-only data tools (003)

- Add five guarded dashboard series, two-phase native tools for all providers, recorded data references, v2 SSE snapshots and a model-free refresh resolver. Preserve the normal demo/DB selector, bounded budgets and whole-call database cancellation.

### Dashboard canvas (004)

- Add the full-width canvas with stable panel identity, model-free refresh and atomic single-panel replace/add edits, three discoverable recorded dashboards, stale-data recovery and honest available/all capability labels. No new dependency or provider keys.

## v0.9.1 — Project homepage (2026-10-27)

Released as [v0.9.1](https://github.com/moeghashim/tenboards/releases/tag/v0.9.1).

- Replace the root redirect with a public SSR homepage focused on the agent workflow, skills, generators, blocks and guardrails, with GitHub as the primary action and Default as the live demo.
- Include current light/dark dashboard captures, the actual stack and screen inventory, copyable quick start, route-specific metadata and a shared theme switcher.
- Preserve dashboard entry redirects, auth fallbacks, brand and recovery destinations; update root-route verification and document how adopters restore the redirect.

## v0.9.0 — Agent-ready template (2026-10-26)

Released as [v0.9.0](https://github.com/moeghashim/tenboards/releases/tag/v0.9.0).

### Public blocks and kit (001)

- Promote typed, TSDoc-documented presentation blocks to `@/components/blocks`; migrate existing imports without changing page markup or behavior.
- Add a caller-owned TanStack Table block with sorting, pagination, empty recovery and labelled mobile reflow.
- Add `/dashboard/kit` under Developer and in the command palette, with executable examples, variants and copyable source. Protected UI/calendar primitives remain unchanged.

### Page generators (002)

- Add `new:dashboard` and `new:page` with editable block-based templates, typed illustrative reads, guarded loaders, sidebar/catalog/parity registration, slug validation and overwrite protection.
- Export the kit's chart composition primitives and CardContent through the blocks barrel so generated routes use only the public presentation API; no runtime dependency added.
- Add `generators:test`: disposable generation, safe-failure checks, build/check/typecheck/data parity and four-state browser/screenshot verification; generated samples stay out of the repository.

### Design guardrails and verification (003)

- v0.9 guardrail review: accept token references and grid composition, keep inherited exceptions in JSON, and name shell/Default controls without changing their appearance.
- Add `check:design` to the standard check: route/block token checks, Recharts boundary, primitive-card import restrictions and documented card/page-header heuristics, with counted exceptions and seeded regression fixtures.
- Route existing Recharts primitives through the public chart block without changing page markup or tokens.
- Add `verify:page` for a single route or the route catalog: four-state screenshots, WCAG 2.2 AA axe scans, console/hydration diagnostics and gitignored JSON reports. Inherited accessibility findings remain reported failures, tracked separately from this tooling change.

### Adopter guide and Agent Skills (004)

- Move upstream workflow rules verbatim to dev/MAINTAINERS.md; root AGENTS.md now guides adopters, with a CLAUDE.md import.
- Add build-ui and connect-data skills, on-demand references and relative Claude mirrors, with review-backed gotchas.
- Add dependency-free check:skills metadata/reference/mirror validation to npm run check.

### shadcn registry and LLM documentation (005)

- Publish nine self-contained registry items with source-derived default tokens, compact CSS, bundled UI/chart helpers and declared package dependencies; add registry build/freshness commands.
- Generate static llms.txt, llms-full.txt and linked adopter docs from the block inventory, scripts, skills and source; fail the standard check on drift.
- Add per-block JSON links and copyable, current-origin install commands to the kit. External installs use isolated tenboards component paths and apply the global default theme.


- Promote typed, TSDoc-documented presentation blocks to `@/components/blocks`; migrate existing imports without changing page markup or behavior.
- Add a caller-owned TanStack Table block with sorting, pagination, empty recovery and labelled mobile reflow.
- Add `/dashboard/kit` under Developer and in the command palette, with executable examples, variants and copyable source. Protected UI/calendar primitives remain unchanged.

### Inherited accessibility (006)

- Match accessible names to visible control text, name CRM discovery-call progress, and give Finance transactions list-item semantics.
- Make Analytics and Timeline table scrolling keyboard accessible with named regions and visible focus.
- Use existing supported text/success token pairs for inactive tabs and the New navigation badge; give CRM/Ecommerce pagination accurate disabled semantics. No token values or protected primitives change.

## v0.8.1 — Default dashboard landing (2026-10-26)

Released as [v0.8.1](https://github.com/moeghashim/tenboards/releases/tag/v0.8.1).

- Restore `/dashboard/default` as the root/dashboard entry point, missing or unsafe auth return fallback, sidebar brand destination and global recovery destination. Preserve the existing 307/replace mechanism and validated returns.
- Keep workspace Home, its navigation position, Projects contextual Home links and all legacy redirects unchanged.
- Align redirect/auth/deploy checks and screenshot tooling with the landing destination.

## v0.8.0 — Projects workspace (2026-10-25)

Released as [v0.8.0](https://github.com/moeghashim/tenboards/releases/tag/v0.8.0).

- Make workspace Home the landing page for root/dashboard redirects and missing or invalid auth returns; preserve validated destinations and the revenue dashboard at `/dashboard/default`.
- Retain AI Assistant immediately after Chat in primary navigation, palette and the route inventory.
- Remove the former local Kanban drag-and-drop interaction as part of read-only project consolidation; Board shows all matching tasks and List retains pagination.

- Replace inherited generated ledger titles with neutral operations-rollout tasks; repeat seeds preserve IDs and update both legacy and canonical copies.

- Add a read-only workspace Home and searchable Projects index, with complete Overview, Board, List, Timeline and Files for each project.
- Share canonical tasks, scoped totals and request-relative sample dates across demo and database sources; preserve adopter dates, legacy rows and auth data through additive migration/backfill. Parity covers 29 reads / 211 scenarios.
- Use compact shared Select/ToggleGroup controls, avatar assignees, semantic status/priority cues, short task keys, KPI cards and live search. Timeline offers Gantt/Table/Calendar with a Today marker, bounded active range, status bars and collapsible unscheduled work.
- Add guarded nested project navigation, bounded localStorage disclosure persistence, named rail popovers, mobile sheet behavior and project-qualified command-palette destinations.
- Consolidate Kanban, Tasks, Calendar and File Manager into permanent guarded redirects; remove obsolete editable page compositions. Root/dashboard/auth fallbacks now use `/dashboard/home`; validated return destinations still win.
- Verify auth/RPC guards, migration preservation, Node/local workerd parity, redirect chains, keyboard/focus, real-clock hydration and the retained-route/project capture matrix across all four presets.
- Add explicit seeded-project selection to screenshot tooling and update usage/data/auth documentation. Review draft only: no version bump, tag, release, merge or production deployment.

## v0.7.0 — AI Assistant (2026-10-25)

Released as [v0.7.0](https://github.com/moeghashim/tenboards/releases/tag/v0.7.0).

- Complete transient conversation history, whole-pair context pruning, Regenerate, cancellation generations, safe recovery/countdowns, explicit provider-change handling and session-loss clearing. Verify synthetic Node/workerd modes and all four presets; no transcript persistence or live provider acceptance.
- Add guarded Assistant streaming for five direct provider adapters, server-only configuration, exact Origin/session checks, bounded input/output/deadlines and atomic DB or bounded local admission. Preview guard rejects AI configuration; adopter secrets preparation keeps keys outside builds.
- Add a native AI Assistant next to unchanged Chat with recorded summaries, comparisons and accessible charts.
- Bound and validate a read-only OpenUI vocabulary before rendering; exclude actions, tools, URLs and raw markup.
- Keep conversation state transient, with Send, Stop and New conversation. No provider access in this layer.
- Pin OpenUI 1.0.1, disable install/runtime telemetry and add adversarial stream/renderer checks.
- Allow isolated auth/Worker test ports without changing default ports.


## v0.6.2 — Compact density (2026-10-24)

Released as [v0.6.2](https://github.com/moeghashim/tenboards/releases/tag/v0.6.2).

- Make compact the shared default: 13px content text, smaller headings/KPIs, 28px desktop controls, 14px standard card padding, tighter tables/gaps, 36px sidebar rows and a 48px desktop header.
- Preserve the 16px rem root, chart/calendar geometry, 12px metadata, 24px minimum button targets, focus/contrast and reduced motion. Mobile retains larger spacing and controls.
- Preserve every font, theme preset and sidebar preference; add computed-density capture and font compatibility checks.
- Update DESIGN.md and the milestone contract. Draft only: no version bump, tag, release, merge or production deployment.

## v0.6.1 — Legacy removal (2026-10-24)

Released as [v0.6.1](https://github.com/moeghashim/tenboards/releases/tag/v0.6.1).

- Remove the Legacy sidebar/palette group, four V1 dashboard screens and Auth V1 forms; retain ten dashboards and Auth V2.
- Permanently redirect all six retired URLs with validated return destinations; use V2 for guards, links, sign-out and OAuth errors.
- Remove V1-only components, data queries, fixtures, seeds and 26 parity scenarios. Add migration `0014_remove_legacy.sql` to drop 13 exclusive tables and V1 metric rows without editing shipped migrations.
- Preserve current-screen data and v0.5 security boundaries; cover fresh/populated upgrades, repeated migrate/seed, 22 reads / 104 parity scenarios and redirect regressions.
- Hide the duplicate header toggle for collapsed desktop icon rails across all sidebar styles; retain mobile and hidden off-canvas openers, breadcrumb alignment, shortcuts and focus handoff.

## v0.6 — Template deployment readiness (2026-10-24)

Released as [v0.6.0](https://github.com/moeghashim/tenboards/releases/tag/v0.6.0). The project stays a zero-config live demo; adopters supply their own database. No project-owned Neon provisioning or hosted cutover is claimed.

- Scope Workers database and Better Auth instances to requests, preserving Node pooling and zero-config demo. Resolve Hyperdrive before direct URL and memoize only successful auth readiness.
- Isolate PR previews on demo-only `tenboards-preview`, with clean builds and config/remote binding and secret guards before upload.
- Add database-backed auth rate limits through migration `0013`, trusted Cloudflare IP policy, required hosted canonical HTTPS origin and Retry-After responses.
- Add explicit remote/TLS migration and seed opt-in, read-only deployment smoke with optional account round-trip, and an adopter runbook for atomic code/binding/secret staging and rollback.
- Add `deploy:prepare` for clean builds, generated Worker/binding validation and optional private 0600 auth-secret files outside the repository; print candidate/check/promotion commands without cloud or database operations.
- Generalize Neon/Hyperdrive setup with Worker/URL placeholders, a quick path, safe first-Worker bootstrap, optional OAuth and rollback guidance.
- Verify Node regressions, local workerd data/auth/concurrency/security, additive migration parity and full route/preset/hydration evidence. Local emulation does not prove hosted Neon/Hyperdrive pooling, TLS, cache or proxy behavior.

## v0.5 — Optional local authentication (2026-10-24)

Release: [v0.5.0](https://github.com/moeghashim/tenboards/releases/tag/v0.5.0)

- Add optional Better Auth with isolated Drizzle/Postgres auth tables and cumulative migration `0012`; zero-secret local and Workers demos remain available.
- Connect shared V1/V2 signup/login, explicit remember-me persistence, optional Google/GitHub initiation and validated app return destinations.
- Protect application routes and every callable app-data read; keep auth/system states public and validate generic UI-cookie RPCs.
- Show the real signed-in identity, sign-out and Account & security in the shell. Add name editing, credential password rotation and owned-session listing/revocation while preserving the sample Profile tabs.
- Add real-Docker Playwright authentication/security acceptance, configuration/provider/protection matrices, migration/bundle checks and optional-auth onboarding. Authentication grants shared template access; it does not add RBAC or business-data ownership.
- Production auth/Neon/Hyperdrive remain deferred to v0.6. No version bump, tag or release is made by this implementation stack.

## v0.4 — Optional local data layer (2026-10-23)

Release: [v0.4.0](https://github.com/moeghashim/tenboards/releases/tag/v0.4.0)

- Route all data-bearing app pages and 14 dashboards through 22 typed GET reads with zero-config demo or actual local Docker Postgres 17.
- Add normalized domain tables, ordered relationships, typed aggregate metrics, a linear Drizzle migration journal and repeatable transactional seeds.
- Preserve separate fixture identities, numeric precision, civil dates, request-relative Calendar/Invoice/Mail definitions, local actions and existing SSR/hydration fixes.
- Keep Patient Monitoring waveform/trend/tick simulation client-side while loading patient records, baselines, alarms and settings normally.
- Fail configured DB errors visibly without silent fallback or credential leakage; support explicit forced demo and lazy server-only DB access.
- Add exact read parity, source-fault/negative controls, runtime-boundary audit and full demo/DB/Workers capture coverage with explicit request references.
- Document optional database onboarding, migrations, reseeding and adding domains. Production remains demo-only; authentication and hosted Neon/Hyperdrive are future milestones.

All eight implementation tasks remain in review. No version bump, tag, release,
merge or production deployment is performed by the implementer.

## v0.3 — App pages (2026-10-23)

- Restyle Mail, Chat, Calendar, Kanban, Tasks, Invoice, File Manager, Products, Users/Roles, Profile, Auth V1/V2 and system states with compact typography, neutral surfaces, semantic states and responsive content.
- Preserve all 38 routes, standalone/iframe Mail and Chat, query views, six Profile tabs, directory tabs, forms, local demo actions and zero-config setup.
- Resolve Calendar, Invoice and both Auth V2 hydration findings through serialized request data; verify real clocks, delayed JavaScript, refresh and differing timezones.
- Replace remaining upstream-author fixtures with coherent neutral demo identities while preserving MIT attribution.
- Improve keyboard menus, focus return, field feedback and local table scrolling; preserve shell preferences and reduced-motion support.
- Verify 1,216 route/preset/theme/viewport cases on dev and Workers, plus iframe, query/tab/overlay/print, auth and real root-boundary recovery scenarios.
- Preserve root/dashboard redirects, root 404 semantics, generic production errors and UI-only authentication. Add no runtime dependencies, backend integration or public error trigger.

All 14 tasks are merged and deployed to https://tenboards.mohanadgh.workers.dev. Release: [v0.3.0](https://github.com/moeghashim/tenboards/releases/tag/v0.3.0).

## v0.2 — Dashboards (2026-10-23)

- Unify all ten current dashboards and four legacy variants with shared compact cards, semantic states, responsive charts, readable legends and preserved demo workflows.
- Replace upstream-author dashboard fixtures while retaining MIT notices and provenance.
- Resolve Finance, Finance V1 and Productivity date hydration mismatches with explicit demo dates; start Patient Monitoring’s real UTC clock after hydration and retain deterministic realtime initial samples.
- Pause continuous monitoring traces for reduced motion and preserve numeric readings, units and alarm semantics.
- Improve E-commerce order menus, Academy keyboard achievements, Logistics mobile sheet focus, and Infrastructure mobile environment fields.
- Align Finance comparison-row heights and verify all 14 routes across four presets, two themes and two viewports on dev and Workers.
- Retain mock data, placeholder/disabled actions and the existing external Logistics basemap. No runtime dependency or backend/auth integration is added. Calendar, Invoice and Auth V2 hydration fixes and app-page restyles remain v0.3 work.

All 12 tasks are merged and deployed. Release: [v0.2.0](https://github.com/moeghashim/tenboards/releases/tag/v0.2.0).

## v0.1 — Design system and shell (2026-10-23)

- Preserve the full upstream route catalog and MIT attribution, with a public Cloudflare demo and per-PR version previews.
- Add the tenboards identity, self-hosted Geist defaults, semantic light/dark tokens, and Default, Graphite, Pine, and Iris presets.
- Rebuild the floating sidebar, responsive header, and neutral demo account/status UI.
- Add one ⌘K/Ctrl+K palette across dashboard, standalone, legacy, auth, and error screens.
- Rebuild persistent layout settings with accessible native controls and a reset to tenboards defaults.
- Add repeatable route captures and shell keyboard, focus, reduced-motion, preference, and contrast evidence.

Known limitation (waived by user 2026-10-23): inherited upstream React hydration errors (#418) on Patient Monitoring, Calendar, Finance, Invoice, Productivity, Finance V1, and Auth V2 login/register; each is fixed when v0.2/v0.3 restyles that page. Dashboard and app-page content restyles remain v0.2/v0.3; database/auth integrations remain later milestones. The implementer does not merge or deploy production; Claude reviews and holds delegated merge authority.

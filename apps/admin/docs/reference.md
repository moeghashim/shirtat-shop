# tenboards reference

The complete reference that previously lived in the root README: commands, previews, visual QA, data layer, authentication, deployment and per-milestone notes. Start with the [README](../README.md) for the overview; release history is in the [CHANGELOG](../CHANGELOG.md).

An agent-first, MIT-licensed dashboard template built with TanStack Start, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui on Base UI.

Point Codex or Claude Code at a clone and ask for a dashboard or page. Agents get an adopter guide ([AGENTS.md](../AGENTS.md)), two Agent Skills, page generators and public blocks, so the on-system path is the shortest one. `npm run check` and `npm run verify:page` fail on off-system UI: raw colors, arbitrary sizes, look-alike cards, accessibility violations and hydration errors. External agents can read [`/llms.txt`](https://tenboards.mohanadgh.workers.dev/llms.txt) and install blocks from the shadcn registry. See [Building with agents](#building-with-agents).

Ten current dashboards and the retained app pages share a compact design system, neutral demo identities and optional Postgres/Better Auth integration. Milestones v0.1–v0.9 are merged and released; [v0.6.0](https://github.com/moeghashim/tenboards/releases/tag/v0.6.0) delivers Workers database support, isolated demo previews and adopter deployment tooling. The [live site](https://tenboards.mohanadgh.workers.dev) intentionally stays a zero-config demo; adopters connect and verify their own database.

**v0.6.1 (legacy removal) is merged, deployed and released as [v0.6.1](https://github.com/moeghashim/tenboards/releases/tag/v0.6.1)**: the four V1 dashboards and Auth V1 forms are retired. Six old URLs permanently redirect to their current equivalents; Auth V2 is the only sign-in UI, and the collapsed desktop sidebar no longer shows a duplicate header toggle. The [collapsed-header-toggle task](../dev/milestones/v0.6.1-legacy-removal/002-collapsed-header-toggle.md), [milestone overview](../dev/milestones/v0.6.1-legacy-removal/README.md) and [milestone status](../dev/milestones.json) track acceptance. The v0.5 authentication/session/security boundaries remain in place.

**v0.6.2 (compact density) is merged, deployed and released as [v0.6.2](https://github.com/moeghashim/tenboards/releases/tag/v0.6.2)** tightens the shared desktop typography, controls, cards, tables and shell. Content uses 13px text, default desktop controls are 28px, and the header is 48px. Toolbar selects and tabs retain content-based minimum widths so wider font choices keep their labels readable. Mobile keeps larger control/spacing defaults; all fonts, presets and sidebar styles remain available. There is one compact default, with no additional preference. See the [density contract](../dev/milestones/v0.6.2-compact-density/README.md) and [design system](../DESIGN.md).

**v0.7 (AI Assistant) is merged, deployed and released as [v0.7.0](https://github.com/moeghashim/tenboards/releases/tag/v0.7.0)** — `/dashboard/assistant` sits immediately after Chat and streams bounded read-only summaries, tables and charts. Zero keys gives recorded examples; adopters can configure Anthropic, OpenAI, xAI, Meta or Google with server-only keys and model overrides. Both modes use a guarded, limited POST endpoint with cancellation. Send, Stop, Copy reply, Regenerate and New conversation keep bounded history only in the mounted view, with safe errors, explicit provider recovery and Retry-After. Existing Chat stays unchanged. Live demo and PR previews remain recorded-only. See [Assistant setup, limits and privacy](../docs/assistant.md) and [the milestone contract](../dev/milestones/v0.7-assistant/README.md).

The Assistant presents a centered conversation, suggestion cards and a single auto-growing composer anchored below the transcript, including safe-area spacing on mobile. Generated metrics, tables and charts share the compact dashboard card styling.
The configured provider/model selector sits in the composer's bottom toolbar and remains disabled during a reply.

The Assistant follows new replies until you scroll up; Jump to latest resumes following. Enter sends, Shift+Enter inserts a newline, and the composer grows from one to eight rows. Copy and Regenerate are available below the latest reply.

**v0.8 (Projects workspace) is merged, deployed and released as [v0.8.0](https://github.com/moeghashim/tenboards/releases/tag/v0.8.0)** — the data foundation, workspace Home/Projects index, and all five direct read-only project views are implemented. [The milestone contract](../dev/milestones/v0.8-projects/README.md) tracks the remaining navigation consolidation and final acceptance. Existing standalone routes and the default landing remain available.

**v0.8.1 (Default dashboard landing) is merged, deployed and released as [v0.8.1](https://github.com/moeghashim/tenboards/releases/tag/v0.8.1)** — restores the Default revenue dashboard as the entry point and auth fallback. Home, Projects, navigation order and legacy redirects remain available. See the [task contract](../dev/milestones/v0.8.1-default-landing/README.md). **v0.9 (Agent-ready template) is merged, deployed and released as [v0.9.0](https://github.com/moeghashim/tenboards/releases/tag/v0.9.0)** — public blocks and the `/dashboard/kit` page, `new:dashboard` / `new:page` generators, `check:design` and `verify:page` guardrails (all 37 catalog routes pass), an adopter AGENTS.md with Agent Skills, and a shadcn registry with generated `llms.txt`. See [Building with agents](#building-with-agents) and the [milestone contract](../dev/milestones/v0.9-agent-ready/README.md).

## Replace the project homepage

`/` is a public, server-rendered project homepage in both demo and auth modes.
The live demo starts at `/dashboard/default`; `/dashboard` and `/dashboard/`
continue redirecting there. Auth fallbacks, the sidebar brand and recovery links
also keep that destination.

To start your clone directly in the app, replace
`src/routes/(external)/index.tsx` with the redirect below, then delete
`src/routes/(external)/-components/homepage.tsx`,
`src/routes/(external)/-components/quick-start.tsx` and `public/homepage/`:

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { APP_LANDING_ROUTE } from "@/navigation/landing";

export const Route = createFileRoute("/(external)/")({
  beforeLoad: () => {
    throw redirect({ href: APP_LANDING_ROUTE, replace: true });
  },
});
```

Set the `/` capture entry's `ready` text in `src/navigation/route-catalog.ts`
back to `"Total Revenue"`. The homepage-specific assertions in
`scripts/homepage-check.ts`, `scripts/screenshot-system.ts`,
`scripts/project-redirect-check.ts`, `scripts/blocks-kit-check.ts` and
`scripts/generators-browser.ts` should then expect the redirect again; classify
`/` with the protected app entries in `scripts/auth-protection-check.ts`.
Keep `src/components/theme-switcher.tsx`: the dashboard uses it too.
Generators, blocks and Agent Skills do not depend on the homepage.

## Run locally

Use Node 22+ and npm. No environment variables or database are required.

```sh
git clone https://github.com/moeghashim/tenboards.git
cd tenboards
OPENUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 npm install
npm run dev
```

Open the [Default revenue dashboard](http://localhost:3000/dashboard/default).

OpenUI install telemetry must remain disabled (`OPENUI_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1`). The Assistant disables its runtime inspector and observability; recorded replies make no provider requests.

## Commands

- `npm run dev` — development server on port 3000.
- `npm run build` — production client and server build.
- `npm run preview` — preview the compiled Worker locally with Wrangler.
- `npm run check` — Biome lint, imports, formatting, design guardrails and Agent Skills validation, registry freshness and generated LLM docs freshness. `npm run check:fix` applies Biome fixes; rerun `check` afterward.
- `npm run assistant:ui` — four-state composer, copy, stop/regenerate and scroll-follow checks, with empty/streaming/completed captures.
- `npm run assistant:conversation` / `assistant:lifecycle` / `assistant:context` / `assistant:modes` — bounded history, configured UI recovery, scrolling and Node/Worker configuration acceptance using synthetic fixtures.
- `npm run assistant:server` / `npm run assistant:worker` — synthetic provider-wire, endpoint and isolated admission/auth checks on Node and compiled workerd.
- `npm run assistant:test` — bounded language/registry/stream checks; `npm run assistant:browser` runs recorded interaction checks against `ASSISTANT_TEST_URL` (default port 3170).
- Set `TEST_PORT_OFFSET` when running auth/Worker regression suites in parallel worktrees; for example `160` maps 3011/3021/3031–3033 to 3171/3181/3191–3193. Supply an isolated local `DATABASE_URL`.
- `npm run typecheck` — TypeScript (`tsc --noEmit`).
- `npm run db:generate` — generate the next reviewed Drizzle migration; no DB required.
- `npm run db:migrate` — apply committed migrations to an explicit local Postgres URL; remote operations require `-- --allow-remote` and direct TLS URL.
- `npm run db:seed` — transactionally upsert canonical demo records, local-only by default; the same explicit remote opt-in applies.
- `npm run data:parity` — compare every demo/DB read against seeded local Postgres.
- `npm run screenshots` — capture route/preset/theme/viewport evidence (optional `--reference` for identical request dates, `--density` for computed geometry, and `--font` for a registry choice).
- `npm run generate-routes` — regenerate file-based routes.
- `npm run generate:presets` — regenerate the preset registry.
- `npm run deploy` — reviewer-only build and production deployment after approved merges.
- `npm run preview:deploy -- --preview-alias pr-NNN` — guarded build/upload exclusively to demo-only `tenboards-preview`; no database bindings or secrets.
- `npm run worker:dev -- --binding` — compiled local Worker with Docker Hyperdrive emulation; omit `--binding` for demo/URL fallback.
- `npm run worker:test` — local workerd runtime/concurrency/recovery and 29-read/211-scenario parity checks on a fresh review database.
- `npm run worker:auth` / `npm run worker:security` — compiled route/account/security regressions and two-Worker distributed limiter checks.
- `npm run deploy:prepare -- --name <worker-name> --url <https-origin> [--secrets-file <external-path>] [--include-assistant]` — clean build/config validation and optional private secrets (AI settings require `--include-assistant`); prints staging commands without network operations.
- `npm run deploy:check -- <origin>` — read-only auth-on production smoke; `--demo` explicitly selects preview expectations, `--auth-roundtrip` explicitly creates one throwaway account.

## Deploy with your own database

Follow the [deployment quick path](../docs/deploy.md#quick-path) to connect your own
Neon project through Hyperdrive with caching disabled, migrate/seed it, and stage
code, binding and auth secrets in one version before promotion. `deploy:prepare`
validates the generated configuration and can create a private secrets file.
Your hosted database must always have auth enabled. The project's live site stays
a demo; local workerd checks do not claim hosted Neon/Hyperdrive acceptance.

## Included screens

The 10 dashboards share the dashboard/chart presentation contract.

| Screen | Route |
| --- | --- |
| Default | `/dashboard/default` |
| CRM | `/dashboard/crm` |
| Finance | `/dashboard/finance` |
| Analytics | `/dashboard/analytics` |
| Productivity | `/dashboard/productivity` |
| E-commerce | `/dashboard/ecommerce` |
| Academy | `/dashboard/academy` |
| Logistics | `/dashboard/logistics` |
| Infrastructure | `/dashboard/infrastructure` |
| Patient Monitoring | `/dashboard/patient-monitoring` |
| Blocks kit (Developer) | `/dashboard/kit` |

The app sitemap also includes Home, Projects, AI Assistant, project Overview/Board/List/Timeline/Files, Products, Users, Roles, Profile, Mail, Chat, Invoice, Coming Soon and error/permission states. Legacy Kanban, Tasks, Calendar and File Manager URLs are guarded permanent aliases to project views. Standalone `/mail` and `/chat` retain `/dashboard/mail` and `/dashboard/chat` iframe aliases. Authentication uses `/auth/v2/login` and `/auth/v2/register`; bare `/auth/v2` remains layout-only. With no secret the forms are visual demos; optional auth enables real accounts/sessions. The [route catalog](../src/navigation/route-catalog.ts) enumerates 37 visual route patterns, including indexes and system states.

`/dashboard/default-v1`, `/dashboard/crm-v1`, `/dashboard/finance-v1` and `/dashboard/analytics-v1` return HTTP 308 to the matching current dashboard. `/auth/v1/login` and `/auth/v1/register` return HTTP 308 to Auth V2. Redirects preserve a validated `redirect` query (unsafe values fall back to `/dashboard/default`); destination pages enforce their existing guards. Redirect-only URLs are absent from sidebar/search and are tested separately from the screenshot catalog.

## Provenance and license

Imported from [arhamkhnz/tanstack-shadcn-admin-dashboard](https://github.com/arhamkhnz/tanstack-shadcn-admin-dashboard) (Studio Admin), revision [`81e5ef1391b68c176154faba0c9ac7b0023ecbaf`](https://github.com/arhamkhnz/tanstack-shadcn-admin-dashboard/commit/81e5ef1391b68c176154faba0c9ac7b0023ecbaf). Copyright © 2026 Mohammed Arham Khan. The original MIT notice is preserved in [LICENSE](../LICENSE), alongside the tenboards copyright. No upstream history or remote is retained.

The upstream contributor guidance is archived at [docs/upstream-AGENTS.md](../docs/upstream-AGENTS.md). PLAN.md and its Decisions log govern tenboards. Root [AGENTS.md](../AGENTS.md) guides adopters’ agents; [dev/MAINTAINERS.md](../dev/MAINTAINERS.md) defines the upstream contributor workflow and PR template.

## Import validation notes

The unmodified import passed Biome with one existing `noArrayIndexKey` warning in `src/lib/highlighter.tsx`. Its initial TypeScript run found four errors: two unused bindings, a missing package version, and an `unknown` error accessed without narrowing. Task 001 applies narrowly scoped fixes without changing screen designs.

`npm install` reported seven high-severity dependency advisories in the inherited dependency tree. No forced dependency upgrades were applied during the import; details are included in the task PR evidence. These advisories are separate from the build, Biome, and TypeScript checks.

## Cloudflare demo and PR previews


**Live demo:** [tenboards.mohanadgh.workers.dev](https://tenboards.mohanadgh.workers.dev/dashboard/default) — redeployed from `main` after each merge.

The Worker serves the existing mock-data demo. It has no database, authentication service, or secret bindings. Its only generated binding is `ASSETS` for static files. Production is redeployed from `main` by the reviewer after approved merges. Preview uploads target only the separate demo-only `tenboards-preview` Worker. They do not change production traffic.

The build uses Nitro's `cloudflare-module` preset. `wrangler.jsonc` owns the Worker name, compatibility date, and public live/preview URL settings. Nitro generates `.output/server/wrangler.json` and `.wrangler/deploy/config.json`, including the server entry, assets binding, module rules, and Node compatibility flag. Do not hand-edit or commit generated output, or pass the root config explicitly to deploy (Wrangler follows Nitro's generated config redirect).

`npm run dev` retains upstream's Node development runtime. Nitro's direct development emulator expects Miniflare 4, while current Wrangler supplies Miniflare 5; forcing that combination fails validation. `npm run build && npm run preview` exercises the compiled Cloudflare Worker with current Wrangler instead. The production preset is therefore selected only for Vite builds. Wrangler is pinned at 4.152.0 for reproducibility.

Run manual deployments using an already authenticated Wrangler session:

```sh
# Reviewer only: after an approved squash merge, from a clean checkout:
git switch main
git pull --ff-only
npm ci
npm run check
npm run typecheck
npm run deploy
```

For each PR, from its branch:

```sh
npm run preview:deploy -- --preview-alias pr-NNN
```

The preview command uses a deliberately separate source/config generator, not a production name override. It rejects local dotenv/dev-vars files and DB/auth/provider/build-override environment, strips build subprocess inputs, disables Nitro production config generation, and checks the final generated config and remote version/secret inventory before upload. Move local `.env*`/`.dev.vars*` files outside the checkout first (keep `.env.example`). No production binding can enter via Nitro array merging. On first use only, add `--initialize` to create the separate demo Worker; normal runs refuse a missing Worker. Never upload PR versions to `tenboards`.

The root config keeps its Hyperdrive slot commented for the live demo; activate it only for your own database deployment. Without binding and secret it deploys as demo; a secret without database configuration returns 503. Never set a production secret on a binding-less live version; [the deployment runbook](../docs/deploy.md) stages a complete version atomically with `wrangler versions upload --secrets-file`, then promotes it to 100%.

Copy the returned version-specific URL into the PR body. The optional alias gives a reusable URL for that PR; uploading a version does not replace the live deployment. Preview URLs are public demo URLs. No GitHub Actions secrets or automated deployments are configured.

Deployment references: [Nitro Cloudflare](https://nitro.build/deploy/providers/cloudflare) and [Cloudflare version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/).

## Visual QA

Install the approved browser tooling once with `npx playwright install chromium`, then run a dev server (`npm run dev`) in another terminal:

```sh
npm run screenshots
npm run screenshots -- --routes /dashboard/default,/auth/v2/login --output screenshots/before
npm run screenshots -- --base-url https://pr-012-tenboards-preview.<account-subdomain>.workers.dev --output screenshots/after
npm run screenshots -- --routes /dashboard/default --sidebar-states --output screenshots/sidebar
npm run screenshots -- --list
```

The default captures every retained route in light/dark at desktop 1440×900 and mobile 390×844. `src/navigation/route-catalog.ts` is the shared 37-route visual inventory, re-exported by `scripts/screenshot-routes.ts` and checked against generated route metadata; missing/stale routes and unknown subsets fail before launch. The dashboard splat uses `/dashboard/capture-not-found` to exercise its not-found state; project-ID routes use `sample-operations` by default, with `--project-id sample-docs|sample-empty` for the secondary and empty fixtures. The root homepage is captured at `/`; dashboard index redirects are captured at their destination; six retired V1 aliases and four consolidated workspace aliases are covered by dedicated redirect checks; explicitly passing those workspace aliases to `--routes` also captures their destinations. `--preset` selects a valid preset for the same four-state matrix. `--sidebar-states` adds expanded/collapsed desktop captures and open/closed mobile-sheet captures on shell routes. Run `node --experimental-strip-types scripts/sidebar-toggle-check.ts` to verify every allowed sidebar style/collapse mode and preset in both themes and viewports; add `--ssr --base-url <built-preview-url>` to check initial markup with JavaScript disabled.

Captures wait for React hydration, fonts, network idle, images, JS chart settling, and stable content. Reduced motion is emulated and screenshot animations are disabled. Console errors, page errors, failed requests, unexpected HTTP status, and capture failures are recorded in `report.json` and cause a nonzero exit. The hydration check uses React's DOM binding marker; revisit it if React's renderer changes. Application clocks are never frozen. For v0.4 comparisons, pass the same `--reference` ISO timestamp to serialize identical date inputs; the real monitoring clock can be narrowly masked with `--mask-live-clocks`.

`screenshots/` is gitignored. Keep all PNGs and reports off main: create a separate worktree from `origin/pr-assets`, copy each task's `before/` and `after/` directories there, commit with the required co-author trailer, and push only that branch. Link images using `https://raw.githubusercontent.com/moeghashim/tenboards/pr-assets/NNN/before/<file>.png` and the corresponding `after/` URL in the PR table. Never add screenshots to an implementation branch. Inspect every submitted capture for blank, incomplete, or mislabeled output.


## Brand assets

The original tenboards mark pairs a solid upright with an open board, reading as “10” at small sizes. `src/components/brand/brand.tsx` supplies the inherited-color mark and wordmark; adjacent visible text or the enclosing link supplies its accessible name. The sidebar uses an explicit home label in collapsed mode. Auth changes replace brand symbols only; form behavior is unchanged.

`public/brand/mark.svg` and `wordmark.svg` are vector masters (the wordmark outlines the bundled SIL-OFL Geist face). `favicon.svg`, ICO/16/32px PNGs, the 180px touch icon, and 192/512px app icons share the same original silhouette. `public/brand/og.svg` is the 1200×630 social-image source for `public/og.png`. PNG/ICO derivatives were rendered locally from these authored vectors, with no stock or third-party logo. Preserve the font package license when redistributing its font files.

Social metadata, favicons and the manifest use origin-relative asset URLs, so a fork does not point to this project's live host. Set `APP_CONFIG.meta.image` in `src/config/app-config.ts` to `https://<worker-name>.<account-subdomain>.workers.dev/og.png` if your social crawler requires an absolute image URL. Inspect `/og.png` on your deployment or PR preview.

## Shell usage and acceptance

The floating sidebar keeps a viewport-height panel while long pages scroll. Primary links, collapsible route sections, icon-only collapse, and the mobile sheet share the same navigation. The demo status card counts distinct enabled `/dashboard/*` sidebar pages (25 total) visited since the sidebar mounted; the count resets on reload or when the mobile sheet remounts; it does not represent a subscription, saved progress, or server data.

Desktop icon rails own the expand/collapse control; the header hides its redundant toggle and aligns the breadcrumb at its normal padding. Expanded desktop navigation also keeps its existing sidebar control. The header opener remains on mobile and when desktop “Hide” mode moves the whole sidebar off-canvas. **⌘B / Ctrl+B** still toggles navigation. When a focused header opener becomes hidden after reopening desktop navigation or resizing to desktop, focus moves to the sidebar toggle.

Open search from the sidebar, the mobile header, or **⌘K / Ctrl+K** on any retained route. Arrow keys choose results; Enter opens a page; Escape closes and restores focus. The palette exposes 27 static screens plus 15 views across the three sample projects; four non-searchable catalog entries cover redirects and the auth layout route. Pressing the shortcut again closes search. Other visible dialogs, alert dialogs, menus, and listboxes retain the shortcut (the mobile navigation sheet excepted); text-field focus alone does not suppress it. The bare `/auth/v2` path is an inherited layout-only screen; its login/register children are the searchable destinations.

Settings in the sidebar or header controls theme (including System), Default/Graphite/Pine/Iris presets, the existing font registry, content width, header behavior, sidebar style, and collapse behavior. Changes persist in the existing seven-day browser cookies, one per preference key, plus the separate sidebar-state cookie. Reset restores Light, Default, Geist, Centered, Sticky, Panel, Show icons, and expanded navigation. Inset also frames the content; every desktop style preserves the reference sidebar. Mobile navigation always uses a sheet.

Shell accessibility checks cover keyboard navigation, named controls, visible focus, palette selection and focus return, settings radio/select operation and focus trapping, mobile sheets, and reduced-motion CSS across all four presets in both modes. Run the supported token-pair contrast audit with:

```sh
node --experimental-strip-types scripts/check-contrast.ts --presets default,graphite,pine,iris --base-url http://localhost:3000
```

Axe is not part of the existing tooling; the acceptance evidence identifies the semantic/keyboard checks actually run. [Task 012 evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/012) holds the complete route matrix, logs, and smoke scripts. [Sidebar/reference comparison](https://github.com/moeghashim/tenboards/blob/pr-assets/008/sidebar-reference-comparison.png) records the locked reference comparison. Captures may contain inherited TanStack development-tool chrome.

Current hydration status: all eight inherited findings are resolved and verified on dev and Workers. Finance, Finance V1, Productivity and Patient Monitoring shipped in v0.2; Calendar and Invoice shipped in v0.3 batch A; Auth V2 login/register shipped in v0.3 batch B. Calendar, Invoice and Auth use serialized request data; Patient Monitoring starts its real clock after hydration. Delayed JavaScript, refresh and differing timezone checks use real clocks. The historical v0.3 1,216-case matrix covered all 38 routes across four presets, both themes and both viewports. Historical failures and linked resolutions remain in [dev/open-questions.md](../dev/open-questions.md).


## Dashboard foundation (v0.2 / 001)

`src/components/blocks/charts.tsx` composes the existing chart wrappers with responsive sizing, token-based axes/grid/cursor/tooltips/legends, explicit en-US numeric formatters, and `useChartMotion`. The hook starts without animation on both SSR and initial hydration, then observes reduced-motion changes; pass its props to every animated Recharts series. `seriesConfig` selects chart-1, chart-2, chart-4 and chart-5, avoiding Default's duplicate chart-3 color. Pair series with labels and dash patterns from their keyed `seriesConfig` entries; color alone is insufficient.

`@/components/blocks` provides `DashboardCard` (12px compact / 16px standard), `SectionHeader`, and `StatCard`. These presentation APIs accept domain values, help, trends and actions without owning data or state. The primitives are reused throughout the 10 dashboard routes. Domain data and interactions remain route-local; protected UI wrappers remain intact.

## Default dashboards (v0.2 / 002)

Default uses neutral KPI cards, semantic signed trends and shared charts with distinct legend line samples. Customer tables retain filtering, selection, pagination and detail actions; full columns scroll locally on narrow screens.

## CRM dashboards (v0.2 / 003)

CRM uses shared compact cards and motion-aware charts, semantic signed trends and explicit opportunity health labels. Narrow tables scroll locally; the opportunity toolbar wraps. Periods, records, table state and demo actions remain local.

## Finance dashboards (v0.2 / 004)

Finance uses neutral KPI cards, semantic signed amounts, labelled allocation charts and compact source/spending breakdowns. Account/transaction placeholders, masked accounts and demo actions remain. Its dated October 23, 2026 demo statement uses explicit UTC fixture dates.

For direct-load and refresh hydration checks with the real clock, `npm run screenshots -- --routes /dashboard/finance --timezone Pacific/Kiritimati --reload` adds a fresh-load/refresh pair in every theme and viewport. `--timezone` defaults to America/Chicago; `--reload` is optional. Use `--base-url` for the Workers version.

### Analytics dashboards (v0.2 / 005)

Analytics uses compact metrics, labelled actual/baseline trends, visitor bars and country codes, wrapping tabs, and a locally scrollable page table. Traffic source labels sit beside bars. Charts respect reduced motion while retaining data and keyboard tooltips; existing period and tab controls remain local demo interactions.

### Productivity dashboard (v0.2 / 006)

Productivity uses compact summary cards, readable task rows, labelled project/weekly progress, and a secondary calendar/focus/notes column that follows the main work on mobile. Jordan replaces the upstream greeting. The calendar visibly identifies its October 23, 2026 demo day; project due dates and recent-note labels derive from the same deterministic fixture. Explicit calendar `today`, selected date and initial month remove server/client clock differences while preserving month navigation and selection. A local day-button adapter attaches keyboard focus for arrow navigation without changing the shared calendar wrapper. Task checkboxes retain local state and show completion with a strike-through. Existing period/project selectors and placeholder creation/focus actions remain available; this does not add a timer or persistent task storage.

For repeatable interaction evidence, run `npm run screenshots -- --routes /dashboard/analytics,/dashboard/productivity --interactions`. This opt-in mode checks controls and keyboard task/calendar behavior, saves `-interactive.png` captures, and records observations in `report.json`; ordinary captures are unchanged.

### E-commerce dashboard (v0.2 / 007)

E-commerce uses shared compact KPIs, a labelled USD revenue/profit chart, readable traffic-source shares, semantic inventory/payment states and wrapping order controls. The demo reporting interval is explicitly October 23, 2026 UTC; sales buckets and traffic timestamps no longer depend on server startup or browser clocks. Existing period/channel selections, filters, selection, date sorting and pagination remain local. Order action menus now open correctly with Base UI group labels; review/settings/export actions retain their existing demo behavior. `npm run screenshots -- --routes /dashboard/ecommerce --reload --interactions` verifies the order workflow and direct/refresh rendering.

### Academy dashboard (v0.2 / 008)

Academy shares compact metrics and semantic schedule/assignment states. Full course names wrap; submission counts are available in a labelled table alongside the motion-aware chart. Performance windows retain their weekly positions and scores, with named student achievement tooltips outside the marks for mobile and keyboard access. Schedule and upcoming events use an explicit October 23, 2026 demo day, retaining their event offsets and times across server/browser timezones. Announcement, Gradebook and assignment controls retain their existing demo behavior. The Academy `--interactions` screenshot scenario checks keyboard achievement details and responsive layout.

### Logistics dashboard (v0.2 / 009)

Logistics keeps its shipment list/map/detail split and mobile detail sheet. Shipment selection supports Enter; Escape closes the mobile sheet and restores focus to the selected row. Shared local status styles, country codes, explicit endpoint labels and different origin/destination marks clarify the route in every preset. Detail tabs, named controls and locally scrolling panes fit narrow screens. Search/filter, copy/contact and unimplemented detail-tab actions retain their existing demo behavior. The Logistics `--interactions` capture verifies selection, placeholder tabs and sheet focus return. The geographic basemap still loads the existing public world-atlas asset.

### Infrastructure dashboard (v0.2 / 010)

Infrastructure retains project grouping, collapsible sections, every environment, resource thresholds and the empty project. Desktop tables scroll locally; mobile rows reflow into labelled fields so health, uptime, CPU/RAM/disk and server details remain available. Project/environment menus and refresh/settings/search controls have accessible names. Status and resource marks use semantic tokens, with values and labels alongside color. The snapshot is explicitly demo data; search/filter and operational actions remain placeholders. Author-linked upstream fixture domains are replaced by `workspace.example.com`. The Infrastructure `--interactions` capture checks keyboard collapse and both action-menu types.

### Patient Monitoring dashboard (v0.2 / 011)

Patient Monitoring retains all simulated readings, units, patient selection, alarms and event/trend views. Compact cards, wrapping names/controls and labelled semantic waveforms remain readable across presets and narrow layouts. The live UTC clock starts after hydration from an identical server/client placeholder; realtime stores expose the same initial sample during SSR and hydration. Reduced motion pauses continuous traces and trends while keeping numeric readings and the real clock available; normal motion resumes the local simulation. Footer actions retain their existing demo behavior.

`npm run screenshots -- --routes /dashboard/patient-monitoring --reload --interactions --hydration-delay-ms 1800` delays JavaScript delivery across a real second boundary, checks direct/refresh hydration, verifies the clock advances, and compares reduced/normal-motion waveform paths. It does not replace or freeze the runtime clock. Add `--base-url` for Workers and `--timezone Pacific/Kiritimati` for timezone coverage.

### Integrated dashboard acceptance (v0.2 / 012)

The historical v0.2 14-route matrix was verified on dev and Workers in Default, Graphite, Pine and Iris, each in light/dark at desktop/mobile. Finance's Spending Overview and Account Allocation now share a row height; its wallet, bills and shortcut column also finish together. The other 13 routes were checked for the same row-gap regression. Supported-token contrast measurements and keyboard/tooltip/reduced-motion spot checks are retained with the PR evidence; these are scoped checks, not a claim of a complete accessibility audit.

All screens remain mock-data demos, including existing disabled and placeholder actions. No runtime dependencies, protected UI/calendar wrappers, shell preferences or v0.3 page designs change. All v0.2 tasks are merged, deployed and released as v0.2.0; production deployment remains the reviewer's responsibility.


### App pages (v0.3)

The [app-page breakdown](../dev/milestones/v0.3-app-pages/README.md) assigns the original 38 route-catalog entries plus root not-found/error states to page owners or final regression coverage. Mail and Chat each retain standalone and dashboard iframe routes; Auth originally included four forms and the bare V2 layout. The external `/` remains a redirect to `/dashboard/default`, with no landing UI to restyle. Implementation progress is documented per task below.

Calendar, Invoice and both Auth V2 forms have passed their separate hydration gates. Page owners replaced the remaining upstream-author demo identities; the final whole-source scan has no matches, while legal attribution remains intact. Final acceptance checks every route across all four presets and reconciles hydration history. All v0.3 tasks are merged, deployed and released; their evidence remains separate from the v0.4 implementation review.


### App-page foundation (v0.3 / 001)

`@/components/blocks` provides a presentation-only `PageHeader` with a required string `title`, optional string `description`, wrapping React `actions`, and optional layout `className`. It renders one semantic h1 at the compact 21px scale, with wrapping titles and action groups. File Manager and Products use it while retaining query-driven file views and the product drawer; their grids and tables remain assigned to tasks 008/009. The upstream-author File Manager owner fixture is now Jordan Lee. Tasks and Invoice are intended later consumers. Existing dashboard cards, card-level headings and chart theme remain the shared APIs for their respective roles.


### Mail pages (v0.3 / 002)

Standalone Mail and its dashboard iframe use neutral panes, compact message rows, explicit unread labels and a selected pressed state. Long sender/recipient fields and attachments wrap; the reply composer has named controls. Jordan Lee and Northwind Studio replace author-linked accounts and recipient fixtures. Desktop panel resizing retains its layout cookie; mobile selection opens the existing message drawer and Escape restores row focus. Search, navigation/filter, send and other unimplemented actions retain their existing demo behavior. The iframe retains its title, full-screen new-tab link and cookie-based theme/preset initialization. `npm run screenshots -- --routes /mail,/dashboard/mail --interactions` covers the inner frame, keyboard selection, attachments, composer, resize cookie and mobile drawer.


### Chat pages (v0.3 / 003)

Standalone tenboards Chat and its dashboard iframe use neutral conversation/thread/contact panes, labelled unread/pinned/online states, and visible sender names beside message times. Jordan Lee replaces the current-user author fixture, and contact emails use the neutral workspace.example.com domain. Pane transitions use 200ms and respect reduced motion. Contact details use the existing sheet below 1280px so the embedded thread keeps room to read. Hidden list, thread and contact panes are inert; mobile selection/back and profile Escape restore focus to the relevant control. Existing conversation selection, composer tabs, messages and placeholder search/send/filter behavior remain local. The account menu label now sits in the required Base UI group. The Chat `--interactions` scenario checks iframe appearance, composer tabs, profile Escape and off-screen focus protection.


### Calendar page (v0.3 / 004)

The former Calendar page now redirects to `/dashboard/projects/sample-operations/timeline?mode=calendar`. Read-only Month/Week/Day, Today/previous/next and more-events popovers retain their existing calendar adapters. SSR uses the serialized request UTC clock and adopts local time after hydration. Project schedule tests cover delayed real-clock hydration across timezones; there is no Add event or calendar-filter placeholder.


### Kanban page (v0.3 / 005)

The former Kanban page now redirects to the default project Board. Legacy `view=list` and `view=table` select the project List. Canonical Board/List use real filters and shared read-only tasks; legacy drag/drop, column reordering and status-edit composition has been removed. See the v0.8 sections below for controls and verification.


### Tasks page (v0.3 / 006)

The former Tasks page now redirects to the default project List, discarding unvalidated legacy search. The project List exposes bounded URL filtering, task details and consistent status, priority and assignee presentation; it has no task mutation controls.


### Invoice page (v0.3 / 007)

Invoice uses the shared page heading, named date/client/adjustment controls, labelled responsive line items and a live balance beside the preview. Descriptions accept multiple lines; long addresses and references wrap on the white paper. Northwind Studio / Jordan Lee and reserved example domains replace upstream-author billing fixtures. Existing calculations, item ordering, add/remove/edit actions and placeholder Save/Send/Download actions remain local.

The route loader creates fresh UTC civil-date defaults for each request and shares them with SSR and hydration. This replaces independent module clocks that disagreed across timezones; both dates remain editable. No warning suppression, SSR disabling or frozen clock is used. The existing print portal is hidden on screen and isolated for Letter printing, preventing a duplicate invoice from widening the mobile page. Preview height follows the actual paper content, and the footer flows after the totals.

`npm run screenshots -- --routes /dashboard/invoice --reload --interactions --timezone Pacific/Kiritimati --hydration-delay-ms 1800` checks delayed direct/refresh hydration, both date edits, client selection, multiline items, quantity/price, add/remove/reorder/cancel, tax/discount calculations and preview/print agreement. The print variant exports a PDF beside its screenshot for page-fit verification. Repeat with `--base-url` on Workers and `--timezone America/Chicago`; captures and PDFs belong only on pr-assets or PR attachments.


### File Manager (v0.3 / 008)

The former File Manager now redirects to default-project Files, retaining only validated `view=grid|list`. Project-owned file/folder presentation uses icons, avatar owners and read-only star/share metadata. Search/type filters work on scoped records. Legacy star toggles and upload/download/share/trash placeholders have been removed.


### Products (v0.3 / 009)

Products uses semantic stock/status labels, wrapping names and SKUs, aligned tabular prices and a locally scrolling catalog. Search, category/status filters, selection and pagination remain local. Duplicate creates a draft; editing preserves IDs and validates unique SKUs. The Add drawer remains validation-only, with optional image previews and no catalog insertion or upload service. Compact form groups retain scrolling and reachable actions; closing the editor returns focus to its product. `npm run screenshots -- --routes /dashboard/products --interactions --base-url http://localhost:3000` covers filters, empty/selection states, duplication, edit validation, zero/upper numeric boundaries, images and keyboard dismissal.


### Users and Roles (v0.3 / 010)

Users and Roles use compact tables, semantic statuses, named search/filter controls and wrapping pagination. Users exposes full workspace names and a live selection count; its workspace selector supplies the array value required by TanStack Table v9 membership filtering. Roles retains its grouping, disabled system-role actions and Permission Sets/Access Reviews placeholder tabs. Directory actions and permission information remain demo-only. No invitations, RBAC or backend mutations are implemented. The `--interactions` screenshot scenarios verify combined filters against exact fixtures, selection, page size/pagination, keyboard menus and all Roles tabs.


### Profile (v0.3 / 011)

Profile retains Overview, Personal, Employment, Compensation, Time off and Documents. Jordan Lee, matching JL initials, reserved example-domain emails, neutral manager/contact and updater attribution replace the upstream identity and remote author avatar. A route-local detail field keeps labels and long values consistent; the document table scrolls locally, and tab navigation remains horizontally scrollable. Restricted compensation copy explicitly identifies the demo state; header/document actions retain their existing behavior. The Profile `--interactions` capture checks all six tabs, identity fields, keyboard menu focus return and document controls.


### Authentication demos (v0.3 / 012)

Auth V2 retains login/register routes, validation, masked password fields, autofill attributes and local submission toasts. Without a secret they remain visual demos with safe acknowledgements and decorative Google/GitHub buttons. Optional local auth enables real credentials, configured providers and explicit remember-me cookie persistence. V2 copyright derives from the real request UTC year, serialized through its parent loader; no module clock or browser timezone difference enters hydration. Bare `/auth/v2` stays layout-only. A shared V2 form frame keeps navigation and footer in document flow, including short screens. Validation messages are associated with their inputs, and demo toasts use valid paragraph-compatible markup. `npm run screenshots -- --interactions` supports the three retained auth URLs; `--reload --hydration-delay-ms 1800 --timezone Pacific/Kiritimati` exercises real delayed hydration.


### System states (v0.3 / 013)

Coming Soon describes planned content; the dashboard splat explains an unknown dashboard page. Root not-found, demo Unauthorized and RootError share a compact hierarchy with wrapping copy and keyboard recovery links. Production errors retain generic text; development can show the error message. `/`, `/dashboard` and `/dashboard/` return 307 redirects to `/dashboard/default`; unknown root URLs return 404 and the explicit dashboard splat remains HTTP 200. `npm run screenshots -- --routes /dashboard/default --boundaries` adds four-state root not-found and real root-error/reset evidence. The CLI temporarily replaces a loaded browser route component, restores it and presses Try again; no error trigger or route is shipped. Expected injected exceptions and the exact unknown-document 404 diagnostic are recorded separately in report.json.


### Complete app-page acceptance (v0.3 / 014)

The integrated v0.3 stack passes all 38 catalog entries on dev and Workers with Default, Graphite, Pine and Iris × light/dark × desktop/mobile: 608 cases per environment, 1,216 total. The coverage manifest checks generated routes, duplicates, missing/unexpected cases and every error; original failures and explicit reruns remain in pr-assets/v03-014. Supplemental scenarios cover Mail/Chat iframe contents, File Manager grid/list, Kanban board/list/table and overlays, Roles and all six Profile tabs, product/directory/task filters and forms, four auth forms, Invoice print, live Calendar/Patient Monitoring behavior, root 404/error/reset, and shell focus/preferences/reduced motion. All eight historical hydration findings are resolved; the whole-src author scan returns no matches. Supported-token audits pass 280 comparisons per environment; scoped actual-surface evidence is linked, not represented as a complete accessibility certification. The app source is unchanged by this acceptance layer. All 14 v0.3 tasks are merged and deployed, and v0.3.0 is released. This paragraph records the historical v0.3 acceptance run; current v0.4 evidence is described below.

Run `npm run screenshots -- --base-url <url> --preset <default|graphite|pine|iris> --output <root>/<dev|workers>/<preset>` for each environment/preset. `node --experimental-strip-types scripts/report-route-coverage.ts --root <root> --retries <manifest.json>` verifies complete coverage and retains original errors alongside explicitly mapped reruns. `--interactions` on `/dashboard/default` verifies shell focus, preference persistence and reduced motion; dialog evidence uses the existing viewport so screenshot resizing cannot disturb focus.


## Optional data layer (v0.4)

All data-bearing app pages and all 10 dashboards now use 22 typed reads. Demo is the
zero-config default; local Postgres is optional. The [data-layer guide](../docs/data-layer.md)
covers source selection, schemas, dates, seeding, migrations, domain ownership and
adding a read. All eight implementation layers are merged and released as v0.4.0; production stays
demo-only; adopters can connect their own database.

### Foundation (v0.4 / 001)

Users and Roles now load through typed GET server functions. With `DATABASE_URL` unset, install, development, builds and Workers previews use demo records without opening a database connection. `DATA_SOURCE=demo` explicitly forces demo; any other configured value is rejected. A configured empty, malformed, unreachable or unmigrated database produces a visible load error, never silent demo fallback. Directory actions remain local demonstrations without persisted edits; optional auth protects access without assigning directory roles.

For optional real reads, run Docker Compose with Postgres 17:

```sh
docker compose up -d
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run data:parity
npm run dev
```

The example uses local-only port `54329`, database/user `tenboards`, password `tenboards_local`, and a named `tenboards_postgres` volume. These are local development credentials, never production secrets. Keep `.env` uncommitted; scripts read it with Node's built-in env-file support. Docker is optional for demo. Only explicit DB commands migrate or seed; startup never does. DB scripts require an explicit localhost target and redact driver errors. Stop containers with `docker compose stop`; no destructive reset helper is provided.

`npm run db:generate` creates reviewed Drizzle SQL under `src/server/db/migrations/`. Migrations are cumulative. The transactional seed upserts stable directory email/role keys, replaces only those fixtures' ordered children, and preserves unrelated parent records. Directory role labels and the informational Roles list remain distinct. Aggregate chart series have a typed decimal metric-points contract; entity lists use normalized tables.

`npm run data:parity` compares actual demo and Postgres implementations with exact ordering and types. Layer 001 covered Users/Roles (two reads, six all/existing/missing scenarios); omitted registration and controlled mismatch tests fail nonzero. `node --env-file=.env --experimental-strip-types scripts/data-source-check.ts` verifies source selection and negative parity tests; its missing-schema case requires a separate local `tenboards_missing_schema` database with no migrations. Database/UI fault evidence is separate from clean smoke. Production remains demo-only; adopters can connect their own database.


### Profile and shell accounts (v0.4 / 002)

In demo mode the dashboard parent loads demo accounts alongside the existing cookie preferences; auth mode uses the actual signed-in identity. Account selection remains local and resets on refresh; it does not establish a session. The former unused `rootUser` export is removed, and `src/data/users.ts` now contains only the account type. Shell accounts, directory members, informational roles and Jordan Lee's profile remain distinct datasets.

All six Profile tabs load normalized identity, contact, employment, time-off and ordered document records, including manager/updater attribution and the previously inline completion, verification and record-status fields. Restricted-compensation and action behavior remain demonstration-only. Cumulative parity covers four reads and twelve scenarios, including missing-account empty arrays and missing-profile null. Apply the new cumulative migrations and rerun `db:seed` when upgrading an existing local database.

`node --experimental-strip-types scripts/check-accounts.ts <base-url> <evidence-folder>` checks account-menu keyboard selection, Escape focus, refresh reset and cookie preferences across light/dark desktop/mobile. The existing Profile interaction captures cover all six tabs and document controls. Evidence belongs on `pr-assets`, never application branches.


### Commerce reads (v0.4 / 003)

Products, Invoice and the entire E-commerce dashboard now use typed server reads. Product categories/status options load with the catalog; local duplication/editing and validation-only Add remain unchanged. Invoice keeps pure arithmetic/paper helpers in its UI module and receives clients/taxes through a route-local context. Draft date offsets are stored as definitions and resolved from one request timestamp in UTC, including a +14-day due date. Reloading discards local product and invoice edits.

Store orders/customers, review records, traffic-source metadata, category/product summaries and report metadata use normalized tables. Chart series, KPIs, traffic and inventory buckets use typed metric points with decimal values and explicit currency/units. Presentation icons/colors remain local. The store's illustrative totals, short order list and separate catalog are intentionally not reconciled or joined by similar names. Order customer identities are scoped to their source order because the fixture supplies names, not shared customer IDs.

Cumulative parity covers seven reads and 26 scenarios, including product filters/missing records, order filtering, Invoice year/leap-day rollover and later requests after seeding. Upgrade with `db:migrate` and `db:seed`; no new dependency or write endpoint is added. `node --experimental-strip-types scripts/check-commerce-local.ts <base-url>...` verifies local edits reset after reload. Invoice's existing delayed-timezone/print interaction checks remain available through `npm run screenshots`.

### Workspace reads (v0.4/004)

Kanban, Tasks, Calendar and File Manager now load through the optional data source.
Those legacy readers and records remain for provenance/parity; v0.8 project views use the canonical read-only task domain and remove the old drag/status/star compositions. The original Kanban
and Tasks ledger records remain separately traceable. Calendar stores typed relative event
definitions, resolves one request timestamp for SSR, then adopts browser-local civil
time after hydration; Today and the now marker continue using the live clock.
Migration `0005_abandoned_red_ghost.sql` extends the cumulative journal. Parity covers
all workspace reads, empty/missing selections and month/year/leap-day timezone cases.

### Communication reads (v0.4/005)

Mail and Chat use normalized read data for their standalone views and dashboard
iframes, including accounts, counts, recipients, attachments, contacts and messages.
Mail dates resolve stored minute offsets against one serialized request reference,
so reseeding is not required to keep relative demo dates current. Attachment IDs map
to icons in the UI. Selection stores belong to each mounted view, safely handle
empty/removed records, and never represent authentication or persist messages.
Migration `0006_useful_quentin_quire.sql` extends the journal; cumulative parity also
checks later request dates against an unchanged seed.

### Core dashboard reads (v0.4/006)

Default, CRM, Finance and Analytics load through four typed GET reads. Customer/opportunity, financial account/card/transaction and analytics page/source/campaign records use normalized tables. KPI and chart measures use ordered typed metric points with display metadata; chart colors, geometry and placeholder controls remain local. No action writes to the DB. CRM month labels share the request reference; Finance statement dates retain UTC semantics.

v0.6.1 removes the V1 payloads, queries, fixtures, seeds, range projectors and 26 V1-only parity scenarios. Migration `0014_remove_legacy.sql` drops 13 exclusive tables and deletes only V1 metric rows; shipped migrations remain intact. Apply `db:migrate` and `db:seed` when upgrading. After the Projects foundation, current parity is 29 reads / 211 scenarios. `node --experimental-strip-types scripts/auth-migration-check.ts` verifies fresh and populated upgrades, retained rows and repeat migrate/seed; `scripts/legacy-redirect-check.ts` checks all six aliases in demo and auth modes.

### Operational dashboard reads (v0.4/007)

Productivity, Academy, Logistics, Infrastructure and Patient Monitoring now load
normalized records through five typed GET reads. Projects/tasks/notes/goals/focus,
class/room schedules and achievements, customer/shipment/cargo/tracking/coordinates,
project/environment resources, and patient/bed/vital/alarm records retain their
original values and ordering. Header totals and aggregate KPIs are typed metric
points; illustrative totals remain independent of short visible lists. Civil-date
labels use explicit UTC formatting. Local actions remain local and reset on reload.

Patient Monitoring's `waveform-data.ts`, `realtime-utils.ts`,
`use-patient-vital-series.ts` and `use-realtime-tick.ts` remain client simulation.
Only waveform/trend geometry, tick progression and live clocks are exempt from
server reads; identities, diagnoses, baseline vitals, signal parameters, alarm
labels/durations, thresholds and monitor settings load normally. This is demo data,
not a medical feed. Real clocks advance and reduced motion pauses traces.
Logistics retains its remote world-atlas presentation asset and exact coordinates.
Removed selections fall back safely, and empty loaded lists do not crash.

Migration `0010_plain_thunderball.sql` extends the cumulative journal. Its historical parity covered
22 reads / 130 scenarios (104 remain after v0.6.1). `scripts/check-operational-data.ts <incumbent-data.json>`
compares both sources with the prior layer's evidence snapshot; the fixture snapshot
belongs on `pr-assets`. `scripts/check-operational-state.ts` verifies loaded selection
changes and empty states on the local dev server. Screenshot `--mask-live-clocks`
masks only Patient Monitoring's explicitly marked live clock, never patient data;
normal reduced-motion snapshots preserve deterministic signal geometry.

### Whole-application acceptance (v0.4/008)

The final source audit checks every canonical fixture owner and traverses runtime
imports to reject client fixture dependencies. Chat's remaining tab counts and
thread date now belong to the Chat read; migration `0011_blushing_siren.sql` follows
the operational migration. The v0.6.1 registry retained 22 reads / 104 scenarios; the Projects foundation extends it to 29 reads / 211 scenarios.
Fresh Postgres 17 and an upgrade beginning with the actual layer 001 schema/seed
both pass, including repeated seeds and deliberate parity failures.

The current screenshot catalog contains 35 visual routes × four presets × two themes × two
viewports: 560 visual cases per source, plus 13 HTTP-only route checks. Run each source/preset with the same `--reference`
ISO timestamp and `--mask-live-clocks`; neither option freezes the runtime clock.
The reference becomes a validated, read-only request header for date-relative
loaders. Without it, requests use real time. Invalid headers are ignored. Masks
cover only the marked Patient Monitoring live clock; business values remain visible.

```sh
npm run screenshots -- --base-url <url> --preset <preset> --reference 2026-10-23T12:00:00.000Z --mask-live-clocks --output <evidence>/<dev|db|workers>/<preset>
node --experimental-strip-types scripts/report-route-coverage.ts --root <evidence> --environments dev,db,workers --retries <retry-manifest.json>
node --experimental-strip-types scripts/audit-data-layer.ts
```

The coverage validator reconciles the generated route inventory, all display cases,
errors and explicit retries. Supplemental interaction, iframe, query/tab, print,
root-boundary, delayed hydration and live-clock evidence accompanies the catalog.
Store all logs/reports/images on `pr-assets` or PR attachments, never main.

## Optional authentication

No secret keeps the existing open demo, including when data comes from Postgres. Optional local auth requires a migrated Docker DB source, a generated private `BETTER_AUTH_SECRET`, and an exact `BETTER_AUTH_URL` (localhost:3000 fallback). Google/GitHub each require a complete server-side client ID/secret pair. Secret plus forced demo fails explicitly. Follow [docs/auth.md](../docs/auth.md) for setup, callbacks, configuration/security boundaries and test commands. The new `0012` migration leaves v0.4 data/seeds intact. The hosted demo intentionally stays database-free; use the [deployment guide](../docs/deploy.md) for your own database.

### Protected local application (v0.5 layer 003)

With optional local authentication enabled, all 10 dashboards, app pages and standalone/embedded Mail and Chat require a current session. Every app-data server function also checks the request independently. Auth/system pages stay public; dashboard 404s load no account shell. The header shows the signed-in name/email with Account & security and Sign out; no-secret demo mode keeps demo switching. Session changes are checked on navigation/refocus, and expired iframes return to a usable top-level login. This is authentication for shared template data, not RBAC or per-user data ownership. See [the protection matrix](../docs/auth.md#application-protection-matrix).

### Your sign-in account (v0.5 layer 004)

In local auth mode, open the account menu → **Account & security**, or `/dashboard/profile?tab=account`. Edit your name, view your read-only email, change a credential password, and revoke active browser sessions. Password changes sign out other sessions and replace this browser's session. Provider-only accounts manage passwords with their provider. Session management may ask you to sign in again after the fresh-session window. The original six Profile tabs still describe a sample employee; demo mode keeps those six tabs only.

### Authentication acceptance commands

After starting optional local Docker Postgres and running `npm run db:migrate` and
`npm run db:seed`, run `npm run auth:test`. It exercises real credentials, session
cookies, providers' authorize redirects, all route/data-function guards, account
changes and owned-session revocation. No real OAuth credentials or live provider
round-trip are required. `AUTH_EVIDENCE_ROOT` selects the private capture directory.
See [repeatable acceptance](../docs/auth.md#repeatable-acceptance) for fresh/upgrade
migration checks, bundle redaction checks and test-database lifecycle. Production
and all Worker previews remain zero-secret demos; Claude owns review/merge/release.

Historical integrated v0.5 acceptance passed **486/486 auth scenarios**, **22 reads / 130 parity
scenarios**, and **1,824 baseline + 588 supplemental capture cases** across no-env
local demo, local DB/auth-off and Workers demo. Supplemental coverage includes all
384 delayed direct/refresh hydration cases across eight routes and Chicago/Kiritimati,
with original failures and explicit retries retained. Four-state auth/account renders
and all twelve invoice print PDFs were inspected. See the [evidence index](https://github.com/moeghashim/tenboards/tree/pr-assets/v05-005)
and [security evidence](../docs/auth.md#verified-security-evidence-v05-review). All five
tasks are merged and released with v0.5; the live demo still runs with auth off.

### Workers runtime readiness (v0.6 task 001)

The compiled Worker now uses request-scoped database and Better Auth instances, a shared effective runtime environment, and successful-only auth-storage readiness memoization. Builds need no secrets. Node retains its pooled client; zero-env and forced demo remain connection-free. See [local setup, tests and evidence boundaries](../docs/auth.md#local-workers-runtime-v06-task-001). Local workerd verification does not claim hosted Neon/Hyperdrive acceptance. Task 002 adds isolated preview tooling and database rate limits; task 003 verifies operations readiness; task 004 completes adopter guidance and preparation tooling; release remains reviewer-owned.

### Preview isolation and auth hardening (v0.6 task 002)

Migration `0013_wandering_midnight.sql` adds only `auth_rate_limit`. Better Auth uses database storage with unique keys and conditional atomic increments; both Node and Worker HTTP handlers share it. Workers trust only `cf-connecting-ip`; missing/invalid values share a conservative per-path bucket. Hosted auth requires an explicit canonical HTTPS origin. General limits remain 100/10 seconds and sensitive credential routes 3/10 seconds. Custom `auth.api` calls are outside the HTTP limiter; session/origin guards still apply. See [storage/IP semantics and limits](../docs/auth.md#database-rate-limits-and-worker-origins-v06-task-002).

### Production operations readiness (v0.6 task 003)

Follow [docs/deploy.md](../docs/deploy.md) for local rehearsal, your own Neon/Hyperdrive setup, guarded direct migrations, atomic code/binding/secret staging, read-only smoke, optional account round-trip, rollback/data recovery and later OAuth. The live site remains demo-only; v0.6 is released as v0.6.0. No production connection or secret is needed for local acceptance. The default deployment check makes no account writes; the optional flag reports the retained throwaway identity and signs out its sessions. Cleanup is an exact-match database operation, not a new public API.

[Task 003 local acceptance and capture reports](https://github.com/moeghashim/tenboards/tree/pr-assets/v06-003) record the exact isolated preview and evidence boundaries; hosted checks belong to each adopter; task 004 adds template preparation and onboarding.

## Projects data foundation (v0.8 / 001)

The additive Projects model is available to server consumers; Board/List now consume it through guarded server functions; navigation is integrated. `0015_project_foundation.sql` preserves the legacy workspace and auth tables and backfills canonical, namespaced tasks plus project file/calendar links. Run `npm run db:migrate` and `npm run db:seed` for local upgrades. Demo and database reads share validated contracts, with 29 registered reads / 211 parity scenarios.

The original samples are Operations rollout (`sample-operations`), Documentation refresh (`sample-docs`) and the empty Research queue (`sample-empty`). Synthetic membership is display metadata, not an account or permission boundary. Both Kanban and ledger records remain traceable, including canceled tasks. Sample dates are projected from one stored anchor onto the request’s UTC day, identically in demo and DB modes. Both populated projects include overdue, today and upcoming work; most tasks have authored schedule spans. Adopter rows retain their actual dates. See [project data and migration details](../docs/data.md).

`node --experimental-strip-types scripts/project-check.ts` verifies mappings, scope, pagination, constraints, DB-only sentinels and populated/repeated upgrades against a local database whose name contains `_v08_`. All 100 legacy ledger titles now describe original, neutral operations-rollout work. Repeat seeds update both workspace and project task copies, preserving IDs and structure. Test ports share `scripts/test-port.ts`: `TEST_PORT_OFFSET` offsets default listeners; explicit suite overrides win and are applied once. Test ports can also be isolated with `AUTH_TEST_PORT`, `WORKER_TEST_PORT`, `SECURITY_TEST_PORT` (reserves three consecutive ports), and `AUTH_SENTINEL_PORT`. `TEST_DATABASE_INFIX=v08` isolates temporary auth database names. These are test tooling settings, not runtime configuration.

## Project Board and List (v0.8 / 002)

Open `/dashboard/projects/sample-operations/board` or `/dashboard/projects/sample-operations/list` directly. The project selector also offers Documentation refresh and the empty Research queue. Board and List share canonical task IDs, statuses (including canceled), assignees, labels, due dates, subtasks and counts. Search, status/assignee/priority/label filters, sort and bounded pages use validated URL state; Board loads every matching task across bounded server reads; only List paginates (10/20/50 rows). Default search values are omitted from Board/List URLs. Progress states the eligible task denominator and the excluded canceled count; tasks without subtasks display an em dash. Search updates after a short typing pause. Filters use the shared Select controls. Compact Board cards omit empty counts and use circular assignee avatars, semantic priority badges, status dots and short task keys; List shares these cues. Task details open the existing keyboard-accessible dialog. There is no task creation, drag/drop, completion or edit endpoint.

The existing Kanban and Tasks URLs redirect permanently to the default project. The project shell has one project-qualified header breadcrumb, status, member avatars and progress, and links Overview, Board, List, Timeline and Files; workspace Home/index, nested sidebar navigation and project-qualified palette search are available. Unknown projects return an authorized 404. `/`, `/dashboard` and auth-success fallback use `/dashboard/default` as of v0.8.1.

Run `node --experimental-strip-types scripts/project-ui-check.ts http://localhost:3270` for project switching, filters, pagination, details/focus and responsive checks. `scripts/project-access-check.ts` checks route/RPC denial, validation, project scope and revocation against an isolated local auth database; `AUTH_TEST_RUNTIME=workerd` exercises the Worker build.

## Project Overview, Timeline and Files (v0.8 / 003)

`/dashboard/projects/sample-operations` validates the project then redirects to `/overview`. Overview shows scoped totals, sample members, upcoming work and activity. Upcoming work uses request-relative dates and filters dates before query limits. Shared StatCards, member avatars with roles and relative due labels support scanning. Empty and unknown projects remain distinct.

`/timeline` offers segmented Gantt/Table/Calendar modes, with Table after mobile hydration unless a mode was explicitly chosen. Weeks/Months, 1–12 periods, date input and previous/next/Today controls change presentation without reloading task data. The initial range includes today and the project’s active span within the bounded range. Status-colored bars and a vertical Today marker align with the date axis. Rows outside the range are hidden in both chart and table; unscheduled work is available in a collapsible group below them. Search updates after a typing pause. Calendar reuses Month/Week/Day with project events and dated tasks, without Add event. Task dates and deadline metrics share the serialized request’s UTC day; event templates retain the existing UTC-to-local hydration behavior. Task/event identities are distinct and inclusive task ends become exclusive all-day calendar ends.

`/files?view=grid|list` reuses the current file/folder displays with real local search/type filters. File-type icons, a read-only star marker and shared icons replace explanatory metadata labels. Grid/List uses a segmented switch; file types use the shared Select. Folder summaries remain display metadata; all loaded files remain at project root. There is no upload, download, share, rename or delete service. Old Calendar/File Manager URLs redirect to Timeline Calendar mode and project Files.

`node --experimental-strip-types scripts/project-schedule-check.ts` tests civil-day spans, clipping, invalid inputs and timezone edges. `scripts/project-views-check.ts http://localhost:3270` covers all five links, index redirect, schedule identity, responsive/keyboard controls, Calendar modes, file filtering, empty projects and delayed direct/refresh hydration. Data parity is 29 reads / 211 scenarios.

Project progress uses completed / (total − canceled), with both the denominator and canceled exclusions shown. Overview shows Canceled separately; Overdue is explicitly a subset of Open. Header member initials have spacing so adjacent avatars do not cover them. Files search uses the “File name” hint. Default Timeline/Files search values are omitted from URLs; explicit display choices still round-trip.

## Workspace Home and Projects (v0.8 / 004)

`/dashboard/home` is the cross-project workspace summary. Its greeting uses a serialized request clock and adopts local time after hydration; the four metrics show open tasks, overdue open tasks, completed tasks and active/at-risk projects. My tasks explicitly belongs to **Jordan Lee, the sample member**, in both demo and authenticated modes. It does not map assignments or membership to the signed-in user. My tasks and upcoming deadlines show at most ten rows with exact totals; each row opens its owning project List, and project progress/activity links open that project's Overview. Sample due dates use the same request UTC day as all project views.

`/dashboard/projects` provides debounced name/description search, a shared status Select, stable project ordering, progress, target dates and member summaries. No matching results can be reset, and the empty Research queue remains a real project with zero work. Both destinations and their server reads are independently guarded and read-only. The project summary card is shared with Home; no new runtime dependency or density override is introduced.

On desktop, Recent activity sits beneath My tasks beside Upcoming deadlines, keeping both work columns balanced; mobile keeps tasks, deadlines, progress and activity in reading order. Home and index cards share the project header’s eligible-task progress and readable member initials. Project breadcrumbs link Projects → project Overview → current view, with `aria-current` on the view. Default index search values are omitted from links.

Primary navigation retains Home and Projects. The brand link, `/`, `/dashboard`, `/dashboard/` and missing/unsafe auth fallbacks open `/dashboard/default`; validated return destinations still win.

## Project navigation and consolidation (v0.8 / 005)

Primary navigation is Home → Projects → Email → Chat, followed immediately by AI Assistant. Default remains under Dashboards. The brand opens `/dashboard/default`; `/`, `/dashboard`, `/dashboard/` and missing/unsafe auth fallbacks redirect to `/dashboard/default`. Guarded summaries populate the Projects section and project-qualified command palette without fetching project data on public root/auth surfaces. Exploration counts include concrete project views, excluding aliases.

Project buttons disclose Overview, Board, List, Timeline and Files. The active child matches an exact project/view; rail triggers open named keyboard-accessible popovers. Mobile disclosure keeps the sheet open, while navigation closes it. `tenboards:project-nav:v1` stores only expanded known IDs (maximum 50) in localStorage. Initial render opens the active ancestor, restores/prunes storage after hydration, tolerates corrupt/disabled storage, and opens an ancestor on project entry. Manual collapse persists across views of the same project until leaving and re-entering. Existing layout cookies remain unchanged.

| Legacy URL | Permanent destination | Retained search |
| --- | --- | --- |
| `/dashboard/kanban` | `/dashboard/projects/sample-operations/board` | `view=list` or `table` selects `/list`; other values select Board |
| `/dashboard/tasks` | `/dashboard/projects/sample-operations/list` | None |
| `/dashboard/calendar` | `/dashboard/projects/sample-operations/timeline` | Explicit `mode=calendar` |
| `/dashboard/file-manager` | `/dashboard/projects/sample-operations/files` | Valid `view=list|grid`, default grid |

Redirects use 308 with replacement navigation and retained fragments. Auth may first send an unauthenticated request to login; authorized requests then follow the permanent redirect. Unknown keys are discarded. Unknown project IDs return authorized not-found rather than default-project data. Legacy workspace rows remain intact; only obsolete page compositions were removed.

Run `scripts/project-navigation-check.ts` for disclosure/rail/mobile/palette/storage/layout checks and `scripts/project-redirect-check.ts` for demo/auth HTTP/client/query/hash/trailing-slash/revocation checks using Node's `--experimental-strip-types`. Capture patterns use concrete `sample-operations` paths in `src/navigation/route-catalog.ts`; redirect-only aliases are in `scripts/screenshot-routes.ts`. Secondary and empty projects are covered separately. Capture output belongs on `pr-assets`, not main.

The Default revenue dashboard is the landing page again, per the locked 2026-10-26 v0.8.1 PLAN decision. `/dashboard` and `/dashboard/` retain their existing 307/replace redirect mechanism and lead to `/dashboard/default`. The v0.9.1 homepage supersedes only the `/` redirect; it returns public marketing content with HTTP 200. Missing or unsafe post-sign-in/OAuth return values fall back to `/dashboard/default`; validated destinations still win. Workspace Home stays at `/dashboard/home` in its existing navigation position, Projects retain their contextual Home links, and Default stays under Dashboards. The brand link (accessible name “tenboards dashboard”) and global recovery links (“Go to dashboard” / “Return to dashboard”) open Default. The consolidated Kanban Board is read-only: the former local drag-and-drop interaction has been removed, and tasks cannot be moved or reordered.

With the three sample projects, the demo card counts **35 enabled concrete dashboard destinations**, including AI Assistant and all 15 project views; aliases are excluded.

## Projects integrated acceptance (v0.8 / 006)

The six v0.8 layers are stacked for review; they do not constitute a merged release. Claude owns review, merge/rebase, production deployment and release. Package version and release tags remain unchanged. The application uses the v0.6.2 compact system; no additional runtime dependency or hosted service was introduced.

The capture inventory contains 36 visual route patterns and 14 HTTP/redirect-only routes. Dynamic project patterns resolve to the concrete `sample-operations` fixture by default. Use `--project-id sample-docs` or `--project-id sample-empty` with the five project route patterns to capture the secondary/empty projects. Only those three known fixture IDs are accepted. Reports record the selected project and each case's diagnostics; the actual app clock remains live. For example:

```sh
npm run screenshots -- --base-url http://localhost:3277 --preset pine --project-id sample-docs --routes '/dashboard/projects/$projectId/overview,/dashboard/projects/$projectId/board,/dashboard/projects/$projectId/list,/dashboard/projects/$projectId/timeline,/dashboard/projects/$projectId/files' --output screenshots/v08-project-docs
```

Integrated acceptance combines the full retained-route Default/Graphite/Pine/Iris matrix (light/dark × desktop/mobile), the secondary/empty project matrix, focused task/navigation/workspace interactions and delayed real-clock Calendar/Home checks. Node/compiled workerd verify guards and failure recovery, 29-read/211-scenario parity and migration preservation. Navigation tests also exercise all sidebar layout/collapse combinations and real isolated DB error/empty recovery. Evidence and a consolidated report belong on `pr-assets/v08-006`; screenshots never enter the implementation branch.


## Public blocks and kit (v0.9 / 001)

Released in v0.9.0. Import presentation APIs from `@/components/blocks`: `PageHeader`, `DashboardCard`, `SectionHeader`, `StatCard`, `DataTable`, `DashboardChart`, `DashboardTooltip`, `DashboardLegend`, and the chart axis/grid/cursor, series, formatting and reduced-motion helpers. Exported prop types and TSDoc describe each contract. Existing route imports have migrated; the old route-local card/header files and chart theme file have no compatibility shims.

Open `/dashboard/kit` from the **Developer** sidebar group or the command palette. Every block has a live example, variants and copyable TypeScript source. Snippets are static raw imports of the actual example modules, so the displayed code is the code that runs. The kit includes sorting, pagination, empty recovery, mobile table reflow/scrolling, single/comparison chart series, exact chart data and clipboard-failure recovery.

### Project layout for blocks

- `src/components/blocks/index.ts` — public barrel and typed API.
- `src/components/blocks/{cards,page-header,charts,data-table}.tsx` — presentation only; no route imports, fetching or domain fixtures.
- `src/routes/(main)/dashboard/kit/-components/` — illustrative fixtures, executable examples and source disclosure.
- `src/lib/data-table-features.ts` — existing TanStack Table v9 registry, also exported by the blocks barrel.
- `src/components/ui/` and `src/components/calendar/` — protected primitive layers, unchanged.

Create a caller-owned `useTable` instance with `dataTableFeatures` and pass it to `DataTable`. Columns, filters, row IDs and client/server state stay with the caller. Use non-interactive column headers because the block supplies sort buttons; supply `columnLabels` for function headers. `mobile="reflow"` retains labelled values below the medium breakpoint; `mobile="scroll"` keeps a locally scrolling table. Set `pagination={false}` when the caller renders its own controls. Specialized existing tables keep their route-specific presentation.

Run `BLOCKS_TEST_URL=http://127.0.0.1:3000 node --experimental-strip-types scripts/blocks-kit-check.ts` for the four-state interaction and homepage → demo → Home smoke checks. Use `npm run screenshots` for the full route matrix. The intentional Developer entry and demo page count change the shell; screenshot comparisons of existing page content exclude that sidebar region and narrowly mask the live monitoring clock.

## Build your own pages (v0.9 / 002)

Page generators shipped in v0.9.0. Start with the canonical examples at `/dashboard/kit`, then scaffold a dashboard or a table page:

```sh
npm run new:dashboard team-activity
npm run new:dashboard team-activity -- --title "Team activity" --group Dashboards
npm run new:page requests -- --title "Requests"
```

Choose one dashboard command: repeating an existing slug fails without changing files. Slugs must be lowercase kebab-case, start with a letter, and contain at most 64 characters. Existing routes (including redirect aliases), reserved framework names, data files and read names are protected. `--title` accepts nonempty single-line text; dashboards accept an existing sidebar group label with `--group` (default **Dashboards**). Pages use **Pages**. Unknown flags/groups fail before writes. The generator prints every created/updated file and follow-up commands.

Each generator adds an `index.tsx` and route-local `-components/` under `src/routes/(main)/dashboard/<slug>/`, a sidebar item, a capture/command-palette route entry, typed DTOs, a canonical fixture, a guarded GET loader, and a registered `readX`/`demoX`/`dbX` domain. Dashboard output composes a PageHeader, three StatCards, one DashboardChart card and one DataTable card. Page output composes a PageHeader and DataTable card with an empty state. Tables preserve the kit's caller-owned `dataTableFeatures`, sorting, pagination and mobile reflow. Charts use the public block exports, token series and reduced-motion helper, with an exact-data table.

Editable templates live in `scripts/templates/*.template`; they use `__SLUG__`, `__NAME__` and JSON-escaped `__TITLE__` substitutions. Node's strip-types runner uses the existing TypeScript parser to locate registration arrays and the existing Biome installation to format before writing. No dependency is added. A temporary `.page-generator.lock` serializes generator invocations; after an interrupted process, confirm no generator is running before removing a stale lock.

The DB function is explicitly a **fixture-backed scaffold stub**, not persistence: demo and DB paths return fresh clones of the same illustrative DTO. Implement the generated TODO with schema, migration, seed and ordered DB queries, and extend its parity scenarios before connecting real records. Follow [the data-layer guide](../docs/data-layer.md) and [project data contracts](../docs/data.md). Both the document route and GET function retain the existing session guards. No auth policy changes or mutations are generated.

```sh
npm run dev                         # visit /dashboard/<slug>
npm run build                       # router regenerates routeTree.gen.ts
npm run check
npm run typecheck
npm run data:parity                  # migrated/seeded local DATABASE_URL required
npm run verify:page -- /dashboard/<slug>  # supplied by v0.9 task 003
```

Never hand-edit `src/routeTree.gen.ts`. `verify:page` is the companion task's command and is unavailable until that task is merged.

Run `npm run generators:test` with a migrated/seeded **local** `DATABASE_URL`. It copies the current tracked and unignored files into a temporary repository, copies installed dependencies with independent caches, verifies safe failures and repeat invocation, generates both examples, and runs build/check/typecheck/full data parity without manual fixes. If `check:design` is installed, it also runs that check. A dedicated random-port demo server verifies homepage → Default → Home, palette navigation, pagination, refresh and both generated screens in light/dark × desktop/mobile, followed by `npm run screenshots`. The test removes its temporary source/build and stops its server even on failure; no sample page is committed. Evidence defaults to gitignored `screenshots/generators-test` (`GENERATORS_TEST_OUTPUT` overrides it) and belongs only on `pr-assets` or PR attachments. Install the repository's Playwright Chromium browser if it is not already available.


## Design checks and page verification (v0.9 / 003)

`npm run check:design` enforces token/block usage in routes and public blocks; it also runs inside `npm run check`. Diagnostics name the token class or block to use. Recharts primitives now come from `@/components/blocks/charts`; chart helpers remain exported by `@/components/blocks`. CSS variable references, viewport calculations using tokens and grid track composition are allowed. Inherited exceptional geometry is documented in the exact, occurrence-counted `scripts/design-exceptions.json`; new pages and generator output must use tokens or blocks instead of adding exceptions. See [the rules and heuristics](../docs/design-guardrails.md).

```bash
npm run check:design
npm run check:design:test
npm run verify:page -- /dashboard/home
npm run verify:page -- /dashboard/kit --base-url http://127.0.0.1:3000
npm run verify:page -- --all --base-url http://127.0.0.1:3000
npm run verify:page:test
```

`verify:page` reuses the requested server or starts a local Vite server when it is unavailable. It captures light/dark × desktop/mobile, checks WCAG 2.2 A/AA rules with exact-pinned `@axe-core/playwright`, and reports console, hydration and page errors. Each route gets screenshots and `report.json` in gitignored `verify/<encoded-route>/`; `verify/report.json` indexes the run. Exit 1 means a violation, runtime error or setup failure. Reports preserve axe selectors, node HTML, help links and incomplete/manual-review candidates; an automated pass is not a complete accessibility audit.

`--all` uses the same 37-entry capture catalog, including concrete sample project paths, aliases and system states. The verifier never suppresses axe rules; the inherited findings it originally reported are recorded as resolved in [open questions](../dev/open-questions.md). Evidence belongs on `pr-assets`, never the implementation branch. Shell search/account names and the Default activity filters have accessible names that include their visible labels. Task 006 resolves the inherited route-specific names, table scrolling, contrast, progress and list semantics at usage sites: all 37 catalog routes pass light/dark × desktop/mobile (148/148 cases), with zero axe violations or runtime errors. Inactive tabs and the New navigation badge use supported token pairs; token values and protected primitives stay unchanged. Named Analytics/Timeline scroll regions support keyboard scrolling with visible focus; disabled pagination exposes its unavailable state.


## Building with agents

Start a fresh Codex or Claude Code session in your clone and ask, for example,
“add a Sales dashboard with revenue KPIs and a top-products table” or
“add a Vendors page listing vendors”. [AGENTS.md](../AGENTS.md) provides the build loop;
Claude Code imports it through root CLAUDE.md.

The repository ships two [Agent Skills](https://agentskills.io/specification):

- [tenboards-build-ui](../.agents/skills/tenboards-build-ui/SKILL.md): generators, public blocks, domain adaptation and page verification.
- [tenboards-connect-data](../.agents/skills/tenboards-connect-data/SKILL.md): typed reads, guarded loaders, additive migrations, seeds and demo/database parity.

Codex discovers `.agents/skills/`; Claude Code discovers the committed relative
symlinks in `.claude/skills/`. Keep symlinks enabled when cloning. Restart an existing
session after adding skills. You can explicitly request `$tenboards-build-ui` in
Codex or `/tenboards-build-ui` in Claude Code. Supporting references load on demand.

The default path is generator → public blocks → typed data → checks → four-state
verification. Run `npm run check:skills` to validate metadata, relative references
and mirrors; it also runs in `npm run check`, with no added dependency. Frontmatter
uses plain/quoted YAML scalar fields and an indented string metadata map; unsupported
YAML constructs fail explicitly. Run `npm run check:skills:test` when editing the validator.

Generators initially return illustrative fixtures in both sources. A working demo
is not proof of a real database query: use the data skill and `data:parity` before
claiming database integration. `verify:page` checks axe and runtime errors; inspect
its screenshots and keyboard behavior too. Upstream contributions must first read
[the maintainer rules and PR template](../dev/MAINTAINERS.md).

## shadcn registry

Use `/dashboard/kit` on your running tenboards host for per-block JSON links and copyable install commands. In an **external React 19 + Tailwind v4 project with shadcn initialized**, substitute that host's origin:

```sh
npx shadcn add https://YOUR-TENBOARDS-HOST/r/stat-card.json
npx shadcn add https://YOUR-TENBOARDS-HOST/r/dashboard-chart.json
```

Nine items cover PageHeader, DashboardCard, SectionHeader, StatCard, CardContent, DataTable, DashboardChart, DashboardTooltip and DashboardLegend. Import installed cards from `@/components/tenboards/cards`, chart components/helpers/primitives from `@/components/tenboards/charts`, and CardContent from `@/components/tenboards/ui/card` (adapt `@/` to your configured alias). PageHeader and DataTable use their kebab-case module names; table features install at `@/lib/tenboards/data-table-features`. Related items intentionally share a source module. Existing tenboards clones should continue importing `@/components/blocks`; do not reinstall the registry into this template.

`registry.json` lists each block's purpose, source files, exact UI/helper files and package dependencies. `npm run registry:build` uses the installed shadcn CLI and emits self-contained `public/r/*.json`. Items use shadcn’s `registry:style` type because they install a block **and** its theme: unlike `registry:block`, this tells the CLI to replace initialized theme variables instead of silently keeping the old palette. The build adds the light/dark tokens, Tailwind mappings and CSS rules directly from `src/styles/styles.css`, pins dependency ranges to this template's package declarations, and relocates bundled primitives under `components/tenboards/ui` so an external project's own UI files stay intact. Chart items include `seriesConfig`, axes, formatters, `useChartMotion`, tooltip/legend helpers and Recharts. Preserve named series and an accessible data alternative.

**Theme installation is global:** it applies the default tenboards colors, Geist fonts, compact type/spacing, focus and reduced-motion rules to the consumer's configured stylesheet. Review the CLI's CSS diff, especially in an existing themed project. It does not install the app shell, presets, routing, data, auth, bindings or secrets. No new package was added to this repository.

Registry items have no host-bound custom registry dependencies: required source and CSS are bundled. Static documentation uses root-relative URLs, resolved against the origin serving `/llms.txt` (`new URL(path, llmsUrl).href`). Kit commands use `window.location.origin` after hydration; SSR and the first client render show the same placeholder. This makes preview and adopter hosts portable without a hard-coded production origin or build-time environment variable.

## LLM documentation

`/llms.txt` is a compact block, generator, skill and docs index; `/llms-full.txt` also contains the source guidance and block implementations. Linked Markdown is served under `/agent-docs/`. All are static ASSETS, alongside `/r/*.json`, with no runtime handlers or new bindings.

Run `npm run llms:build` after changing the registry inventory, generators, listed docs, skills or block source. Run `npm run registry:build` after changing blocks, their dependencies or tokens. Commit the resulting assets. `npm run check` runs `check:registry` and `check:llms` in read-only mode and fails on drift; it never silently refreshes stale output. Deploy/build uses these checked-in assets unchanged.

Registry tooling regression coverage: `node --experimental-strip-types scripts/registry-test.ts` checks theme conversion and verifies that source/output drift fails the freshness checks (restoring all probes afterward).

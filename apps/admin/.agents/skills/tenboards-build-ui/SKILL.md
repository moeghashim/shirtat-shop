---
name: tenboards-build-ui
description: Build tenboards dashboards and app pages with generators and public blocks. Use when adding or changing a dashboard, page, KPI, chart, revenue summary, or data table.
license: MIT
metadata:
  version: "1.0"
---
# Build tenboards UI

Default to the existing compact system and read-only demo data unless the user asks
for live data. Use the generator, then adapt its domain; do not offer a new design system.
Read root AGENTS.md and DESIGN.md. Inspect `/dashboard/kit` and the local component
before composing. If Impeccable is installed, use Operate mode and its craft floor.

## External projects

Inside a tenboards clone, keep using `@/components/blocks`. Only when installing
blocks into another initialized React 19 + Tailwind v4 + shadcn project, use the
kit's registry links and current-host `npx shadcn add` commands. Items install
under `components/tenboards`, include chart helpers and apply the default global
theme/compact CSS. Review that CSS change; retain accessible chart data alternatives.
`/llms.txt` indexes the registry and guidance; resolve its root-relative URLs
against the host from which you fetched it before passing a URL to shadcn.

## Progress checklist

- [ ] Run `npm run new:dashboard <slug>` for metrics/charts or `npm run new:page <slug>`
  for a listing. Both live at `/dashboard/<slug>`; optional `-- --title "Title"` sets the title.
  Generators register sidebar, route catalog and parity reads and reject occupied slugs.
- [ ] Read [block contracts](references/blocks.md) for the blocks you need. Adapt
  generated `-components/`, server types and canonical fixtures together; use realistic
  neutral sample records. Update table headings, accessible labels, empty copy and KPI
  units to match the requested domain. Do not leave generic requests in a Vendors page.
- [ ] Preserve the generated guarded loader and `readSource` boundary. Components
  import types only from the server layer, never fixtures. For a real DB query, use
  `tenboards-connect-data`; clearly retain the illustrative DB TODO until implemented.
- [ ] Run `npm run build`, `npm run check`, `npm run typecheck`.
- [ ] Run `npm run check:design` and `npm run verify:page -- /dashboard/<slug>`.
  Use an isolated demo server/port for scratch work, e.g. `--base-url http://127.0.0.1:3404`.
  Read `verify/report.json` and route reports; fix violations/runtime errors and rerun.
- [ ] Inspect the four light/dark × desktop/mobile captures, empty state, keyboard
  controls and reduced motion. Report actual results and any remaining blocker.

## Gotchas

- SSR clocks must share an initial value; live clocks start after hydration. Delayed
  hydration evidence must actually delay scripts, not expire during server startup
  ([review #24](https://github.com/moeghashim/tenboards/pull/24#discussion_r4359849605)).
- A tooltip `formatter` replaces the whole row: preserve series labels as well as
  values ([review #24](https://github.com/moeghashim/tenboards/pull/24#discussion_r4359849593)).
- Compact desktop sizing must not shrink mobile grouped inputs into focus zoom
  ([review #65](https://github.com/moeghashim/tenboards/pull/65#discussion_r4368113744)).
  Keep body/table ≥13px, metadata ≥12px and targets ≥24px per DESIGN.md.
- A login redirect is not a verified dashboard. Check the final route and use the
  intended demo server ([review #78](https://github.com/moeghashim/tenboards/pull/78#discussion_r4375549966)).
- Tokens, not literals or arbitrary typography escapes; new pages get no exception
  ([review #78](https://github.com/moeghashim/tenboards/pull/78#discussion_r4375549973)).
- Framework/API invariants (not invented review findings): route groups add no URL
  segment; never hand-edit `routeTree.gen.ts`; spread `useChartMotion()` on animated
  series/tooltips so SSR and reduced motion stay stable. Use the local Table v9 API,
  not v8 `useReactTable` examples.

### Scratch evaluation corrections (v0.9 / 004)

- The Sales eval initially assumed a third options argument to `formatCurrency`
  and a Table `sortFn: "basic"`. The agent corrected both: the helper accepts only
  `(value, currency?)`; numeric columns use a numeric comparator. Wrap it for chart
  tick callbacks so an index is not passed as the currency argument. Read installed
  signatures before borrowing examples.
- Scratch evaluations with a symlinked `node_modules` hit Nitro dev-runner module
  resolution errors and HTTP 503 before page rendering. Install dependencies inside
  each scratch clone; alternatively build and run `npm run preview -- --port <port>`
  and pass that origin to `verify:page`. This is a harness setup failure, not an
  accessibility pass; preserve the failed report alongside the successful rerun.
- Gitignored scratch TSX probes can still enter `tsc` through tsconfig's include
  patterns. The Sales empty-state probe introduced an unused React import; remove
  temporary probes after verification and rerun typecheck. Gitignore is not a
  TypeScript exclusion.

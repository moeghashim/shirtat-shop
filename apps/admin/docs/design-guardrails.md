# Design guardrails

DESIGN.md owns tokens and presentation. `npm run check:design` scans `src/routes/**` and `src/components/blocks/**`; protected `ui/`, protected `calendar/`, generated files and dependencies are outside its scope. `npm run check` runs Biome and then this command. No runtime dependency is added.

## Rules and fixes

| Rule | What fails | Fix |
| --- | --- | --- |
| Raw color | Hex (3/4/6/8 digits), rgb/rgba, hsl/hsla or oklch functions in JS/TS strings/templates/JSX attributes or CSS, excluding comments | Use `text-muted-foreground`, `bg-card`, another DESIGN.md class or `var(--primary)`; normative palette literals belong in the token stylesheet |
| Arbitrary value | Bracket/parenthesis values for color, width/height/min/max/size, margins/padding/gaps, offsets, type/leading/tracking, radii and related utilities; arbitrary CSS color/size/type properties | Use named utilities such as `p-4`, `text-sm`, `h-64`, or token references; new pages must use tokens or blocks |
| Chart boundary | Static/dynamic imports, requires and re-exports of `recharts` or its subpaths in route/block code outside the chart module | Import primitives from `@/components/blocks/charts`, with chart styling/motion helpers from `@/components/blocks` |
| Primitive card import | Importing `Card` (including aliases), a namespace, or a whole dynamic UI card module in route code | Use `DashboardCard` or `StatCard`; existing UI card slots are still valid composition tools |
| Card markup heuristic | Native `div`, `section`, `article` or `aside` with a literal `className` containing a rounded utility, border/ring utility, and a card/background/muted/white surface | Use `DashboardCard` or `StatCard` |
| Page header heuristic | Native `<h1>` in routes/blocks outside the canonical PageHeader implementation | Use `PageHeader`; card headings use `SectionHeader` |

The Recharts-outside-chart-block rule lives in **`biome.json`**, not `design-rules.ts`. `scripts/fixtures/design/violations.json` seeds static, dynamic, re-export and deep Recharts imports; `check:design:test` verifies that each fails in both routes and non-chart blocks.

Biome's `noRestrictedImports` owns module restrictions ([official rule](https://biomejs.dev/linter/rules/no-restricted-imports/javascript/)). Its path/name patterns cover aliases and relative card imports. The chart implementation boundary is `src/components/blocks/charts.tsx`, `charts-*.tsx` and `charts/**`. Recharts primitives are re-exported from there and through the `@/components/blocks` barrel; no other module imports `recharts`.

The remaining rules use the already-installed TypeScript parser in `scripts/design-rules.ts`. This makes multiline JSX, conditional `cn(...)` literals, templates and comment exclusion predictable without a new parser dependency. Biome/GritQL can match individual syntax forms, but cannot share the occurrence-counted, value-specific geometry exception policy and mixed CSS/JS checks as simply. Diagnostics include source location and a concrete token/block correction.

These are intentionally bounded authoring checks, not a general CSS interpreter. They do not resolve computed class strings, follow variables into JSX, infer whether arbitrary native markup is semantically a card, validate every numeric inline style, or prove token contrast. Selector/state variants such as `[&_td]:text-sm` and `data-[state=open]:bg-card` are allowed; a bracket value such as `[&_td]:text-[13px]` fails. CSS custom-property references (`h-(--header-height)`, `bg-[var(--primary)]`) and `calc()` expressions composed only of variables, numbers, arithmetic and viewport units are allowed token usage. Grid track templates (`grid-cols`, `grid-rows`, `auto-cols`, `auto-rows`) are allowed layout composition. Literal colors, type/leading/tracking, spacing, radii, shadows and fixed px/rem dimensions still fail, including literals mixed into variable expressions such as `h-[calc(var(--header-height)+13px)]`. JS prose, comments and array indexing are not treated as Tailwind classes; color-like strings can require an explicit exception if they are non-style data.

## Existing exceptions

**Exceptions are for inherited code only. New pages and generator output must not add entries; fix with tokens or blocks instead.**

`scripts/design-exceptions.json` is the reasoned inventory of existing geometry/markup. Entries match **file + rule + exact value + count**. Adding another occurrence or copying the value to another file fails. Removing an occurrence fails until the stale entry is removed. Each entry explains its existing pane/print/grid/control or heading requirement. This task preserves all approved renders; it introduces no new tokens or visual fixes.

Six existing primitive Card imports have adjacent, narrowly scoped Biome suppressions explaining their specialized density/size semantics. UI card content/header/footer slots are intentionally available for DashboardCard composition. Blocks can use protected primitives to implement their API.

Do not generate or renew the baseline automatically. For new pages, use the blocks and named utilities. Broad directory exclusions or silent suppressions defeat the contract. As an existing screen is migrated, remove its matching exception in the same change.

## Page verifier

`npm run verify:page -- <route> [--base-url URL]` accepts a concrete application path or a capture-catalog pattern such as `'/dashboard/projects/$projectId/overview'`. `--all` selects every `captureRoutes` entry, including its concrete demo path. The default base origin is `http://127.0.0.1:3000`. An unavailable loopback HTTP origin starts Vite with the requested port and `--strictPort`; an unavailable remote origin fails with an instruction to start it. Only a server started by the verifier is stopped. Reused servers are left running. Auto-start uses the same optional `.env` convention as `npm run dev`.

Each route runs in four fresh browser contexts: light/dark at 1440×900 and 390×844, with reduced motion, en-US, America/Chicago, Default preset and Geist. Theme cookies and rendered theme/hydration gates match the existing screenshot suite. It waits for ready text (when catalogued), network idle, fonts/images and chart settling before full-page capture and axe. Capture preserves input caret styles to avoid injecting inline styles while lazy routes hydrate. It does not hide content or mask accessibility failures. Console errors, hydration-related console messages, page exceptions and failed requests are failures; ordinary warnings are retained separately.

The approved dev dependency is exact-pinned `@axe-core/playwright@4.14.0` (Node 22.12+). Axe includes `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `wcag22aa`, following [Playwright's axe integration](https://playwright.dev/docs/accessibility-testing). Reports include violations, affected selectors/HTML, help links, incomplete/manual-review results and axe version. An empty violation list cannot establish full WCAG compliance.

Artifacts live under `verify/<URL-encoded-route-without-leading-slash>/` (`root` for `/`). Every route writes `report.json` and four PNGs; setup failures write `verify/failure.json`, and `verify/report.json` indexes the run. Failed navigation/capture is recorded as an error and may have no screenshot. Exit 0 requires all selected cases to pass; any axe/runtime/setup failure exits 1. The tool has no inherited-failure suppression mode. Log those findings separately in `dev/open-questions.md` and link the evidence for reviewer triage.

## Tooling regression tests

- `npm run check:design:test`: seeded color/utility/markup and import violations, permitted tokens/selectors/slots/chart-module imports, counted and stale exceptions, and the failing CLI path. Import fixtures use temporary dash-prefixed files, removed in `finally`; route generation ignores them.
- `npm run verify:page:test`: serves `scripts/fixtures/inaccessible.html`, runs the same four-state audit core in a child process, and verifies unnamed-button/input axe rules, a seeded hydration console error, screenshots/report and exit 1. It also proves reuse leaves the fixture server running. The HTML fixture bypasses only the app's React/theme readiness gate; production CLI verification always requires it.

Upload output only to `pr-assets` or PR attachments. Never commit capture output to main.

# 002 — Page generators

Status: merged (#79). Branch: `feat/v0.9/002-page-generators`. Depends on 001.

## Scope

- `npm run new:dashboard <slug> [--title "…"] [--group Dashboards]` and `npm run new:page <slug> [--title "…"]` (Node strip-types scripts, no new dependency).
- Each generates: route under `src/routes/(main)/dashboard/<slug>/` with `-components/`, a skeleton composed only of blocks (`PageHeader`, a `StatCard` row, one `DashboardChart` card, one `DataTable` card for dashboards; `PageHeader` + `DataTable`/empty state for pages), a typed demo read following the v0.4 data-layer pattern (demo fixture + read function; db path stubbed with a clear TODO that keeps demo ≡ db parity checks passing), sidebar item and route-catalog entry.
- Refuse to overwrite; validate slug (kebab-case, not reserved); print the created files and next steps (`verify:page`).
- Templates live in `scripts/templates/` so adopters can edit them.

## Acceptance criteria

- [x] Fresh output of both generators passes build, check, typecheck and data parity with zero edits; renders without console/hydration errors in light/dark × desktop/mobile.
- [x] Re-running on an existing slug fails safely with a clear message; invalid slugs rejected.
- [x] A scripted test generates into a temp copy, runs the checks, and cleans up (`npm run generators:test`).
- [x] README “Build your own pages” section and CHANGELOG draft updated; milestone status; preview in PR (generated sample pages are not committed).

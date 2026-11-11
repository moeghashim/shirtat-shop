# 001 — Public blocks and kit page

Status: merged (#77). Branch: `feat/v0.9/001-blocks-kit`.

## Scope

- Create `src/components/blocks/` with stable typed exports: `PageHeader`, `SectionHeader`, `DashboardCard`, `StatCard`, chart wrappers (`DashboardChart`, tooltip, legend, axis/grid helpers re-exported or moved from `src/lib/charts/theme.tsx`), and a `DataTable` built on the existing `@tanstack/react-table` usage (sorting, pagination, empty state, mobile reflow pattern already in use).
- One barrel `src/components/blocks/index.ts`; each block has a TSDoc summary and prop docs.
- Migrate all existing imports to the blocks path; remove the old route-local copies (no re-export shims left behind except where needed for one release, documented).
- Add `/dashboard/kit` (sidebar group “Developer”, also in the palette and route catalog): every block with live demo data, variants, and a copyable source snippet. Static snippets, no new dependency for highlighting beyond existing `shiki`/code-block.
- DESIGN.md: replace “Dashboard presentation foundation” paths with the blocks API.

## Acceptance criteria

- [x] Blocks exported from `@/components/blocks` with typed props and TSDoc; no route-local duplicates remain.
- [x] Every existing dashboard/app page renders identically before/after (screenshot diff evidence for all dashboards, light/dark × desktop/mobile).
- [x] `/dashboard/kit` shows every block, keyboard accessible, AA contrast, no console/hydration errors; listed in sidebar, palette and route catalog.
- [x] Protected `src/components/ui/` and `src/components/calendar/` unchanged.
- [x] Build, check, typecheck, dev smoke, screenshots; README (screens, project layout), DESIGN.md, CHANGELOG draft, milestone status updated; preview version + alias in PR.


## Verification (PR #77)

- Build, Biome check and typecheck pass. Biome retains 35 inherited warnings and 10 infos; no new diagnostics. The milestone status update formats the inherited JSON formatting failure.
- Dev smoke `/` → `/dashboard/home` and kit keyboard/navigation/copy/sort/pagination/empty/mobile/chart checks pass in all four light/dark × desktop/mobile states.
- Full capture: 144 before and 148 after, no console/hydration/request failures. All 144 existing content comparisons pass; 135 are pixel-identical and nine contain only channel deltas ≤16. The authorized Developer navigation and page count are excluded via the desktop sidebar region; all source captures are retained. The live monitor clock uses the existing narrow mask.
- All 70 supported contrast checks pass. Protected UI/calendar paths and PLAN are unchanged. Impeccable finish and documentation review: `ship`, no material fixes.
- [Evidence matrix and logs](https://github.com/moeghashim/tenboards/blob/pr-assets/v0.9-001/qa/README.md).
- Preview: [version](https://63e15ab3-tenboards-preview.mohanadgh.workers.dev) / [pr-77 alias](https://pr-77-tenboards-preview.mohanadgh.workers.dev). Guarded upload confirmed ASSETS only and no secrets.

# 003 — Design guardrails and verify:page

Status: merged (#78). Branch: `feat/v0.9/003-design-guardrails`. Depends on 001.

## Scope

- `npm run check:design`, chained into `npm run check`: scans `src/routes/**` and `src/components/blocks/**` (not `ui/`, `calendar/`, generated files) and fails on raw color literals (hex/rgb/hsl/oklch), arbitrary Tailwind values for color, size, spacing and typography (`[13px]`, `[#…]`, `[oklch(…)]`), `recharts` imports outside `src/lib/charts`, and hand-rolled card/page-header markup where a block exists (heuristic rules documented). Prefer Biome rules/GritQL plugins where Biome can express a rule; a small script for the rest. Every existing violation is fixed through tokens or blocks, or added to a commented allowlist with a reason.
- Messages tell the agent the fix (“use `text-muted-foreground` / `StatCard` / `@/lib/charts`”).
- `npm run verify:page <route> [--base-url]`: starts or reuses the dev server, captures light/dark × desktop/mobile screenshots, runs `@axe-core/playwright` (WCAG 2.2 AA tags), records console/hydration errors, writes `verify/<route>/report.json` (gitignored) and exits nonzero on violations.
- Add `@axe-core/playwright` as an exact-pinned dev dependency (approved in PLAN).

## Acceptance criteria

- [x] `check:design` passes on main after fixes; seeded violation fixtures prove each rule fails with an actionable message.
- [x] `verify:page` passes for every route in the route catalog (or documents inherited axe findings separately with issues logged), and fails on a seeded inaccessible fixture.
- [x] No visual change to existing screens except documented token-only fixes (before/after evidence).
- [x] README (checks section), CONTRIBUTING, CHANGELOG draft, milestone status; preview in PR.


## Review round 1 verification (superseded by round 2 below)

- Build/check/typecheck and four-state root → Default → Home/Kit smoke pass; inherited Biome warnings remain separate.
- 25 seeded design violations and allowed-token/module/exception cases pass; the scanner CLI exits 1 on the seeded violations.
- Catalog audit: 37 routes × four states = 148 cases; 26 pass, 122 report inherited axe findings, zero runtime errors. Issues V09-003-A through F are logged in `dev/open-questions.md`; the verifier retains exit 1.
- Seeded inaccessible fixture exits 1 with axe and hydration diagnostics. Local server auto-start/reuse/cleanup verified.
- Default/Finance/Kit: 12 pixel-identical before/after images. All 20 changed route modules have identical non-import AST statements. No token, style or markup changes.
- Evidence: `pr-assets/v09-003` (capture output is not on this branch).

- PR: https://github.com/moeghashim/tenboards/pull/78
- Preview version: https://f294f9f5-tenboards-preview.mohanadgh.workers.dev
- Preview alias: https://pr-78-tenboards-preview.mohanadgh.workers.dev
- Remote preview inventory verified: ASSETS only, no secrets.

## Review round 2

- Shell search/account accessible names now contain the visible shortcut/initials. Default's two activity selectors are named by purpose and current value at their usage sites. Kit, Default and an uncommitted PageHeader route in an isolated temporary copy each pass all four `verify:page` states. Four-state keyboard/selection/account-name checks pass.
- 8/8 new Default/Kit before/after captures are pixel-identical. No token, CSS, auth behavior or protected primitive changes.
- Token references, variable/viewport calculations and grid track composition no longer need exceptions. The inherited inventory moved to `scripts/design-exceptions.json`: 69 entries / 71 occurrences, down from 118 / 127, with retained match fields and reasons unchanged. New pages and generator output may not add entries.
- 41 seeded violations and 16 allowed token/layout fixtures pass, including Recharts restrictions in both route and non-chart block code; Biome ownership is explicit in the docs.
- The verifier preserves caret styles during screenshot capture, preventing Playwright's inline-style injection from racing lazy hydration. Runtime/hydration reporting remains enabled; the inaccessible fixture still proves exit 1.
- Evidence: [review2](https://github.com/moeghashim/tenboards/tree/pr-assets/v09-003/review2). Final catalog: 105/148 cases pass (22/37 routes pass all four states), 43 cases retain route-specific axe findings, zero runtime errors, exit 1.

- Build/check/typecheck, design fixtures, verifier fixtures and hosted read-only preview smoke pass. Inherited check warnings: 35 warnings / 10 infos. Task status remains in-review; dev/milestones.json already records that status.
- Round 2 version preview: https://0ed7b6ae-tenboards-preview.mohanadgh.workers.dev (implementation e2bb248). Alias: https://pr-78-tenboards-preview.mohanadgh.workers.dev. Remote inventory verified ASSETS-only, no secrets.

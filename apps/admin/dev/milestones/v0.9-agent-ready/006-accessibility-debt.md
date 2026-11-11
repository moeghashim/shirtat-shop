# 006 — Inherited accessibility findings

Status: merged (#81). Branch: `feat/v0.9/006-accessibility-debt`. Depends on 003.

Task 003's `verify:page` audit of the full route catalog (light/dark × desktop/mobile) found inherited axe failures. 003 fixes the shell-level ones so new pages pass. This task clears the route-specific remainder so `npm run verify:page -- --all` passes catalog-wide, making it usable as a regression gate.

## Scope

Findings logged in `dev/open-questions.md` as V09-003-A (screen-specific `label-content-name-mismatch`), B (`scrollable-region-focusable`), C (`color-contrast`), E (`aria-progressbar-name`) and F (`aria-required-children`). Fix at usage sites through tokens and existing components; do not edit `src/components/ui/` or `src/components/calendar/`. Contrast fixes use existing DESIGN.md token pairs; any token value change needs recorded contrast evidence across all four presets.

## Acceptance criteria

- [x] `npm run verify:page -- --all` passes every catalog route in all four combinations, or each remaining failure has a documented, reviewer-approved reason.
- [x] No unintended visual change; intended contrast changes shown in before/after evidence across the four presets.
- [x] Keyboard access added for scrollable regions keeps visible focus and doesn't trap focus.
- [x] Build, check (incl. `check:design`), typecheck; README, CHANGELOG draft, milestone status; preview in PR.

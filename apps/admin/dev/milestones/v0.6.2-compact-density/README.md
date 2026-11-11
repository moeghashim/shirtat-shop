# v0.6.2 — Compact density

Status: **done — merged as #65 and released as [v0.6.2](https://github.com/moeghashim/tenboards/releases/tag/v0.6.2)**.

Task: 001 — Compact density. Approved contract: PLAN.md Decisions log, “v0.6.2 compact density” (2026-10-24), from main `54c8d70`. Branch: `feat/v0.6.2/001-compact-density`; base main; one layer. Status: in review. [PR #65](https://github.com/moeghashim/tenboards/pull/65). Rebased onto `cc3c5e7` to preserve concurrently merged README/milestone plans; application changes are unchanged.

Make the whole template about 8–12% more compact through shared tokens/primitives in Impeccable Operate mode. Compact becomes the single default; no density preference. Preserve screen composition, behavior, font/preferences registries, protected UI/calendar implementations and production isolation.

## Acceptance

- [x] Inspect incumbent renders and computed type/control/card/table/sidebar/header/gutter sizes before editing.
- [x] Apply compact type, controls, card/table padding, sidebar/header and gaps through shared tokens/primitives; preserve the rem root and third-party geometry.
- [x] Verify body/table text ≥13px, metadata ≥12px, interactive targets ≥24px with WCAG 2.5.8 spacing, AA contrast, visible focus and reduced motion.
- [x] Verify fonts, all theme presets/modes and sidebar styles without overflow/truncation regressions; retain usable mobile controls.
- [x] Update DESIGN.md, README, CHANGELOG draft and milestone tracking.
- [x] Pass build, check, typecheck, dev dashboard smoke and hydration checks; report inherited warnings separately.
- [x] Capture before/after Default, CRM, Finance, Tasks, Mail, Kanban, Profile and Auth V2 login in light/dark × desktop/mobile, with expanded/collapsed navigation where applicable; upload only to pr-assets.
- [x] Record Impeccable after-state critique and before→after scale table in PR.
- [x] Publish only an isolated tenboards-preview version and open the signed-off PR to main for Claude review; implementer never merges.

## Decisions

The existing Tailwind spacing token and Card `--card-spacing` seam avoid broad per-screen edits or changes inside protected wrappers. No structural prefactor was needed. One shared header-height token keeps header and viewport-height app layouts synchronized. The screenshot harness gains optional computed measurements and a font selector.

Desktop spacing changes from 4px to 3.5px; mobile retains 4px. Typography changes globally; mobile inputs stay 16px to avoid Safari focus zoom. Small cards retain 12px. Button targets have a 24px minimum. The rem root, sidebar widths, breakpoints, chart and calendar coordinate contexts remain stable. No dependencies, auth behavior, palette or registry changes.

## Verified result

[Version preview](https://6795e7df-tenboards-preview.mohanadgh.workers.dev) · [reusable alias](https://pr-65-tenboards-preview.mohanadgh.workers.dev) · [pr-assets evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v062-001).

Build/check/typecheck pass, with inherited dependency build advisories and Biome’s one warning/eight infos. Before/after requested captures pass; 72 dev + 72 preview font combinations, 96 hydrated + 96 SSR sidebar cases, 24 delayed-hydration interaction cases (after documented retries), eight corrected Kanban/Mail interaction cases, eight version-preview smoke cases, four calendar compatibility captures and 280 contrast checks pass. Supported text minimum 4.67:1, control/focus minimum 3.41:1; palette unchanged.

Independent Impeccable critique found and verified fixes for generic role-target minimums shrinking Kanban cards and inherited 12px Mail body text. Final verdict: coherent compact hierarchy, legible charts, preserved mobile spacing; no remaining density-specific visual correction. The detector returned zero findings. Browser overlay injection was unavailable because the collaborative browser could not fetch the local detector; live preview and screenshot inspection supplied the visual evidence. Existing mobile table scroll discoverability remains a follow-up, not a layout change here.

## Review round 2 verification

Review round 2: corrected Customer Activity select clipping and the same wider-font failures in Analytics, Products and Calendar. Toolbar selects/tabs now preserve their intrinsic label width; the target floor no longer overrides larger usage-site minimums. Compact heights and spacing remain unchanged. The audit covers all ten dashboards, Users, Products, Tasks, Invoice, Profile, Mail, Roles, Calendar, Kanban and File Manager at 1440/1280/390px in all 18 fonts, plus settings and the add-product form. No remaining trigger clipping or page overflow was measured. Full-width form controls keep their responsive layout; protected wrappers are unchanged.

[Round 2 preview](https://a30400b5-tenboards-preview.mohanadgh.workers.dev) · [round 2 evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v062-001/review2). Build/check/typecheck, 72 dev + 72 preview font cases (now checking both Tasks and Default), 96 hydrated + 96 SSR sidebar cases, 52 route captures, 28 shell captures, delayed hydration and Kanban/Mail interactions, and eight preview smoke cases pass after documented Calendar-navigation/sidebar-timeout reruns. The new clipping assertion fails against the previous preview on “All segments,” confirming regression coverage. Milestone remains in review; Claude retains merge authority.

## Before → after (CSS px)

| Element | Before | Compact desktop | Mobile |
| --- | ---: | ---: | ---: |
| Rem root | 16 | 16 | 16 |
| Common body/table text | 14 / 20 line | 13 / 18 line | 13 / 18 line |
| Unstyled body fallback | 16 / 24 line | 13 / 18 line | 13 / 18 line |
| Metadata `text-xs` | 12 / 16 line | 12 / 16 line | 12 / 16 line |
| `text-label` token (unused) | 13 / 18 line | 12 / 16 line | 12 / 16 line |
| Section heading `text-base` | 16 | 14 | 14 |
| `text-lg` / `text-xl` | 18 / 20 | 16 / 18 | 16 / 18 |
| Page heading `text-2xl` | 24 | 21 | 21 |
| Wide KPI `text-3xl` | 30 | 26 | 21 (existing breakpoint) |
| Large metric `text-4xl` | 36 | 32 | 32 |
| Default button/input/select | 32 | 28 | 32 |
| Small controls | 28 | 24.5 | 28 |
| Extra-small button target | 24 | 24 minimum | 24 minimum |
| Standard/small card padding | 16 / 12 | 14 / 12 | 16 / 12 |
| Header | 56 | 48 | 56 |
| Sidebar row / icon | 40 / 18 | 36 / 16 | 40 / 18 |
| Sidebar row horizontal padding | 12 | 10 | 12 |
| Page gutters | 24 desktop / 16 mobile | 21 | 16 |
| Grid gaps (4 / 6 utility steps) | 16 / 24 | 14 / 21 | 16 / 24 |
| Standard KPI card height at 1440 | 129.5 | 114 (−12.0%) | content-driven |
| Customer table row | 59 | 54.25 (−8.1%) | local scrolling |
| Single-line Tasks row | 45 | 39.5 (−12.2%) | wrapping/local scrolling |

# 002 — Collapsed header toggle

Status: merged (#64)
Base: `origin/main` at `28cdc56` (PR #63). Branch: `feat/v0.6.1/002-collapsed-header-toggle`.
Authority: explicit user task approval, 2026-10-24; PLAN §7 and its preview/reviewer decisions remain in force.

## Scope

Remove the redundant header toggle when desktop navigation is an icon rail. Preserve the incumbent expanded state (the sidebar owns its toggle and the header already hides its copy), mobile sheet opener, and desktop off-canvas opener when the entire sidebar is hidden. Keep the shared sidebar primitives, route loaders, cookies, shortcuts, presets and tokens intact.

## Acceptance criteria

- [x] Desktop collapsed icon rails show only the sidebar's toggle, across Sidebar, Inset and Floating and all four presets in light/dark.
- [x] Expanded desktop behavior is unchanged; fully hidden off-canvas navigation retains its header opener.
- [x] Mobile retains the header opener, keyboard sheet opening/closing and focus return for either desktop collapse preference.
- [x] Hidden toggle leaves no placeholder or extra gap; breadcrumb starts at the normal header padding.
- [x] Ctrl+B / Cmd+B and visible keyboard focus work; a focused header opener that becomes hidden transfers focus to the sidebar control.
- [x] Cookie-driven collapsed/expanded initial markup and hydration agree; no toggle flash or new browser/hydration errors.
- [x] Build, check, typecheck and dev `/dashboard/default` smoke pass; inherited diagnostics are reported separately.
- [x] `npm run screenshots` captures before/after expanded/collapsed × light/dark × desktop/mobile; reviewed evidence is uploaded only to pr-assets.
- [x] README, DESIGN, v0.6.1 draft changelog and milestone status are updated; PR includes an isolated tenboards-preview version and alias.

## Decisions

Prefactor inspection: the existing provider already emits server-rendered `data-state` and `data-collapsible`; the shell CSS usage site can consume them directly. No preparatory abstraction, runtime dependency, protected wrapper change or routing/framework change is necessary. The header's existing expanded-state rule remains. The new desktop-only CSS rule hides the icon-rail duplicate without relying on client viewport detection. Focus handling is confined to the header usage site, runs after commit, and moves focus only when its opener was focused and becomes hidden.

Off-canvas is the preferences UI's “Hide” mode: no rail toggle is visible after collapse, so its header opener remains. Mobile always needs the header opener. No token or preset changes; existing AA pairs are unchanged.

The user explicitly authorized this additive task contract and milestone updates. PLAN.md and the separate `docs/v0.7/000-milestone-plan` branch remain untouched. Claude Opus 5.5 reviews and holds merge authority; the implementer never merges or deploys production.

## Verification

Build, check and typecheck pass. Biome retains one inherited highlighter warning and eight class-order infos; no errors. Dev default smoke and both screenshot runs have no browser errors. The hydrated matrix passes 96/96 combinations, and the hosted JavaScript-disabled matrix passes 96/96 cookie combinations (each collapsed and expanded). The latter verifies initial state/visibility, while theme boot remains covered by the hydrated matrix. Mobile captures are pixel-identical before/after.

Evidence: [pr-assets/v061-002](https://github.com/moeghashim/tenboards/tree/pr-assets/v061-002), including logs and initial test-harness failures with their fixes. Preview: [version](https://530b083a-tenboards-preview.mohanadgh.workers.dev/dashboard/default), [alias](https://pr-64-tenboards-preview.mohanadgh.workers.dev/dashboard/default). Remote inventory confirms ASSETS only and no secrets. [PR #64](https://github.com/moeghashim/tenboards/pull/64) targets main.

Reproduce: run `node --experimental-strip-types scripts/sidebar-toggle-check.ts` for every supported style/collapse/preset/theme/viewport combination, and `--ssr --base-url <version-preview>` for the same initial-state checks with JavaScript disabled. Use `npm run screenshots -- --routes /dashboard/default --sidebar-states --output screenshots/v061-002/before` and the corresponding `after` directory for reviewable expanded/collapsed evidence (mobile means sheet open/closed).

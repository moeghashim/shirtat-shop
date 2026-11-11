---
id: "001"
title: Establish a small app-page header foundation
milestone: v0.3-app-pages
status: merged
category: ui
files: ["src/routes/(main)/dashboard/-components/app-pages/", "src/routes/(main)/dashboard/file-manager/route.tsx", "src/routes/(main)/dashboard/products/route.tsx", "DESIGN.md", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/file-manager` and `/dashboard/products` (header-only integration).

- Create one typed, presentation-only `PageHeader` at the common dashboard ancestor, with an h1, optional description and wrapping action slot. File Manager and Products repeat this structure; Invoice and Tasks are later consumers. Existing `SectionHeader` is a card h2/h3, so do not distort its semantics to make a page title.
- Integrate only the two named headers, preserving labels, actions, state and page composition. Do not restyle their tables/grids yet.
- Reuse `DashboardCard`, `SectionHeader`, `StatCard` and `src/lib/charts/theme.tsx` where their semantics fit in later tasks. Document the new header API and intended consumers in DESIGN/README. Do not create an alternate card, table, chart, toolbar or empty-state framework.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect File Manager/Products/Invoice title-description-action markup and existing dashboard card exports. Extract only the demonstrated repeated presentation seam; no route, state or data abstraction.

## Acceptance criteria

- [x] Both named routes consume the small header API; headings, wrapping long titles and action groups fit 1440px and 390px without clipping.
- [x] Header integration preserves existing File Manager links/query state and the Products add drawer. Existing dashboard primitives and protected wrappers are unchanged.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

No v0.3 dependency; v0.1/v0.2 are merged. Establish the one demonstrated shared need before page composition work.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

## Verification — 2026-10-23

Build (preview upload), check and typecheck pass; Biome retains one highlighter warning and six informational diagnostics. Dev and Workers smoke pass 12/12 cases each; header/query/drawer interaction cases pass 8/8 per environment. All 280 supported token/preset contrast checks pass. The initial interaction locator incorrectly assumed a radio role; corrected to the observed button role. A combined Workers command incorrectly requested an unsupported Default interaction scenario; the separate smoke run verifies Default. Original logs retained.

Evidence: [v03-001](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-001). Version: https://750e4016-tenboards.mohanadgh.workers.dev; alias: https://v03-001-tenboards.mohanadgh.workers.dev (batch alias requested by user). Prefactor: extracted only the repeated header presentation, preserving route/state ownership and protected wrappers. Neutralized the owned File Manager author fixture per batch brief. README documents the API, integration and fixture; DESIGN records the header contract.

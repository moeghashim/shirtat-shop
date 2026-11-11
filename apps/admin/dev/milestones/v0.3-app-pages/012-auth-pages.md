---
id: "012"
title: Restyle Auth V1/V2 and fix V2 hydration
milestone: v0.3-app-pages
status: review
category: ui
files: ["src/routes/(main)/auth/", "src/config/app-config.ts (only if proven hydration cause)", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/auth/v1/login`, `/auth/v1/register`, `/auth/v2/login`, `/auth/v2/register` and layout-only `/auth/v2`.

- Restyle both login/register variants and the V2 split layout, shared forms, social-auth button, dividers, navigation and footers. Preserve route distinctions, existing validation and demo submission behavior; Better Auth remains v0.5.
- Diagnose each recorded V2 text mismatch with the actual server/client diff. Inspect APP_CONFIG copyright/year, markup composition, form IDs and theme-dependent rendering as candidates; do not assume the year is the cause. Any proven shared-config fix must be narrow and smoke its other consumers.
- Keep bare `/auth/v2` as the inherited layout-only path; do not silently add a redirect or new auth logic. Make narrow-screen/short-height form content and footer links reachable without absolute-position collisions.
- Audit shared form placeholders and auth copy for author identity; use neutral demo values if found. Preserve legal attribution elsewhere.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect shared LoginForm/RegisterForm/GoogleButton and the repeated V2 footer/link structures. A small local form frame/footer helper is acceptable only when it preserves labels, routes, validation and SSR output; no auth service changes.

## Acceptance criteria

- [x] Auth V2 login: no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile.
- [x] Auth V2 register: no React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile.
- [x] Both V2 fixes address demonstrated root causes: no suppressHydrationWarning, no SSR disabling, no frozen clocks. Direct loads, refresh, delayed JS and different real server/browser timezones pass; shared layout and V1 variants remain clean.
- [x] All four forms retain labels, validation/errors, password controls, social demo actions and cross-links. Keyboard focus/return, narrow/short viewport overflow and browser autofill are inspected.
- [x] All five URLs receive screenshot/smoke evidence; layout-only `/auth/v2` is explicitly tested rather than mistaken for a missing page. Resolve login and register hydration entries individually with evidence.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 011 by default (hard dependency 001). Keep shared form/layout work together, with separate nonwaivable gates for each V2 child.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

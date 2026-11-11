---
id: "013"
title: Restyle system states and verify entry redirects
milestone: v0.3-app-pages
status: review
category: ui
files: ["src/routes/(main)/dashboard/coming-soon/route.tsx", "src/routes/(main)/dashboard/$.tsx", "src/routes/(main)/unauthorized.tsx", "src/routes/-components/not-found.tsx", "src/routes/-components/root-error.tsx", "scripts/ (scoped capture evidence support if needed)", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/coming-soon`, `/dashboard/$` (capture `/dashboard/capture-not-found`), `/unauthorized`, root not-found on `/capture-not-found`, and root error boundary (controlled failure, no dedicated URL). Verify `/`, `/dashboard` and `/dashboard/` redirects.

- Restyle all empty/error/permission/coming-soon presentations with coherent headings, explanatory text and existing recovery actions. Correct Coming Soon’s inherited “Page not found” heading to describe its actual state.
- Keep dashboard splat and root not-found distinct; preserve HTTP status, error/reset behavior and safe production error messaging. Unauthorized remains a demonstration, not new access control.
- `/` is a redirect-only external route in `src/routes/(external)/index.tsx`; no landing UI exists to restyle. Preserve and verify it and both dashboard entry forms. If UI is added elsewhere before this task starts, reconcile ownership with the reviewer instead of inventing a landing page.
- Add narrowly scoped test/capture support for root not-found and RootError because neither has its own generated route entry. Use a controlled test-only fault/recovery harness or injection; never ship a public error trigger or change application routing just to capture evidence. Exercise the actual boundary, not merely a static component lookalike.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect the five small system components and existing capture inventory. A presentation helper is warranted only if it reduces duplication without conflating statuses/actions. Keep error injection exclusively in QA and preserve route metadata generation.

## Acceptance criteria

- [x] Coming Soon, dashboard not-found, root not-found, Unauthorized and RootError each have distinct appropriate copy and matching visual hierarchy; existing recovery links/reset work by keyboard.
- [x] Capture root not-found and a controlled real root error on dev and Workers preview, including reset/recovery. Record expected injected exception/HTTP diagnostics separately; no unexpected console errors or hydration recovery are accepted.
- [x] Verify root unknown-path HTTP semantics and unchanged `/`, `/dashboard`, `/dashboard/` destinations. Do not add an external landing page, redirect behavior or auth gate.
- [x] Supplemental four-state before/after evidence covers both non-route boundaries; ordinary route evidence alone cannot satisfy this task. Owned source has no upstream-author references.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 012 by default (hard dependency 001). Finish uncommon system/entry states and their evidence seams before the full-route gate.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

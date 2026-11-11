---
id: "011"
title: Restyle Profile and neutralize its demo identity
milestone: v0.3-app-pages
status: review
category: ui
files: ["src/routes/(main)/dashboard/profile/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/profile`, all six tabs.

- Restyle breadcrumb/header, avatar, status sidebar, overview, personal/employment details, compensation restricted state, time off and documents. Keep all six tabs and current demo actions/information.
- Replace the author name, preferred/legal names, work/personal emails, bio, updater attribution and derived initials in `profile-data.ts` and consumers with a coherent neutral demo person. Use fictional example-domain contact details rather than another real identity.
- Keep employee record relationships, document/time-off content and the distinction between restricted demo content and actual access control. No RBAC/auth changes.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect repeated label/value rows and profile header/sidebar/tab compositions. Extract only a small route-local detail-field helper if needed; preserve tab and record contracts.

## Acceptance criteria

- [x] Overview, Personal, Employment, Compensation, Time off and Documents remain reachable and readable; tab scrolling, document controls and header actions preserve current behavior.
- [x] Long names, bios, email addresses, date ranges and document names fit mobile without lost data; heading levels and restricted-state copy remain clear.
- [x] Every personal identity field, bio reference, updater, email and derived avatar matches the neutral demo person; no upstream-author reference remains in owned source.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 010 by default (hard dependency 001). Complete the detailed identity surface after the directory/role hierarchy is settled.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

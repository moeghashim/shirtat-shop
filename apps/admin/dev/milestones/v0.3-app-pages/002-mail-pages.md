---
id: "002"
title: Restyle standalone and embedded Mail
milestone: v0.3-app-pages
status: merged
category: ui
files: ["src/routes/(main)/mail/", "src/routes/(main)/dashboard/mail/route.tsx", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/mail` and `/dashboard/mail`.

- Restyle the standalone mailbox navigation, inbox/filter controls, pinned/unread rows, selected message, attachments and reply composer with the established neutral surfaces and semantic states. Keep the three-pane desktop workflow and local resize/cookie contract.
- Restyle the dashboard iframe heading/frame and full-screen link at its usage site; retain both routes, iframe title and new-tab behavior. Verify theme/preset propagation into the iframe, its actual inner viewport and nested scrolling.
- Preserve the mobile list-to-message drawer, back/close behavior, selection, existing filtering and demo actions. Inspect loading, empty selection/no results, long subjects, many recipients and attachments.
- Replace `arhamKhan`, account labels, recipient references and `hello@arhamkhnz.com` in `mail/-components/data.tsx` with consistent neutral demo identity fields and identifier names; audit all owned components.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect `mail.tsx`, `mail-layout-config.ts`, `use-mail.ts`, list/detail/sidebar components and the iframe wrapper. Extract local status/identity presentation only if needed; preserve the existing mounted layout boundary and do not add SSR bypasses.

## Acceptance criteria

- [x] Desktop resizing and stored sizes, list selection, unread/pinned cues, attachment/reply controls and mobile drawer keyboard focus/return retain their current behavior.
- [x] Both standalone and iframe content are inspected in each screenshot state; all icon controls have names and selected/unread meaning is available without color alone.
- [x] Neutral sender/account/recipient names, emails, initials and internal fixture identifiers replace every owned upstream-author reference.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 001 by default. Resolve the split-pane communication pattern before the related Chat layout.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

## Verification — 2026-10-23

Build/check/typecheck pass (inherited one highlighter warning and six infos). Dev smoke 12/12, Default interactions 8/8; Graphite/Pine/Iris interactions 8/8 each including inner iframe geometry, inherited preset, attachments/composer, resizing and drawer focus return. Workers Default smoke 4/4; Mail direct/refresh 8/8 and dashboard Mail 8/8 on retry. One original HTTP 502 cleared on the full route retry. Expanded resize tests first used a nonexistent data-panel-id selector, then read geometry before asynchronous layout; corrected to observed panel id and a geometry wait. Logs preserved.

T3 browser verification: ArrowRight changed list width 449.539px → 508.687px and cookie [38,62] → [43,57]; reload restored 508.687px/[43,57]. Existing search/filter/send controls are placeholders; no new filtering/backend behavior. No added abstraction was needed; removed explicit row blur so the existing drawer restores keyboard focus. No runtime dependencies, routing APIs, protected wrappers, tokens or clock behavior change. Uses existing AA foreground/card/muted and primary pairs verified in 001.

[Evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v03-002). Version https://7644b67c-tenboards.mohanadgh.workers.dev; batch alias https://v03-002-tenboards.mohanadgh.workers.dev. README: Mail pages section.

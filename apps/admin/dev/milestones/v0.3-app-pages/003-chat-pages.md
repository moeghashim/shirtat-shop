---
id: "003"
title: Restyle standalone and embedded Chat
milestone: v0.3-app-pages
status: merged
category: ui
files: ["src/routes/(main)/chat/", "src/routes/(main)/dashboard/chat/route.tsx", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/chat` and `/dashboard/chat`.

- Restyle conversation tabs/search, pinned and unread rows, thread bubbles, timestamps, composer and contact details. Keep conversation selection, existing message/demo behavior and responsive panel topology.
- Cover the dashboard iframe heading/frame and open-in-new-tab control as well as standalone content; preserve title, theme/preset inheritance and nested scrolling.
- Replace the upstream-author current-user name/email in `chat/-components/data.ts`, derived initials and any related identity references with neutral demo fields. Align the visible inherited “Studio Chat” label with tenboards without inventing a new product.
- Review the 300ms pane transitions against the 150–200ms shared motion contract; respect reduced motion. Off-screen list/thread/contact content must not trap focus or leave hidden controls in the keyboard path.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect `chat.tsx`, `use-chat.ts`, thread/list/contact components and local breakpoint hooks. Keep responsive state transitions local; only extract repeated status or identity markup if it reduces risk.

## Acceptance criteria

- [x] Selecting a conversation, mobile forward/back, contact panel/sheet, Escape and focus return work without clipping or off-screen focus.
- [x] Unread/pinned/status cues and thread authors remain distinguishable without color alone; long messages, empty composer and long contact names fit.
- [x] Both URLs and iframe contents pass the screenshot/smoke matrix; current-user name/email/initials are neutral and Studio Chat branding is aligned.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 002 by default. Reuse communication layout lessons while preserving Chat’s distinct thread/contact workflow.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.

## Verification — batch A

Dev and Workers direct/refresh smoke, all four appearance presets, keyboard selection/composer/profile/mobile focus scenarios and the four-state visual matrices passed; evidence is on `pr-assets/v03-003`. Final Workers iframe retry passes after waiting for the closing sheet. Build/check/typecheck pass with inherited Biome/chunk-size/deprecation warnings. Preview: https://695b2a45-tenboards.mohanadgh.workers.dev (alias v03-003 per batch brief). No token, dependency or protected-wrapper edits. Prefactor inspection kept state/focus effects local; Base UI menu grouping and profile click wiring corrected inherited usage bugs. Contact sheet below 1280px preserves readable embedded thread width. README Chat section updated.

Final scoped identity audit also replaces eleven contact email domains with workspace.example.com. README records the neutral domains. Build/check/typecheck rerun; all eight dev contact/profile scenarios and default smoke pass. Updated Workers reports, exact transient HTTP errors and their retries are retained under identity-* in the task evidence.

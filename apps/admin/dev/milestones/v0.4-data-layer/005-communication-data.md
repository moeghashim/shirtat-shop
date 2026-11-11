---
id: "005"
title: Connect standalone and embedded Mail and Chat
milestone: v0.4-data-layer
status: review
category: data
files: ["src/routes/(main)/mail/", "src/routes/(main)/chat/", "src/routes/(main)/dashboard/mail/", "src/routes/(main)/dashboard/chat/", "src/server/data/mail.ts", "src/server/data/chat.ts", "src/server/db/", "scripts/data-parity.ts", "README.md", "dev/milestones.json"]
---

## Goal and scope

Make the standalone Mail/Chat surfaces and both dashboard iframe wrappers read from the same selected source, including sidebar accounts/counts, thread/contact detail and message metadata.

## Files and ownership

- `src/routes/(main)/mail/`
- `src/routes/(main)/chat/`
- `src/routes/(main)/dashboard/mail/`
- `src/routes/(main)/dashboard/chat/`
- `src/server/data/mail.ts`
- `src/server/data/chat.ts`
- `src/server/db/`
- `scripts/data-parity.ts`
- `README.md`
- `dev/milestones.json`

The [ownership matrix](README.md#fixture-and-route-ownership-matrix) defines exact existing fixtures, inline values and route boundaries. Shared database, migration, seed and parity paths contain only this task's additions; do not rewrite prior task migrations. README/status updates accompany verified work.

## Before implementation

Prefactor inspection: Mail/Chat stores currently select fixture[0] at module initialization. Initialize selection from loaded data safely, including empty/deleted selections and independent requests. Split Lucide/simple-icons values out of data.ts(x) into UI mappings keyed by serializable IDs.

## Acceptance criteria

- [x] Normalize mail accounts/messages/recipient and CC relations/attachments/labels, and chat contacts/conversations/messages/tags/reactions plus the existing current-user and sidebar count data. Preserve presentation-only navigation definitions separately from data-bearing labels/counts; preserve message and attachment order.
- [x] Implement mail.ts and chat.ts reads, migrations, seed contributions and registry/parity cases. Routes call GET server functions in loaders. Components, sidebars, thread details and Zustand initialization no longer import fixture values.
- [x] Replace Mail module-level Date.now() fixture creation with typed relative-time definitions resolved from a shared serialized request reference. Demo, seed and DB must not independently sample clocks or drift after seeding; preserve existing relative labels and ordering. Test old seeds with later request references.
- [x] Store attachment/icon identifiers as data and map them to existing local icons in the UI. No React/Lucide functions, Simple Icons objects, Date instances with ambiguous formatting or class maps cross the read-function payload boundary.
- [x] Preserve /mail, /chat, /dashboard/mail and /dashboard/chat, iframe title/theme/preset/focus, resize cookie, mobile drawer/back behavior, selected conversation and contact sheet. Outer wrapper captures must include inner frame data.
- [x] Keep composer/search/send/filter placeholders and local state semantics unchanged; no message sending, file storage, realtime service, session, authentication or DB mutation endpoint.

## Tests

- Run migrate/seed/data:parity with mail and chat list/detail/sidebar/current-user reads, missing IDs/empty results, same reference and a later reference after seed.
- Run standalone and embedded interaction suites in demo and DB, including initial/changed/empty selection, attachment rendering, composer, resize cookie, mobile back/Escape and sheet focus return.
- Capture all four URLs in light/dark × desktop/mobile before/demo/DB and smoke Workers demo, including iframe contents and refresh without hydration/console errors.

## Execution order

Hard dependency: 001. Default merge order: after 004. 002 owns shared shell accounts; Mail/Chat retain their own distinct account/contact fixtures.

## Common gates and delivery

- [x] All [milestone test-floor gates](README.md#test-floor-and-evidence) pass for this task: build/check/typecheck; zero-env demo and actual Docker Postgres reads; parity for owned reads; dev `/dashboard/default` plus owned-route smoke; Workers demo version preview.
- [x] Capture and inspect incumbent → demo after → seeded DB for owned routes in light/dark × desktop (1440×900)/mobile (390×844), including listed variants. Attach four-state comparisons; no visual change is expected. Keep evidence on `pr-assets` or PR attachments, never main.
- [x] README reflects verified commands/behavior/status and the PR states `README: updated (sections …)` or `README: no change needed (reason)`. Update task acceptance and `dev/milestones.json` only from evidence; leave in review until merged.

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), inspect affected code before implementation, and read current official TanStack docs before framework/loader changes. UI edits use global Impeccable in Operate mode, context once per session, incumbent inspection and craft floor immediately before edits. Preserve keyboard access, names, focus, reduced motion and all four presets. No token/preset edits are planned; if approved, record actual contrast evidence. Keep `src/components/ui/`, `src/components/calendar/`, generated route/Worker files, font/preferences registries and PLAN.md intact.

One approved task per branch `feat/v0.4/NNN-slug` and PR targeting main. Prefer merged predecessors; declare any stack/base PR/merge order/layer compare URL. Use Conventional Commits, `git commit -s` (`Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>`) and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Include version-specific preview and alias via `npm run preview:deploy -- --preview-alias pr-NNN`; never `npm run deploy`. Claude Opus 5.5 reviews and holds merge/rebase/redeploy/release authority; GPT-6-Astra never merges. Escalate conflicts, missing access/assets, any other new runtime dependency or scope/auth/destructive change in `dev/open-questions.md`, pause dependent work and finish independent work. This breakdown does not start implementation.

---
id: "002"
title: Connect Profile and shell demo accounts
milestone: v0.4-data-layer
status: review
category: data
files: ["src/data/users.ts", "src/routes/(main)/dashboard/profile/", "src/routes/(main)/dashboard/route.tsx", "src/routes/(main)/dashboard/-components/header/shell-header.tsx", "src/routes/(main)/dashboard/-components/header/account-switcher.tsx", "src/server/data/accounts.ts", "src/server/data/profile.ts", "src/server/db/", "scripts/data-parity.ts", "README.md", "dev/milestones.json"]
---

## Goal and scope

Connect the complete Profile and shared demo account switcher through typed reads. The shell change is data plumbing only; account selection remains a demonstration, not a session or auth identity.

## Files and ownership

- `src/data/users.ts`
- `src/routes/(main)/dashboard/profile/`
- `src/routes/(main)/dashboard/route.tsx`
- `src/routes/(main)/dashboard/-components/header/shell-header.tsx`
- `src/routes/(main)/dashboard/-components/header/account-switcher.tsx`
- `src/server/data/accounts.ts`
- `src/server/data/profile.ts`
- `src/server/db/`
- `scripts/data-parity.ts`
- `README.md`
- `dev/milestones.json`

The [ownership matrix](README.md#fixture-and-route-ownership-matrix) defines exact existing fixtures, inline values and route boundaries. Shared database, migration, seed and parity paths contain only this task's additions; do not rewrite prior task migrations. README/status updates accompany verified work.

## Before implementation

Prefactor inspection: Profile already receives a ProfileRecord through props; retain that seam. Inspect shell loader/preferences composition and pass account records through its existing boundary. Do not merge the two shell demo users, directory users and Jordan Lee profile by name or invent relationships.

## Acceptance criteria

- [x] Own src/data/users.ts (including rootUser/unused exports audit) and profile-data.ts exactly once. Keep these distinct fixture datasets faithful; create normalized account/profile/contact/employment/time-off/document records and ordered child rows where needed.
- [x] Expose typed accounts.ts and profile.ts reads with demo/db implementations, seed contributions and parity cases; reuse task 001 contracts. All six Profile tabs, updater/manager attribution, balances and document metadata are included.
- [x] Load accounts through the dashboard parent server function/loader and Profile through its route server function/loader; no shell/Profile component imports fixture values. Existing cookie preferences and sidebar layout still load correctly.
- [x] Keep account selection, restricted-compensation copy and all profile/document actions demo-only. No Better Auth, sessions, login, role enforcement, RBAC or changes to auth routes.
- [x] Prove directory and role results from task 001 are unchanged; avoid sharing tables merely because display names resemble one another.

## Tests

- Migrate/seed a fresh and previously seeded local Postgres database; run data:parity including Accounts/Profile and the prior Users/Roles reads.
- Compare all six Profile tabs and account menu on /dashboard/default before → demo after → DB, light/dark × desktop/mobile; verify account menu keyboard behavior and unchanged cookie preferences.
- Smoke /dashboard/default and /dashboard/profile with no env/no Docker, with DB, and on the Workers demo preview.

## Execution order

Hard dependency: 001. Default merge order: after 001.

## Common gates and delivery

- [x] All [milestone test-floor gates](README.md#test-floor-and-evidence) pass for this task: build/check/typecheck; zero-env demo and actual Docker Postgres reads; parity for owned reads; dev `/dashboard/default` plus owned-route smoke; Workers demo version preview.
- [x] Capture and inspect incumbent → demo after → seeded DB for owned routes in light/dark × desktop (1440×900)/mobile (390×844), including listed variants. Attach four-state comparisons; no visual change is expected. Keep evidence on `pr-assets` or PR attachments, never main.
- [x] README reflects verified commands/behavior/status and the PR states `README: updated (sections …)` or `README: no change needed (reason)`. Update task acceptance and `dev/milestones.json` only from evidence; leave in review until merged.

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), inspect affected code before implementation, and read current official TanStack docs before framework/loader changes. UI edits use global Impeccable in Operate mode, context once per session, incumbent inspection and craft floor immediately before edits. Preserve keyboard access, names, focus, reduced motion and all four presets. No token/preset edits are planned; if approved, record actual contrast evidence. Keep `src/components/ui/`, `src/components/calendar/`, generated route/Worker files, font/preferences registries and PLAN.md intact.

One approved task per branch `feat/v0.4/NNN-slug` and PR targeting main. Prefer merged predecessors; declare any stack/base PR/merge order/layer compare URL. Use Conventional Commits, `git commit -s` (`Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>`) and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Include version-specific preview and alias via `npm run preview:deploy -- --preview-alias pr-NNN`; never `npm run deploy`. Claude Opus 5.5 reviews and holds merge/rebase/redeploy/release authority; GPT-6-Astra never merges. Escalate conflicts, missing access/assets, any other new runtime dependency or scope/auth/destructive change in `dev/open-questions.md`, pause dependent work and finish independent work. This breakdown does not start implementation.

Verification: [v04-002 evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v04-002). Preview https://1a768d21-tenboards.mohanadgh.workers.dev (alias pr-43). Four reads / twelve cumulative scenarios, fresh and incremental local Postgres migration/seed, all six tabs and account keyboard/preferences evidence. Status remains review.

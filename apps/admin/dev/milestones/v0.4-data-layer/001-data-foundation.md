---
id: "001"
title: Establish Postgres, source selection and Users/Roles reads
milestone: v0.4-data-layer
status: review
category: data
files: ["package.json", "package-lock.json", "compose.yaml", ".env.example", "drizzle.config.ts", "src/server/db/", "src/server/data/", "scripts/data-parity.ts", "src/routes/(main)/dashboard/users/", "src/routes/(main)/dashboard/roles/", "README.md", "dev/milestones.json"]
---

## Goal and scope

Prove the complete vertical slice on Users and Roles before migrating other domains. Add only the approved drizzle-orm + postgres runtime dependencies and drizzle-kit development tooling; use the existing Node 22+ and TypeScript toolchain.

## Files and ownership

- `package.json`
- `package-lock.json`
- `compose.yaml`
- `.env.example`
- `drizzle.config.ts`
- `src/server/db/`
- `src/server/data/`
- `scripts/data-parity.ts`
- `src/routes/(main)/dashboard/users/`
- `src/routes/(main)/dashboard/roles/`
- `README.md`
- `dev/milestones.json`

The [ownership matrix](README.md#fixture-and-route-ownership-matrix) defines exact existing fixtures, inline values and route boundaries. Shared database, migration, seed and parity paths contain only this task's additions; do not rewrite prior task migrations. README/status updates accompany verified work.

## Before implementation

Prefactor inspection: Inspect Users/Roles prop boundaries and mixed fixture/presentation exports. Extract serializable row types and UI-only status/filter metadata only where needed; do not generalize table components or create a generic repository/CRUD framework.

## Acceptance criteria

- [x] Add Docker Compose with Postgres 17, a health check, named local volume and documented local credentials/port. Docker is optional for demo use and never contacted by install, dev or build when DATABASE_URL is unset.
- [x] Add Drizzle config, a lazy server-only postgres.js client, normalized user/role tables and actual existing relationships (including ordered workspace membership where present). Preserve distinct fixture identities and role display semantics; no authentication or enforcement.
- [x] Create the shared typed metric-points schema contract for subsequent tasks: domain/series identifier, ordered point key, typed value/unit and dimensions as needed, uniqueness and deterministic ordering. No whole-fixture JSON payloads; entity lists use entity tables. Later tasks add only their necessary columns/relations.
- [x] Implement one source selector: absent DATABASE_URL selects demo; configured DATABASE_URL selects db; DATA_SOURCE=demo overrides even a broken URL. Validate unsupported DATA_SOURCE values explicitly; do not reinterpret malformed/empty configured credentials as permission to fall back. Never expose URLs/credentials to the browser or logs.
- [x] Provide db:generate, db:migrate, db:seed and data:parity scripts. Commit generated SQL and Drizzle migration metadata under src/server/db/migrations/. Database commands require an explicit local target and fail clearly when unavailable; never run migrations/seeding on application startup.
- [x] Use a transactional, repeatable seed with stable fixture identifiers and explicit row ordering. Re-seeding the owned demo rows must not duplicate records; avoid blanket truncation or deletion of unrelated data. Document a manual Docker start command; no reset/up npm helper is needed unless justified in this task PR.
- [x] Add typed users.ts and roles.ts reads under src/server/data/ with explicit demo/db implementations. Route loaders invoke TanStack Start GET server functions, then feed props to components; no component/runtime fixture import remains for these domains. Database queries and the driver stay outside the browser bundle.
- [x] Define a read-function registry and parity harness. Compare every registered function with identical validated inputs/context through both real implementations against seeded Docker Postgres; preserve array ordering, IDs, nullability, dates, money and counts. Fail nonzero on differences, omitted registrations or DB failures; never normalize away substantive differences. Prove the harness fails with a controlled mismatch and cannot pass by calling demo twice.
- [x] A refused connection, invalid credentials and missing schema surface a safe, visible load error through the existing error boundary; no silent demo data, raw SQL or secret-bearing error text. Verify recovery after fixing the connection and retrying.
- [x] Workers build/upload and demo route smoke pass without DATABASE_URL, without Docker and without attempted DB connections. No Hyperdrive, Neon account, production database or new secret binding.

## Tests

- Run db:generate and review SQL; db:migrate on a fresh local Postgres 17 database, then repeat to prove no-op migration behavior. Seed twice and verify stable counts/relationships/order.
- Run data:parity for all Users/Roles reads with normal and empty/missing-result cases; exercise the deliberate mismatch and incomplete-registry checks.
- Run the source-selection matrix (no URL/no Docker, valid local URL, DATA_SOURCE=demo with broken URL, broken URL without override, missing schema). Record expected fault errors separately from clean smoke.
- Compare Users/Roles before → demo after → seeded DB in four states, including directory filters/selection/pagination and all Roles tabs. Smoke /dashboard/default and Workers demo.

## Execution order

None beyond approved breakdown; start from latest origin/main.

## Common gates and delivery

- [x] All [milestone test-floor gates](README.md#test-floor-and-evidence) pass for this task: build/check/typecheck; zero-env demo and actual Docker Postgres reads; parity for owned reads; dev `/dashboard/default` plus owned-route smoke; Workers demo version preview.
- [x] Capture and inspect incumbent → demo after → seeded DB for owned routes in light/dark × desktop (1440×900)/mobile (390×844), including listed variants. Attach four-state comparisons; no visual change is expected. Keep evidence on `pr-assets` or PR attachments, never main.
- [x] README reflects verified commands/behavior/status and the PR states `README: updated (sections …)` or `README: no change needed (reason)`. Update task acceptance and `dev/milestones.json` only from evidence; leave in review until merged.

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), inspect affected code before implementation, and read current official TanStack docs before framework/loader changes. UI edits use global Impeccable in Operate mode, context once per session, incumbent inspection and craft floor immediately before edits. Preserve keyboard access, names, focus, reduced motion and all four presets. No token/preset edits are planned; if approved, record actual contrast evidence. Keep `src/components/ui/`, `src/components/calendar/`, generated route/Worker files, font/preferences registries and PLAN.md intact.

One approved task per branch `feat/v0.4/NNN-slug` and PR targeting main. Prefer merged predecessors; declare any stack/base PR/merge order/layer compare URL. Use Conventional Commits, `git commit -s` (`Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>`) and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Include version-specific preview and alias via `npm run preview:deploy -- --preview-alias pr-NNN`; never `npm run deploy`. Claude Opus 5.5 reviews and holds merge/rebase/redeploy/release authority; GPT-6-Astra never merges. Escalate conflicts, missing access/assets, any other new runtime dependency or scope/auth/destructive change in `dev/open-questions.md`, pause dependent work and finish independent work. This breakdown does not start implementation.

Verification: [v04-001 evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v04-001). Preview: https://7a227c1e-tenboards.mohanadgh.workers.dev (alias pr-42). Two reads / six parity scenarios; real Postgres 17.10 migration and repeat seed; four-state demo/DB/Workers and explicit fault/recovery evidence. The inherited shell QA race and its passing retry are retained in evidence. Status remains review.

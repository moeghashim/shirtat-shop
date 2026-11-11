---
id: "001"
title: Project model, additive backfill, seeds and parity
milestone: v0.8-projects
status: in-review
category: data
files: ["src/server/db/project-schema.ts", "src/server/db/migrations/", "src/server/db/fixtures/", "src/server/db/seed-projects.ts", "src/server/data/", "scripts/", "docs/data.md", "README.md", "dev/milestones.json"]
---

## Goal and scope

Establish the common read-only Projects data contract before routes depend on it. Follow the milestone README model, explicit legacy mappings, metric definitions and security matrix. No UI, route consolidation, auth-policy change or runtime dependency.

Follow the [milestone contract](README.md), PLAN Decisions and AGENTS. All acceptance below is pending implementation.

## Files and ownership

- `src/server/db/project-schema.ts`
- `src/server/db/migrations/`
- `src/server/db/fixtures/`
- `src/server/db/seed-projects.ts`
- `src/server/data/`
- `scripts/`
- `docs/data.md`
- `README.md`
- `dev/milestones.json`

Changes stay within the named task. Shared route metadata is generated only by the existing tool; protected UI/calendar wrappers and PLAN stay intact. README/status changes belong to the same PR.

## Before implementation

Inspect workspace-schema.ts, seed-workspace.ts, the four workspace domain readers, registry.ts, source.ts and request-scoped DB client. Extract pure shared DTOs/projectors and explicit mapping tables only where they remove route-type coupling or duplicate normalization. Keep old readers compatible; do not refactor unrelated data domains.

## Acceptance criteria

- [x] Add projects, synthetic people/members, canonical tasks, labels, subtasks, activity and project file/calendar relations with stable keys, same-project constraints, indexes, validated enums, dates and counts. Auth identities remain separate.
- [x] Use the next free additive migration after rebasing; fresh and populated upgrades backfill board/ledger/file/calendar records without dropping old tables, losing adopter rows or touching auth data. Preserve shipped migrations.
- [x] Map every existing fixture exactly once according to the README, with namespaced task IDs, explicit status/date/owner mappings and source traceability. Retain canceled tasks and null unknown metadata. Default, secondary and empty projects use original tenboards data only.
- [x] Seed transactionally and idempotently in dependency order; repeat migrate/seed does not duplicate links or wipe unrelated/adopter/auth records. Existing fixtures and reads retain their parity during rollout.
- [x] Implement readProjects/readProject/readProjectTasks/readProjectTimeline/readProjectFiles/readProjectActivity/readWorkspaceHome through readSource with equivalent demo/DB validation, deterministic ordering and bounded results. DB joins use project predicates before serialization; missing project differs from empty project.
- [x] Shared metrics, sample-member My tasks, date semantics, pagination and calendar projections follow the README. Do not parse formatted legacy dates at runtime or assume file-folder relations from names.
- [x] Register every new exported read and meaningful scenario; cover second/empty/missing/wrong-project cases, mappings, filters, dates, counts and ties. Add DB-only sentinel coverage to prove reads do not substitute fixtures; preserve existing 22-read/104-scenario floor.
- [x] Exercise reads in local Node and compiled workerd through test-only harnesses excluded from production. Any added server function independently calls requireSession; test direct denied/revoked requests, invalid input and configured DB failure without fixture fallback.
- [x] Update data/migration docs and README with implemented schema/read capabilities only; task status remains in review until reviewed. No claim that project screens are already shipped.

## Tests

Run the common test floor, npm run data:parity against isolated local Postgres, fresh/populated/repeat migration-seed checks and the relevant auth/workerd harnesses. Inspect row preservation and source coverage, not only fixture equality. Keep local DB setup isolated from other worktrees and never use hosted credentials. Nonvisual exemption applies to schema/read work; fresh four-state default smoke and isolated demo preview still required.

Every task passes `npm run build`, `npm run check`, `npm run typecheck` and dev `/dashboard/default` smoke without console errors. Attach a demo-only immutable preview and alias; use only `npm run preview:deploy -- --preview-alias pr-NNN`. Evidence stays on pr-assets/PR attachments. Report inherited warnings separately.

## Dependencies and handoff

Depends on planning approval and merged v0.6.2; rebase/reinspect before implementation. Blocks 002. Hand off DTOs, mapping manifest, default IDs, registered scenarios and migration evidence. No hosted access is needed.

One approved task per branch/PR; declare any stack and layer compare URL. Conventional commit with DCO sign-off and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Claude reviews and alone merges.

Verification: [PR #67 evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v08-001). Node and workerd parity: 29 reads / 202 scenarios; Node auth: 426; Worker auth: 272; legacy redirects: 96. Build/check/typecheck and four-state dev/preview default smoke pass. Remains in review pending Claude.

Round 2 verification: [evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v08-001-round2). Request-relative demo/DB dates and mostly scheduled sample work verified at UTC day, leap-day and year boundaries. Build/check/typecheck, default dev/preview four-state smoke, Node auth 426, Node/Worker parity 29 reads / 208 scenarios, Worker auth/security, project migration checks and 96 legacy redirects pass. Preview: https://82f202d4-tenboards-preview.mohanadgh.workers.dev (alias pr-67). Status remains in review.


### Round 4 integration — 2026-10-25

Replayed onto main f228231 (v0.7.0). Preserved released Assistant and consolidated test isolation in `scripts/test-port.ts`; explicit suite/sentinel ports and shared offsets remain supported. Authored all 100 operations ledger titles without changing IDs or structure; legacy and project seeds use the same fixtures. Fresh migration/seed, 29 reads / 209 parity scenarios and populated/repeated upgrade/preservation checks pass on isolated local PostgreSQL 17. Build/check/typecheck pass (35 inherited Biome warnings, 14 infos). Screenshot/default/Assistant smoke evidence is recorded under the round-4 pr-assets report. Status remains in review; no reviewer approval or merge is claimed.

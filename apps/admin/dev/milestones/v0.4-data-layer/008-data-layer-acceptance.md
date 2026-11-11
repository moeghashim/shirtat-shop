---
id: "008"
title: Verify complete parity and document template onboarding
milestone: v0.4-data-layer
status: review
category: validation
files: ["scripts/data-parity.ts", "scripts/screenshots.ts", "scripts/report-route-coverage.ts", "docs/data-layer.md", "README.md", "CHANGELOG.md", "dev/milestones/v0.4-data-layer/", "dev/milestones.json", "dev/open-questions.md"]
---

## Goal and scope

Close the complete data-layer contract after all domain tasks pass. Audit every fixture/read/route, reproduce demo/DB parity from a clean local database and publish precise template-user documentation. Do not mark the milestone done before reviewer merges.

## Files and ownership

- `scripts/data-parity.ts`
- `scripts/screenshots.ts`
- `scripts/report-route-coverage.ts`
- `docs/data-layer.md`
- `README.md`
- `CHANGELOG.md`
- `dev/milestones/v0.4-data-layer/`
- `dev/milestones.json`
- `dev/open-questions.md`

The [ownership matrix](README.md#fixture-and-route-ownership-matrix) defines exact existing fixtures, inline values and route boundaries. Shared database, migration, seed and parity paths contain only this task's additions; do not rewrite prior task migrations. README/status updates accompany verified work.

## Before implementation

Prefactor inspection: Inspect the existing screenshot and route-coverage scripts before adding a small source/environment dimension or deterministic QA capture seam. Reuse their manifests and reports; do not build a new testing framework or freeze application clocks to make captures pass.

## Acceptance criteria

- [x] Reconcile the ownership matrix against the entire src tree and actual loader/server-function graph. No unowned fixture, unregistered read, component runtime fixture import, inline business dataset, or unmigrated data-bearing route remains. UI config/type-only imports and documented client signals are the only exclusions. Follow renamed/extracted fixtures back to their original owner.
- [x] Fresh Docker Postgres 17: db:generate produces no unexplained schema drift, committed db:migrate succeeds, db:seed twice is stable, and data:parity proves every read/function/variant against demo using the same input/context. Also verify cumulative upgrade from task 001 migrations; do not recreate a database to conceal a broken upgrade.
- [x] Zero-env path works from npm install to npm run dev with Docker stopped. DATABASE_URL selects real DB; DATA_SOURCE=demo overrides it; refused connection, invalid credentials and missing schema visibly fail without fallback or secret exposure. Record controlled fault evidence and recovery separately from clean smoke.
- [x] Full catalog screenshot matrix: demo vs seeded DB for every route in all four presets × light/dark × desktop/mobile (currently 38 × 4 × 2 × 2 = 608 per source, 1,216 local cases). Add query/tab/iframe/print/error variants from the ownership/test matrix. Compare before/demo/DB with identical reference/timezone/viewport/preferences; unexplained visual or content diffs fail. Do not use broad pixel tolerance or mask changed values.
- [x] Workers preview without DATABASE_URL passes the full 608-case demo catalog and data-route refresh/iframe smoke, with no DB connection attempt, browser driver bundle, hydration error or new binding. Test all eight historical hydration routes with delayed JavaScript/opposite zones; capture live-signal behavior separately from synchronized visual comparisons.
- [x] Write docs/data-layer.md: architecture and per-domain reads, source-selection/error truth table, normalized schema and typed metrics, fixture/seed/parity contract, date/precision/order rules, add-a-domain steps, read-only/local-state boundary, Docker Postgres 17 onboarding, migrations/reseed/cleanup guidance and future Neon/Hyperdrive boundary. No undocumented destructive reset command.
- [x] Update README Run locally, Commands, current data behavior and roadmap/status; preserve zero-config first-run instructions and clearly separate optional Docker/DB setup. Add CHANGELOG v0.4 describing verified behavior. No version bump/tag/release by the implementer; reviewer owns release.
- [x] Record verified acceptance/status and evidence links in task files and milestones.json; leave outstanding criteria unchecked and unresolved failures in dev/open-questions.md. Final audit fixes stay within the agreed contracts; scope/design/auth/dependency conflicts pause dependent work.

## Tests

- Run npm run build, npm run check and npm run typecheck after final changes; all must pass. Report exact failures and inherited warnings separately.
- Run the complete fresh/incremental Docker, double seed, parity, no-env and visible-error matrix; verify one deliberate parity mismatch fails without changing shipped fixture records.
- Run npm run screenshots and route-coverage validation for demo, DB and Workers demo, all routes/presets/four states plus variants and hydration checks. Upload logs/reports/PNG evidence only to pr-assets or PR attachments.
- Follow README/docs onboarding verbatim in an isolated local environment, inspect rendered screenshots and confirm every documented command exists and uses the correct environment.

## Execution order

Hard dependency: 001–007 verified. Merge last after all domain layers.

## Common gates and delivery

- [x] All [milestone test-floor gates](README.md#test-floor-and-evidence) pass for this task: build/check/typecheck; zero-env demo and actual Docker Postgres reads; parity for owned reads; dev `/dashboard/default` plus owned-route smoke; Workers demo version preview.
- [x] Capture and inspect incumbent → demo after → seeded DB for owned routes in light/dark × desktop (1440×900)/mobile (390×844), including listed variants. Attach four-state comparisons; no visual change is expected. Keep evidence on `pr-assets` or PR attachments, never main.
- [x] README reflects verified commands/behavior/status and the PR states `README: updated (sections …)` or `README: no change needed (reason)`. Update task acceptance and `dev/milestones.json` only from evidence; leave in review until merged.

Read dev/MAINTAINERS.md and PLAN.md (Decisions log wins), inspect affected code before implementation, and read current official TanStack docs before framework/loader changes. UI edits use global Impeccable in Operate mode, context once per session, incumbent inspection and craft floor immediately before edits. Preserve keyboard access, names, focus, reduced motion and all four presets. No token/preset edits are planned; if approved, record actual contrast evidence. Keep `src/components/ui/`, `src/components/calendar/`, generated route/Worker files, font/preferences registries and PLAN.md intact.

One approved task per branch `feat/v0.4/NNN-slug` and PR targeting main. Prefer merged predecessors; declare any stack/base PR/merge order/layer compare URL. Use Conventional Commits, `git commit -s` (`Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>`) and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Include version-specific preview and alias via `npm run preview:deploy -- --preview-alias pr-NNN`; never `npm run deploy`. Claude Opus 5.5 reviews and holds merge/rebase/redeploy/release authority; GPT-6-Astra never merges. Escalate conflicts, missing access/assets, any other new runtime dependency or scope/auth/destructive change in `dev/open-questions.md`, pause dependent work and finish independent work. This breakdown does not start implementation.

## Verified implementation evidence

Status: in review; merge/release remain reviewer-owned. [PR #49](https://github.com/moeghashim/tenboards/pull/49) is layer 008 above [#48](https://github.com/moeghashim/tenboards/pull/48), merge order 001→008. [Version preview](https://9d63aeb5-tenboards.mohanadgh.workers.dev), [alias pr-49](https://pr-49-tenboards.mohanadgh.workers.dev).

[Evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v04-008) contains final build/check/typecheck logs, fresh and true task-001 cumulative upgrades, repeated seeds, all 22 reads / 130 parity scenarios, deliberate mismatch/omission controls, 20 visible fault/recovery states, and isolated no-env/no-Docker onboarding. The complete catalog is 1,824 passing cases (608 each demo/DB/Workers), plus 640 resolved interaction/boundary/refresh cases and 384 delayed hydration cases in Chicago/Kiritimati. All 16 Invoice PDFs are one Letter page with $945.18 balance. Separate 65-second Calendar and Patient interaction evidence prove live behavior.

The 1,216 local image comparisons comprise 1,154 exact pairs and 62 inspected raster-edge differences (1–204 pixels, maximum channel delta 4); no content/layout difference remains. All pairs retain exact diff bounds and side-by-side inspection evidence without a blanket tolerance. Incumbent business code is layer 006 with only the documented QA reference seam; layer 007 separately proved 40/40 operational pairs exact. Only the named live clock is masked.

Prefactor inspection reused the existing route manifest, capture report and interaction helpers, adding an environment dimension and request-reference input. Whole-tree audit assigned Chat's remaining inline counts/date to the original communication owner and migration 0011. Existing dependencies suffice. Protected files, application clock behavior, auth and production deployment are unchanged. Original capture failures and explicit retry mappings are retained, including QA redirect/loopback/keyboard harness corrections and isolated navigation/form assertion timeouts. No unresolved question remains.

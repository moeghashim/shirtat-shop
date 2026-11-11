# Project data foundation

Projects use the existing `readSource` selection and request-scoped database client. No configuration, auth policy or runtime dependency changes. All project-view, workspace aggregate and navigation GET functions independently call `requireSession` before validated reads. Route guards protect documents; direct RPC access is separately checked. The foundation itself exports data readers, not RPC endpoints.

## Migration and provenance

Apply `npm run db:migrate`, then `npm run db:seed` against the intended local database. Migration `0015_project_foundation.sql` creates eleven additive tables. It backfills every existing board and ledger task, including adopter rows, and links existing files, folders and calendar templates to `sample-operations`. Old tables and readers remain intact. Unknown dates stay null, unknown statuses conservatively become backlog and unknown priorities become medium. The original source rows remain the audit reference for unmapped adopter metadata.

`src/server/db/fixtures/project-mapping.ts` explicitly enumerates all shipped task/file/folder/event IDs and owner mappings. Stored sample dates use a single **2026-06-20** anchor. `project-sample.ts` shifts only known shipped sample IDs by the UTC civil-day offset of the request; database filters, ordering and metrics apply that same projection before limits. Adopter records retain actual dates. Formatted legacy dates are never parsed at request/render time. IDs are `board:<source-id>` and `ledger:<source-id>` with unique source-kind/source-ID pairs. No fuzzy deduplication. `projects.ts` adds original tenboards documentation samples, explicit spans, subtasks and activity; no Gr8r material is used.

Seeds run inside the existing transaction in dependency order. Upserts touch known fixture IDs; relation inserts preserve adopter links. Repeat migration/seed must retain adopter and auth rows. The dedicated check creates an isolated populated-upgrade database and removes only that test database on completion.

## Read contracts

Seven reads are registered: `readProjects`, `readProject`, `readProjectTasks`, `readProjectTimeline`, `readProjectFiles`, `readProjectActivity`, `readWorkspaceHome`. The registry retains the old 22 reads / 104 scenarios and now totals **29 reads / 211 scenarios**. Both source implementations validate IDs/filters and return deterministic order. Database child queries include the requested project predicate; missing project returns null while an empty project returns an empty collection.

Project summaries contain members and server-computed metrics, never task/file bodies. Project and membership summaries cap at 100. Task pages accept 10/20/50 rows or a 100-row board/timeline batch, with offset, total and `hasMore`. Filters cover task ID, status, assignee (including null), label and bounded text search. Files and calendar templates cap at 100; files carry a total. Activity caps at 50. Home sections cap at ten, with independently computed overall task totals. Home queries its member and upcoming sections across all stored tasks before applying the ten-row limit.

Canonical statuses are backlog, todo, in-progress, review, done and canceled. Open excludes done/canceled; overdue means an open task due before the request’s UTC day. An optional validated `renderedAt` input makes clocks reproducible, including leap days and year rollover; all nested reads share that anchor. Progress is done divided by non-canceled, or zero with no eligible tasks. Sample-member My tasks defaults to Jordan Lee (`board:jordan`), even in auth mode; it never claims to represent the signed-in account.

Civil dates are nullable ISO dates. Start/end spans are inclusive; calendar adapters advance the end one civil day for FullCalendar's exclusive all-day end. UTC calendar arithmetic is independent of local DST. Legacy calendar templates still use the request reference and timezone projection and remain distinct from tasks. Counts preserve Comments/Attachments/Documents; subtasks derive from their own rows, not legacy percentages.

Project membership, labels, subtasks, optional task/event/file/activity associations use same-project foreign keys. Membership roles are sample display strings and never auth roles. Folder counts/sizes remain sample summaries; files currently have no asserted folder membership and remain visible at project root. There is no mutation endpoint, binary storage, download/share service, tenant or ACL.

## Verification

Use a dedicated local Postgres container/database. The v0.8 verification uses isolated loopback Postgres on port 3278 and `_v08_` database names after its dedicated Docker instance became unavailable; it never accesses a shared database. Run build/check/typecheck, auth:test, data:parity, worker:test, worker:auth, worker:security and `scripts/project-check.ts`. The Worker parity harness imports the same full read registry and is excluded from production. Existing redirect checks remain in `scripts/legacy-redirect-check.ts`; project redirect coverage is in `scripts/project-redirect-check.ts`.

Test listener settings support concurrent worktrees: `AUTH_TEST_PORT=3280 WORKER_TEST_PORT=3281 SECURITY_TEST_PORT=3282 AUTH_SENTINEL_PORT=3288 TEST_DATABASE_INFIX=v08`. `SECURITY_TEST_PORT` also reserves its next two ports. Node/compiled local workerd evidence does not establish hosted database behavior.

Task 003 adds a validated `dueFrom` filter to task reads so Overview selects upcoming work before bounded limits. Its scoped aggregate uses the same project metrics as Board/List; it combines at most 10 upcoming rows from each open status and returns the earliest 10. The registry includes dated-bound and empty-bound parity cases. Calendar events use `event:<template-id>` and dated task projections use `task:<canonical-task-id>`; invalid task spans fail before projection. `schedule.ts` performs UTC civil arithmetic and clipping independently of timezone/DST. Project Calendar preserves request-clock serialization and post-hydration local projection; task dates stay authored civil dates.

## Workspace and navigation consumers

Home returns bounded My tasks/upcoming sections plus independent `myTaskTotal` and `upcomingTotal`; its project list supplies metrics and progress. My tasks uses the named synthetic member, without inferring the signed-in user's assignments. Projects index filters validated name/description text and status. Navigation reads the same guarded project summaries and projects only ID, name, status and favorite into the shell/palette DTO; it sends no task/file bodies or auth membership.

A navigation query failure renders an explicit retry state; an empty query renders no projects. The auth guard runs before the recoverable data-read boundary, so auth storage failure or revocation is never converted into a demo or empty navigation result. `project-navigation-data-check.ts` verifies real schema loss, recovery and empty state in its own disposable `_v08_` database.

Reused read-only Board/Calendar/Files presentation now lives under `dashboard/projects/-components`. Old routes contain guarded 308 aliases only. Original workspace readers and records stay for migration/provenance/parity, while the project views consume one canonical task domain. Short display keys do not replace the stable namespaced IDs in data contracts.

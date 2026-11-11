---
name: tenboards-connect-data
description: Connect tenboards typed reads to demo fixtures and Postgres with Drizzle. Use when adding a data source, database query, schema migration, seed, parity scenario, or auth-guarded server loader.
license: MIT
metadata:
  version: "1.0"
---
# Connect tenboards data

Preserve the zero-config demo and one typed contract across demo and database reads.
Read [data workflow](references/data-workflow.md) before changing schema, seeds or
server functions. Keep presentation in blocks and route-local components.

## Progress checklist

- [ ] Inspect the owning domain read and generated types/fixture. Define validated
  inputs and one serializable output contract; choose stable IDs and deterministic order.
- [ ] Implement separate demo and DB functions behind `readSource`. Keep fixtures
  server-side. Replace generated DB TODOs with real ordered queries before claiming
  database integration; comparing two fixture clones does not prove DB parity.
- [ ] Add an additive migration and repeatable fixture seed if persistence is needed.
  Never rewrite shipped migration SQL/journal history or overwrite adopter records.
- [ ] Keep `requireSession()` inside each app-data server function before reading data,
  even when its parent route is guarded. Validate inputs at the server boundary.
- [ ] Register all reads/scenarios and run migrations, seed and `npm run data:parity`
  against an explicitly selected disposable local database. Check missing/filter/empty
  cases, deterministic ordering, repeat seeds and date boundaries where relevant.
- [ ] Run build/check/typecheck; verify any affected page with `verify:page` and
  report demo and DB evidence separately. No database access means DB acceptance
  remains unverified; finish independent demo work and report the missing prerequisite.

## Gotchas

- Apply SQL filters before result limits; filtering the first 100 rows in memory
  loses matching records ([review #67](https://github.com/moeghashim/tenboards/pull/67#discussion_r4368227630)).
- Verify the requested page, not a login redirect ([review #78](https://github.com/moeghashim/tenboards/pull/78#discussion_r4375549966)).
- Existing source/auth contracts: configured DB errors remain visible, never fall
  back to fixtures; demo identities are not authenticated users or ownership checks.
  No CRUD, RBAC or authentication changes are implied by adding a typed read.

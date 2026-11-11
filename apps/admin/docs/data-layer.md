# Optional local data layer

v0.4 is released. Production and version previews remain demonstration Workers;
Neon hosting and Hyperdrive belong to v0.6. v0.5 adds optional local authentication
on this database source; see [the auth guide](auth.md). Business-data forms,
selection, drag/reorder, alarm acknowledgement, invoice edits and message controls
remain local demonstrations. Auth forms and account/session controls persist real
auth records when a private secret enables local auth. No read function writes data, authorizes a
user, establishes a session, sends a message or connects a medical feed.

## Start without a database

Use Node 22+ and npm in a clean checkout:

```sh
npm install
npm run dev
```

Open `http://localhost:3000/dashboard/default`. With no `.env`, `DATABASE_URL` or
`DATA_SOURCE`, this works with Docker stopped. `npm run build` also needs no DB.
The dev script uses Node's `--env-file-if-exists=.env`; inherited shell variables
still take precedence. To return to demo after setting up a DB, set
`DATA_SOURCE=demo` in the shell or local `.env`, or remove the DB configuration.
Also unset `BETTER_AUTH_SECRET`: a nonempty secret requires the real DB source and
intentionally rejects forced demo or a missing DB.

## Opt into Postgres 17

Docker Compose is optional. From the repository root:

```sh
docker compose up -d
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run data:parity
npm run dev
```

Copy the example only when creating a new local `.env`; preserve an existing file.
It contains only local development credentials. The Compose service binds to
loopback port 54329 and uses database/user `tenboards`, password `tenboards_local`.
Never commit `.env` or production credentials. There is no hosted DB provisioning.
Migrate and seed are explicit commands; development startup never performs either.
Wait for `docker compose ps` to show the database healthy if starting from a cold
image. A failed read is visible and can be retried after repairing configuration.

Stop the container with `docker compose stop`; resume with `docker compose up -d`.
The named volume preserves local records. This guide intentionally provides no
volume-deletion/reset command. Review and back up local data before any manual
cleanup. Reseeding is not an arbitrary database reset.

## Selection and errors

| Configuration | Result |
| --- | --- |
| `DATABASE_URL` absent, `DATA_SOURCE` absent | Demo, without constructing a DB client |
| Valid `DATABASE_URL`, `DATA_SOURCE` absent | Actual Postgres reads |
| `DATA_SOURCE=demo` | Demo, even with an invalid/unreachable configured URL |
| Any other configured `DATA_SOURCE`, including empty | Explicit unsupported-source error |
| Empty/malformed `DATABASE_URL` | Safe visible DB load error; no fallback |
| Connection refused, invalid password, missing migrations | Safe visible DB load error; no fallback |
| Corrected DB configuration/schema | Reads recover on retry/reload |

The selector is `src/server/data/source.ts`. Driver errors, SQL and credentials are
discarded before reaching the browser. The local DB command scripts additionally
reject non-localhost targets. They fail nonzero with a redacted error. Do not infer
that a page is using Postgres merely because a URL exists: forced demo wins.

## Read boundary and ownership

Each route calls a GET TanStack Start server function from its loader. Server
handlers independently require the actual session in auth mode before importing
`src/server/data/<domain>.ts`; components receive serializable
loader data through typed props or a route-local context. Domain modules expose
`readX`, `demoX` and `dbX`; the selector chooses the actual implementation. DB client
construction and queries are lazy and server-only. Components/state stores never
import runtime seed fixtures. Types, pure arithmetic, icons, styling, navigation,
form choices, chart geometry and preference registries remain UI code.

| Module / exported read | Consumers and records |
| --- | --- |
| `accounts` / `readAccounts` | Demo shell accounts; auth-on header uses the real session identity instead |
| `users` / `readUsers` | Directory, workspaces and memberships |
| `roles` / `readRoles` | Informational roles and ordered permissions |
| `profile` / `readProfile` | Six Profile tabs, contact/employment/documents/time off |
| `products` / `readProducts` | Product catalog, categories and status options |
| `invoices` / `readInvoices` | Parties, taxes, items and request-relative draft dates |
| `ecommerce` / `readEcommerce` | Store orders, reviews, products, inventory and metrics |
| `kanban` / `readKanban` | Board/list/table records, columns, owners and summaries |
| `tasks` / `readTasks` | Separate task ledger |
| `files` / `readFiles` | Folders/files, owners/shares and summaries |
| `calendar` / `readCalendar` | Typed relative event definitions |
| `mail` / `readMail` | Standalone Mail and dashboard iframe; accounts/messages/attachments |
| `chat` / `readChat` | Standalone Chat and dashboard iframe; contacts/messages/reactions |
| `default` / `readDefault` | Customer dashboard |
| `crm` / `readCrm` | Opportunities dashboard |
| `finance` / `readFinance` | Accounts/cards/transactions and metrics |
| `analytics` / `readAnalytics` | Visitor/page/source/campaign models |
| `productivity` / `readProductivity` | Tasks/projects/notes/goals/focus/quote and civil day |
| `academy` / `readAcademy` | Classes/rooms/schedules/assignments/events/achievements |
| `logistics` / `readLogistics` | Customers/shipments/cargo/tracking/handling/locations |
| `infrastructure` / `readInfrastructure` | Organizations/projects/environments/resources |
| `patients` / `readPatients` | Beds/identities/clinical baselines/alarms/events/settings |

There are 22 registered reads and 104 parity scenarios. v0.6.1 removes 26 V1-only scenarios: Default 8, CRM 6, Finance 6 and Analytics 6. Retained screen coverage is unchanged. Auth/system/error
routes and redirects have no persisted app-domain data. Mail/Chat dashboard aliases
load their standalone source through iframes. The shared dashboard account loader
also covers non-data dashboard states.

## Schema, fixtures and seed

Plain modules under `src/server/db/fixtures/` are the single canonical seed source.
Natural entities and ordered relations have domain tables and foreign keys. Similar
names never imply a shared identity: shell accounts, directory users, profile,
commerce customers, proposals/leads and workspace tasks are distinct universes.
No whole-fixture JSON payload table is used.

Aggregates use `metric_points`: domain, series, point key, position, decimal value,
unit and optional currency. Ordered dimensions preserve labels and exact display
format metadata; they are not hidden copies of entire business objects. Numeric
parts of formatted KPIs stay numeric, including grouped currency, percentages,
ratios and durations. Short illustrative lists deliberately need not reconcile to
aggregate totals. Infrastructure's header totals, for example, are independent of
its small visible environment sample.

The transactional seed upserts known stable keys, refreshes owned ordered children
and metric dimensions, and preserves unrelated parent records. Repeating it is
stable. Editing a seeded record locally is temporary: reseeding restores the
canonical value for that key. Removing a fixture from source does not authorize a
global delete; add an explicit, reviewed migration/cleanup policy if needed.

All reads specify deterministic ordering, with stable keys as tie breakers where
applicable. Postgres numeric values convert deliberately at DTO boundaries;
coordinates retain ten fractional digits in storage, and parity checks the exact
original JavaScript numbers. Money/metric formatting is explicit, not dependent on
the server locale. Optional fields remain absent where the original contract used
absence; missing lookups return the domain's documented null/empty result. Missing
required related records are errors, never silently replaced by fixture values.

## Dates and live simulation

Civil dates use ISO `YYYY-MM-DD`; fixed labels explicitly format UTC. Calendar,
Invoice and Mail store typed offsets/definitions and resolve one serialized
request reference on each read. Seeding never bakes today's rendered dates into
those definitions. Calendar adopts browser-local month/wall time after hydration;
Today and its now marker keep the real clock. Month-end CRM labels preserve
clamped month subtraction.

Patient Monitoring alone retains client-simulated waveform/trend/tick computation
in `waveform-data.ts`, `realtime-utils.ts`, `use-patient-vital-series.ts` and
`use-realtime-tick.ts`. Their geometry, calibration/axis labels, deterministic
initial samples and live tick mechanics are presentation/simulation. Patient
identity, diagnosis, baseline vitals, signal amplitude/phase/rhythm, alarms,
thresholds and settings still come from the read. Reduced motion pauses traces;
it does not freeze the real clock or hide numeric readings. No ordinary chart
series or “realtime visitors” snapshot is exempt.

## Migrations and validation

`npm run db:generate` generates SQL and journal metadata from the schema.
Review generated SQL, commit it, and apply `npm run db:migrate`; never regenerate
an older migration to change history. The stack journal is linear and cumulative.

| Layer | Cumulative SQL migrations |
| --- | --- |
| 001 | `0000_cynical_solo.sql`, `0001_flaky_the_santerians.sql` |
| 002 | `0002_nice_gideon.sql`, `0003_smiling_tombstone.sql` |
| 003 | `0004_easy_la_nuit.sql` |
| 004 | `0005_abandoned_red_ghost.sql` |
| 005 | `0006_useful_quentin_quire.sql` |
| 006 | `0007_even_the_santerians.sql`, `0008_cultured_praxagora.sql`, `0009_large_katie_power.sql` |
| 007 | `0010_plain_thunderball.sql` |
| 008 | `0011_blushing_siren.sql` |

For an existing checkout, update code, run migrate, then seed. A second generate on
unchanged schema must report no changes.

`npm run data:parity` invokes separate demo and actual DB implementations with
identical inputs/context, compares exact results/types/order and verifies caller
mutation cannot contaminate subsequent reads. Its inventory matches every exported
`readX` function; omissions, DB failures and mismatches fail nonzero. It covers
missing IDs, filters, later request times after seed, leap days,
year/month rollover and date ranges. Negative controls:

```sh
npm run data:parity -- --inject-mismatch
npm run data:parity -- --omit-registration
```

Both intentionally fail. `node --env-file=.env --experimental-strip-types scripts/data-source-check.ts` checks selection/faults and a TCP sentinel with every
read in forced demo. Its missing-schema test expects a separate empty local
`tenboards_missing_schema` database. `scripts/data-source-browser.ts <output>`
checks visible refused/password/schema errors, forced demo and recovery. Test
credentials and expected errors belong in local evidence, never production config.

Run build, check and typecheck for each change. The capture harness uses the route
manifest and exact downloaded font assets; `--reference <ISO>` sends
`x-tenboards-qa-reference` only to the app origin. Date-relative GET handlers validate
this read-only input and serialize it through the normal DTO. Missing or malformed
headers use real request time. It does not replace Date, pause ticks or change
Today. The incumbent comparison worktree receives the same narrow capture seam;
its business code remains at layer 006 (`474a29e`). Layer 007 separately proved
all 40 operational before/demo/DB image pairs identical, and the final full-catalog
comparison includes those routes in every preset. `--mask-live-clocks` covers only
Patient Monitoring's `[data-monitoring-clock]`. `--hydration-delay-ms 1500 --reload`
and `--timezone` exercise real hydration and refresh in opposite zones.

`node --experimental-strip-types scripts/report-route-coverage.ts --root <evidence> --environments dev,db,workers --retries <manifest.json>` verifies all 608 cases per
source without discarding original failures. `scripts/audit-data-layer.ts` checks
all 22 canonical fixture owners and the transitive runtime import boundary;
companion literal/array inspection classifies UI configuration and client signals.
Chat's final audit correction owns its previously inline three tab counts and
thread date, extending the original communication domain through migration 0011.

For capture reports, failures are retained alongside explicit
reruns. Evidence is committed only to `pr-assets`, never application branches.

## Add a domain

1. Inspect the incumbent records and consumers; separate UI config/types first.
2. Define normalized entity/child tables or typed aggregate metrics. Preserve the
   original keys, relationships, ordering, precision and null semantics.
3. Move canonical plain records to one fixture module; extend the transactional
   seed without deleting unrelated data. Generate the next migration.
4. Implement typed demo/DB/read functions with equivalent inputs, validation and
   output. Queries must actually load the owned tables.
5. Register every read and supported variant/filter/date/missing scenario; prove
   parity against fresh and cumulatively upgraded Postgres.
6. Connect GET server functions/loaders and typed UI data; preserve local actions.
7. Run zero-env/fault/Workers gates and inspect before/demo/DB four-state captures.
   Update README, ownership documentation and review status.

## Hosted database boundary

The only Worker binding remains ASSETS. Demo never constructs a Postgres client,
and browser bundles exclude the driver and credentials. v0.4 adds no Cloudflare
DB secret, binding, Neon instance, Hyperdrive pool or production persistence. A
future hosted integration must separately define credentials, pooling, deployment,
authentication/authorization and operational safeguards. Do not treat local seed
commands or the public demo UI as production administration tools.

## Auth tables and preserved domain ownership

Migration `0012_watery_sugar_man.sql` appends four isolated auth tables after v0.4's
unchanged `0011`. Auth is optional: DB without a secret remains open; a secret adds
route and callable-function session enforcement. Domain reads still have no writes
or identity selection and CLI parity calls them without an HTTP session. All 22
reads remain; v0.6.1 reduces 130 baseline scenarios to 104 by removing only retired V1 coverage. Sample directory roles and
Profile employment data are not authorization or account records. Seeds never
create passwords/auth users and preserve existing auth records. Auth mutations go
through Better Auth and never update these business tables.

## Workers connection lifetime (v0.6 task 001)

Data reads use the same effective request environment as authentication. A valid
`HYPERDRIVE.connectionString` takes precedence over `DATABASE_URL`; an invalid
binding cannot fall through to a valid URL. `DATA_SOURCE=demo` remains connection
free. Workers reuse a client only within one request (max 1); Node retains its
lazy pool (max 4) and explicit CLI shutdown. Worker request cleanup closes sockets,
while Hyperdrive owns hosted pooling. Do not infer hosted TLS or cache correctness
from the local emulator. See [local runtime and tests](auth.md#local-workers-runtime-v06-task-001).

Nitro defaults `cloudflare.nodeCompat` to true and already emitted `nodejs_compat`
before v0.6. The root Wrangler source now states that intent explicitly. Nitro
merges overrides, configured Wrangler values, source config and defaults using
`defu` (arrays can survive/merge); generated output retains date `2026-10-23`,
`index.mjs`, ASSETS and ESModule rules. Never edit generated output. The local
test config explicitly selects `local`; the independent preview source config
selects `tenboards-preview` and cannot inherit root production bindings.

## Direct operational targets

Migration/seed keep their explicit local-only default. Reviewer Neon operations
require `npm run db:migrate -- --allow-remote` and `npm run db:seed -- --allow-remote`,
with a direct TLS DATABASE_URL supplied privately. The target validator rejects
missing/duplicate TLS settings, known pooler endpoints and Hyperdrive binding input.
Parity/auth suites remain local-only. These commands apply additive migrations and
idempotent fixture upserts; they do not reset schemas or create default auth users.
See [the deployment runbook](deploy.md) for ordering, backup/recovery and cutover.

## v0.6.1 legacy cleanup

`0014_remove_legacy.sql` is a new migration after the unchanged shipped journal. It drops 13 tables used exclusively by V1 screens: four CRM tables, two Finance tables, three Analytics V1 tables, two Default V1 tables, `default_proposal_reviewers` and `analytics_coverage_assignments`. It deletes `v1.%` series only for the four core dashboard domains, removing dependent metric dimensions before points. Shared metric tables and all current-screen data remain.

The four core reads no longer accept a variant or return/load V1 payloads. V1 fixtures, seed statements, route server functions and range-specific projectors are deleted. Shared civil-date helpers used by Academy and Productivity remain.

`node --experimental-strip-types scripts/auth-migration-check.ts` creates and drops test-owned databases for fresh and populated upgrade paths from `f45e813`. It compares retained rows, verifies all 13 tables and V1 metric rows are gone, repeats migrations/seed, and runs 22-read/104-scenario parity on each. This migration intentionally deletes retired template data; take a backup before upgrading an adopted installation that may contain customized V1 data.

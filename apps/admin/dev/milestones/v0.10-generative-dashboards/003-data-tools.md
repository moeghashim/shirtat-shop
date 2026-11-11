# 003 — Read-only data tools

Status: merged (#86). Branch: `feat/v0.10/003-data-tools`. Depends on 001 approval.

## Scope

- A server-only tool registry wrapping existing typed reads (start with Default, Analytics, Finance, CRM and E-commerce). Each tool: Zod input of enumerated options only, independent `requireSession()` in auth mode, data-source selection as today (visible DB error, no fallback), projected and size-capped output, no credentials or internal errors in results.
- Wire tools into the Assistant per the spike's design for all five providers; recorded mode resolves the same tools against demo fixtures.
- Limits: per-turn tool-call cap, tool time counted in existing deadlines, tool calls count toward rate limits; document the numbers in docs/assistant.md.
- Tool results are untrusted data in prompts; add prompt-injection tests (fixture text containing instructions must not change behavior).

## Acceptance criteria

- [x] Unit tests per tool: schema rejection, auth-on without session → rejected, demo and DB parity (`data:parity`), DB failure → visible error.
- [x] Mocked provider tests for each provider's tool-call flow; recorded mode shows fixture numbers with no keys.
- [x] Preview Worker remains recorded-only, ASSETS-only with no secrets.
- [x] Build, check, typecheck, verify:page pass; docs/assistant.md (tools, limits, privacy), README, CHANGELOG draft, milestone status updated.

## Spike clarifications (accepted by reviewer and user 2026-11-06)

- Use one native SDK planning step without automatic execution, validate at most four calls, then resolve sequentially before returning the Response; stream the final language with tools disabled. Keep the five existing direct adapters. Add v2 data/text-delta/finish/error transport for dashboards and retain v1 for existing replies.
- Each invocation independently guards its session, charges the existing admission buckets and uses the normal source selector. Recorded specs replace the model, not the source selector: zero-config/preview reads fixtures; configured DB reads DB and never falls back.
- Implement dashboard_read with per-domain/metric discriminated enum schemas, an explicit projection catalog and the spike's reference/result DTO. Initially range=available and segment=all; offer additional filters only with honest source support and parity. Reject unsupported date ranges/metrics rather than relabeling fixed aggregates.
- Add a guarded, model-free refresh resolver. Validate and deduplicate reference batches and finish DB work inside the request scope. No render-time fetch or shared cross-user cache.
- Shared budgets: four calls, two model requests, 4,096 aggregate output tokens (1,024 planning + 3,072 final), 2 MiB aggregate provider wire, 5s per tool within existing 20s first/15s idle/60s total deadlines. Results: 8 KiB each, 24 KiB aggregate; dashboard SSE 96 KiB including language, refresh JSON 32 KiB. Charge one admission for the request plus one per invocation; do not reset timers between phases.

Additional acceptance:

- [x] All five actual adapters pass fragmented native tool-call/result/final-text mocks on Node and compiled workerd; unknown tools, invalid args, fifth calls, late results, cancellation and aggregate budget failures fail closed.
- [x] DB/session cleanup occurs only after preflight work settles; refresh constructs no provider and configured DB errors remain visible in recorded mode. Injection fixtures cannot bypass authorization, gate or caps.

## Cancellation design (reviewer decision 2026-11-06, after the gate failure in dev/open-questions.md)

The first attempt showed that aborting the request and closing the client does not stop the PostgreSQL query (a backend stayed active at 5.35 s). Cancellation is therefore enforced by the database, with client cancellation as a second layer:

- **Primary — server-enforced timeout:** every tool read and every refresh-resolver read runs inside its own short transaction that first executes `SET LOCAL statement_timeout` (and `SET LOCAL idle_in_transaction_session_timeout`) to the smaller of 5,000 ms and the remaining request deadline. PostgreSQL cancels the statement itself; this works through Hyperdrive because the setting is transaction-scoped. Timeouts surface as a safe, visible tool error, never a fallback.
- **Secondary — client cancel:** on Request abort or deadline, cancel pending queries through the postgres driver (e.g. the pending query's `cancel()`), even if that needs a small seam below Drizzle in `src/server/db/`. No new dependency.
- **Settle before cleanup:** await every started read to settle (resolved, rejected or cancelled) before request-scoped resources close; no late results are applied.
- **Scope:** required for the new dashboard tool and refresh paths. Session and rate-limit reads keep their v0.7 behavior but must not start after abort/deadline.

Revised gate (must pass before the rest of 003 proceeds): with a `pg_sleep(6)` probe through the real tool path, the read rejects within the ceiling and `pg_stat_activity` shows no active backend for it within **ceiling + 500 ms**, on Node and on the full compiled application (`npm run build` + `npm run preview`, workerd). Budgets stay unchanged.

### Settlement margin (reviewer decision 2026-11-06, round-2 gate results)

Round 2 showed database-enforced cancellation works on Node and the compiled app (backend inactive at 5,015 / 5,008 ms, inside the ceiling + 500 ms window), but rejection landed 3–5 ms after the 5,000 ms ceiling. Reserve settlement time inside the budget instead of permitting overshoot: set `statement_timeout` to `min(4,750 ms, remaining deadline − 250 ms)` and skip the read entirely if less than 500 ms remains. The 5 s per-call ceiling and all other budgets are unchanged. Gate: rejection ≤ 5,000 ms and backend inactive ≤ 5,500 ms on Node and the compiled app.

### Whole-call deadline (reviewer decision 2026-11-06, round-3 gate results)

Round 3 passed the single-statement gate (rejection 4,760 / 4,752 ms; backend inactive 4,780 / 4,769 ms) but a multi-statement read reached 5,002 / 5,004 ms because `statement_timeout` restarts for each statement. Bound the whole call, not each statement:

- **Portable layer (required):** compute one per-call deadline at the start of the tool read. Before every statement in the transaction, re-arm `SET LOCAL statement_timeout` to the time remaining on that deadline (minus the 250 ms settlement margin); if under 500 ms remains, stop with a visible timeout error without issuing the statement.
- **PostgreSQL 17+ (additional):** also `SET LOCAL transaction_timeout` to the same per-call budget. Detect support via `server_version_num`; never fail on older servers.
- Gate: single- and multi-statement probes both reject ≤ 5,000 ms with backend inactive ≤ 5,500 ms, on Node and the full compiled app.

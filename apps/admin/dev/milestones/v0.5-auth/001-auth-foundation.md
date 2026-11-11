---
id: "001"
title: Establish Better Auth configuration, storage and session boundary
milestone: v0.5-auth
status: merged
category: auth
files: ["package.json", "package-lock.json", ".env.example", "src/lib/auth/", "src/server/db/client.server.ts", "src/server/db/schema.ts", "src/server/db/migrations/", "drizzle.config.ts", "src/server/server-actions.ts", "src/lib/preferences/preferences-storage.ts", "src/routes/(main)/mail/route.tsx", "src/routes/api/auth/$.ts", "scripts/screenshot-routes.ts", "scripts/screenshots.ts", "scripts/report-route-coverage.ts", "scripts/auth-config-check.ts", "docs/auth.md", "README.md", "dev/milestones.json"]
---

## Goal and scope

Establish real auth on the existing Postgres connection while keeping no-secret demo mode open and connection-free when the data source is demo. Deliver the mode/configuration contract, migrations, Better Auth HTTP entry and safe session bootstrap. Route protection and real forms belong to 002–003; this layer is not a completed secured application.

## Files and ownership

- `package.json`, `package-lock.json`: only `better-auth` as a new direct runtime dependency.
- `.env.example`, `src/lib/auth/`: server-only configuration/factory, safe types, provider flags, browser-client boundary and server session APIs/functions. Exact helper filenames settle here.
- `src/server/db/client.server.ts`, `schema.ts`, `migrations/`, `drizzle.config.ts`: reuse client and append isolated auth schema/migrations; no v0.4 table or historic migration changes.
- `src/server/server-actions.ts`, preference storage and Mail route call sites: restrict generic cookie helpers to their real UI callers.
- `src/routes/api/auth/$.ts`: GET/POST handler; generated route tree changes only through tooling.
- Screenshot/coverage scripts: narrowly classify the new HTTP-only route so the existing visual inventory remains exhaustive and runnable.
- `scripts/auth-config-check.ts`: focused config/cookie-boundary/no-connection checks using existing tooling; `docs/auth.md`/README begin verified setup/security documentation.

## Before implementation

Prefactor inspection: `selectSource` already owns the v0.4 rule and `getDatabase` is lazy; compose them rather than create a second source rule/pool. Extract a pure environment-to-mode/provider decision and a minimal serializable bootstrap type only where they make fail-closed tests local. Inspect the arbitrary-name cookie get/set functions and all callers: the getter serves Mail layout, and the setter is a preference persistence path. Replace their broad input contract with runtime validation before auth cookies exist; preserve supported preference values/options. Keep browser exports separate from server secret/DB imports.

## Acceptance criteria

- [x] Read the linked current official integration/cookies/server-route/adapter docs and verify APIs against the installed Better Auth version; record that version and dependency decision. Use `better-auth/adapters/drizzle` on the existing postgres.js-backed Drizzle client; escalate any additional direct runtime dependency before installation.
- [x] Implement every row of the milestone configuration/provider matrices. No secret means auth off even with DB; secret plus non-DB source produces an explicit safe startup/config error before serving an open app. Invalid/unreachable/unmigrated auth configuration fails closed. No env values appear in errors.
- [x] Define `BETTER_AUTH_URL`, documented localhost fallback, exact trusted origin and secret validation; only server-side config reads credentials. Return provider booleans, never credential pairs. Email/password is enabled whenever auth is on; incomplete OAuth pairs disable only that provider.
- [x] Add `auth_user`, `auth_session`, `auth_account`, `auth_verification` with correct Better Auth model mappings, indexes/relations and committed SQL/journal metadata. Fresh and incremental migrations work; v0.4 schemas/seeds/data are unchanged and reseeding preserves auth records. No auto-migration, sample auth identity or credential seed.
- [x] Mount `/api/auth/$` GET/POST through TanStack Start and preserve request/response headers and cookies. Auth-off returns a safe disabled response without initializing auth/DB. Use supported cookie propagation for server APIs that set cookies; keep cookie cache disabled for immediate revocation.
- [x] Expose a safe mode/session server function using request headers and Better Auth server APIs, plus an internal require-session helper for later guards. Distinguish demo, signed-out, signed-in and service-error states; no raw tokens, credential-account fields or ORM objects in bootstrap DTOs. No global per-user state.
- [x] Runtime-allowlist existing preference/Mail-layout cookie names, values and options. Forged direct calls cannot read or overwrite auth cookies, arbitrary cookies or cookie attributes. Existing theme/preset/font/sidebar/Mail layout persistence still works; registries remain intact.
- [x] Verify cookie flags, exact trusted origins and intact CSRF defaults; record selected rate-limit behavior. Audit client bundles with test sentinels. Zero-env install/dev/build and Workers version preview require no DB/auth environment or connection attempt.
- [x] Add explicit HTTP-route classification to existing screenshot/coverage inventory without losing a visual route; existing default smoke remains runnable. Document optional auth setup in `.env.example`, README and initial `docs/auth.md`; no production secret/binding is configured.

## Tests

- Table-driven source/secret/base-URL/provider tests include absent/empty/nonempty-invalid inputs, forced demo with secret and invalid `DATA_SOURCE`; direct cookie RPC negative tests include the actual configured session cookie name and unknown names.
- Docker Postgres 17: fresh migrations and upgrade from v0.4, repeat migration, `db:generate` no unexpected drift, repeated seed, full `npm run data:parity`. Create isolated test auth records through the library and prove reseeding does not erase them.
- HTTP GET/POST handler/bootstrap checks, actual Set-Cookie checks and sanitized configured-DB failure/recovery. Instrument a local connection sentinel for demo; merely observing a successful page is insufficient.
- Pass [common gates](README.md#test-floor-and-evidence): build/check/typecheck, dev default-route and Workers demo smoke, source isolation and client-bundle audit. Four-state unchanged-shell/Mail preference checks accompany the cookie boundary change.

## Execution order and delivery

Start from latest main after breakdown approval. Foundation for 002–005. Follow the [stack/delivery contract](README.md#stack-and-merge-order): one task PR, DCO/co-author trailers, version preview and alias, README decision, evidence only on `pr-assets`/attachments. Tick only verified criteria and update registry to `review`; Claude owns merge/release. Do not begin subsequent tasks without their approval.

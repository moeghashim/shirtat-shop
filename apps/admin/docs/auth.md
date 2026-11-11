# Optional authentication

Zero configuration remains the first-run path: `npm install && npm run dev` needs no database or auth environment. Workers production and version previews remain demos, with only an ASSETS binding. Do not configure hosted authentication before v0.6.

## Foundation and scope

The foundation uses **better-auth 1.7.12**, its bundled `better-auth/adapters/drizzle` export, the existing lazy postgres.js client and explicit `auth_user`, `auth_session`, `auth_account`, `auth_verification` tables. Migration `0012_watery_sugar_man.sql` appends to the unchanged v0.4 journal. There is no startup migration/seed or seeded auth identity. The v0.4 directory, roles and employee Profile are sample data, not authentication or authorization records.

Layers 001–004 provide HTTP/session/configuration boundaries, real Auth V2 entry flows, protected application routes, signed-in shell identity and account/security controls. Hosted auth remains deferred to v0.6.

## Local setup

1. Start `docker compose up -d` (Postgres 17).
2. Copy `.env.example` to private `.env`; run `npm run db:migrate` then `npm run db:seed`.
3. Generate `openssl rand -base64 32` locally and set `BETTER_AUTH_SECRET` in `.env`. Never publish it, use `VITE_*`, or put a real secret in a screenshot.
4. Set `BETTER_AUTH_URL=http://localhost:3000`, or your exact development origin. When omitted, the development fallback is explicitly `http://localhost:3000`.
5. Restart `npm run dev`. Run migration commands yourself after pulling schema changes.

HTTP is accepted only for localhost/127.0.0.1/IPv6 loopback; otherwise use HTTPS. Credentials, query strings, fragments and paths other than `/` are rejected in the base URL. Only this exact origin is trusted; incoming Host/forwarded headers do not select it. A secret must have at least 32 characters, no surrounding whitespace, and at least 120 estimated bits under the installed library's uniqueness estimate; generate randomness rather than constructing one manually.

## Configuration matrix

| Source / configuration | Secret absent or empty | Nonempty secret |
| --- | --- | --- |
| No DB URL | Open demo, no auth or DB initialization | Configuration error |
| Valid migrated DB URL | Open DB-backed demo, visual auth forms | Auth enabled |
| `DATA_SOURCE=demo`, any DB URL | Forced demo, no DB connections | Configuration error |
| DB URL empty/malformed | Existing visible data failure | Configuration error |
| DB unreachable/unmigrated | Existing visible data failure | Auth service fails closed |
| Unsupported source (`db`, empty, other) | Configuration error | Configuration error |
| Invalid base URL/secret | Optional auth settings ignored | Configuration error |

Nonempty invalid values never fall back to anonymous/demo success. Build and request middleware check configuration. Auth HTTP/session operations additionally check storage readiness; errors discard driver details. `DATA_SOURCE=db` is never supported. Source selection remains the v0.4 rule.

## Providers and callbacks

Email/password is always enabled in auth mode, with an 8–128 character password policy. Optional provider pairs:

| Complete pair | Enabled provider |
| --- | --- |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub |
| Both pairs | Both |
| Neither or a missing/blank half | Only complete providers, otherwise email/password alone |

Register `${BETTER_AUTH_URL}/api/auth/callback/google` and `${BETTER_AUTH_URL}/api/auth/callback/github` with their respective providers (omit a trailing slash on the configured origin). Google uses the library's default OpenID/profile/email scopes; GitHub requests `read:user` and `user:email`. Credentials stay server-side; only enabled booleans are projected to the UI. No live credentials are available for automated verification: dummy pairs test authorize URL/state/callback generation, not a provider consent round-trip. Real-provider round-trip validation requires the operator's own app registration and credentials.

For the default local origin, the exact callbacks are `http://localhost:3000/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/github`. A different port/origin requires matching provider registrations.

## Session and security boundary

`/api/auth/$` forwards GET/POST to Better Auth; disabled mode returns 404 without initializing the auth instance or DB. Library responses preserve Set-Cookie. Server APIs use `tanstackStartCookies` last in the plugin list. Safe bootstrap exposes only mode/provider flags and user ID/name/email; it does not return tokens, hashes or account credentials. Service errors are distinct from a signed-out session.

Cookie cache is explicitly disabled, so session authority is checked against Postgres. The installed library defaults to seven-day sessions, a one-day update interval and one-day fresh-session window. Persistent signup/OAuth and remember-me cookies have Max-Age; `rememberMe:false` creates a session-only token cookie. Browser session restore can retain session cookies. Cookies are HttpOnly, host-only, Path `/`, SameSite=Lax, and Secure for HTTPS (loopback HTTP is the development exception).

CSRF/origin checks are intact. Account linking is disabled; email verification is not enabled, so an unverified address is not proof of ownership. Authentication grants shared template-data access, not RBAC or per-user business-data ownership. Password hashing/verification remains entirely library-owned.

Rate limiting is explicitly enabled in development too: memory storage, 100 requests per 10 seconds plus the library's stricter sensitive-endpoint rules (email sign-in: 3/10 seconds). Without a trusted IP it uses a shared per-path bucket. Local tests do not disable limits; distributed storage and deployment proxy trust belong to v0.6. `auth.api` server calls do not traverse the HTTP limiter; credential mutations should stay on the HTTP client path.

The generic cookie RPC is now limited to validated preference names/values, with fixed seven-day Lax `/` options. Its only non-preference getter is validated `mail_panel_layout`; malformed client layout falls back to the existing default. Unknown/auth cookie names and caller-supplied cookie options are rejected.

## Verification and troubleshooting

`node --experimental-strip-types scripts/auth-config-check.ts` checks configuration/provider decisions, real DB signup/session/signout/cookie semantics, reseed preservation and a forced-demo TCP sentinel. `node --experimental-strip-types scripts/auth-cookie-check.ts` calls the actual HTTP RPCs with hostile cookie names/options and valid UI preferences. Both use the installed Playwright tooling, generated throwaway credentials, and no committed storage state. `DATABASE_URL` may select another explicit local test DB; otherwise the compose URL is used.

Run `npm run data:parity` with the local URL: all 29 domain reads and 211 scenarios pass (including the v0.8 Projects registry; 26 V1-only scenarios were removed in v0.6.1). Run `npm run db:generate` to check drift; apply/repeat migrations explicitly. If configuration fails, check the source, private secret and exact origin. If auth storage fails, check Docker availability and migrations. Never fix a DB error by silently selecting demo while a secret is set.

Official references checked against installed APIs: [TanStack integration](https://www.better-auth.com/docs/integrations/tanstack), [Drizzle adapter](https://www.better-auth.com/docs/adapters/drizzle), [cookies](https://www.better-auth.com/docs/concepts/cookies), [sessions](https://www.better-auth.com/docs/concepts/session-management), [rate limits](https://www.better-auth.com/docs/concepts/rate-limit), [Start server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) and [middleware](https://tanstack.com/start/latest/docs/framework/react/guide/middleware). The adapter docs show a separate package; the installed bundled export supports this approved dependency boundary.

## Sign in and return destinations

Auth V2 owns the login and registration forms. Auth-on registration asks for a trimmed name (1–100 characters), email, password (8–128 characters) and matching confirmation. Demo retains the original field set and gives a safe Demo only acknowledgement; it never echoes passwords, submits to auth endpoints or creates a session. Google and GitHub remain decorative in demo; in auth mode only complete configured pairs appear, with no empty provider divider.

Login's initially unchecked **Remember me** explicitly selects a session-only cookie. Checked login, signup and OAuth use the library's persistent seven-day policy described above. Failed submissions retain non-secret input, show safe inline feedback and permit retry; pending actions prevent duplicate submissions. Credential success replaces the document to clear router/user state and revalidate the destination. OAuth follows the library-owned authorize redirect. Provider denial returns to the same supported form variant with safe retry feedback.

A single pure validator accepts only normalized relative application destinations with one leading slash. It rejects absolute/protocol-relative URLs, backslashes, controls, encoded path separators/double encoding, path normalization tricks, and auth/API loops. It preserves legitimate query/hash values, including nested query URLs that are data rather than the navigation target. Invalid/missing values fall back to `/dashboard/home`; unknown app paths go to the public 404. Login/register cross-links and already-signed-in visits use the same validation. Better Auth's supported before hook validates callback/new-user/error destinations again before OAuth state is created; provider state/cookie validation remains library-owned. Credential forms own their one post-success navigation and omit the library's automatic email callback redirect.

`node --experimental-strip-types scripts/auth-redirect-check.ts`, `scripts/auth-flows-check.ts` and `scripts/auth-provider-check.ts` provide adversarial redirect, real-DB browser flow and provider configuration/authorize URL tests. No provider consent or token exchange is claimed. Shared client sign-out returns to canonical `/auth/v2/login` only after server success; the signed-in shell exposes Sign out and Profile.

Error/pending verification: `node --experimental-strip-types scripts/auth-errors-check.ts` checks duplicate registration, network failure/retry, a delayed real request with duplicate-submit prevention, and enabled limiter 429/recovery. It never replaces a server success with a mock.

## Application protection matrix

| Boundary | Rule |
| --- | --- |
| `/`, `/dashboard`, `/dashboard/` | Aliases normalize into the guarded dashboard flow |
| All 10 current dashboards and all app pages, including Coming Soon | Dashboard ancestor checks the actual request session before loading |
| `/dashboard/mail`, `/dashboard/chat` | Dashboard guard protects each wrapper |
| `/mail`, `/chat` | Each standalone document independently checks its session; same-origin iframe requests share cookies |
| Two auth forms and bare `/auth/v2` | Public; signed-in form visits return to a validated application destination |
| `/unauthorized`, root error/404, dashboard splat | Public; the exact splat renders without the protected shell/account loader |
| `/api/auth/$` | Public dispatcher, with Better Auth's own endpoint/origin/session checks |
| Safe mode/session bootstrap and four preference/layout functions | Public, minimal projection and strict cookie allowlists |
| Account details / session revoke | Current-session projection / strict same-origin owned-ID mutation (see Account & security) |
| All 22 application-data functions across 22 v0.4 domains | Independent `requireSession` before importing/invoking a domain read, including shell accounts |

Auth-on identity is the current session's name/email/initials; demo switching stays demo-only. The menu links directly to Profile’s Account & security tab. A fresh document after sign-out drops router caches; each navigation checks authority again and refocus checks server state. Storage failures surface as failures, never anonymous/demo success. Identity/data responses use `Cache-Control: private, no-store`.

An expired embedded Mail/Chat document moves its same-origin parent to canonical login with the validated wrapper return path. Direct standalone navigation remains protected. The browser-retained fragment is added to the validated return destination after hydration. No auth token is stored in client application state.

`scripts/auth-protection-check.ts` audits every generated visual/HTTP route and callable server function, then exercises anonymous/valid SSR, refresh and client navigation, all direct RPCs with no/valid/tampered/expired/revoked sessions, public system pages, shell sign-out and iframe expiration. Authentication grants access to shared template data; it does not confer directory roles or ownership of sample business records.

## Account & security

`/dashboard/profile?tab=account` is auth-only; demo maps that query to Overview without loading account data. The six sample employee tabs remain separate from **Your sign-in account**. Known Profile tab values are validated; unknown values fall back to Overview. Only the current session supplies identity. Name changes trim to 1–100 characters; email is read-only. The HTTP update-user hook permits only the name field and rejects supplied IDs/email/other fields.

Name/password mutations use Better Auth's HTTP client, retaining library origin checks and HTTP rate limiting. Password changes verify the current password and enforce `revokeOtherSessions:true` server-side, even for a direct request. In 1.7.12 this revokes all old sessions, creates a new current session, and sets its cookie; the UI clears password fields and refreshes sessions. Old credentials fail immediately. The server projects credential capability from account provider metadata; no hash or provider token reaches the account UI. Provider-only accounts have no password/reset controls.

The safe session projection contains ID, bounded plain user-agent description (or an unavailable fallback), creation/expiry and a current-session marker. It contains no bearer token or IP. Better Auth's session-list API requires a session created within the default one-day fresh window. The UI handles `SESSION_NOT_FRESH` with a sign-out then canonical re-login to the account tab, avoiding an already-signed-in redirect loop. Password validation itself uses the library's authoritative-session/current-password boundary.

The custom POST revoke function validates a strict ID-only input, requires an exact configured Origin, checks the actual request session, and resolves the ID within that user's active session list before passing its internal token to Better Auth. Foreign, forged and stale IDs return an unavailable result without a write. Current-session revocation uses library sign-out and the final `tanstackStartCookies` plugin propagates cookie clearing; the client replaces the document. A different browser's next protected route/RPC fails immediately. These custom wrappers do not claim the Better Auth HTTP limiter; they perform their own origin/ownership checks. Identity/session responses are private and no-store.

`scripts/auth-account-check.ts` uses two real users and independent browser contexts for name persistence, ownership/origin rejection, other/current revocation, password rotation, stale/fresh sessions, retry and four-state account/confirmation/error captures. Its provider-only capability fixture uses Better Auth's supported adapter operations on a test-owned identity after credential signup; it does not represent a completed OAuth login. Cleanup deletes only those test-owned users.

## Callable function inventory

The acceptance inventory fails on unclassified route or function additions. The
following application reads each assert the request session before invoking a
domain read; direct CLI parity remains independent of HTTP sessions.

| Route owner | Callable read | Domain |
| --- | --- | --- |
| `/chat` | `loadData` | `chat` |
| `/dashboard/academy` | `loadData` | `academy` |
| `/dashboard/analytics` | `loadData` | `analytics` |
| `/dashboard/calendar` | `loadData` | `calendar` |
| `/dashboard/crm` | `loadData` | `crm` |
| `/dashboard/default` | `loadData` | `default` |
| `/dashboard/ecommerce` | `loadEcommerce` | `ecommerce` |
| `/dashboard/file-manager` | `loadData` | `files` |
| `/dashboard/finance` | `loadData` | `finance` |
| `/dashboard/infrastructure` | `loadData` | `infrastructure` |
| `/dashboard/invoice` | `loadInvoice` | `invoices` |
| `/dashboard/kanban` | `loadData` | `kanban` |
| `/dashboard/logistics` | `loadData` | `logistics` |
| `/dashboard/patient-monitoring` | `loadData` | `patients` |
| `/dashboard/productivity` | `loadData` | `productivity` |
| `/dashboard/products` | `loadCatalog` | `products` |
| `/dashboard/profile` | `loadProfile` | `profile` |
| `/dashboard/roles` | `loadRoles` | `roles` |
| `/dashboard` | `getAccounts` | `accounts` |
| `/dashboard/tasks` | `loadData` | `tasks` |
| `/dashboard/users` | `loadUsers` | `users` |
| `/mail` | `loadData` | `mail` |

`getAccountDetails` adds a 27th protected read with safe account/session projection.
`revokeAccountSession` is the separate POST-only owned-session mutation. Both
independently check server session authority. Five public functions are explicitly
classified: `getAuthState` (minimal bootstrap), `getValueFromCookieServer` (validated
Mail layout), `setValueToCookieServer` (preference allowlist), `getPreferenceServer`
and `getDashboardLayoutServer` (non-sensitive UI preferences). No caller-supplied
identity controls an app read or account mutation.

## Repeatable acceptance

Start the compose Postgres 17 service and run migrations/seed before:

```sh
npm run auth:test
npm run data:parity
node --experimental-strip-types scripts/auth-migration-check.ts
node --experimental-strip-types scripts/auth-bundle-check.ts
npm run check
npm run typecheck
npm run build
```

`auth:test` runs the focused Playwright/HTTP suites sequentially with generated
throwaway credentials and isolated browser contexts. It uses the compose URL by
default, or an explicit local `DATABASE_URL`. Stop another Vite server in the same
checkout before running it; use a separate checkout for concurrent capture servers.
The suite creates an explicitly test-owned empty database for the missing-schema
case; the local test role needs CREATE DATABASE, as the compose role has. It never
resets a shared database. Tests delete only their exact test-owned auth users.

The migration check compares all shipped migration files at `f45e813` byte-for-byte, creates fresh and
upgrade test databases, applies/repeats migrations and seed, and runs all 22 reads /
211 scenarios in each. Those fresh test-owned databases are dropped after the checks. Fetch
the `f45e813` base in a shallow checkout before running this check. The bundle check
builds with private random sentinels, scans browser/server artifacts without
printing their values, then always restores a zero-env build. It does not deploy.

Auth captures default to `screenshots/v05-005/auth` under the suite; override
`AUTH_EVIDENCE_ROOT` for a private local evidence directory. Never publish storage
state, credentials or logs containing raw auth responses. Original failures and
explicit retries belong alongside final reports; screenshots/logs remain off main.

Manual real-provider validation requires your own provider registration and a
private complete credential pair. Register the exact callback URLs above, initiate
from either V2 form, complete consent, and verify the callback returns to the
intended relative app destination with a real session. Repeat denial and sign-out.
Automated dummy-pair tests deliberately stop at the provider authorize redirect.


## Verified security evidence (v0.5 review)

The historical v0.5 `npm run auth:test` report had **486/486 scenarios across 12 suites**:
config 31, cookie allowlist 23, service 5, redirect policy 28, browser return-path 4,
credential flows 30, provider matrix 42, error/rate-limit 5, protection 283,
account 15, demo Profile 8 and security 12. The return-path cases now cover Auth V2 through guarded and direct entry; the historical v0.5 run covered V1/V2
pathname, query and fragment through login/register switching and real signup.
The retained V2 switch links consume the same hydrated destination as their forms.

| Security requirement | Verified evidence and limits |
| --- | --- |
| Actual cookie attributes | Signup, remember-me, refresh, sign-out and current-session revoke inspect real headers/browser cookies and DB authority. HTTPS canonical configuration emits Secure/HttpOnly/host-only/Path `/`/SameSite Lax cookies; the automated Secure-header test uses loopback HTTP transport and does not claim a TLS deployment test. Cookie caching stays disabled. |
| Exact origins and redirects | Forged-origin credential/account/session writes reject; the custom revoke wrapper rejects missing/foreign origins and supplied identity. Adversarial redirect policy and real provider initiation enforce the canonical callback and library state handling. |
| Rate limiting | Enabled local Better Auth HTTP limiting returns 429 and recovers after its window. General 100/10 seconds and sensitive email sign-in/signup 3/10 seconds are in-memory per process. Custom server API wrappers are not covered by that HTTP limiter; production distribution/proxy policy remains v0.6. |
| Authority and revocation | All 31 protected route cases cover signed-out/valid/expired/revoked SSR, refresh and client navigation. All 27 protected reads cover absent/valid/tampered/expired/revoked direct calls; the separate session mutation checks ownership and exact origin. Password changes cannot opt out of revoking other sessions. |
| Safe output | Minimal identity/session DTOs and SSR responses omit passwords, hashes, tokens and connection strings; private/no-store is asserted. Builds with generated private sentinels are scanned, then restored to zero-env output. Published evidence is scanned separately. |
| UI cookies | 23 allowlist cases reject arbitrary/auth cookie names, invalid values/options and forged direct calls; legitimate preferences remain available. |
| Password and identity policy | Better Auth owns hashing/current-password verification. Email verification and automatic account linking remain disabled; sample employee/directory users are never auth identities. |

Evidence is on [pr-assets/v05-005](https://github.com/moeghashim/tenboards/tree/pr-assets/v05-005),
including original failed runs and explicit retries. No real-provider consent or
hosted database deployment was performed. Workers previews and production remain
demo-only; final review, ordered merges and release belong to Claude Opus 5.5.

Demo regression reconciles 1,824 baseline cases (608 per environment) and 588
supplemental cases across no-env local, DB/auth-off local and Workers. The latter
includes 384 delayed hydration cases on all eight historical routes, both timezones,
and direct/refresh. [Baseline coverage](https://github.com/moeghashim/tenboards/blob/pr-assets/v05-005/coverage.json)
and [supplemental coverage](https://github.com/moeghashim/tenboards/blob/pr-assets/v05-005/supplemental-coverage.json)
retain original failures and explicit passing retries. Authenticated four-state
forms, shell/account states and twelve print PDFs were inspected separately.

## Local Workers runtime (v0.6 task 001)

`npm run build` is credential-independent. `npm run worker:dev` starts the compiled
Nitro app with local Wrangler, selected `--env local`, and an ignored per-port test
configuration. With no environment it is a demo. To use Docker, put a **local**
`DATABASE_URL` in `.env`, migrate/seed it, then use `npm run worker:dev -- --binding`.
This supplies a local-only Hyperdrive `localConnectionString`; its zero ID is never
uploaded. Without `--binding`, the same command exercises `DATABASE_URL` fallback.
For auth, set a private random `BETTER_AUTH_SECRET` and
`BETTER_AUTH_URL=http://localhost:3021`. `.dev.vars*` and `.wrangler/` are ignored;
the helper deletes its temporary config/secrets on normal exit. Never copy these
files into an artifact or use `--remote`.

Nitro 3.0.260903-beta augments the request with `runtime.cloudflare.env`; Start's
`getRequest()` preserves it through request middleware, HTTP auth handlers and
server functions. Our AsyncLocalStorage scope resolves that binding object once,
without mutating global environment. `HYPERDRIVE.connectionString` wins over
`DATABASE_URL`; invalid configured bindings fail closed. Forced demo ignores all
connections, but a nonempty auth secret with demo is still invalid. Node scripts
retain their lazy pool and `closeDatabase()` lifecycle. Worker requests own both
their postgres.js/Drizzle client and Better Auth adapter/instance, reuse them only
inside that request, and close the client after request processing. No session
identity is cached globally.

Readiness retains only a successful boolean, never a pending I/O promise or a
rejection. Concurrent first requests may each check schema. Failures retry on the
next request; later session/database failures still fail closed. HTTP handling
uses middleware readiness and session helpers use that same memoized policy.

Run these against a fresh test-owned Docker database, then drop it:

```sh
DATABASE_URL=<local-review-url> npm run worker:test
AUTH_TEST_RUNTIME=workerd DATABASE_URL=<local-review-url> node --experimental-strip-types scripts/auth-protection-check.ts
AUTH_TEST_RUNTIME=workerd DATABASE_URL=<local-review-url> node --experimental-strip-types scripts/auth-account-check.ts
AUTH_TEST_RUNTIME=workerd DATABASE_URL=<local-review-url> node --experimental-strip-types scripts/auth-security-check.ts
DATABASE_URL=<separate-local-review-url> npm run auth:test
DATABASE_URL=<separate-local-review-url> npm run data:parity
```

The Worker suite tests demo/DB/auth configuration, runtime-only secrets, recovery
and readiness memoization, sequential/overlapping users, signup/signin/signout,
origin/redirect rejection, revocation and all 29 reads / 211 parity scenarios over
HTTP in a separate test-only Worker entry. That harness is not in production output.
Existing protection/account/security suites discover the compiled RPC manifest;
they do not rely on Vite RPC IDs. Node regressions remain separately labeled.
Provider consent, hosted TLS/pooling/cache and Cloudflare's actual proxy/IP
rewriting require verification on your own deployment; local Hyperdrive emulation proves none of those.

The runtime probe compares only presence/equality: Nitro request bindings,
`cloudflare:workers` and populated `process.env` agree for the runtime string
secret. The application uses request bindings, not either global alternative.
No unconditional `cloudflare:workers` import enters Node scripts or development.

Worker Secure-cookie probes use a reserved HTTPS canonical host over loopback HTTP
to avoid Wrangler proxy rewriting of localhost URL-related headers. This checks
actual response cookie flags, not TLS transport. The v0.5 Node probe is unchanged.

## Database rate limits and Worker origins (v0.6 task 002)

Migration `0013_wandering_midnight.sql` adds `auth_rate_limit` without changing
existing tables or seeds. Better Auth's `rateLimit` model maps to this isolated
Drizzle table: text primary ID, unique text key, integer count and bigint millisecond
`last_request`. Required readiness includes the limiter table. Explicit enabled
database storage never falls back to memory on connection/schema failure.

Installed Better Auth 1.7.12 reads the bucket, inserts under a unique-key constraint
or retries a competing insert, and uses conditional atomic `incrementOne` for
counts/window resets. The Drizzle adapter emits a conditional SQL UPDATE with
RETURNING. Limits are shared across isolates/restarts: general 100/10 seconds;
credential signup/signin and password/email changes 3/10 seconds. This is an
inactivity/sliding window: an admitted request updates lastRequest; rejected requests
do not extend it. The library returns X-Retry-After; our handler also emits standard
Retry-After, with private/no-store. Expired rows are opportunistically pruned on
window reset; inactive one-off buckets can remain until later cleanup. This is an
IP/path HTTP limiter, not account lockout, bot protection or per-user authorization.

Workers configure only `cf-connecting-ip`, which Cloudflare overwrites at ingress.
Forwarded, x-forwarded-for and x-real-ip cannot change the bucket. Missing/invalid
trusted IPs share a conservative per-path bucket instead of bypassing limits.
IPv6 uses the library's /64 grouping. Local workerd tests inject controlled reserved
addresses; actual Cloudflare header rewriting is an adopter deployment check. Node keeps its
existing Better Auth development IP behavior; do not expose Node dev as production.
Auth tests use distinct reserved IP fixtures across independent suites and retain
real limits. The two-Worker concurrency test uses one shared IP and admits exactly
three of twelve simultaneous first requests; it never disables limits.

Hosted Worker auth requires an explicit non-loopback HTTPS BETTER_AUTH_URL. Trusted
origins contain only that validated origin; no forwarded host/origin inference.
Local Node/workerd loopback retains its documented development origin. Cookie,
CSRF, callback, account ownership and direct server-function guards remain enabled.
Direct `auth.api.getSession`, listUserAccounts/listSessions, signOut/revokeSession
inside server functions do not traverse Better Auth HTTP rate limiting. They still
require the existing session and, for mutations, the exact configured origin.

Run `node --experimental-strip-types scripts/worker-rate-limit-check.ts` with an
explicit fresh local DATABASE_URL after migration/build. It checks two instances,
restart, concurrent insertion/increment, 429/window recovery, forwarding spoof,
missing trusted header, missing-table failure and recovery. Run
`node --experimental-strip-types scripts/preview-policy-check.ts` without DB/auth
environment to test preview allowlists and a real isolated build while the production
source temporarily contains a nonsecret Hyperdrive/URL fixture. Nothing is deployed
by that fixture test.

Wrangler supplies a loopback cf-connecting-ip when the incoming header is empty.
The missing-header case therefore uses a separate local test adapter that strips
it immediately before the real built Worker entry. This adapter is excluded from
production/preview builds; it changes no auth guard. Initial proxy-fixture failure
and the corrected passing test are retained in task 002 evidence.

## Your deployment smoke and promotion

[The operations runbook](deploy.md) keeps code, binding and both launch secrets in
one staged version before changing traffic. Do not set a secret on binding-less
live code or deploy a DB/auth-off intermediate version.
`npm run deploy:check -- <origin>` performs only GETs by default and validates the
actual redirect/status/null private session. Use `--demo` for isolated previews;
only explicit `--auth-roundtrip` creates a throwaway account, whose retained email
and exact-match cleanup are documented. All passwords/cookies stay in
memory. Normal GET traffic still updates the database limiter's counters.

## v0.6.1 canonical entry points

All route guards, session refreshes, sign-out destinations, account return links and OAuth error callbacks target `/auth/v2/login` or `/auth/v2/register`. The old V1 forms are redirect-only routes with HTTP 308 and the existing `authDestination` validator. Invalid destinations fall back to `/dashboard/home`; valid pathname/search/hash destinations survive. Dashboard V1 aliases redirect outside the authenticated layout; the current destination then applies its normal guard and callable reads still require a session. No auth storage, cookie policy, rate limit, provider or session ownership rule changes.

Run `node --experimental-strip-types scripts/legacy-redirect-check.ts` against a seeded local test database to check all six aliases, safe/hostile return parameters and browser/guard behavior. At the v0.6.1 release, protected read coverage was 22 app-data functions plus Account details (23); owned-session mutations remain independently checked.

The v0.6.1 Node rerun passes 426 scenarios across 12 suites; compiled Worker auth passes 245 protection, 15 account and 12 security cases. Removed-screen coverage is retired while credential/cookie, return-path, provider, error, ownership and failure-mode categories remain. Reports and original reruns are in [pr-assets/v061-001](https://github.com/moeghashim/tenboards/tree/pr-assets/v061-001).

## v0.8 project boundaries

Home, Projects index, the project layout and all five views remain under the dashboard route guard. Every new project/workspace/navigation server function independently checks `requireSession` before reading data. The shell requests summaries only inside the guarded dashboard layout; the root command palette consumes loader data and makes no protected project request on an auth/public surface. Navigation query recovery does not catch authentication failures.

Projects and sample membership are shared display data for signed-in users, not a tenancy or ACL implementation. My tasks identifies Jordan Lee as the sample member rather than claiming the session user's assignments. There are no task/file/member/favorite mutation endpoints. Existing account ownership, origin, cookie, provider, rate-limit and session-revocation rules remain unchanged.

The legacy Kanban/Tasks/Calendar/File Manager aliases recheck the app guard and issue 308 only after authorization. Login-return follows the original local URL and fragment through the canonical redirect; unknown legacy search keys are discarded. `/`, dashboard index and invalid auth-return fallback resolve to `/dashboard/home`; validated return destinations still win.

Run `scripts/project-access-check.ts` in Node and with `AUTH_TEST_RUNTIME=workerd` against a built local Worker for malformed/cross-project/missing IDs, independent RPC denial, cache headers and revocation. `project-redirect-check.ts` covers 80 demo/auth redirect cases; `legacy-redirect-check.ts` retains the 96 V1 cases. The integrated inventory is 27 guarded read functions (including account details), plus the existing owned-session mutation and five public bootstrap/preference functions. Full local suites do not claim hosted DB/Hyperdrive or provider round-trip acceptance.

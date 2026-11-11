# v0.5 — Better Auth

Status: **done — all five tasks merged (PRs #51–#55), deployed and released as [v0.5.0](https://github.com/moeghashim/tenboards/releases/tag/v0.5.0)**. Planning approval was merged as PR #50. Baseline: `origin/main` **201eb01**, 2026-10-24, released v0.4.0. [PLAN.md](../../../PLAN.md) is the canonical contract; its six v0.5 Decisions log rows win. Format and delivery precedent: [v0.4](../v0.4-data-layer/README.md), planning [PR #41](https://github.com/moeghashim/tenboards/pull/41). Verified implementation criteria below are checked against [acceptance evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v05-005); the milestone remains in review.

## Brief and boundaries

Template users keep the zero-config demo, then opt into real authentication on the existing local Postgres 17 data source. Email/password is always available with auth enabled. Google and GitHub are independently optional, each requiring its complete client ID/secret pair. Every app route and app-data server function requires a valid session in auth mode. Public auth and system screens remain available. Production and PR Workers previews remain demos with no auth secret until v0.6.

Include sign up, sign in with remember me, sign out, name edits, password changes for credential accounts, and active-session listing/revocation. Exclude forgot/reset password, email verification, 2FA, RBAC, organizations, admin user management, account linking UI, email changes, account deletion, avatar uploads, business-data CRUD and production Neon/Hyperdrive setup. Directory users, roles, shell sample accounts and the sample employee Profile are not auth identities. Authentication grants access to shared template data; it does not add per-user data ownership or turn informational Roles/Compensation into authorization.

Add only the approved `better-auth` runtime dependency, using its Drizzle adapter with the existing lazy `src/server/db/client.server.ts` postgres.js client. Use explicit `auth_user`, `auth_session`, `auth_account`, `auth_verification` SQL table names, mapped to Better Auth's models. The verification storage model supports library/OAuth state needs; it does not enable email verification. Preserve all v0.4 tables, records, migrations, seeds and read contracts. Append reviewed auth migrations to the existing journal; never auto-migrate or seed on startup, and never seed passwords or sample auth users.

No redesign of layouts, tokens, presets, sidebar or existing app content. Keep protected wrappers, calendar components, font/preferences registries, LICENSE and PLAN.md intact. Generate route/Worker files through tooling, never by hand. New feature UI stays in the owning route's `-components`; shared auth/config/session utilities belong in `src/lib/auth/`. The user's breakdown assignment authorizes these new `dev/**` contracts and registry updates; it does not authorize implementation in this PR.

## Configuration matrix

Auth mode and data source are separate dimensions. Reuse the v0.4 `selectSource` rule; `DATA_SOURCE=db` is not a valid setting. “No secret” means absent or empty `BETTER_AUTH_SECRET`; whitespace-only or otherwise invalid nonempty secrets are configuration errors, not permission to open the app. Validate nonempty secrets against the selected Better Auth version's requirements without echoing them.

| Data configuration | Auth secret | Result |
| --- | --- | --- |
| No `DATABASE_URL`, no `DATA_SOURCE` | Absent/empty | Demo data, auth off, all screens open; no auth/DB client or connection |
| Valid `DATABASE_URL`, no override | Absent/empty | DB-backed data, auth off, app open; auth screens remain visual-only |
| `DATA_SOURCE=demo`, with or without a DB URL | Absent/empty | Forced demo, auth off; no connection even if the URL is broken |
| Valid DB source, migrated database | Valid nonempty | Auth on; email/password plus independently configured OAuth providers |
| No DB URL, or `DATA_SOURCE=demo` even with a URL | Nonempty | Explicit startup/configuration error before app data is served; never silently open |
| Empty/malformed/unreachable DB URL or missing migrations, DB selected | Nonempty | Safe configuration/service error, access fails closed; never demo or anonymous success |
| Broken DB selected | Absent/empty | Existing v0.4 visible data-load error; auth off does not hide a DB failure |
| Unsupported `DATA_SOURCE` (including empty) | Any | Existing v0.4 explicit source error |
| Invalid nonempty secret or invalid configured `BETTER_AUTH_URL` | Auth requested | Safe configuration error; never include supplied values |

`BETTER_AUTH_URL` is the canonical auth base URL. Task 001 documents an explicit `http://localhost:3000` development fallback when it is absent and auth is on; other origins/ports must configure it. Accept HTTP only for loopback development and HTTPS elsewhere; reject credentials, query/fragment and unexpected base paths. Set the trusted origin from this configured base, not untrusted Host/forwarded headers. No public `VITE_*` secret variables. Auth-off ignores optional auth URL/provider configuration and does not instantiate Better Auth. Build validation and runtime configuration checks must both preserve the zero-env Workers path.

| Provider configuration | Auth on | Auth off |
| --- | --- | --- |
| Neither pair complete | Email/password only; no OAuth divider if no providers | Google and new GitHub buttons are decorative, no network/session action |
| Complete Google pair only | Google shown, GitHub hidden | Same visual-only demo behavior |
| Complete GitHub pair only | GitHub shown, Google hidden | Same visual-only demo behavior |
| Both complete | Both shown | Same visual-only demo behavior |
| Missing/blank half of a pair | That provider disabled on server and hidden in UI; email/password still works | Ignored |

Expose only mode/provider booleans and safe user/session display fields to the client. Callback registrations are `${BETTER_AUTH_URL}/api/auth/callback/google` and `/api/auth/callback/github`; keep provider credentials server-only.

## Route and server-function protection matrix

Use a shared server session helper in route `beforeLoad` checks and independently at every app-data server-function entry point. A parent guard alone does not protect a callable server function. Do not put a blanket guard on `(main)` or `__root`; they also contain public routes. Audit the actual generated inventory and every `createServerFn`, not just the navigation list.

| Surface | Auth-on signed out | Auth-on signed in | Auth off |
| --- | --- | --- | --- |
| `/dashboard/default`, `/crm`, `/finance`, `/analytics`, `/productivity`, `/ecommerce`, `/academy`, `/logistics`, `/infrastructure`, `/patient-monitoring` (all under `/dashboard`) and `default-v1`, `crm-v1`, `finance-v1`, `analytics-v1` | Login redirect before app data | Load app data | Existing behavior |
| `/dashboard/{file-manager,products,users,roles,profile,calendar,kanban,tasks,invoice,coming-soon}` | Login redirect | Load app | Existing behavior |
| `/mail`, `/chat`, `/dashboard/mail`, `/dashboard/chat` | Guard standalone documents and wrappers independently | Same-origin iframe session works | Existing standalone/iframe behavior |
| `/`, `/dashboard`, `/dashboard/` aliases | Resolve canonical dashboard destination through the guard | Default dashboard | Existing redirects |
| `/auth/v1/{login,register}`, `/auth/v2/{login,register}` | Public real forms | Redirect to validated destination, default `/dashboard/default` | Public visual-only forms |
| Bare `/auth/v2` | Public existing layout-only catalog state | Remains public; no forced redirect needed | Existing layout |
| `/unauthorized`, root error/not-found, dashboard splat/404 | Public, sanitized system UI; no protected shell/account data | Public system UI | Existing behavior |
| `/api/auth/$` | Public Better Auth HTTP entry; endpoints enforce their own session requirements | Same | Safe auth-disabled response; no auth/DB initialization |
| All app-data server functions, including shell accounts and standalone Mail/Chat | Safe unauthenticated rejection before read; never app records | Revalidate session for each request | Existing data-source behavior |
| Auth mode/session bootstrap | Safe mode/provider flags and null user | Minimal safe identity/session projection | Demo discriminant; no auth query |
| Account/session reads and mutations | Reject | Current-user-only enforcement on server | Unavailable; no writes |
| Existing preference/Mail-layout cookie functions | Public allowlisted UI preferences only | Same | Same supported preferences |

The dashboard splat currently inherits the account loader. Task 003 must isolate its public system rendering from that loader/guard so the 404 exception neither leaks accounts nor exempts actual dashboard routes. Preserve the message and links using a public-safe frame where needed; no application route may acquire an accidental public escape.

The canonical login is `/auth/v1/login`. Preserve the attempted app pathname/search (and client-known hash) in `redirect`; retain it when switching login/register within either variant. Use one pure shared validator at every consumption boundary and before OAuth callback construction. Accept only normalized same-origin relative app destinations beginning with a single `/`; reject absolute URLs, protocol-relative URLs, backslashes, control characters, encoded separator/double-encoding bypasses and auth/API destinations that could create loops. Preserve legitimate query/hash values without treating a nested query value as a navigation target. Invalid/missing destinations fall back to `/dashboard/default`. Revalidate after success and on already-signed-in auth visits. Unknown app destinations end in the public 404, never an external navigation.

## Screen and account contracts

Use Impeccable **Operate** mode, incumbent components and PLAN §7. V1 retains its split brand panel; V2 retains its existing frame and request-year hydration fix. Both consume the same login/register logic. A GitHub button uses the existing Google button treatment and installed `simple-icons`; keep the current provider placement in each variant and remove empty provider separators. No new UI dependency.

Auth-on registration adds a labeled **Name** field before email (Better Auth requires a name), then password and confirmation. Demo registration retains its existing field set. Match auth-on validation to the server policy, including password limits; do not keep the incumbent six-character registration minimum if the selected library requires eight. Login permits an existing credential and lets the server validate it. Keep password-manager autocomplete, input labels/error associations, first-invalid-field focus, visible focus and Enter submission. Pending submission prevents duplicates and announces progress; field and form-level errors remain inline, safe and retryable. Keep non-secret inputs after recoverable failure. Success refreshes route/session state and navigates only through the validated destination. Remove password/confirmation echoes from the existing demo JSON toasts too; demo success says it is a demonstration and creates no account/session.

Keep the unchecked remember-me default. In auth mode use Better Auth's `rememberMe` explicitly: unchecked is a session cookie, checked is persistent. Change the auth-on label to **Remember me** and document the selected version's actual lifetime/refresh policy; the current unimplemented “30 days” promise is not a new locked session TTL. Test cookie persistence attributes, not only a checked control. Do not claim closing a browser always erases a session when browser restore can retain session cookies.

The shell's existing `account-switcher.tsx` is the actual nav-user surface; no `nav-user.tsx` exists. Auth-on shows the signed-in name/email/initials, an **Account & security** entry and **Sign out**; remove demo identity switching in that mode. Demo keeps the existing switcher. Sign-out invalidates the server session, clears stale client/router data and returns to canonical login; failure does not falsely report success. Preserve shell geometry and menu keyboard/focus behavior.

Add an auth-only seventh **Account & security** tab at `/dashboard/profile?tab=account`. Validate the search value; existing six tabs and their v0.4 loaded Profile content remain intact, with Overview as the normal default. The shell account link opens the new tab directly. Clearly label the account section **Your sign-in account** and the existing employee record as sample data in auth mode: Jordan Lee is not the authenticated user. Do not repurpose the sample employee's Edit profile action or save auth changes to v0.4 Profile/directory tables. Unknown tab values safely fall back; demo `?tab=account` returns to Overview without auth calls.

Within the tab, keep a simple vertical order: name/email, password, sessions. Email is read-only; name has Save, pending, success and inline error states. Credential accounts get current/new/confirm password fields; OAuth-only accounts get explanatory text, no set-password/reset workaround. Successful password change revokes other sessions, preserves the current session if the API supports it (otherwise returns to login with clear feedback), clears password inputs and refreshes the session list. A fresh-login requirement uses the existing login flow and validated return path, not a new recovery feature.

Active-session rows show available device/browser information as plain text with a fallback, created/expiry times, **Current session**, and a clearly named Revoke action. Do not add a user-agent parsing dependency or display raw tokens. Project safe session IDs for the UI; resolve revocation targets against the caller's sessions on the server before invoking Better Auth. Revoke another device invalidates its next protected request immediately; revoking the current session follows sign-out behavior. Handle loading, failure/retry, stale/already-revoked rows and empty/expired state. Rows wrap/stack on mobile; confirmation and feedback retain keyboard focus and screen-reader context.

## Definition of Done

- [x] Auth/config/provider matrices pass, including fail-closed misconfiguration and no-env/no-Docker demo behavior. Workers demo performs no auth/DB connection attempts.
- [x] Approved dependency, lazy server configuration, Drizzle adapter, isolated auth tables, committed cumulative migrations and `/api/auth/$` handler work against Docker Postgres 17; all v0.4 parity scenarios remain green.
- [x] Both login/register variants implement real email/password and configured OAuth initiation, safe redirects, inline validation/errors and remember me; demo remains visual-only, with decorative Google/GitHub controls and no credential echoes.
- [x] Every app route and data server function enforces sessions in auth mode; public exceptions, aliases, iframe documents and signed-in auth-screen behavior pass the route matrix. Cookie helpers cannot expose/overwrite auth cookies.
- [x] Shell identity/sign-out and Profile account name/password/session flows work for the current user, without mutating v0.4 data or adding RBAC.
- [x] Security checklist, real-DB Playwright auth tests, full-catalog demo regression, four-state UI evidence and clean build/check/typecheck/Workers smoke pass.
- [x] README auth onboarding/status, `docs/auth.md`, aligned `docs/data-layer.md`, CHANGELOG v0.5 and evidence-backed acceptance/status are complete. No implementer version bump/tag/release.
- [x] Claude Opus 5.5 reviews and merges each approved task, then owns main redeploy and milestone release; GPT-6-Astra never merges or deploys production.

## Security checklist

These are verification gates, not claims of completed security review. Owners: 001 establishes configuration/cookies, 002 covers entry forms/redirects, 003 enforces access, 004 covers account ownership, 005 repeats the integrated checks.

- [x] Keep session cookies HttpOnly, host-only, Path `/`, appropriate SameSite (normally Lax for same-origin OAuth) and Secure over HTTPS. Verify actual Set-Cookie for sign-in, refresh, sign-out and revocation; document the loopback HTTP development exception. Keep cookie session caching disabled so revocation is checked against DB on the next protected request. [Cookies](https://www.better-auth.com/docs/concepts/cookies), [sessions](https://www.better-auth.com/docs/concepts/session-management).
- [x] Preserve Better Auth CSRF/origin checks; never enable `disableCSRFCheck`/`disableOriginCheck`. `trustedOrigins` contains only exact configured origins, no wildcard Worker previews or arbitrary request headers. OAuth state/callback checks remain library-owned. Test forged origins and hostile redirect inputs. Custom mutation server functions need their own same-origin enforcement; direct `auth.api` calls are not HTTP-boundary validation. [Security](https://www.better-auth.com/docs/reference/security).
- [x] Record the selected version's actual rate-limit defaults, stricter endpoint rules, development behavior and storage limits. Current docs describe production 100 requests/10 seconds, stricter sign-in limits and development disabled; exercise an enabled local limiter and 429/recovery. Direct server API calls bypass that HTTP limiter: audit any wrappers and do not claim blanket coverage. Keep credential mutations on the protected Better Auth HTTP path; do not disable limits to make tests pass. Distributed production rate limiting/proxy trust belongs to v0.6. [Rate limits](https://www.better-auth.com/docs/concepts/rate-limit).
- [x] No passwords, confirmation values, secrets, connection strings, OAuth tokens or raw session tokens in UI toasts, logs, error text, HTML hydration data or saved evidence. Minimize session DTOs; do not serialize raw Better Auth results. Scan bundles with non-production sentinels and redact test artifacts. No secrets enter browser environment variables.
- [x] Replace arbitrary-name cookie get/set server-function input with a runtime allowlist of existing UI preferences/Mail layout, with validated values/options. Reject auth cookie names and unknown names, including direct forged calls; preserve all existing preference behavior. Type annotations alone are insufficient.
- [x] Guard each app-data server function before any domain read; no caller-supplied user ID defines authority. Reject expired/revoked/tampered sessions and cross-user session targets. Mutations require the server-derived current identity. Keep user/session responses private/non-shared-cacheable; no process-global user state.
- [x] Use Better Auth's password hashing and current-password verification; no custom crypto or credential seed. Document email-verification and account-linking settings honestly; no automatic identity merge with sample users or assumption that an unverified email proves ownership.

## Stack and merge order

1. [001 — Auth foundation](001-auth-foundation.md): dependency/config/mode, safe cookie boundary, isolated schema/migrations, HTTP handler, session bootstrap and Workers demo proof.
2. [002 — Sign-in flows](002-auth-flows.md): shared V1/V2 sign-up/sign-in/sign-out logic, env-gated OAuth UI, remember me, validation and redirect contract.
3. [003 — Protection and shell identity](003-protection-shell.md): all app-route and server-function guards, public system exceptions, standalone/iframe coverage and signed-in shell menu.
4. [004 — Account and sessions](004-account-sessions.md): Profile account tab, name/password changes, active sessions and current/other-session revoke.
5. [005 — Acceptance and onboarding](005-auth-acceptance.md): integrated Docker auth e2e/security, full-catalog demo regression, README/docs and CHANGELOG v0.5.

Serial default: start each approved task from latest main after its predecessor merges. Implementation branches `feat/v0.5/NNN-slug`, one task per PR targeting main, following the v0.4 convention. Any approved stack declares base PR/branch, merge order 001 → 005 and each layer compare URL. Foundation/flows are intermediate layers, not a claim of a protected application before 003; do not promote auth-on deployments during the stack. This planning branch is `docs/v0.5/task-breakdown`.

Commits use Conventional Commits, `git commit -s` with `Signed-off-by: Moe Ghashim <mohanadgh@gmail.com>` and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Use the dev/MAINTAINERS.md PR body template and record the README decision. Claude owns review, squash merge, stack rebases, production redeploy and release. Never run `npm run deploy` as implementer. Acceptance/status edits require evidence; tasks stay `review` until merged.

## Test floor and evidence

Every implementation task, not only 005:

1. Pass `npm run build`, `npm run check`, `npm run typecheck`; zero-env dev `/dashboard/default` smoke without console/page/hydration errors. Report inherited warnings separately from failures. Use Node 22+, npm and existing Playwright tooling; no new runtime test dependency.
2. Run owned auth tests against real Docker Postgres 17, plus `npm run data:parity` for all 22 existing reads/130 baseline scenarios. Schema tasks prove fresh and v0.4 incremental migrations, repeat migration/seed and no v0.4 drift or deletion of auth records by seeding. Parity invokes domain reads without an HTTP session; do not weaken HTTP guards for CLI parity. No DB activity is needed for this planning PR.
3. Verify relevant rows of both configuration matrices; induced config/service failures have separate evidence and recover after correction. Prove absent secret with DB remains open, and secret with forced demo fails closed. Isolate environment variables and local `.env` so results actually exercise the intended mode.
4. Run `npm run screenshots` before/after for affected screens in light/dark × desktop (1440×900)/mobile (390×844); inspect demo and authenticated renders plus errors/pending/menu/tab/iframe states. Preserve keyboard names/focus, reduced motion and supported AA token pairs. No token edits planned; any approved token change needs contrast evidence. Store captures/logs only on `pr-assets` or PR attachments, never main. A nonvisual planning PR may document its screenshot-comparison exemption and still provide four-state default-route smoke.
5. Run `npm run preview:deploy -- --preview-alias pr-NNN` without DB/auth/provider env, include immutable version URL and reusable alias, smoke default and owned public/demo routes. No production secret/binding, auth deployment or production traffic change. Check client bundle boundaries and no auth/DB connection attempt on this path.
6. Read current official Better Auth and TanStack docs before auth/framework edits. UI work runs Impeccable context once per session and reads craft floor immediately before edits; inspect incumbent and final desktop/mobile light/dark. Preserve V2 request-year and all existing SSR/hydration fixes; no `use client`, SSR disabling, suppressed warnings or frozen application clocks.
7. Update README for verified behavior/commands/status, record `README: updated (sections …)` or a justified no-change decision in the PR, and tick only demonstrated criteria. Record blockers in `dev/open-questions.md`, pause dependent work and complete independent work.

Task 005 expands demo captures to the complete 38-route baseline × four presets × two themes × two viewports (608 per environment), on zero-env local demo, DB-backed/auth-off local mode and Workers demo. Reconcile against generated routes after adding the HTTP handler: classify API routes explicitly as nonvisual with separate HTTP tests, never silently omit them. Add authenticated all-protected-route/iframe smoke, all four auth forms signed out, Profile states, signed-in auth redirects, direct/refresh and root/system/error/query/tab/print variants. Re-run delayed hydration/opposite-timezone checks for the eight historically fixed routes. Auth tests use isolated users/browser contexts; never commit live credentials/storage state or truncate a shared database.

## Planning inspection and official references

Inspected shared RHF/Zod forms, Google button, V1 routes/V2 frame, dashboard account loader/header/switcher, Profile's six tabs, source selector, lazy DB client, server cookie helpers and route/server-function inventory. Existing live V1/Profile renders confirm the incumbent layout. Useful preparation is narrow: split safe auth DTOs from server config, share redirect/form-state logic, isolate public dashboard errors from account loading, and replace generic cookie names with validated UI-only contracts. No code prefactor occurs in this PR.

Official docs reviewed 2026-10-24: [TanStack integration](https://www.better-auth.com/docs/integrations/tanstack) for GET/POST `/api/auth/$`, request-header session APIs and cookie propagation; [Drizzle adapter](https://www.better-auth.com/docs/adapters/drizzle) for schema mappings; [Start server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes), [server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) and [middleware](https://tanstack.com/start/latest/docs/framework/react/guide/middleware) for independent request boundaries. Prefer Better Auth's browser client for credential mutations; any cookie-setting server API path must propagate Set-Cookie through the supported `tanstackStartCookies` integration, last in the plugin list.

[Email/password](https://www.better-auth.com/docs/authentication/email-password), [users/accounts](https://www.better-auth.com/docs/concepts/users-accounts), [Google](https://www.better-auth.com/docs/authentication/google) and [GitHub](https://www.better-auth.com/docs/authentication/github) inform the flow contracts. GitHub setup must include the documented email scope. The API contracts must be checked again against the version installed in 001, not copied blindly from a moving documentation site.

Dependency inspection: the current docs install `@better-auth/drizzle-adapter` separately, but published `better-auth@1.7.12` exports `better-auth/adapters/drizzle`, re-exporting its own exact adapter dependency. Use that supported package export; no additional direct runtime dependency is planned. If the implementation version removes it or requires another runtime dependency, escalate before installing it.

No unresolved product/access question blocks this breakdown. The public dashboard-404 loader and generic cookie functions are assigned explicitly above rather than left as guard bypasses. Missing access/assets, conflicting PLAN requirements, additional runtime dependencies or scope expansion go to [open questions](../../open-questions.md); do not invent approval. This planning PR does not mark any v0.5 implementation criterion verified.

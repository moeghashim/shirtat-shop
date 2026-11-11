---
id: "005"
title: Verify auth end to end and document optional onboarding
milestone: v0.5-auth
status: merged
category: validation
files: ["scripts/auth-*.ts", "scripts/screenshots.ts", "scripts/screenshot-routes.ts", "scripts/report-route-coverage.ts", "package.json", "docs/auth.md", "docs/data-layer.md", ".env.example", "README.md", "CHANGELOG.md", "dev/milestones/v0.5-auth/", "dev/milestones.json", "dev/open-questions.md"]
---

## Goal and scope

Prove the integrated authentication contract against real local Docker Postgres and preserve the full demo catalog. Consolidate repeatable Playwright auth acceptance and honest onboarding/security documentation. This is verification of 001–004, not permission for new auth features or production configuration.

## Files and ownership

- Existing/001–004 auth check scripts: compose an executable `npm run auth:test` command with current Playwright dependency; isolated test users/environment and clear failure reports.
- Screenshot/coverage tooling: safe authenticated setup where needed, retain all visual routes and explicit HTTP-route classification, record variant/error/iframe coverage.
- README, `.env.example`, `docs/auth.md`, `docs/data-layer.md`, CHANGELOG: reconcile completed behavior, onboarding, command surface and boundaries.
- Milestone/task acceptance and registry: verified evidence/status only; unresolved failures to `dev/open-questions.md`. Narrow contract bugs return to their owning files/task with explicit review scope; no opportunistic redesign.

## Before implementation

Prefactor inspection: reuse the focused auth scripts, existing screenshot manifest, environment dimension and route coverage report. Extract shared test setup only if it avoids duplicating isolated-user/session lifecycle. Add a private authenticated-context seam without saving session tokens to published storage state. Do not introduce a test framework/runtime dependency, test-only auth bypass, destructive database reset or global frozen clock.

## Acceptance criteria

- [x] Runnable Playwright auth suite against real migrated Docker Postgres covers signup and login in both V1/V2, remember-me cookie semantics, inline/server errors, sign-out, profile name save, password change and old-password rejection. Tests assert real server session/persistence outcomes, not intercepted success mocks.
- [x] Complete route/server-function matrix passes signed out, signed in, expired and revoked. Include all 14 dashboards, every app page, standalone/iframe Mail/Chat, aliases, public unauthorized/error/404, all four auth forms and already-signed-in redirects. Direct calls to every app-data server function reject without a session before reading data.
- [x] Redirect adversarial suite covers absolute URLs, protocol-relative URLs, encoded/double-encoded separators, backslashes, controls, nested query destinations and auth/API loops, plus legitimate pathname/search/hash round trips. Test both credential and provider callback paths and forged origins.
- [x] Multi-context tests prove current/other-session revocation and password-change revocation invalidate the next protected request; cross-user revoke fails without affecting either user. Test stale rows, service failures and recovery. Record cookie flags/expiry and no-cache behavior.
- [x] OAuth matrix covers missing, partial, Google-only, GitHub-only and both pairs across all four forms. With test credentials, generate real Better Auth authorization URLs and assert correct provider host, callback `redirect_uri`, state handling and safe app return destination; verify disabled providers reject direct initiation. No external account consent is needed, and this evidence is not a claim of completed real-provider authentication. Document manual real-provider verification/setup separately.
- [x] Complete both configuration matrices: zero-env/no-Docker first run, DB without secret still open, forced demo without connection, secret without DB/with forced demo explicit error, configured unreachable/missing-schema auth failure and recovery. Workers build/runtime with no auth/DB env succeeds without connection attempts or secret/driver leakage in browser bundles.
- [x] Fresh and v0.4 incremental auth migrations, repeat migration/seed and `db:generate` drift checks pass. All 22 existing reads/130 baseline parity scenarios remain green; controlled parity mismatch/omission still fails. Seeds preserve auth records, and account changes never modify v0.4 records.
- [x] Full demo catalog regression on local no-env demo, local DB/auth-off and Workers demo: all four presets × light/dark × desktop/mobile (608 baseline cases per environment), plus query/tab/iframe/print/public-system variants. Reconcile generated inventory including API exclusions; preserve original failures and explicit retries. Inspect before/after demo captures, explain intended GitHub/safe-toast differences, and verify authenticated protected-route and account-state captures separately.
- [x] All eight historical hydration routes pass delayed direct/refresh in Chicago/Kiritimati, including both V2 forms. Keyboard access, names, focus, reduced motion, shell preferences and real clocks remain intact. No blanket pixel tolerance, hidden business-data masks, SSR disabling or warning suppression.
- [x] Complete the milestone security checklist with evidence: exact trusted origins/CSRF tests, actual cookies, enabled local rate-limit 429/recovery and documented defaults/limits, generic-cookie endpoint negative tests, current-user enforcement and credential/session redaction in UI/logs/errors/HTML/bundles/evidence.
- [x] README documents zero-config first, optional Docker migrate/seed, secret/base URL/provider configuration, real versus decorative forms, account/session usage, commands and roadmap. `docs/auth.md` covers architecture, tables, configuration/protection matrices, callbacks/scopes, redirect policy, persistence/revocation, security defaults and troubleshooting. Align data-layer guide's old “no authentication” statements to the mode boundary; no stale promise that auth is already live in production.
- [x] Add CHANGELOG v0.5 for verified work; no implementer version bump/tag/release. Record evidence and acceptance/status honestly, leave unmet criteria unchecked and milestone in review until Claude completes merges/release. Production remains demo with no secret until v0.6.

## Tests

- Run `npm run build`, `npm run check`, `npm run typecheck`, `npm run auth:test`, `npm run data:parity` and required migration/source checks; report exact failures separately from inherited warnings and induced-fault tests.
- Run `npm run screenshots` and route-coverage validation for each required environment/preset; upload PNGs/reports/logs only to `pr-assets` or PR attachments after redacting auth material. Use real isolated DB/browser contexts for e2e, no auth bypass in shipped code.
- Follow README and `docs/auth.md` in a clean isolated environment. Verify every documented command and callback, plus cleanup that touches only test-owned records; never drop/truncate shared user data to reset a test.
- Upload a no-secret version via `npm run preview:deploy -- --preview-alias pr-NNN`; include immutable URL/alias and smoke default/all demo catalog without auth or DB access. Do not activate production auth or claim hosted DB/Hyperdrive validation.

## Execution order and delivery

Depends on verified 001–004; merge last. Follow [common gates](README.md#test-floor-and-evidence) and [delivery rules](README.md#stack-and-merge-order). Claude Opus 5.5 owns review, squash merge, main redeploy and v0.5.0 release. Implementer stops after the authorized PR work.

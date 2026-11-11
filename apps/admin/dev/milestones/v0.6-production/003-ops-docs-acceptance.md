---
id: "003"
title: Document operations and verify production readiness
milestone: v0.6-production
status: merged
category: validation
files: ["docs/deploy.md", "docs/auth.md", "docs/data-layer.md", "scripts/database.ts", "scripts/deploy-check.ts", "scripts/auth-*.ts", "scripts/", "package.json", "README.md", "CHANGELOG.md", ".env.example", ".gitignore", "dev/milestones/v0.6-production/", "dev/milestones.json", "dev/open-questions.md"]
---

## Goal and scope

Turn the milestone outline into an executable reviewer runbook, add safe deployment smoke tooling and prove 001–002 are ready for cutover. Close the inspected remote-DB command gap without performing production work. Draft CHANGELOG v0.6 for verified implementation; do not claim release or hosted acceptance yet.

## Files and ownership

- `docs/deploy.md`: Neon provisioning through rollback/release, exact target/command/env separation and credential-safe operational instructions.
- Database CLI: explicit remote opt-in for migrate/seed, retaining existing local defaults and safe errors. Do not relax parity/auth-test local database protections.
- `scripts/deploy-check.ts`/package command and focused tests: production read-only default, demo expectation option and opt-in account round-trip.
- README/auth/data guides/env examples/CHANGELOG and milestone acceptance: reconcile verified behavior and link redacted evidence. No source changes beyond scoped acceptance fixes in owning tasks without review.

## Before implementation

Reuse 001–002's runtime tests and existing safe assertion/session helpers. Extract DB command target validation if necessary rather than removing `localOnly` globally. Keep deployment checks independent of Vite internals, browser auth bypasses or admin APIs. Inspect existing migration/seed safeguards and release wording before adding commands.

## Acceptance criteria

- [x] `docs/deploy.md` explains user-created Neon/direct TLS URL, reviewer-only access, Hyperdrive creation with caching disabled, nonsecret committed ID, Worker secrets, direct migration/seed, main deployment, smoke, rollback and v0.6.0 release. Include separate local/preview/production config and exact selected target for every mutating command.
- [x] Document/test an explicit remote migrate/seed opt-in (for example `--allow-remote`) with target validation, no credential logging and unchanged local-only defaults. Direct URL only for operations, no Hyperdrive migration path; no destructive resets or default auth accounts. Demonstrate rejection without opt-in and success/idempotence on an isolated test target without needing production Neon.
- [x] Runbook makes secret/version ordering concrete: no secret-only broken live version, no production DB/auth-off intermediate exposure. Record preflight, known-good versions, binding/secret compatibility and separate data recovery; `wrangler rollback` does not reverse database migrations. Rehearse using local/isolated non-production resources, never production credentials.
- [x] `npm run deploy:check -- <url>` defaults to read-only auth-on production expectations. Check all four public login/register routes, public unauthorized/404 behavior, signed-out `/dashboard/default` redirect with validated return path, and `/api/auth/get-session` null signed-out result with private/no-store. Inspect redirect targets/status rather than accepting a followed login 200 as proof. Reject unexpected demo/500/off-origin behavior and exit nonzero with safe diagnostics.
- [x] Provide explicit demo expectation for `tenboards-preview`: dashboard accessible, auth disabled (current handler 404) and no false production success. Bound network timeouts/retries, validate HTTP(S) target and never forward cookies/credentials to another origin. No secrets in default output.
- [x] Optional explicit flag (for example `--auth-roundtrip`) creates a unique throwaway user, signs up, signs out, signs in, confirms session identity/protected access, then signs out/revokes its sessions. Retain credentials only in memory, redact evidence, report any retained account and reviewer cleanup procedure. No writes without this flag; no new account-delete API or business-data mutation.
- [x] Document optional later Google/GitHub secrets/callback URLs and complete-pair behavior; launch remains email/password-only. Explain open signup/shared seed data, runtime source rules, limiter limitations and local-vs-hosted evidence boundaries.
- [x] Full Node auth suite, baseline 22-read/130-scenario parity, migration checks, workerd subset and runtime/security negatives pass. Repeat delayed hydration for all eight historical routes and representative authenticated account/protected routes in both timezones. Demo preview cannot reach DB and passes smoke.
- [x] All-route demo capture/route coverage and affected authenticated captures are inspected in light/dark × desktop/mobile; preserve four-preset coverage where inherited acceptance scripts require it. No new console/hydration errors, warning suppression or secret artifacts. Publish reports only to pr-assets/attachments.
- [x] README command/setup/deployment/status sections and guides agree with tested behavior. CHANGELOG v0.6 draft records delivered changes but leaves release/cutover pending. Mark only verified acceptance; task 004 and milestone completion stay open until reviewer execution.

## Tests

Run build/check/typecheck, auth:test, data:parity, fresh/incremental/repeat migration/seed checks, local workerd matrix and deploy-check positive/negative cases on local auth and isolated demo preview. Ensure smoke fails for wrong mode, unsafe redirect, unreachable target and invalid session response without leaking bodies/tokens. Verify default smoke makes no account writes. Run screenshots/coverage and follow the runbook from a clean setup. Production steps are checked for syntax/preconditions here, then executed and evidenced in 004.

## Dependencies and handoff

Depends on 001 and 002. Blocks 004; lack of the user's Neon URL does not block this task. Hand reviewer a checked runbook, exact passing revision, rollback plan, isolated preview URL and explicit remaining hosted checks. Implementer never merges, sets production secrets, provisions production Hyperdrive, deploys main or releases.

## Verified implementation evidence

Local acceptance: build/check/typecheck, Node auth 486/486, Node/workerd 22-read/130-scenario parity, fresh/v0.5 incremental/repeat migrations/seeds, compiled protection/account/security and distributed limiter checks pass. Remote opt-in and deployment smoke positive/negative cases pass; default smoke creates no accounts. Atomic code/binding/secret upload syntax passes a local dry run only.

[Reports, logs and inspected captures](https://github.com/moeghashim/tenboards/tree/pr-assets/v06-003): 1,216 all-route/four-preset demo cases, 256 historical delayed-hydration cases and 96 real-auth delayed-hydration cases. Four network/navigation/idle timeouts and one transient null-body capture probe error passed targeted identical-setting retries; original diagnostics remain linked. No warning suppression or UI/token changes. Inherited Biome one warning/ten infos and Base UI/chunk warnings remain separate.

Immutable preview: https://b890f943-tenboards-preview.mohanadgh.workers.dev (alias https://pr-59-tenboards-preview.mohanadgh.workers.dev), ASSETS only/no secrets. Production resources, credentials, traffic and task 004 remain untouched. Hosted Neon/TLS/pooling/cache/proxy and promotion checks remain reviewer-owned.

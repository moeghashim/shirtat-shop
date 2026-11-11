---
id: "004"
title: Template deployment readiness
milestone: v0.6-production
status: merged
category: operations
files: ["scripts/deploy-prepare*.ts", "scripts/build-environment.ts", "scripts/preview-policy.ts", "scripts/operations-check.ts", "scripts/worker-rate-limit-check.ts", "src/config/app-config.ts", "wrangler.jsonc", "docs/deploy.md", "docs/auth.md", "README.md", "CHANGELOG.md", "package.json", "dev/milestones/v0.6-production/", "dev/milestones.json", "dev/open-questions.md"]
---

## Goal and scope

Make tenboards ready for template adopters to connect their own Neon database and
publish a complete authenticated Cloudflare Worker. PLAN's **v0.6 template
readiness** decision (2026-10-24, bb3c62a) supersedes the former project provisioning
and production-mode requirements and explicitly authorizes this task rewrite.
The repository's live Worker stays a zero-config demo. No project-owned Neon,
Hyperdrive, production secrets or production upload is required or authorized.

GPT-6-Astra implements this task on `feat/v0.6/004-template-deploy-readiness` in one
PR to main. Claude Opus 5.5 reviews and owns merge/release. No implementer merge,
production deployment, version bump, tag or release.

## Before implementation

Inspect deployment scripts and build isolation before editing. Share the existing
preview clean-build environment allowlist and dotenv-file rejection as a small
behavior-preserving prefactor. Keep config validation/private-file creation in a
pure/local helper seam for focused tests. Preserve existing preview targeting and
all application/auth behavior; add no runtime dependency.

## Acceptance criteria

- [x] Generalize `docs/deploy.md` to address you with Worker/URL placeholders, one live-demo note, a short quick path and ordered detailed Neon/Hyperdrive/migrate/seed/secrets/candidate/promotion/check/OAuth/rollback steps. Preserve no-secret-only and no-DB/auth-off warnings and state local-only workerd verification honestly.
- [x] Add `npm run deploy:prepare`: clean build, expected Worker name and nodejs_compat validation, exactly one real-format nonzero 32-hex HYPERDRIVE ID, no localConnectionString or DB/auth vars; optional exclusive 0600 secrets outside the repository with random BETTER_AUTH_SECRET and required canonical --url. Print next commands without executing Cloudflare/database operations or exposing secret contents.
- [x] Test invalid configuration, environment isolation, private secret-file safety and command ordering in the existing scripts style; include preparation tests in the operations check. Replace adopter-facing hardcoded production-origin fixtures with example hosts.
- [x] Update README deployment guidance/live-demo/release-ready status, draft CHANGELOG v0.6, milestone references/runbook/DoD and task 004 review status. Keep PLAN and release metadata unchanged.
- [x] On a fresh local Docker database at port 54329, pass build/check/typecheck, auth:test, data:parity, worker:test, worker:auth, worker:security, operations-check and deploy-check-test. Drop the test database afterward. Record inherited warnings separately.
- [x] Pass dev `/dashboard/default` smoke without console errors and `npm run screenshots`; publish redacted light/dark × desktop/mobile evidence or explain the nonvisual exemption. Include an immutable `tenboards-preview` URL plus `pr-NNN` alias in the PR.

## Verification and handoff

Record exact commands and evidence in the PR and the verification note below.
Hosted Hyperdrive→Neon pooling/TLS/cache/proxy behavior remains unverified: local
workerd tests are the readiness evidence, and adopters verify their own live
installation. No live database/account is created to close this milestone.

Depends on merged tasks 001–003 (PRs #57, #60, #59). No Neon-access gate remains.
The reviewer may release v0.6 after readiness review; package/tag/release changes
are separate reviewer work.

## Verified evidence — 2026-10-24

[PR #61](https://github.com/moeghashim/tenboards/pull/61) targets main. Implementation
`3fe465c`; [logs, capture matrix and database cleanup](https://github.com/moeghashim/tenboards/tree/pr-assets/v06-004).

- Build/check/typecheck pass. Biome retains one existing highlighter array-index-key warning and ten infos.
- Node auth: 486 scenarios; data parity: 22 reads/130 scenarios. Worker auth: 310 scenarios; Worker runtime/parity, distributed security, operations-check, deploy-check-test and atomic-upload dry-run pass.
- Preparation validation rejects 27 invalid configs and verifies environment/file/command safety. A temporary copied fork passes real clean Nitro build/config/0600 secret creation with inherited secret markers absent from output; it contacts no cloud/database and is removed.
- Fresh Docker targets use port 54329. Both test-owned databases were dropped; a follow-up catalog query confirms zero remaining. The shared Docker service is preserved.
- Dev before/after and immutable-preview `/dashboard/default` captures pass light/dark × desktop/mobile with zero app console/hydration errors. Dev before/after PNGs are identical. No UI/token changes; broader visual regression is exempt for this nonvisual task.
- Initial IPv4 capture failure and a Worker startup failure during a concurrent preview rebuild are retained in evidence. Correct localhost captures and a stable-build/fresh-database Worker rerun pass without runtime changes.
- [Immutable preview](https://ed61566f-tenboards-preview.mohanadgh.workers.dev) and [pr-61 alias](https://pr-61-tenboards-preview.mohanadgh.workers.dev) pass demo deploy:check; inventory is ASSETS-only with no secrets. Production resources were not touched.

Release remains reviewer-owned; hosted Neon/Hyperdrive acceptance is not claimed.

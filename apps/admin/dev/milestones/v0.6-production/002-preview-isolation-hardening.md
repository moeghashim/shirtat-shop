---
id: "002"
title: Isolate demo previews and harden production authentication
milestone: v0.6-production
status: merged
category: security
files: ["wrangler.jsonc", "vite.config.ts", "package.json", "scripts/", "src/lib/auth/", "src/server/db/auth-schema.ts", "src/server/db/schema.ts", "src/server/db/migrations/", "src/start.ts", "drizzle.config.ts", "AGENTS.md", "CONTRIBUTING.md", "README.md", "docs/auth.md", ".gitignore", "dev/milestones.json"]
---

## Goal and scope

Send implementer previews exclusively to demo-only `tenboards-preview`; prepare production's unfilled Hyperdrive binding slot and replace the existing in-memory auth limiter with database storage shared by isolates. Preserve existing auth flows and exact-origin validation. Production remains demo before reviewer cutover.

## Files and ownership

- Wrangler/Nitro source config, preview scripts/package command: deterministic independent target, binding/secret guards, immutable version and alias. Generated configs remain tooling-owned.
- Auth config, rate limiter model/migration/readiness and focused tests: isolated `auth_rate_limit` SQL table, cross-instance storage, origin and trusted-IP handling.
- AGENTS, CONTRIBUTING, README/auth guide: update preview target/commands, security behavior and before-ID deployment contract. Do not change PLAN or merge authority.

## Before implementation

Reuse 001's effective runtime configuration and test harness. Keep the existing origin validator and explicit limiter enablement; isolate environment selection and preview allowlist validation into narrow helpers. Inspect installed Better Auth schema/storage semantics before generating an additive Drizzle migration. No Redis/KV/Durable Object/driver dependency or broad auth refactor.

## Acceptance criteria

- [x] `npm run preview:deploy -- --preview-alias pr-NNN` builds/uploads only to the exact Worker name `tenboards-preview`; initial creation is documented. It never uploads a version to `tenboards` or changes production traffic.
- [x] Preview uses deliberately separate configuration and ASSETS only. Verify final generated config and remote binding/secret inventory; reject Hyperdrive, DATABASE_URL, auth/provider secrets and production service access. Do not rely on `--name` alone, array merging, inherited env or absence of local credentials. Build with secrets stripped and fail safely on contaminated inputs.
- [x] Immutable version URL and reusable alias on `tenboards-preview` serve demo, with public dashboard and auth-disabled endpoint. Repeat after production-binding fixture is added to the source config to prove no inheritance; use only nonsecret fixture IDs in tests, not deployment.
- [x] Production source config includes a documented inactive `HYPERDRIVE` slot. Before real ID, omit active binding rather than deploying a placeholder. Zero-env build/demo succeeds; secret without binding/URL fails closed. Real ID is committed only by reviewer at cutover.
- [x] Better Auth uses explicitly enabled database rate-limit storage and a correctly mapped isolated model, with additive committed Drizzle migration/journal. Existing auth/data tables and seeds are unchanged. Readiness checks include required limiter storage; missing-table errors are safe.
- [x] Rate-limit state survives independent Worker instances/restarts sharing Docker DB; verify 429, Retry-After/recovery, strict sign-in rules and concurrent requests without disabling limits for tests. Record actual storage semantics and limitations; missing DB must not silently fall back to memory.
- [x] Trusted origins derive only from validated runtime BETTER_AUTH_URL, as the existing code intends. Hosted auth requires its configured canonical HTTPS origin, no implicit localhost or request-header fallback. Reject forged origins/redirects; preserve CSRF, cookie/session and direct server-function protections.
- [x] Worker IP policy uses Cloudflare's trusted overwritten client address; test spoofed forwarding chains and missing-header behavior. Keep controlled local tests and Node behavior explicit. Audit direct auth.api callers and accurately document their exclusion from HTTP rate limiting.
- [x] AGENTS/CONTRIBUTING/README describe the new target and implementer/reviewer split, including first-use and binding-less behavior. Auth guide describes DB limiter schema/migration and IP/origin policy. No production secret, migration or deploy occurs in this task.

## Tests

Run build/check/typecheck, default dev smoke, Node auth/parity regressions and 001's local workerd subset. Verify fresh and v0.5-incremental migrations, repeat migration/seed and no schema drift. Add focused preview contamination/merge-negative checks and two-instance limiter tests. Capture demo preview plus local authenticated public/protected screens in light/dark × desktop/mobile; attach immutable preview/alias, redacted bindings proof and console/hydration evidence. Token contrast is unchanged; document nonvisual scope where applicable.

## Dependencies and handoff

Depends on 001. Blocks 003/004 and all future PR preview uploads. Claude reviews/merges; implementer may deploy the isolated demo preview only, never production. Reviewer supplies real Hyperdrive ID in 004, not here. If isolation or distributed storage needs an unapproved dependency, log the blocker and stop dependent work.

## Verification evidence

2026-10-24: [task 002 evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v06-002). Build/check/typecheck, Node 486 auth cases and 22/130 parity, v0.5 incremental/fresh/repeat migration/seed and no drift pass. Workerd runtime/22–130 parity and protection 283/account 15/security 12 pass. Two-Worker limiter tests prove restart persistence, exactly three concurrent admissions, Retry-After recovery, trusted-IP policy and missing-table recovery. Preview contamination and real production-fixture isolation build pass; immutable https://f70a72ed-tenboards-preview.mohanadgh.workers.dev has ASSETS only/no secrets. No production mutation.

Maintainer-reference update (v0.9 / 004): historical root `AGENTS.md` workflow rules and its PR template now live in `dev/MAINTAINERS.md`; read that file for current upstream contributions.

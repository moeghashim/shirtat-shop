---
id: "001"
title: Establish request-scoped Workers database and auth runtime
milestone: v0.6-production
status: merged
category: runtime
files: ["wrangler.jsonc", "vite.config.ts", "src/server/db/client.server.ts", "src/server/data/source.ts", "src/server/", "src/lib/auth/", "src/start.ts", "scripts/auth-test-support.ts", "scripts/auth-*.ts", "scripts/data-parity.ts", "scripts/", ".gitignore", ".env.example", "docs/auth.md", "docs/data-layer.md", "README.md", "dev/milestones.json"]
---

## Goal and scope

Make the existing postgres.js/Drizzle and Better Auth stack execute safely in workerd while preserving Node pooling and zero-config demo. Follow the milestone runtime/configuration matrix. No production provisioning, new driver, auth feature or preview deployment to `tenboards`.

## Files and ownership

- Source Wrangler/Nitro config: explicit compatibility intent, dedicated non-production local environment and generated-config verification. Never hand-edit generated Worker files.
- Source selector, a small server runtime/context helper, DB client, auth config/instance/session/account and Start middleware: one consistent effective environment and request lifetime.
- Existing test helpers/scripts: support local built Worker requests without relying on Vite source RPC IDs. Ignore local Wrangler secrets/config; keep Docker credentials local and no real Hyperdrive ID.
- README/auth/data docs: verified local workerd commands and configuration; registry/task status only after checks.

## Before implementation

Inspect the installed Nitro request adapter and current TanStack Start official request/middleware APIs before framework changes. Extract a pure effective-configuration resolver and separate client factory from lifetime policy if that keeps `getDatabase()` callers stable. Inspect both DB and Better Auth singletons together. Reuse existing test lifecycle helpers with an explicit runtime target; no broad domain refactor, new runtime dependency, production test route or auth bypass.

## Acceptance criteria

- [x] Source config explicitly carries `nodejs_compat`; generated config retains the intended `2026-10-23` date, flags, entry/assets and environment selection. Document Nitro's merge/default behavior and baseline flag already supplied by Nitro.
- [x] Runtime resolver reads object binding `HYPERDRIVE.connectionString` before `DATABASE_URL`, and supplies the same effective source to data/auth validators. Invalid configured binding fails rather than using a fallback. Forced demo stays connection-free; existing unsupported-source/error behavior remains.
- [x] Demonstrate how request bindings and string secrets reach Start middleware, HTTP handler and server functions. Prefer request-owned Nitro runtime context; compare with `cloudflare:workers` env and populated `process.env` in a local probe. No secret baking, global env mutation, or unconditional Worker-module import in Node scripts/dev.
- [x] DB client/Drizzle and Better Auth adapter/instance are request-scoped on Workers, shared only within that request when useful. No cached instance captures an earlier request client/session. Node retains its lazy pool and `closeDatabase()` CLI lifecycle. Demo instantiates neither DB nor auth.
- [x] Runtime auth secret/base URL/provider settings govern Worker behavior even when build env has none; session/account helpers agree. Preserve validation, cookie privacy, safe errors and all v0.5 guards.
- [x] `src/start.ts` readiness is memoized per isolate only after success; remove redundant handler checks through the same policy. Do not share a pending I/O promise between requests or cache rejection. Startup/schema failure retries and recovers; later DB/session failures still fail closed. No process-global auth identity.
- [x] Local `wrangler dev --env local` (or documented equivalent selected config) uses a non-production binding with ignored `localConnectionString` for Docker Postgres. A separate binding-free local case exercises demo and DATABASE_URL fallback. No remote dev/production credential required.
- [x] Workerd runs the defined milestone subset: real credential signup/signin/signout, protected routes and direct data functions, repeated/overlapping distinct-user requests, revocation, config/schema/unreachable-DB errors and recovery. Data parity crosses actual Worker request execution; Node-only parity results are labeled separately. Test harness never ships.
- [x] README/local guides describe the tested setup and limits of local Hyperdrive emulation. Evidence identifies runtime versions, environment, subset/exclusions, request lifetime and runtime-secret proof without credentials.

## Tests

Run build/check/typecheck and four-state dev default smoke; full Node `auth:test`, `data:parity` and relevant config/source tests. Run local workerd request/concurrency/secret/config tests above and the existing auth/security subset against the compiled Worker. Validate no-secret/no-DB demo without Docker. Inspect generated deployment config and browser bundles with non-production sentinels. Capture affected demo/auth routes in all four states, preserving delayed V2 hydration checks. Report warnings separately; upload redacted evidence only to pr-assets/attachments.

## Dependencies and handoff

Depends on approved v0.6 planning and main 272ee7b. Blocks 002–004. For its version-preview gate, use an explicitly reviewed binding-free configuration targeting `tenboards-preview` until 002 makes that target permanent; never upload a PR version to `tenboards`. If the isolated upload cannot be provided, log the missing gate without waiving it. Log request-context/runtime incompatibility before expanding scope. Hand off runtime seam and workerd harness to 002; no Neon URL is needed.

## Verification evidence

2026-10-24: [task 001 evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v06-001). Build/check/typecheck, Node 486 auth cases and 22/130 parity, fresh/upgrade/repeat migrations, workerd runtime + 22/130 HTTP parity and compiled protection 283/account 15/security 12 pass. Demo/auth captures cover all four states with delayed V2 hydration. Version preview: https://40f2c0dc-tenboards-preview.mohanadgh.workers.dev (ASSETS only, no secrets). Hosted TLS/pooling/cache/proxy acceptance remains task 004.

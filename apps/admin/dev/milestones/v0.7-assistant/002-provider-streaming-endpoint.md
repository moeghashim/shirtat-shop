---
id: "002"
title: Add guarded provider streaming on Node and Workers
milestone: v0.7-assistant
status: review
category: security
files: ["src/routes/api/assistant.ts", "src/server/assistant/", "src/server/runtime.server.ts", "src/lib/assistant/", "src/routes/(main)/dashboard/assistant/", "scripts/", "package.json", "package-lock.json", ".env.example", "docs/assistant.md", "docs/deploy.md", "README.md", "dev/milestones.json"]
---

## Goal and scope

Implement the [milestone configuration/security matrix](README.md) with one POST streaming route for recorded replies and five provider adapters. Preserve existing data/auth selection and request lifetimes. This layer includes safe config metadata, a minimal usable configured-provider control and actual stream integration; 003 completes picker/conversation polish and integrated acceptance. No paid call, production provisioning, new auth flow or new infrastructure service.

## Files and ownership

- `src/server/assistant/`: pure validated config/public DTO, provider factories, prompt, admission/limiter, bounded streaming and sanitized errors. `src/routes/api/assistant.ts`: thin Start POST handler using global runtime middleware. Public config uses a separately guarded server function; no raw environment serialization.
- `runtime.server.ts`: narrowly extend runtime environment types for AI keys/models/origin, retaining Worker binding precedence, no process-env merging and per-request resources. Resolve credentials once inside the request; never hold another request's instance or database client.
- Reuse `auth_rate_limit` via Assistant-owned SQL with namespaced keys. No conversation table or new migration is planned; do not use Better Auth internals or change its limiter rules/schema. If reuse cannot meet atomicity/cleanup isolation, stop for review before changing storage.
- `scripts/preview-policy.ts`, existing build/deploy preparation scripts and tests: explicitly reject AI env contamination, preserve ASSETS-only preview, allow documented adopter-owned secrets without exposing them. Update env example and adopter documentation with placeholders, never values.
- Package/lockfile: the six exact AI SDK pins in the milestone README only; no additional provider-native SDK, Gateway, React chat SDK or OpenUI server package.

## Before implementation

Inspect 001's decoder/spec seam and current official TanStack server-route/AI SDK docs. Factor a pure provider registry/config validator and an atomic admission function if this makes mocking and bounds review local. Reuse `requireSession` and origin policy semantics; do not rewrite auth. Validate the pinned SDK exports and stream cancellation behavior under Nitro/workerd before broad integration. Any UI wiring uses Impeccable context/craft floor and Operate mode.

## Acceptance criteria

- [x] POST `/api/assistant` runs through Start's runtime middleware on Node and compiled workerd, returns a Web streaming Response with the shared envelope, and routes zero-key requests to recorded fixtures. Registered providers never silently fall back to recorded or another provider on failure.
- [x] Only nonblank configured keys enable providers, in Anthropic/OpenAI/xAI/Meta/Google order; model-only config enables none. Server config honors all documented overrides and exact defaults. Browser DTO exposes names/IDs/models only; arbitrary provider/model/baseURL/header/key inputs are rejected. Invalid overrides produce explicit safe configuration errors.
- [x] AI SDK factories receive explicit keys from `runtimeEnvironment`; use explicit direct model objects and endpoints. Meta uses `https://api.meta.ai/v1` Chat Completions with `muse-spark-1.3` by default, correct instruction role and its own key. OpenAI/xAI Responses storage is disabled; no provider tools, grounding, search, conversation handles or reasoning data reach the renderer.
- [x] System instructions are generated from 001's registry spec, with tools/bindings/functions/actions/inline/edit capabilities excluded and deterministic examples. Accept only bounded user/assistant messages, never client system/developer/tool roles; forward no DB, profile, Chat or session data.
- [x] Independently enforce `requireSession` at config and POST boundaries. Auth-on missing/expired/revoked session fails before upstream dispatch. Correctly map rejection to safe 401/503; do not return a login HTML page as a stream. Preserve app-route login redirects and existing auth-off behavior.
- [x] Exact canonical Origin/method/content-type policy from README holds in recorded and live modes. Hosted live auth-off requires valid `ASSISTANT_ORIGIN`; auth-on agrees with BETTER_AUTH_URL. Missing/null/cross-origin/forwarded-origin spoofing fails, no permissive CORS. Responses are private/no-store/nosniff; errors never expose provider bodies or credentials.
- [x] Implement the specified per-user/IP 60-second limits: DB atomic conditional upsert, safe namespacing/hash/expiration and cleanup restricted to Assistant keys; no DB-failure fallback. Auth-off/no-DB uses bounded TTL memory with documented process/isolate scope. 429 carries Retry-After; spoofed/missing IP and concurrent admission/restart behavior are tested.
- [x] Enforce 64 KiB bounded body reading, 20 history messages, 8 KiB user/32 KiB assistant message limits, bounded system spec, 64 KiB visible output, 4,096 output tokens and 10/20/15/60-second input/first-content/idle/total deadlines. Validate fragmented/missing Content-Length and upstream endless/oversized streams. SDK retries disabled; no tool loops.
- [x] Stop, disconnect, timeout, size overflow and unmount cancel upstream and release readers/timers. Apply backpressure without unbounded buffering; emit exactly one terminal event. Safe errors before and after headers are distinguishable; truncated output is never marked complete. Consume no request-scoped DB resource after response return/cleanup.
- [x] Mock actual wire streams for all five adapters on Node and workerd: Anthropic event SSE, Responses text/finish/errors, Meta chat deltas/[DONE], Gemini streaming parts, empty/refusal/malformed/429/5xx/timeout/disconnect cases. Assert no real provider egress, no debug/telemetry sinks and no prompt/key leakage with synthetic sentinels.
- [x] Preview policy rejects all five new keys, model overrides and ASSISTANT_ORIGIN in caller env; clean build still strips secrets and remote/generated config remains ASSETS-only. Tests cover local env files and contaminated config/inventory. Adopter deploy preparation privately accepts keys per documented mode without baking them into a build or provisioning the repo live Worker.
- [x] Record exact dependency tree and real raw/gzip Worker/client bundle deltas; Node/workerd compile and startup pass within deployment limits. Browser bundles contain no adapter/credential imports; no unexpected SDK/Gateway/telemetry network call. Any compatibility or size failure remains a reported blocker.
- [x] README and initial `docs/assistant.md` document this layer's usable endpoint/config, limits and preview policy; `docs/deploy.md` and `.env.example` cover adopter setup. No transcript persistence. Version-specific preview plus alias demonstrates recorded operation only.

## Tests

Run build/check/typecheck and four-state dev default smoke, targeted Assistant stream/guard/security suites on Vite/Node and actual compiled workerd, and preview-policy/deploy-preparation contamination tests. Use two independent Worker processes against local Docker Postgres to prove shared limits and restart persistence, including auth-off DB mode; verify no-DB operation without Docker. Run existing `auth:test`, `data:parity`, `worker:test`, `worker:auth` and `worker:security` regressions relevant to the extended runtime. Verify distinct users/keys across overlapping requests, revoked sessions, DB outage/recovery, storage cleanup and no cross-request I/O. No live provider keys in CI/tests.

Capture affected Assistant/default/Chat routes light/dark × desktop/mobile; retain 001's recorded visual output. Inspect Worker build artifacts and use the isolated preview command only. Evidence identifies local emulation versus hosted limitations, original failures/retries and inherited diagnostics.

## Dependencies and handoff

Depends on merged 001; blocks 003. Handoff tested metadata and stream contracts, sanitized error taxonomy, effective model/retention choices, exact limits and mock harness. A global no-DB paid quota, extra runtime dependency, new storage or auth-policy change is not silently added; record and pause dependent work if requested. No real account access is necessary for this task; adopter entitlement checks remain adopter-owned.

Review round 2: rebased onto the refined 001 shell; provider selector integrated into the composer toolbar. Backend source remains unchanged from the prior branch head. Build/check/typecheck and four-state Assistant/default smoke rerun for this layer; final-stack backend regressions are linked from PR #70. Status remains review, pending reviewer assessment.

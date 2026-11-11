---
id: "003"
title: Complete provider picker, conversation UX and Assistant acceptance
milestone: v0.7-assistant
status: review
category: acceptance
files: ["src/routes/(main)/dashboard/assistant/", "src/lib/assistant/", "src/navigation/route-catalog.ts", "scripts/", "docs/assistant.md", "docs/deploy.md", ".env.example", "README.md", "CHANGELOG.md", "dev/milestones.json"]
---

## Goal and scope

Complete the existing 001/002 Assistant with a clear enabled-provider/model picker and robust transient conversation, then verify the entire [milestone contract](README.md). No new provider, runtime dependency, database table, generated form/action, tool, data source or auth behavior. Finish adopter docs and release-readiness evidence; Claude owns merge/release and main deployment.

## Files and ownership

- Route-local controls, transcript/controller and UI states; retain 002's guarded metadata/endpoint and 001's safe registry. Narrow shared transport types only where genuinely shared.
- Acceptance scripts exercise real UI, mocked upstream transports and compiled Worker paths. Deterministic mock fixtures/test routing must not become production endpoints or caller-selectable upstream URLs.
- `docs/assistant.md`, deploy guide/env example, README and CHANGELOG describe verified functionality and limitations. Update acceptance/status after proof, never tick future release/merge boxes prematurely.

## Before implementation

Run Impeccable context once, inspect incumbent Assistant and local Base UI wrappers, read craft floor immediately before edits, use DESIGN Operate mode. Inspect whether a small discriminated conversation-state reducer or generation-ID helper simplifies stop/regenerate/stale-chunk handling; avoid a global store or redesign of shell/Chat. Validate current provider docs against approved defaults and record drift instead of silently changing pins.

## Acceptance criteria

- [x] Zero keys presents an honest Recorded demo indicator and working examples. Each of five single-key cases shows exactly one enabled picker option and effective model; multi-key cases show only enabled entries. No empty disabled-provider menu, key input, billing UI, arbitrary model textbox or server env disclosure.
- [x] Selection is local to the current view; provider/model attribution stays attached to each response. One request at a time per view. Disable provider switching while streaming; after completion a changed selection applies only to the next explicit request. Removed config/invalid credentials produce a useful safe error and refresh metadata, without silently calling another provider.
- [x] Send validates locally and server-side; Enter sends, Shift+Enter adds a newline, IME composition never submits. Stop aborts the active generation and marks partial content. Regenerate replaces only the latest assistant attempt using its preceding user/history context and selected provider, excludes stopped partial output from replay, and is subject to the same limits. No automatic retry.
- [x] New conversation, unmount and session loss cancel streams and clear in-memory history. Generation IDs prevent late chunks/errors from overwriting a newer request. No transcript stored in browser storage, cookies, URL, database or provider conversation state. Reload starts empty; users are told this plainly.
- [x] Bound request history by dropping oldest complete user/assistant pairs with a visible context-limit notice; do not silently truncate language or split a turn. If the latest necessary turn alone exceeds the request/message cap, explain the limit and offer New conversation rather than sending invalid partial history. Completed oversized-to-replay output can remain visible locally within the renderer cap.
- [x] Empty/loading/streaming/completed/stopped/refused/invalid-output/auth-expired/config/provider/rate-limit states have concise next steps. Honor Retry-After without retry loops; preserve editable user input for safe manual retry. Error messages never include raw API responses, prompt content or keys. No false “live” attribution for recorded examples.
- [x] Keyboard-only send/stop/regenerate/picker/clear works with visible focus and accessible names; focus returns sensibly, streaming announcements are polite and bounded rather than per-token. Scroll respects users reading older output; follow new content only when appropriate. Mobile composer remains reachable with the keyboard, tables scroll locally, charts have readable data alternatives, reduced motion is respected.
- [x] All configuration rows and provider protocols from the milestone pass on Node and compiled workerd with synthetic keys/mock streams only. Test no-env, forced demo, DB/auth-off, DB/auth-on, invalid auth configuration, missing/revoked sessions and configured provider failure; no silent fallback or real egress.
- [x] Integrated adversarial suite proves independent evaluated-prop validation, registry/feature allowlisting, malformed/split/deep/oversized output handling, prompt injection/role spoofing, URL/HTML/script/iframe rejection, all caps/deadlines/limits and abort cleanup. No safe-looking intermediate chunk can trigger forbidden behavior. Complete every milestone security checkbox with linked evidence.
- [x] Browser/HTML/loader/bundle/error/log sentinel scan finds no keys/prompts/authorization headers. No provider SDK reaches browser, no OpenUI telemetry/Gateway/devtools capture is active, and application records/Chat history never enter requests. Provider storage settings are asserted in mock request bodies; docs accurately distinguish app non-persistence from provider retention.
- [x] Before/after Assistant and affected navigation captures pass light/dark × desktop/mobile; final Assistant/Chat/default captures cover all four presets. Direct load/refresh and delayed hydration pass; no new console/page errors or screen regressions. Existing auth/system routes retain their exceptions. Contrast evidence is required if a token/preset change is proposed; none is planned.
- [x] `docs/assistant.md` covers zero-config, all five env keys/model overrides, canonical Origin, Node/workerd deployment, supported component vocabulary, limits, Stop/Regenerate, no persistence, prompt-injection boundary, provider access/retention and troubleshooting. Meta default/base URL/Chat Completions and current geography caveat are explicit. README/CHANGELOG/deploy guide/env example match verified behavior; live demo remains recorded and adopters supply keys.
- [x] Build/check/typecheck/default smoke, focused suites and auth/data/Worker regressions pass; inherited warnings and hosted-unverified limitations are reported separately. Isolated immutable preview and alias work recorded-only; screenshot/log evidence stays on pr-assets/attachments. Registry records review-ready status, not merge/release before Claude completes them.

## Tests

Run the full Assistant mode/security/stream/interaction suite with local upstream mocks on Node and workerd; synthetic secret inputs are redacted from evidence. Repeat 002's existing auth/data/Worker regression commands on the integrated result. Run `npm run screenshots` for affected routes and presets, inspect every state, and exercise keyboard, reduced-motion, long text, overflow, direct/refresh, delayed chunks, cancel/restart races and auth expiration. Verify default and both standalone/embedded Chat regressions. Provider account entitlement and hosted Neon/proxy behavior are not established by mocks/local workerd; document that boundary without blocking the zero-config template release on real keys.

## Dependencies and handoff

Depends on merged 001 and 002. Hand off all security/DoD evidence, package-size report, documentation and open questions to Claude Opus 5.5 for review, squash merge and release. Do not merge, bump/tag/release or run production deploy. Missing acceptance evidence remains unchecked and logged; stop at the completed implementation PR.

## Verification status — 2026-10-24

Implemented and verified in [PR #72](https://github.com/moeghashim/tenboards/pull/72), stacked above #70 and #68; merge/release remain reviewer-owned. [Evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v0.7/003) includes the floor, auth/data/Worker suites, real compiled provider/deadline/quota tests, Node/workerd mode matrix, adversarial registry checks, four-mode lifecycle/context captures and all four preset direct/refresh captures. Synthetic keys and mock streams only; no hosted provider or Neon/Hyperdrive acceptance is claimed. Current immutable recorded-only preview and reusable pr-72 alias are linked in PR #72. Final review corrections distinguish service outages from configuration errors, preserve safe allowlisted error copy and focus sign-in after session loss.

Review round 2 UI verification: consolidated 1–8-row composer and toolbar, icon send/stop, conversation bubbles, framed generated components, accessible reply actions, full-height scrolling and jump-to-latest are implemented. Four-state UI/context/lifecycle/recorded checks, build/check/typecheck/default smoke, 12 Node/Worker modes, provider-wire/deadline/quota checks, Node auth (12 suites/435 scenarios), Worker auth/security/runtime and 22-read/104-scenario parity pass. Independent Impeccable assessments found and prompted accessible-name and heading fixes. Screenshot/log evidence and the critique summary are published with #72; tasks remain in review, with no reviewer verdict claimed.

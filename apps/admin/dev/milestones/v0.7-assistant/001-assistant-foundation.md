---
id: "001"
title: Build the Assistant shell, safe OpenUI registry and recorded streams
milestone: v0.7-assistant
status: review
category: ui
files: ["src/routes/(main)/dashboard/assistant/", "src/routes/(main)/dashboard/-components/sidebar/nav-main.tsx", "src/navigation/", "src/lib/assistant/", "scripts/", "package.json", "package-lock.json", "README.md", "dev/milestones.json"]
---

## Goal and scope

Deliver a usable zero-config `/dashboard/assistant` without changing person-to-person Chat. Follow the [milestone contract](README.md), PLAN's three v0.7 decisions and DESIGN Operate mode. Install only approved `@openuidev/react-lang@1.0.1` and `@openuidev/lang-core@1.0.1`; retain existing React/Zod versions. No provider access, persistence, forms, tools or public generation endpoint in this layer.

## Files and ownership

- `assistant/route.tsx` and `assistant/-components/`: page, composer/transcript, typed read-only registry, guarded renderer and recorded reply fixtures. Keep presentation colocated; introduce `src/lib/assistant/` only for pure schemas/spec/transport types genuinely shared with server work in 002.
- Sidebar metadata plus `nav-main.tsx` primary IDs: Assistant directly after Chat. `route-catalog.ts`: command-palette/header/capture discovery. Generate routes with existing tooling; never hand-edit routeTree.
- Existing UI wrappers and dashboard/chart helpers: inspect and compose, never alter protected components. Scripts own focused renderer/stream/registry checks and deterministic visual fixtures, excluded from production entrypoints.
- Package/lockfile, README/status: exact dependency graph and truthful recorded-only feature status. No PLAN changes.

## Before implementation

Run the global Impeccable context command once from repo root; inspect Chat and dashboard render/components, then read its `reference/craft-floor.md` immediately before UI edits. Read current official TanStack routing documentation. Consider separating schemas and a serializable library spec from React bindings, plus a single stream-consumer helper; make these only if they reduce duplication for 002. Do not refactor Chat or auth. Disable OpenUI install telemetry before dependency installation; inspect pinned exports and transitive peers.

## Acceptance criteria

- [x] `/dashboard/assistant` renders in the current shell, inherits `requireAppRoute` protection/session refresh, and sits immediately after Chat in desktop, collapsed-icon and mobile nav. Palette/header/capture registry agree; existing standalone and embedded Chat are unchanged.
- [x] Exact OpenUI pins and lockfile are committed; existing React/Zod peers resolve, no react-ui/headless/CLI/server/Gateway/native SDK dependency is added. Record dependency tree and before/after client/Worker build sizes; unused devtools/observability are not activated. No telemetry or external network request in recorded mode.
- [x] Registry contains bounded root/stack, escaped text, cards, stats, badges, lists, tables and simple bar/line charts composed from existing wrappers/theme. Strict Zod schemas enforce finite data, text/array limits and application-owned enums; chart alternatives and reduced-motion behavior match DESIGN.
- [x] Registered names/prop schemas produce one serializable spec and library prompt, with drift detection; server-use imports exclude React/render components. Match the pinned package's real API rather than copying a newer docs example blindly.
- [x] Every node's evaluated props are independently validated before rendering; enforce milestone depth/node/row/point limits, reject unknown names and unsupported expressions/actions/Query/Mutation. No DOM spreading, raw HTML, iframe, script, dynamic evaluation, arbitrary CSS, URL/link prop or generated form. The safety boundary holds for intermediate as well as final output.
- [x] Recorded samples cover every allowed component using synthetic illustrative data and the versioned text-delta/finish/error envelope. Select an example or submit a prompt to receive an explicitly labeled recorded reply; unmatched input gets an honest recorded fallback, never pretends to call a model. Same incremental decoder/renderer source seam will accept 002 streams.
- [x] Provide a minimal working composer and transient transcript with visible empty/loading/completed/incomplete/error states; recorded generation is cancellable and cleans up on unmount. No storage, cookie or URL transcript. SSR/client initial state agrees; browser APIs stay in effects/guarded code, no `use client` directive.
- [x] Incremental split tokens/UTF-8, malformed/unknown/deep/oversized output and error-boundary recovery tests pass without exposing unsafe partial content or crashing the page. Error messages contain no raw payloads. Parser/schema tests are behavior-focused, not snapshots of implementation internals.
- [x] Keyboard names/focus, Enter versus Shift+Enter/IME, mobile composer and local table scrolling, token pairs and reduced motion pass. Capture/inspect before/after Assistant shell context plus unchanged Chat/default in light/dark × desktop/mobile; no hydration/console errors.
- [x] README explains this layer's recorded-only availability, and status reflects verified work only. Version preview is ASSETS-only `tenboards-preview`; no real credentials or provider calls.

## Tests

Run build/check/typecheck, dev default smoke and `npm run screenshots` for Assistant, Chat and default in four states; inspect renders. New route's before evidence is the existing shell/404 and Chat reference, labeled honestly. Run registry/spec-drift, malicious-output, chunk-boundary/UTF-8, cancellation and zero-provider-egress checks. Test auth-on route redirect/session refresh using existing local auth harness without changing auth behavior. Inspect bundles with sentinels where applicable. Keep captures/logs on pr-assets, not main; record inherited warnings separately.

## Dependencies and handoff

Depends on planning approval, merged planning PR and the v0.6.1 legacy-removal implementation mandated by main's f45e813 decision. cad4896 remains the inspection baseline; reinspect current routes/guards before starting and preserve Auth V2 as canonical. Blocks 002, then 003. Handoff the registry/spec, stream envelope, fixtures and cancellation seam. The temporary recorded source is client-local; 002 supplies a guarded POST for both sources. Additional runtime packages, inability to enforce renderer limits or required shared-component edits must be escalated; do not weaken safety to make the renderer work.

Review round 2 UI verification (2026-10-24): build/check/typecheck, four-state Assistant/default smoke, recorded browser interactions and bounded renderer tests pass. Shell/registry refinement is ready for reviewer assessment; status remains review. Evidence is published with PR #68.

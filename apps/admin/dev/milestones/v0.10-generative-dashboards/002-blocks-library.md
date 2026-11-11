# 002 — Blocks as the OpenUI library

Status: merged (#85). Branch: `feat/v0.10/002-blocks-library`. Depends on 001 approval.

## Scope

- Register tenboards public blocks as OpenUI components with Zod prop schemas: `DashboardCard`, `StatCard`, `DashboardChart` (line, bar, area; series labels and accessible data table), `DataTable` (read-only), `PageHeader`/section heading, a dashboard grid layout. Reuse `@/components/blocks`; no look-alike re-implementations.
- Components accept either literal data (as today) or a named data reference that 003 resolves; keep the reference shape from the spike.
- Keep every v0.7 safety property: literal-language gate, Zod validation, render limits (raise only with reviewer approval, documented), no HTML/links/styles/forms/actions.
- Existing Assistant replies keep working; update the library instructions within the 32 KiB cap.

## Acceptance criteria

- [x] Recorded examples render each new block correctly in light/dark × desktop/mobile; `verify:page -- /dashboard/assistant` passes with zero axe/console/hydration errors.
- [x] Invalid props, unknown components and over-limit specs are rejected with tests.
- [x] `check:design` passes with no new exceptions; build, check, typecheck pass.
- [x] docs/assistant.md, README, CHANGELOG draft, milestone status updated; preview linked in PR.

## Spike clarifications (accepted by reviewer and user 2026-11-06)

- Keep OpenUI core/react-lang at 1.0.1. Register strict wrappers, not native block prop spreads; build TanStack table instances and chart marks inside adapters. Retain Stack root, adding DashboardGrid and stable-ID Panel children.
- Use the spike's version-1 literal/data-ref discriminated union and server result map. References are inert; never enable native Query/Mutation, bindings or renderer fetching. Extract a validated tree/serializer seam without weakening the current literal gate or work limit.
- Preserve existing limits; additionally cap eight panels and four distinct references. Test duplicate IDs, unknown reference combinations, incompatible result kinds, partial/unreachable statements and immutable old replies. Keep PageHeader heading hierarchy valid within the Assistant page.

Additional acceptance:

- [x] Versioned ref/result schemas, panel identity and literal compatibility have focused tests; refresh changes data without parser-side network access.

## Implementation evidence

Shared contract: `src/lib/assistant/data-contract.ts`. Language tree/serializer: `src/lib/assistant/language.ts`. Snapshot-only renderer provider: route-local `registry.tsx`. No tool registry, transport, resolver or canvas implementation is included.

Verified: build, check/design (no exceptions), typecheck, assistant:test (including block contracts and fan-out), assistant:server (45 adapter cases), assistant:conversation, assistant:ui, four-state block rendering/axe, snapshot refresh with stable panel DOM, and verify:page. Dev `/` → `/dashboard/home` smoke passed. The older assistant:browser harness times out looking for its sample-launch suggestion; its run is not claimed as passing. The focused block suite and current assistant:ui interaction suite pass.

PR: https://github.com/moeghashim/tenboards/pull/85. Demo-only alias: https://pr-85-tenboards-preview.mohanadgh.workers.dev. Version URL and pr-assets evidence are linked in the PR.

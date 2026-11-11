# v0.10 — Generative dashboards in the AI Assistant

Status: **done — merged as #84, #85, #86 and #87 and released as [v0.10.0](https://github.com/moeghashim/tenboards/releases/tag/v0.10.0)**. Contract: PLAN.md Decisions log, “v0.10 generative dashboards” and “v0.10 data tools” (2026-11-06).

Goal: a user asks the AI Assistant for a dashboard and gets one built from tenboards' own blocks, filled with real data from the app's typed reads, that can be refreshed and edited one panel at a time. It complements the ten coded dashboards; it does not replace them.

| Task | Depends on | Contract |
| --- | --- | --- |
| 001 — OpenUI dashboards spike (gate) | main | [001](001-spike.md) |
| 002 — Blocks as the OpenUI library | 001 approved | [002](002-blocks-library.md) |
| 003 — Read-only data tools | 001 approved | [003](003-data-tools.md) |
| 004 — Dashboard canvas, refresh and targeted edits | 002, 003 | [004](004-dashboard-canvas.md) |

Branches: `feat/v0.10/NNN-slug`, one PR per task to main. 002 and 003 may run in parallel after the 001 spike is approved by the reviewer and the user.

## Principles

- **On-system by construction:** generated dashboards can only use registered tenboards blocks, so they match the design system in light and dark.
- **Same access rules:** tools are thin wrappers over existing guarded reads; a user sees only what the app would show them.
- **Zero-config demo stays:** no keys means recorded dashboards that call the real tools against demo fixtures.
- **Untrusted output:** the existing literal-language gate, Zod validation and render limits apply to every generated dashboard and every edit.

## Out of scope

Writes, mutations or actions; browsing, MCP, RAG or uploads; a calculated-field/code interpreter; saving, sharing or scheduling generated dashboards (a later milestone, see Open questions); the managed OpenUI Dashboards product, Gateway, Autofix, hosted observability and `@openuidev/react-ui`; changes to the ten coded dashboards; new runtime dependencies unless the 001 spike recommends one and the reviewer approves it.

## Open questions (for after v0.10)

- Persistence: should users be able to save a generated dashboard (DB table) or “promote” it into a real route via `npm run new:dashboard`?
- Calculated fields: is a sandboxed expression language worth its security surface?

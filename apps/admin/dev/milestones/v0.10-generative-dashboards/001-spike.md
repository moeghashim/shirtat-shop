# 001 — OpenUI dashboards spike (gate)

Status: merged (#84); GO approved by reviewer and user 2026-11-06. Branch: `feat/v0.10/001-spike`. Output: documentation only; no product code merged.

Answer these with evidence (links, versions, minimal throwaway experiments kept out of the PR) in `dev/milestones/v0.10-generative-dashboards/spike.md`:

1. **Packages and versions:** what the open-source `@openuidev/lang-core` / `react-lang` support today for data-bound components, tool/query binding, streaming partial layouts and incremental edits. Is an upgrade from 1.0.1 needed? Changelog risks, breaking changes, license (must be MIT/compatible).
2. **Managed vs open:** which OpenUI Dashboards features (refresh without regeneration, targeted edits, validation/repair) exist in open-source packages, and which require the managed service or Gateway. The `assistant-ui-dashboards` example: license, dependencies, whether it calls hosted services. Do not adopt anything managed.
3. **Tool calling path:** how the existing AI SDK (`ai` 7.x + `@ai-sdk/*`) tool calling fits the current `/api/assistant` SSE envelope across all five providers, including recorded mode. Whether tool calls should be resolved server-side before streaming OpenUI, or OpenUI should reference named queries the server executes at render/refresh time. Recommend one design.
4. **Refresh and edits:** how “refresh without regenerating” and “edit one panel” map onto OpenUI Lang (stable node IDs, query references, patch format).
5. **Security review:** prompt injection through tool results, tool-call limits, cost/deadline impact, what the gate must reject.
6. **Recommendation:** go/no-go, the concrete design for 002–004, any dependency changes with exact pins, and revised acceptance criteria if needed.

## Acceptance criteria

- [x] `spike.md` answers 1–6 with sources and exact versions checked on the date of writing.
- [x] No managed/hosted OpenUI dependency proposed; any new dependency justified with license and size.
- [x] Clear go/no-go; reviewer and user approve before 002/003 start.

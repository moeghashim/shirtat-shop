# 001 — OpenUI dashboards decision spike

Date checked: **2026-11-06**. tenboards baseline: `4c68804a2b84341f226187de541f48099e0cac25`.
Recommendation: **GO for a bounded, tenboards-owned implementation; approved by reviewer and user 2026-11-06.**
No managed Dashboards, Gateway, Autofix, hosted observability, `react-ui`, interpreter, MCP, persistence or new runtime dependency. Keep both OpenUI packages at **1.0.1**. Reviewer and user must approve this spike and the proposed 002–004 clarifications before implementation starts.

## 1. Packages, versions and evidence

Registry metadata was fetched directly from npm today; upstream source was inspected in a disposable checkout outside this repository at **`fe5c9c383a05920f0cce9738ef593b49f2002540`**. Links below pin source observations to that revision. The worktree initially had no node_modules; `npm ci --ignore-scripts` installed the unchanged lockfile for inspection/checks, without running dependency install hooks. No real provider credentials were used.

| Package | Installed/locked | npm latest observed |
| --- | --- | --- |
| `@openuidev/lang-core` | 1.0.1 | 1.1.0 |
| `@openuidev/react-lang` | 1.0.1 | 1.1.0 |
| `ai` | 7.0.152 | 7.0.164 |
| `@ai-sdk/anthropic` | 4.0.87 | 4.0.98 |
| `@ai-sdk/openai` | 4.0.101 | 4.0.110 |
| `@ai-sdk/xai` | 5.0.29 | 5.0.39 |
| `@ai-sdk/openai-compatible` | 3.0.77 | 3.0.86 |
| `@ai-sdk/google` | 4.0.104 | 4.0.113 |

Metadata sources: [lang-core](https://registry.npmjs.org/@openuidev/lang-core), [react-lang](https://registry.npmjs.org/@openuidev/react-lang), [ai](https://registry.npmjs.org/ai), [Anthropic](https://registry.npmjs.org/@ai-sdk/anthropic), [OpenAI](https://registry.npmjs.org/@ai-sdk/openai), [xAI](https://registry.npmjs.org/@ai-sdk/xai), [compatible](https://registry.npmjs.org/@ai-sdk/openai-compatible), [Google](https://registry.npmjs.org/@ai-sdk/google). Tags are observations, not upgrade instructions.

Other locked transitive packages: `@ai-sdk/provider@4.0.33`, `provider-utils@5.0.67`, `gateway@4.0.125`; `@openuidev/devtools@0.3.0`, `observability@0.0.4`. The AI SDK's transitive gateway package is not OpenUI Gateway and is not used: retain explicit direct provider factories. Keep existing devtools auto-mount suppression and `publishObservability={false}`.

Additional OpenUI metadata inspected (not proposed dependencies): `devtools@0.3.1`, `observability@0.0.4`, `react-ui@0.18.5`, `dashboard-library@0.0.2`, `server@0.4.0`. Registry endpoints follow the same `https://registry.npmjs.org/@openuidev/<name>` convention. Latest core/react-lang metadata declares MIT, unpacked sizes **1,469,276 / 699,548 bytes** respectively, Zod 3.25/4 peers and optional MCP peer; react-lang also has React/React DOM and optional React Native peers. These are archive sizes, not client bundle sizes. No new dependency means zero dependency-size delta in this PR.

The [core changelog](https://github.com/thesysdev/openui/blob/fe5c9c383a05920f0cce9738ef593b49f2002540/packages/lang-core/CHANGELOG.md) and [React changelog](https://github.com/thesysdev/openui/blob/fe5c9c383a05920f0cce9738ef593b49f2002540/packages/react-lang/CHANGELOG.md) distinguish the available primitives:

- 1.0.1 already exposes streaming parsing, named statements, `mergeStatements`, and a query manager. Query/Mutation and binding support are broader than tenboards permits; prompt options do not disable runtime syntax.
- 1.0.2 adjusts telemetry configuration and React devtools/native behavior. 1.1.0 adds dependent-query evaluation/cycle handling and changes the QueryManager interface. It changes array math semantics, parse-result immutability expectations and streaming memoization; its multiline merge fix is relevant if adopting raw statement patches. These are migration risks even though the version increment is minor.
- A root emitted late delays a partial layout. tenboards deliberately renders only whole validated statements, not arbitrary parser recovery. Keep that property.

A keyless local probe of installed 1.0.1 confirmed `createQueryManager`, `createStreamingParser`, and `mergeStatements` are functions; merging `p = Text("new")` into a two-statement program replaced `p` and preserved `root`. This proves a syntactic merge primitive, not secure panel identity. `npm run assistant:test` passed 1,047 assertions plus six reference fan-out attacks. No experimental files are committed.

**Upgrade not needed:** the recommended design uses literal reference objects, application state and atomic validated panel replacement. It needs neither native Query dependency graphs nor raw multiline merges. Defer a paired core/React upgrade to a separately justified change, with prompt/parser/renderer and telemetry regressions together.

## 2. Managed versus open

The [Dashboards page](https://www.openui.com/dashboards) advertises live data, refresh, local edits and repair. It does not establish that the installed renderer provides a complete dashboard backend. The open packages provide parsing, component registration, query scheduling and statement merging; the host still supplies tools, authentication, data lifetime, edit policy and validation. Refresh can be implemented without a hosted service. Automatic model repair and persisted artifacts are not required to do so.

The inspected [assistant-ui-dashboards example](https://github.com/thesysdev/openui/tree/fe5c9c383a05920f0cce9738ef593b49f2002540/examples/miscellaneous/assistant-ui-dashboards) is under `examples/miscellaneous`, not directly under examples. Its [manifest](https://github.com/thesysdev/openui/blob/fe5c9c383a05920f0cce9738ef593b49f2002540/examples/miscellaneous/assistant-ui-dashboards/package.json) is version 0.1.0 and uses core/react-lang 1.1.0, dashboard-library 0.0.1, react-ui/headless 0.18.4, server 0.4.0, CLI 0.6.1, ai ^7.0.162 and OpenAI adapter ^4.0.108, plus assistant-ui, Next 16.2.6, React 19.2.4, MCP and Zustand. These are manifest requirements, not our installed versions.

Its [chat route](https://github.com/thesysdev/openui/blob/fe5c9c383a05920f0cce9738ef593b49f2002540/examples/miscellaneous/assistant-ui-dashboards/src/app/api/chat/route.ts) uses Gateway; [server setup](https://github.com/thesysdev/openui/blob/fe5c9c383a05920f0cce9738ef593b49f2002540/examples/miscellaneous/assistant-ui-dashboards/src/lib/openui.ts) defaults to `api.thesys.dev`. It creates remote artifacts, renders through react-ui/cloud, and routes queries through an interpreter, including MCP sources and generated scripts. Its browser thread storage also conflicts with mounted-view-only state. Do not copy its architecture or dependencies.

The repository [MIT license](https://github.com/thesysdev/openui/blob/fe5c9c383a05920f0cce9738ef593b49f2002540/LICENSE) covers the example (no separate example license found). MIT source permission does not make hosted services self-contained or confer service access. Preserve notices if code is ever reused; this spike copies no example implementation.

## 3. Tool architecture and provider transport

**Resolve native model tool calls server-side before the final OpenUI stream; retain named references for explicit refresh.** Never execute native OpenUI Query at render time. This separates fetching from render, avoids repeated effects during partial parses and preserves request-scoped Worker resources.

Local evidence: `providers.server.ts` currently calls `streamText` without tools; `stream.ts` rejects every `tool-*` event. `endpoint.server.ts` forbids DB work after returning the Response because `withRuntimeRequest` runs cleanup on return. The typed reads are not session guards: each new tool must independently call `requireSession`. The current prompt explicitly forbids tools and workspace data and must be replaced for the dashboard path.

The installed AI SDK types support tools with inputSchema, toolChoice, abortSignal and bounded steps. [AI SDK tool documentation](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) describes server tool execution and model tool results. Use an explicit two-phase controller rather than forwarding `fullStream` wholesale or enabling an automatic unbounded agent loop:

1. Admit the request using existing Origin/session/body/rate checks. Begin one shared deadline/byte/token budget before model planning. Dashboard planning uses one streamed model step with allowlisted tool declarations **without automatic execute callbacks**; collect at most four complete calls. No planning text goes to the UI. Validate the entire batch before executing anything. A normal text-only answer can use the existing v1 path; explicit dashboard requests with no valid calls fail visibly rather than inventing workspace numbers.
2. Sequentially run each validated call through the guarded registry, charging admission before each invocation. Each execution returns a server-authored reference and a bounded projection. This happens inside the original request scope, before returning the Response. Use one server clock for all date projections. Provider-native tool call IDs correlate results only; they are not data authorization tokens.
3. Supply the selected adapter with the SDK-normalized assistant tool-call and tool-result messages, then stream final language with tools disabled. Only this phase's text reaches the language gate. No client may send a tool/system/developer role. Unexpected final-phase calls fail closed. Do not auto-repair, retry or substitute providers.
4. Preserve v1 for legacy replies. Dashboard transport v2 adds one server-authored `data` event before text-delta events, containing the capped successful reference/result map; finish/error remain terminal. Validate this DTO client-side independently. Renderer adapters read the map, never fetch. Final references must match successful calls exactly, including parameter combinations and result kinds. A data event alone does not reset the first-visible-content deadline.

| Provider | Existing factory/protocol retained | Required synthetic wire test in 003 |
| --- | --- | --- |
| Anthropic | createAnthropic, Messages | streamed tool_use JSON fragments → correlated tool_result → final text |
| OpenAI | createOpenAI.responses, store:false | function-call argument deltas → function_call_output → final text |
| xAI | createXai.responses, store:false | same Responses lifecycle, tested independently |
| Meta | createOpenAICompatible.chatModel, api.meta.ai/v1 | indexed tool_calls/function arguments → role:tool result; system-to-developer mapping preserved |
| Google | createGoogleGenerativeAI, generateContent | functionCall → functionResponse → final text |

The SDK normalizes these formats; mocks must exercise each installed adapter, not just a shared fake SDK object. They must cover multiple calls, fragmented arguments, unknown tools, malformed JSON, abort and refused/unsupported tools. No real account or model entitlement was tested. If a configured model lacks tool support, report provider failure without switching models.

Recorded dashboards supply a deterministic batch/spec instead of the two model phases; use the same registry, validation, admission, clock, transport and projections. In the zero-config demo and ASSETS-only preview the normal selector chooses fixtures. **Recorded means no model, not bypass the data-source selector:** an adopter's configured DB still uses DB reads and errors visibly. This clarification avoids an accidental demo fallback and is proposed explicitly in 003.

### Reference and result contract

A literal block data prop is a strict discriminated union: `{kind:"literal", value: ...}` or the following **proposed** reference (not native OpenUI syntax):

```json
{"kind":"data-ref","version":1,"tool":"dashboard_read","args":{"domain":"default","metric":"performance","range":"available","segment":"all","limit":50}}
```

`dashboard_read` dispatches to `readDefault`, `readAnalytics`, `readFinance`, `readCrm`, or `readEcommerce`. Inputs are a Zod discriminated union per domain/metric, not the Cartesian product of independently allowed strings. Initially expose one audited series per domain: Default performance, Analytics traffic quality, Finance transaction overview, CRM pipeline activity, E-commerce revenue. Add KPI/table projections only with documented mappings to actual fields and tests. Never expose raw customer emails, account details or whole domain objects.

Initial range=`available`, segment=`all`; limit enum=`10|25|50`. The current core reads take a renderedAt clock and optional record id, not arbitrary reporting ranges. Never forward model identifiers, claim a 90-day filter over undated aggregates, or fabricate refund/channel metrics. Add range/segment options only where the source supports an honest projection, with demo/DB parity and explicit period labels. Unsupported requests get an explanation. Filters are application-authored controls populated from this capability catalog, not generated forms.

Initial series mappings are `default/performance` → `projection.performance`, `analytics/traffic-quality` → `current.trafficQualityQualitySeries`, `finance/transaction-overview` → `current.transactionsOverviewCardChartData`, `crm/pipeline` → `projection.pipeline`, and `ecommerce/revenue` → `revenueOverviewData`. The projection adapter supplies fixed field/series labels and units from the existing domain contracts; it exposes no arbitrary field selector. Truncation uses deterministic source ordering and reports `truncated`, never silently changes aggregation.

Canonicalize validated args in fixed key order to make an internal map key; no model-chosen lookup path. Return `{ref, kind, data, source, asOf, periodLabel, truncated}` with a discriminated `kind` of stat/series/table, bounded strings and finite numbers. Serialize plain JSON only. Projection is server code, never a generated expression. Separate definitions from snapshots; neither persists beyond the mounted view. Do not replay snapshot values in history unnecessarily. Client-supplied refs are always revalidated/re-authorized and cannot supply trusted results.

## 4. Refresh, edits and identity

Extend the strict request union deliberately: legacy conversation, dashboard create, dashboard edit, and a separate refresh body. Create/edit include a bounded operation discriminator; edit additionally includes definition, baseRevision and target. All fields count toward the existing 64 KiB body cap and unknown fields remain rejected. Explicit UI intent or a recorded prompt can select dashboard creation; this is not permission for client-supplied tool messages. A definition that cannot fit the edit request is rejected with an actionable size error, never truncated. The final data event and language both remain subject to the generation ID and terminal-event state machine.

Keep a validated application dashboard model `{version:1, revision, panels:[{id, node}], refs}` beside the OpenUI text. Panel IDs are local document identifiers (bounded ASCII, unique), not database identifiers. Server validates them; they never enter a typed read. Retain Stack as the language root and add a DashboardGrid subtree and Panel wrapper with literal ID. Existing SafeResponse serializes to one root and keys its boundary by the whole response: it cannot preserve panel identity as written. Preserve the validated structured tree/IDs and key each canvas panel independently in 004.

Refresh POSTs refs only to a dedicated guarded resolver endpoint, with the same strict Origin/content-type/body/session/rate checks. It executes the same registry in its own request scope and returns bounded JSON, no provider construction. Deduplicate equal refs within a request, share one clock, and replace snapshots atomically only if the client generation/revision still matches. Keep prior data visibly marked stale on failure; clear all data on session loss. No background polling in v0.10. A supported filter changes only validated ref args; it does not change layout.

Edits submit a validated current definition, its revision and an explicit target panel ID (or add operation); all are untrusted. A natural-language ambiguous target asks the user to choose a panel. Generate only a replacement panel subtree using the same language gate. The application constructs a patch `{version:1, baseRevision, op:"replace"|"add", targetId, panel}`; do not let the model return arbitrary JSON Patch paths. Replace preserves the existing ID; add gets an application-assigned ID and appends. Removal/reordering are deferred. No patch is applied during streaming. Validate subtree, refs and the resulting whole dashboard, then commit atomically; unaffected panel objects and snapshots keep identity. Revision mismatch, Stop or error discards the patch and preserves the previous dashboard.

This is an application patch protocol, not an upstream guaranteed edit API. Do not use raw string replacement or trust `mergeStatements` as authorization. Reuse old references without rerunning unchanged panels; newly requested references must resolve in the pre-stream phase. In stateless edit requests, old client snapshots are never sent to the model as authoritative tool results. Type-only edits need no data tool calls.

## 5. Gate and resource/security review

Small preparatory extractions are justified for 002–004, but none belongs in this documentation PR: split literal parsing/validated tree/serialization in `language.ts`; extract provider model construction; share a request budget across phases and refresh. Do not broaden the grammar to the upstream evaluator.

Keep all v0.7 limits: 64 KiB input and visible language, 20 messages, user 8 KiB / assistant replay 32 KiB, instructions 32 KiB, 200 nodes, depth 12, 50×8 table cells, 4×50 chart points and the 12,000-work guard. Add at most **8 panels**, **4 distinct refs**, **4 tool invocations per request** (duplicates still count as calls), **8 KiB per result / 24 KiB aggregate results**, **96 KiB total dashboard SSE payload** including its 64 KiB language and framing. Refresh JSON stays within 32 KiB. These are ceilings, not targets.

Model budget remains **4,096 requested output tokens aggregate**: planning at most 1,024, final at most 3,072; a no-planning edit may use 4,096. Wire cap is **2 MiB aggregate across both provider responses**, not 2 MiB per fetch. Tool args at most 2 KiB each, within the wire cap. At most two model requests, no automatic continuation. Charge the existing 10/user + 30/IP (auth), or 10/IP (open), per 60-second window for the outer request **and each tool invocation**. Denial stops remaining work; no refund. Refresh is charged the same way and cannot bypass generation limits.

Preserve **20s first visible, 15s idle, 60s total**, including planning, auth/tool reads and final stream; retain the 10s input cap. Pass the remaining budget to the final boundedStream rather than restarting timers after preflight. Tool execution has a **5s per-call ceiling**, bounded by the remaining first/total deadline. Abort must prevent later calls and late results, cancel provider fetches, and cancel/close request DB work safely before cleanup; Promise.race alone is not proof of DB cancellation. Test this on compiled workerd. Slow preflight may legitimately fail before headers. No heartbeat or tool status may extend the first-content deadline.

The gate rejects unknown/extra props, Query/Mutation, `$state`, functions/operators/actions, URLs/styles/HTML, prototype-like object keys, duplicate/cyclic/unresolved IDs, unknown references, incompatible result kinds, oversize data and unknown enum combinations. Validate unreachable statements too. Reference objects are inert literals; no network during parsing/rendering. Strict wrappers construct public blocks without DOM spreading: DataTable needs a caller-owned TanStack instance, DashboardChart needs application-owned marks/config, and PageHeader must not introduce duplicate h1 headings. Reuse blocks, motion hooks and accessible table alternatives.

Tool text is untrusted even after schema validation. Project minimally, escape labels, send results in tool messages, never append them to system instructions. Injection tests must include fake role delimiters, “ignore previous instructions”, exfiltration URLs and embedded OpenUI in labels. Do not assert that a model can never be influenced: assert it cannot exceed authorization, invoke forbidden tools, render executable content or bypass limits. Data bound by reference displays the server projection, not model-rewritten numbers. User-entered text and minimal selected projections go to the chosen provider; docs must describe this new privacy boundary. No raw tool results, prompts or errors in telemetry/logs.

## 6. Handoff, approval and remaining risks

002 owns strict serializable block/ref/Panel schemas and the validated-tree seam; 003 owns registry, projections, provider preflight, v2 DTO and refresh resolver; 004 owns mounted canvas, reference snapshots and atomic revisioned edits. Exact proposed contract additions are included in **002–004 themselves**, accepted by reviewer and user on 2026-11-06. This avoids implying that prose here silently changes an approved task.

No package.json or lockfile changes; retain all exact direct pins in section 1. No preview deployment needed for this docs-only PR. The user explicitly authorizes the spike/task-file edits, overriding the maintainer default restriction on dev/** scope; PLAN.md remains untouched. Approval is not supplied by writing this recommendation.

Remaining implementation gates: per-provider native tool mocks on Node/workerd; genuine cancellation under DB latency; fitting useful dashboards into the existing first-content budget; preserving identity through the current serializer/renderer; capability/period accuracy and demo/DB parity; prompt/spec size after blocks are registered. Existing per-isolate no-DB limiting is still not a global spend quota. No hosted provider, billing or entitlement claim is made. If these gates cannot hold, stop the affected implementation for review rather than raising budgets or introducing a hosted service.

## Verification for this documentation PR

- `npm run check`: passed; 35 inherited Biome warnings and 10 informational diagnostics, with design/skills/registry/llms checks passing. No source fixes applied.
- `npm run build` and `npm run typecheck`: passed.
- `npm run assistant:test`: passed, including reference fan-out bounds (section 1).
- Headless Chromium dev smoke: `/` then `/dashboard/home`, HTTP 200 each, zero console/page errors. No screenshot or preview deployment: no product/UI code changed.
- `git diff --check`: passed. These checks establish the existing baseline and document consistency, not implementation acceptance for future tool flows.

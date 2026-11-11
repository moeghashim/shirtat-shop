# AI Assistant

`/dashboard/assistant` is separate from person-to-person Chat. It renders bounded summaries, cards, statistics, badges, lists, tables and bar/line/area charts using the existing components. Charts include data tables. It can read five audited dashboard series through guarded tools; it cannot browse or change data. Output is untrusted: a restricted literal-language gate and independent Zod validation reject unsupported expressions, components and props before rendering. No generated HTML, script, iframe, links, styles, forms or actions are supported.

## Public blocks library (v0.10 task 002)

Send **Show sample blocks** in recorded mode for an illustrative grid containing every new wrapper. Existing launch/plan/week replies and their literal syntax remain supported. Public wrappers are `DashboardCard`, `StatCard`, `DashboardChart`, read-only `DataTable` and `PageHeader` (a section h2, preserving the page's only h1). `DashboardGrid` contains `Panel(id, [block])` children under the existing `Stack` root. Panel IDs are unique ASCII document identifiers, never database IDs. The grid collapses on mobile; charts keep labeled series, a data table and reduced-motion support.

The shared contract for task 003 is **`src/lib/assistant/data-contract.ts`**. It exports `dashboardReadArgsSchema`, `dataRefSchema`, `blockDataSchema`, stat/series/table data schemas, `dataResultSchema`, `dataResultMapSchema`, their types, and `dataRefKey`. Data props are strict `{kind:"literal",value:...}` or `{kind:"data-ref",version:1,tool:"dashboard_read",args:...}` objects. Domain/metric pairs are default/performance, analytics/traffic-quality, finance/transaction-overview, crm/pipeline and ecommerce/revenue; range is `available`, segment is `all`, and limit is 10, 25 or 50. Initial refs yield series only, so stat/table reference use fails closed until an audited capability is added.

Results are `{ref,kind,data,source,asOf,periodLabel,truncated}` with `kind` stat/series/table, source demo/db, ISO datetime `asOf`, and fixed-order canonical keys from `dataRefKey`. Stat data contains label/value/detail; series data contains labels and labeled finite value arrays; table data contains columns and matching rows. Limits are eight panels, four distinct references, 8 KiB per result and 24 KiB per result map, in addition to all existing language limits and the 12,000-work guard.

`inspectLanguage` exposes the validated `tree`; `validateTree` and `serializeTree` provide the application seam for task 004 without exposing the OpenUI evaluator. Supplying a result map requires every referenced result to exist and match its block kind. `AssistantDataProvider` accepts validated host snapshots; changing them updates chart data without parsing or network I/O. A missing snapshot renders an explicit unavailable state. This layer does not fetch: native Query/Mutation, bindings, functions and actions remain disabled. Task 003 supplies server tools, v2 transport and the refresh resolver; the mounted canvas supplies refresh and targeted edits.

Regression coverage: `npm run assistant:test` includes the block/ref/result/partial/unreachable/legacy gate checks. Run `node --experimental-strip-types scripts/assistant-blocks-browser-check.ts` against `ASSISTANT_TEST_URL` (default port 3170) for four-state recorded block and axe evidence under gitignored `verify/blocks`.

## Recorded and configured modes

No keys means recorded replies. Legacy examples use illustrative data; recorded dashboards use guarded fixture or DB projections. Unmatched legacy prompts receive a labelled fallback. Both use POST `/api/assistant`, with v1 for legacy replies and v2 data/text/terminal events for dashboards. The repository live demo and every `tenboards-preview` version stay recorded-only.

Adopters can set any subset of these **server-only** variables. Only a nonblank key enables a provider, in this order; model variables alone enable none. The selector shows enabled names and effective models. It sends only the provider ID; the server resolves the key and model on each request. Invalid configuration, removed/revoked keys and upstream errors fail explicitly, with no provider or recorded fallback.

| Provider | Key | Override | Default |
| --- | --- | --- | --- |
| Anthropic | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` | `claude-sonnet-5-5` |
| OpenAI | `OPENAI_API_KEY` | `OPENAI_MODEL` | `gpt-6.1-sol` |
| xAI | `XAI_API_KEY` | `XAI_MODEL` | `grok-4.7` |
| Meta | `META_API_KEY` | `META_MODEL` | `muse-spark-1.3` |
| Google | `GOOGLE_GENERATIVE_AI_API_KEY` | `GOOGLE_GENERATIVE_AI_MODEL` | `gemini-3.8-flash` |

Use private Node environment variables or adopter-owned Worker secret bindings. Worker bindings take precedence without merging process environment; Hyperdrive/DB/session resources are request scoped. Browser metadata contains names, IDs and models only. Never use `VITE_` keys, put keys in source/config vars, or supply real credentials to tests. The client has no key input. Exact SDK pins are recorded in the milestone README and lockfile.

For local Node, the actual loopback origin is accepted. Hosted live auth-off deployments require `ASSISTANT_ORIGIN=https://your-own-dashboard.example`. Auth-on uses validated `BETTER_AUTH_URL`; an additional `ASSISTANT_ORIGIN` must agree. Recorded mode without an explicit origin uses the request URL's origin. POST requires an exact non-null Origin and JSON content type; forwarded origin/host headers are ignored. These checks mitigate CSRF; open auth-off access remains open. With auth enabled, config and POST independently require a valid session. All responses are private/no-store and nosniff.

## Conversation controls

Enter sends, Shift+Enter adds a newline, and IME composition does not submit. One generation runs at a time. The provider picker is disabled while streaming; changing it afterward affects only the next explicit request. Each reply retains its original provider and effective model. Selection lasts only in the mounted view.

Stop aborts and marks the partial reply incomplete. Regenerate replaces only the latest attempt, using its original question, preceding completed exchanges and the current selection. Stopped or failed replies are excluded from future context. Nothing retries automatically. Errors preserve the editable draft without overwriting text entered while waiting. A rate-limit countdown honors Retry-After and requires an explicit Send or Regenerate afterward.

History drops the oldest complete user/reply pairs to fit message and encoded-body limits, with a visible notice; their display stays intact. It never truncates output language or splits an exchange. If the latest necessary reply alone exceeds the 32 KiB replay cap, or the latest exchange plus draft cannot fit, it stays visible and the UI asks you to shorten the draft or choose New conversation. Regenerate can replace an oversized latest reply without replaying that reply.

Provider/config failures refresh enabled metadata. A removed provider leaves an explicit selection prompt, even if no providers remain: choose Use recorded demo before sending again. A session-expired response cancels and clears history and presents a sign-in link. Focus returns to the composer after explicit actions; new content follows the bottom only while you are already there, preserving older-output reading. Streaming announcements report state changes rather than every token.

## Limits and request lifetime

| Boundary | Limit |
| --- | --- |
| Request body | 64 KiB counted while reading; 10-second input deadline |
| Messages | 20; user 8 KiB and assistant 32 KiB UTF-8 each; aggregate within body cap |
| Server instructions | 32 KiB; registry specification and deterministic examples only |
| Reply | 64 KiB visible text; 4,096 requested output tokens |
| Deadlines | 20 seconds to first visible content, 15 seconds idle, 60 seconds total |
| Render | 200 nodes, 12 levels, 50 table rows × 8 columns, 4 series × 50 points |
| Provider wire | 2 MiB cap, including metadata; bounded independently of visible output |

Only user/assistant text is accepted. Client system/developer/tool roles, arbitrary destinations, headers, models and unknown fields are rejected. Requests contain entered text and library instructions; dashboard final requests additionally contain minimal selected projections, never profile/session/Chat records or whole domain objects. SDK retries are disabled. Stop, disconnect, timeout and overflow cancel upstream. Truncated, empty, refused or invalid replies never receive a completed marker. Exactly one terminal event closes a response; safe HTTP errors before streaming are distinct from error events after headers. DB and session work finishes before the stream returns.

Admission uses fixed 60-second windows: 10 per authenticated user plus 30 per trusted IP, or 10 per IP with auth off. 429 includes Retry-After; aborts are not refunded. DB mode uses atomic conditional upserts in existing `auth_rate_limit`, hashed identifiers and `assistant:v1:` keys; cleanup touches only Assistant keys. Storage errors return 503 without memory fallback. Workers trust only `cf-connecting-ip` on their actual request path. Node ignores forwarding headers and uses one conservative unknown-IP bucket (30 across authenticated users). Fixed-window boundaries can admit twice the stated limit in a short burst; each IPv6 /128 has its own bucket.

No-DB mode uses a maximum 10,000-bucket TTL map, rejecting new buckets at capacity. Its scope is one Node process or Worker isolate and it resets on restart: **it is not a global spend quota**. Public paid deployments across isolates need adopter-owned shared ingress/provider budgets; that infrastructure is outside this template.

## Privacy and provider access

Conversation UI is mounted-view state only, cleared on navigation or reload. There is no transcript database, localStorage, cookie, URL or provider conversation ID. Send, Stop, Regenerate and New conversation use no persistent store. Session loss clears the view; navigation, page exit and unmount cancel the active generation. No prompts, keys, output, provider errors or authorization headers are logged/traced. SDK telemetry and provider-warning logging are disabled. OpenUI devtools and observability are disabled.

OpenAI and xAI explicitly use Responses with `store: false`. Meta uses `https://api.meta.ai/v1/chat/completions`, its own key and a developer instruction message. Google uses streamed generateContent, Anthropic Messages. Application storage choices do not promise zero provider retention: account terms, abuse monitoring and regional policies still apply. Check entitlement/billing and availability with your provider before enabling it; mocks prove integration, not account access.

Official model/protocol references rechecked 2026-10-24: [Anthropic catalog](https://platform.claude.com/docs/en/models/overview), [OpenAI Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [OpenAI storage](https://developers.openai.com/api/docs/guides/conversation-state), [xAI 4.7](https://docs.x.ai/developers/models/grok-4.7), [Meta catalog](https://dev.meta.ai/docs/models), [Meta protocol](https://dev.meta.ai/docs/protocols/chat-completions), [Google 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash). Meta's standard `muse-spark-1.3` is used, never its contributor variant by default. The [current supported-countries help](https://dev.meta.ai/help/accounts-and-login/supported-countries), rechecked 2026-10-24, describes availability across most regions with Meta AI and supported billing, with its Geographic Use Policy authoritative. This is neither a universal US-only restriction nor guaranteed worldwide access. The current [product page](https://dev.meta.ai/products/meta-model-api) lists standard 1.3 separately from the contributor variant. Geographic access, account entitlement and retention policies must be verified by each adopter.

## Validation and deployment

`npm run assistant:test` checks the registry/language/decoder. `npm run assistant:server` runs synthetic direct-adapter wires and pure bounds. `npm run assistant:worker` exercises the actual Node route and compiled workerd behind a test-only provider egress barrier, plus isolated local Postgres admission/auth checks. Use `TEST_PORT_OFFSET` and a dedicated test DB; no real provider call is required or permitted in these tests. Local workerd evidence is not hosted provider or Hyperdrive acceptance.

`npm run assistant:browser` targets `ASSISTANT_TEST_URL`; set `ASSISTANT_ENDPOINT_TEST=1` to space each visual mode into a fresh rate-limit window when using the real endpoint. Evidence is written to `ASSISTANT_EVIDENCE_ROOT`. The reusable preview guard rejects all key/model/origin variables, dotenv/dev-vars contamination and any remote binding except ASSETS. See [deployment](deploy.md) for private adopter setup. Contributors use only `npm run preview:deploy -- --preview-alias pr-NNN`; never deploy PR builds to the production Worker.

`npm run assistant:conversation` verifies stale-generation handling and whole-pair context bounds. `assistant:lifecycle` uses compiled workerd with synthetic upstreams for picker/history/recovery; `assistant:context` targets `ASSISTANT_TEST_URL` for controlled UI boundary and scrolling fixtures. `assistant:modes` exercises the actual Node and workerd routes in no-env, configured, forced-demo, DB-open, authenticated and invalid-auth modes. Node invalid auth is rejected at startup; workerd rejects the request. Test-only mocks and probes under scripts are never application routes or production configuration.

## Troubleshooting

- No picker: check whether any nonblank server key is configured. A model override alone does not enable a provider; OAuth Google settings are unrelated.
- Provider/configuration error: check key validity, model entitlement and canonical origin in your private server settings. Review refreshed picker choices; no alternate provider is called automatically.
- Unsupported/refused output: simplify or rephrase, then explicitly Send or Regenerate. The renderer never weakens validation to display a failed reply.
- Timeout/size limit: shorten the request; a truncated reply is incomplete. For context limits, start a new conversation.
- 429: wait for Retry-After. New conversation does not reset the server budget; public adopters need appropriate shared ingress budgets.
- Session ended/service unavailable: sign in again when prompted, or restore configured auth/DB service. The app never downgrades an auth failure to open demo access.

### Conversation controls

The bottom composer grows from one to eight rows. Enter sends; Shift+Enter inserts a newline. Its toolbar contains the enabled provider/model selector (or Recorded demo badge) and Send, which becomes Stop during a reply. Copy reply and Regenerate sit below the latest assistant turn. Scrolling up pauses following; Jump to latest returns to new output. New conversation clears the view, and its tooltip explains that leaving or reloading also clears it.

## Read-only dashboard data (v0.10 task 003)

Send **Show revenue dashboard** (or **Show dashboard**) for a recorded dashboard with real fixture values and server-authored data references. The API also accepts `operation: "dashboard"`. Ordinary illustrative replies retain v1 SSE; dashboards use v2 with one validated `data` event followed by text-delta and a terminal finish/error. Snapshots live only in the mounted conversation. They never authorize subsequent reads, and renderer components never fetch.

`dashboard_read` independently checks the session and charges admission on every invocation. Its sole schema is `src/lib/assistant/data-contract.ts`: five discriminated domain/metric pairs, `range: "available"`, `segment: "all"`, and limit 10, 25 or 50. Unsupported dates, channels, identifiers, SQL and URLs are rejected. Ordered projections expose only:

| Domain / metric | Projection |
| --- | --- |
| default / performance | New customers, active accounts, returning users; available observation dates |
| analytics / traffic-quality | Actual and baseline quality indices; fixed source dates |
| finance / transaction-overview | Expense observations only; sparse income is not replaced with invented zeroes |
| crm / pipeline | Qualified opportunities, labelled by reporting month |
| ecommerce / revenue | Revenue and profit in USD, source reporting periods |

The source selector is unchanged: no configured DB uses fixtures; configured DB uses DB and errors visibly. Recorded mode replaces only the model. Results carry source, server clock, period and explicit truncation metadata. No raw customers, email addresses, account records or entire domain objects leave the projection boundary.

Live providers perform one native planning request with no execute callback. The whole batch is validated before sequential guarded execution inside the request scope; the second request streams final language with tools disabled. Tool labels/results are untrusted tool-message data, never system instructions. Prompt injection cannot grant authorization, add tools, change schemas or bypass the literal-language gate. The selected provider receives user text plus these minimal selected projections. Session credentials, raw database records and provider secrets are never included; prompts/results are not logged.

POST `/api/assistant-refresh` accepts only `{refs:[...]}`. It applies method, Origin, content/body, session and rate checks, deduplicates validated refs, resolves them sequentially with one clock and returns `{v:2,results}`. It constructs no provider. The canvas uses this endpoint directly without a model call; no background polling or persistence.

Additional budgets: four invocations (duplicates still count in model batches), two model requests, 1,024 planning + 3,072 final requested tokens, 2 MiB aggregate provider wire, 2 KiB tool args, 8 KiB per result and 24 KiB aggregate, 96 KiB dashboard SSE and 32 KiB refresh JSON. One admission is charged for the request plus one per invocation. The existing 20s first-visible/15s idle/60s total deadlines include preflight; a data event does not extend first-visible time. Eight panels, four refs and existing language/render budgets remain enforced.

Each tool has one deadline at most five seconds away. Database reads use a short transaction, re-arming `SET LOCAL statement_timeout` before each statement to remaining time minus 250 ms; no statement starts with under 500 ms left. PostgreSQL 17+ additionally receives `transaction_timeout` for the remaining call budget; older versions skip that setting. Pending queries are cancelled on abort/deadline and settled before request cleanup. A cancelled/failed read is a visible error, never a fixture fallback or late result.

Verification commands: `npm run assistant:test`, `node --experimental-strip-types scripts/assistant-data-adapters-check.ts`, and `DATABASE_URL=<disposable-local-db> node --experimental-strip-types scripts/assistant-data-endpoint-check.ts` after `npm run build`. The endpoint suite uses synthetic provider wires on Node and compiled workerd; it also compares all five guarded projections, rejects missing sessions and checks visible DB failure. No real provider entitlement or hosted Hyperdrive test is implied.

## Dashboard canvas (v0.10 task 004)

Try **Show revenue dashboard**, **Show analytics dashboard**, or **Show finance dashboard**. Each uses the real guarded refs and normal demo/DB selector with no model in recorded mode. Completed dashboard replies occupy the full available width. Panel error boundaries use stable IDs; definitions and snapshots are separate mounted state.

**Refresh data** sends refs only and atomically replaces snapshots after generation/revision checks. Failure keeps visibly stale values; session loss clears the conversation. Range is **Available**, segment **All**: the capability catalog supports no other reporting filters, so these are displayed as read-only labels rather than misleading controls.

Use **Edit a panel** to select an explicit target, or **Add panel** to append. Enter **Make this a bar chart** (also line/area), or **Add analytics chart** (also revenue, finance, crm, performance). Recorded mode rejects unsupported requests such as refunds; it never invents a series. Selecting a panel resolves ambiguous “this” references. Configured providers receive the instruction and current bounded definition, never client snapshots as trusted results.

Edits submit `operation: "edit"` plus `{definition,baseRevision,op,targetId}`. Output is exactly one Panel wrapped in Stack/DashboardGrid. Application code builds a v1 patch, preserves replacement IDs, allocates addition IDs locally, validates the whole resulting tree, and commits atomically. Unchanged panel objects and snapshots are reused; only new references execute tools. Stop, errors and stale revisions discard pending work. No removal, reordering, saving or sharing. Conversation history byte limits remain unchanged; oversized edit definitions fail visibly without truncation.

Canvas verification: `npm run assistant:canvas` checks patch identity, snapshots, stale revisions and whole-tree bounds. `npm run assistant:canvas-browser` runs recorded flows and five synthetic edit adapters against compiled workerd, asserts no recorded provider egress, and captures four-state evidence with axe/keyboard/Stop/session checks.

# 004 — Dashboard canvas, refresh and targeted edits

Status: merged (#87); hands-on VoiceOver/NVDA review not yet performed. Branch: `feat/v0.10/004-dashboard-canvas`. Depends on 002 and 003.

## Scope

- When a reply is a dashboard, show it on a full-width canvas in the Assistant (desktop and mobile), using the dashboard grid and blocks.
- **Refresh:** re-run the dashboard's data references (and range/segment filters exposed as controls) without calling the model or changing the layout.
- **Targeted edits:** a follow-up such as “add a chart of refunds” or “make this a bar chart” changes only the affected panel; other panels keep identity and data.
- State stays in the mounted view (no persistence), consistent with v0.7. Stop, Regenerate, errors and rate-limit behavior keep their v0.7 semantics.
- Recorded mode: at least three recorded dashboard prompts plus one recorded edit and refresh flow, so the live demo shows the whole feature with no keys.
- Kit/llms: mention generative dashboards in the homepage features, README and `/llms.txt` sources once live.

## Acceptance criteria

- [x] Recorded flows (create, refresh, edit) work on the preview Worker with no keys; mocked provider flows pass for all five providers.
- [x] Refresh makes no model call (asserted in tests); edits change only targeted nodes (asserted).
- [ ] `verify:page -- /dashboard/assistant` and `--all` pass; keyboard and screen-reader flow for canvas, filters and refresh; reduced motion respected.
- [x] Build, check (no new design exceptions), typecheck pass; evidence to pr-assets only.
- [x] docs/assistant.md, homepage copy, README, CHANGELOG, llms sources and milestone status updated.

## Spike clarifications (accepted by reviewer and user 2026-11-06)

- Keep validated panel definitions/IDs separate from snapshots in mounted state. Render keyed panel boundaries rather than keying the whole canvas by serialized response text.
- Refresh calls 003's guarded resolver with refs only; replace snapshots atomically after revision/generation checks, retain visibly stale data on failure and clear it on session loss. Only capability-catalog filters are exposed; no polling or generated form/action language.
- Edits produce a validated single-panel subtree; application constructs a version-1 replace/add patch with baseRevision and targetId. Preserve replacement ID; assign additions locally and append. Validate the resulting whole dashboard before atomic commit. No arbitrary paths, raw mergeStatements patches, removal or reordering. Ambiguous natural-language targets require panel selection.
- Preserve unchanged panel objects and data; execute tools only for new references. No client-provided snapshot is trusted as a tool result. Stop/stale revision/error discards the pending edit.

Additional acceptance:

- [x] Tests assert stable unchanged panel identity/data, stale-patch rejection, whole-tree validation, model-free refresh and zero provider egress for three recorded creates plus recorded edit/refresh. Existing conversation lifecycle and history byte caps remain intact.

## Verification — PR #87

Build, check (no new design exceptions), typecheck, all npm Assistant suites, data:parity (29 reads / 211 scenarios), five-adapter data/edit tests and artifact checks passed. The full catalog passed 148 four-state checks with zero axe violations/runtime errors; the hosted Assistant passed all four states. Keyboard/accessible-name and status announcements, reduced-motion, Stop, refresh failure/session loss and stable panel identity are covered by the canvas browser suite. Actual VoiceOver/NVDA interaction was not run; accessibility evidence is the browser accessibility tree, keyboard checks and axe.

Preview version: https://a54407e7-tenboards-preview.mohanadgh.workers.dev
Alias: https://pr-87-tenboards-preview.mohanadgh.workers.dev
Deployment verified ASSETS only and no secrets. Hosted revenue, analytics and finance creates returned real refs; the mounted revenue panel changed to bar and refreshed successfully. Evidence: https://github.com/moeghashim/tenboards/tree/pr-assets/pr-87

## Review round 2 verification — PR #87

Corrected recorded chart titles to catalog labels, formatted snapshot captions with fixed en-US/UTC, formatted all five projections by domain (date-only performance, intraday analytics/finance, monthly CRM, existing ecommerce periods), and matched bar legend swatches to bar marks. Protected primitives and PLAN.md are unchanged.

Build, check, typecheck, all 11 npm Assistant suites, data adapter/endpoint/block/artifact suites, and data:parity (29 reads / 211 scenarios) pass. Endpoint tests cover all five recorded titles and demo/DB projection parity. Local and hosted Assistant four-state verification report zero axe violations/runtime errors; four-state canvas create/edit/refresh screenshots replace the prior pr-assets captures. Homepage → dashboard/home smoke passes. Hands-on VoiceOver/NVDA remains outstanding.

Initial environment failures (missing dependencies and occupied ports) were resolved. Recorded browser checks pass with rate-window isolation. The lifecycle test now clicks Send after provider configuration refresh so Playwright waits for enabled submission; an early Enter could be ignored. Existing build/Biome warnings remain non-failing.

Preview version: https://bf4b34bd-tenboards-preview.mohanadgh.workers.dev
Alias: https://pr-87-tenboards-preview.mohanadgh.workers.dev
Hosted recorded create/bar-edit/refresh pass; deployment inventory is ASSETS only, no secrets.

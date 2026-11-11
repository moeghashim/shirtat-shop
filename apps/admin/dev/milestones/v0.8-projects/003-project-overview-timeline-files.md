---
id: "003"
title: Project Overview, Timeline and Files
milestone: v0.8-projects
status: in-review
category: ui
files: ["src/routes/(main)/dashboard/projects/", "src/routes/(main)/dashboard/calendar/", "src/routes/(main)/dashboard/file-manager/", "src/server/data/calendar.types.ts", "src/navigation/route-catalog.ts", "scripts/", "README.md", "dev/milestones.json"]
---

## Goal and scope

Complete all five project views, including an original read-only Gantt view and its accessible table. Re-scope Calendar and File Manager using their existing components; do not rewrite protected wrappers or add a charting dependency.

Follow the [milestone contract](README.md), PLAN Decisions and AGENTS. Acceptance below is verified for this layer; reviewer approval and merge remain pending.

## Files and ownership

- `src/routes/(main)/dashboard/projects/`
- `src/routes/(main)/dashboard/calendar/`
- `src/routes/(main)/dashboard/file-manager/`
- `src/server/data/calendar.types.ts`
- `src/navigation/route-catalog.ts`
- `scripts/`
- `README.md`
- `dev/milestones.json`

Changes stay within the named task. Shared route metadata is generated only by the existing tool; protected UI/calendar wrappers and PLAN stay intact. README/status changes belong to the same PR.

## Before implementation

Inspect the Calendar request-reference/UTC hydration seam, empty calendar-definition assumption, protected EventCalendarViews props, file grid/list/folder/actions and the project shell. Extract a pure span-to-day-position helper and read-only usage adapters only where needed. Keep all new Gantt presentation local to the project route.

Run Impeccable context once from the task worktree, inspect incumbent renders and local components, and read reference/craft-floor.md immediately before UI edits. Use Operate mode and the merged v0.6.2 DESIGN scale. Read current official TanStack documentation before route/framework changes.

## Acceptance criteria

- [x] Add guarded /overview, /timeline and /files routes plus project-index redirect to validated Overview; complete five route links and concrete route catalog entries. Unknown/empty IDs follow the common contract.
- [x] Overview uses real scoped aggregate reads for status, member metadata, progress, upcoming work and sample activity; it agrees with Board/List and exposes no mutation controls.
- [x] Timeline provides validated gantt/table/calendar modes, bounded Weeks/Months ranges and named range controls. CSS/date utilities draw labeled read-only bars with exact dates, unscheduled items and clipping/continuation; no dependency editing, drag/resize or new runtime dependency.
- [x] Accessible table uses exactly the same filtered schedule rows/order with names, status, assignee, start/end/due and duration. Mobile defaults to the table after safe hydration, with explicit chart opt-in and labeled local horizontal scroll; no hover-only information or duplicate announcements.
- [x] Reuse Calendar composition and projectEvents for the project event subset; remove Add event at usage sites, handle empty definitions, retain month/week/day access and UTC-to-local request-clock hydration. Convert inclusive task ends to exclusive all-day calendar ends explicitly.
- [x] Test civil-day spans across DST/leap/month/year edges, missing/endless/same-day/reversed dates, calendar event versus task identity, timezone changes and long names; invalid spans fail validation rather than rendering misleading bars.
- [x] Reuse file grid/list/folder display and validated view switch with project data. Original shared/starred flags are read-only sample attributes; no fake download/upload/share/delete service, and folder summary limitations remain honest.
- [x] Screens, detail/empty/loading/error states and keyboard controls meet the merged compact scale and token/focus/motion contract. No protected component edit or unrelated page change.
- [x] README describes working project views and read-only calendar/file boundaries; old standalone URLs remain working until 005, and final navigation is still pending.

## Tests

Run common test floor, relevant project/calendar/file parity and npm run screenshots for all project views plus old Calendar/File Manager in four states. Inspect Gantt/table/calendar equivalence, keyboard range/navigation, mobile and zoomed overflow, reduced motion and delayed direct/refresh hydration in UTC/Chicago/Kiritimati on dev/isolated preview. Calendar date tests must not freeze live-clock acceptance.

Every task passes `npm run build`, `npm run check`, `npm run typecheck` and dev `/dashboard/default` smoke without console errors. Attach a demo-only immutable preview and alias; use only `npm run preview:deploy -- --preview-alias pr-NNN`. Evidence stays on pr-assets/PR attachments. Report inherited warnings separately.

## Dependencies and handoff

Depends on 002, blocks 004. Hand off five complete view URLs, Calendar mode search contract and tested default/empty project behavior. Old URLs cannot redirect yet; 005 owns the switch.

One approved task per branch/PR; declare any stack and layer compare URL. Conventional commit with DCO sign-off and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Claude reviews and alone merges.

## Verification — 2026-10-24

Build/check/typecheck and Default smoke pass. Node auth suites pass after separating validated index redirects from the visual-route inventory; direct redirect/access checks remain explicit. Worker auth, security, runtime and project access pass. Demo/DB parity is 29 reads / 204 scenarios, project mapping/upgrade/constraint checks pass, and existing legacy redirects 96/96 pass. Civil-date tests pass UTC/Chicago/Kiritimati, including DST/leap/year, invalid spans, clipping and task/event identity. Four-state view interactions, 32 screen captures, delayed direct/refresh hydration and narrow/zoom overflow checks pass. Fresh Impeccable review: three fixes applied in one batch, then ship verdict. No dependency/token/protected-wrapper change. Evidence: pr-assets/v08-003.

PR: [#71](https://github.com/moeghashim/tenboards/pull/71), after #67 and #69. Immutable demo: https://99332b1b-tenboards-preview.mohanadgh.workers.dev ; reusable alias: https://pr-71-tenboards-preview.mohanadgh.workers.dev . Hosted four-state Default/Overview/Timeline/Files captures pass without console errors. [Evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v08-003).

## Round two verification — 2026-10-24

Rebased on revised 001/002. Shared Select/ToggleGroup controls, project-qualified shell identity/status/avatars/progress, Overview StatCards/member rows/relative dates, active-span Timeline with today/status bars/hidden outside rows/collapsed unscheduled work/live search, and clean Files icons/metadata are verified. File filtering puts results before unrelated folder summaries. Build/check/typecheck pass; Node auth 471, Worker auth 317, demo/DB and Worker parity 29 reads/210 scenarios, Worker security, Node/Worker project access, project/migration checks, 96 redirects and civil-date checks pass. Four-state interactions and delayed Calendar hydration in three timezones pass. Inherited Biome one warning/four infos; no new dependency/token/protected-wrapper edits.

Independent Impeccable A/B: 29/40 before final polish, no P0/P1; file-result visibility, singular count and avatar overlap fixed. Two nonblocking refinements remain: mobile table identity during horizontal inspection and exact-label discovery. Raw reports and four-state before/after/preview captures are in [round-two evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v08-003-round2).

Final immutable demo: https://4d38b0c3-tenboards-preview.mohanadgh.workers.dev ; alias https://pr-71-tenboards-preview.mohanadgh.workers.dev . A disk-full/Docker interruption was recovered using a clean temporary evidence-cache removal and isolated PostgreSQL 17 on3278; complete reruns pass. PR #71 remains in review; implementer did not merge or deploy production.


### Round 4 integration — 2026-10-25

Replayed on v0.7 and the revised Board layer. Overview exposes canceled totals and marks overdue as a subset of open; the header shares the done/eligible progress explanation. Member avatars no longer overlap initials. Files has a File name hint; Timeline/Files defaults are absent from URLs while explicit choices remain. Build/check/typecheck, default smoke, all four view-interaction states and delayed Calendar hydration across UTC/Chicago/Kiritimati pass. Civil schedule checks pass in all three zones. Breadcrumb links follow in layer004 when Projects index exists. Status remains in review.

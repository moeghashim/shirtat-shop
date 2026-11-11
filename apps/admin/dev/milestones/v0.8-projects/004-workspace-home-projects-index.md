---
id: "004"
title: Workspace Home and Projects index
milestone: v0.8-projects
status: in-review
category: ui
files: ["src/routes/(main)/dashboard/home/", "src/routes/(main)/dashboard/projects/", "src/server/data/", "src/navigation/route-catalog.ts", "scripts/", "README.md", "dev/milestones.json"]
---

## Goal and scope

Deliver /dashboard/home and /dashboard/projects as usable cross-project entry points after project destinations exist. Home serves sample-workspace scanning; the current default dashboard and root/login destinations stay unchanged.

Follow the [milestone contract](README.md), PLAN Decisions and AGENTS. Acceptance below is verified against the approved round-two brief; reviewer merge remains pending.

## Files and ownership

- `src/routes/(main)/dashboard/home/`
- `src/routes/(main)/dashboard/projects/`
- `src/server/data/`
- `src/navigation/route-catalog.ts`
- `scripts/`
- `README.md`
- `dev/milestones.json`

Changes stay within the named task. Shared route metadata is generated only by the existing tool; protected UI/calendar wrappers and PLAN stay intact. README/status changes belong to the same PR.

## Before implementation

Inspect DashboardCard/StatCard/SectionHeader/PageHeader, project aggregate DTOs and existing data/date boundaries. Extract only shared metric/date formatting already needed across Home and Overview; do not reshape all dashboard cards or Productivity's independent domain.

Run Impeccable context once from the task worktree, inspect incumbent renders and local components, and read reference/craft-floor.md immediately before UI edits. Use Operate mode and the merged v0.6.2 DESIGN scale. Read current official TanStack documentation before route/framework changes.

## Acceptance criteria

- [x] Home and index inherit requireAppRoute; each new aggregate/index server function independently guards with requireSession and returns bounded DTOs without sensitive identity/configuration.
- [x] Home contains greeting, KPI row, My tasks, upcoming deadlines, project progress and recent sample activity; values derive from canonical scoped reads and match the README metric definitions.
- [x] My tasks visibly refers to the named sample member in demo and auth mode, never claims real auth-user ownership. Historical sample reporting date is labeled separately from serialized request-time greeting/current-day markers.
- [x] Projects index supports working search/status filtering, stable ordering, status/progress/due/member summaries and Overview links. Default, secondary, empty and missing project paths behave distinctly.
- [x] All task/activity/progress links reach the owning completed project view; display limits have honest totals and a route to the full dataset. No fake creation/invite/favorite actions.
- [x] Desktop hierarchy and mobile stacking preserve complete labels and reachable data. Cover zero/one/many projects, no matching search, no upcoming tasks, long titles, missing dates/members and load failures without inventing data.
- [x] Add concrete capture/catalog entries and generate route metadata. Keep /, /dashboard, /dashboard/ and auth fallback unchanged; 005 switches sidebar/brand-home only after both destinations work.
- [x] Capture and inspect four-state new screens and unchanged Default/Chat; verify keyboard/filter/focus, AA supported pairs, reduced motion and real-clock delayed hydration. Use compact merged tokens with no per-screen density fork.
- [x] README clearly distinguishes workspace Home from the retained Default dashboard and documents the sample-person/read-only limitations; update only verified status.

## Tests

Run common test floor, aggregate/project parity, direct RPC guard negatives and npm run screenshots for Home/index/default/Chat in four states. Test KPI/Overview/Board/List consistency, cross-project links, search empty recovery and delayed SSR/refresh under different timezones. Use an isolated demo version preview.

Every task passes `npm run build`, `npm run check`, `npm run typecheck` and dev `/dashboard/default` smoke without console errors. Attach a demo-only immutable preview and alias; use only `npm run preview:deploy -- --preview-alias pr-NNN`. Evidence stays on pr-assets/PR attachments. Report inherited warnings separately.

## Dependencies and handoff

Depends on 003, blocks 005. Hand off working workspace and project destinations to the navigation integration task. No default-route/auth destination rewrite is authorized.

One approved task per branch/PR; declare any stack and layer compare URL. Conventional commit with DCO sign-off and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Claude reviews and alone merges.

## Verification — 2026-10-24

Build/check/typecheck pass with inherited Biome one warning/four infos. Node auth 489, Worker auth335, demo/DB and Worker parity29reads/210scenarios, Worker security, Node/Worker direct workspace/project guard negatives and revocation, project fresh/populated/repeat migration checks and96legacyredirects pass. Four-state Home/index/Default/Chat dev and immutable-preview captures pass; workspace interaction and real-clock delayed hydration pass in UTC/Chicago/Kiritimati. An in-flight HMR navigation interrupted the initial retained Chat capture; a stable complete rerun passes. Independent Impeccable finish review: SHIP, no material design issue.

The round-two user instruction supersedes the original historical-reporting-date clause: samples now share the serialized request UTC date, with no internal deadline-reference UI. My tasks explicitly names Jordan Lee as the sample member; greeting adopts local time after safe hydration. Exact aggregate counts accompany capped lists.

PR [#73](https://github.com/moeghashim/tenboards/pull/73), stacked on#71. Immutable demo https://584941b9-tenboards-preview.mohanadgh.workers.dev ; alias https://pr-73-tenboards-preview.mohanadgh.workers.dev . Upload used the approved preview command. A transient Cloudflare version-not-found response interrupted post-upload verification; a subsequent read-only verification using the same policy assertion confirms ASSETS only/no secrets. [Evidence](https://github.com/moeghashim/tenboards/tree/pr-assets/v08-004). No new runtime dependency, token or protected-wrapper change; no merge/production deploy.


### Round 4 integration — 2026-10-25

Replayed on the v0.7-integrated stack. Home places Recent activity beneath My tasks at desktop widths, with the existing mobile reading order. Home/index cards use the shared progress denominator/canceled explanation and spaced member initials. The project shell now has real Projects and project Overview breadcrumb links plus the current view. Index default queries are omitted. Build/check/typecheck, default smoke, four-state Home/index interactions and three-zone delayed hydration pass. Final evidence includes 1440/1280 desktop inspection. Status remains in review.

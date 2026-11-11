---
id: "005"
title: Nested Projects navigation and legacy redirects
milestone: v0.8-projects
status: in-review
category: ui
files: ["src/navigation/", "src/components/navigation/command-palette.tsx", "src/routes/(main)/dashboard/-components/sidebar/", "src/routes/(main)/dashboard/-components/header/", "src/routes/(main)/dashboard/route.tsx", "src/routes/(main)/dashboard/projects/", "src/routes/(main)/dashboard/kanban/", "src/routes/(main)/dashboard/tasks/", "src/routes/(main)/dashboard/calendar/", "src/routes/(main)/dashboard/file-manager/", "scripts/", "README.md", "dev/milestones.json"]
---

## Goal and scope

Integrate complete destinations into sidebar, palette and header, then consolidate old app URLs. Follow the README disclosure/persistence and redirect contracts exactly; preserve v0.7 Assistant next to Chat whenever present.

Follow the [milestone contract](README.md), PLAN Decisions and AGENTS. All acceptance below is pending implementation.

## Files and ownership

- `src/navigation/`
- `src/components/navigation/command-palette.tsx`
- `src/routes/(main)/dashboard/-components/sidebar/`
- `src/routes/(main)/dashboard/-components/header/`
- `src/routes/(main)/dashboard/route.tsx`
- `src/routes/(main)/dashboard/projects/`
- `src/routes/(main)/dashboard/kanban/`
- `src/routes/(main)/dashboard/tasks/`
- `src/routes/(main)/dashboard/calendar/`
- `src/routes/(main)/dashboard/file-manager/`
- `scripts/`
- `README.md`
- `dev/milestones.json`

Changes stay within the named task. Shared route metadata is generated only by the existing tool; protected UI/calendar wrappers and PLAN stay intact. README/status changes belong to the same PR.

## Before implementation

Reinspect latest sidebar metadata/primaryIds, nav-section pathname key, AppPath, header catalog lookup, palette static groups and support-card flattening. Introduce a typed destination builder/active matcher shared by these consumers and a controlled expansion seam only as needed. Read local Collapsible/Popover/Sidebar wrappers; do not edit protected components.

Run Impeccable context once from the task worktree, inspect incumbent renders and local components, and read reference/craft-floor.md immediately before UI edits. Use Operate mode and the merged v0.6.2 DESIGN scale. Read current official TanStack documentation before route/framework changes.

## Acceptance criteria

- [x] Primary Home points to /dashboard/home, Projects to /dashboard/projects, and brand-home follows Home. Retain Default under Dashboards; root/dashboard-index/auth fallbacks lead to Home per the locked 2026-10-25 PLAN decision, while validated return destinations win. Keep Email/Chat and preserve Assistant directly after Chat.
- [x] Projects section loads guarded summaries and expands each named project to Overview/Board/List/Timeline/Files with exact active child and parent indication. No unresolved parameter navigation, prefix collisions or copied reference assets/data.
- [x] Disclosure buttons/nested lists expose correct expanded/controls state; Enter/Space/Tab and visible focus work, collapsed content leaves tab order and focus is recovered on collapse. Use the same indented pattern for suitable existing parent groups without unrelated redesign.
- [x] Named collapsed-rail triggers open usable Popover links, active state and project name; tooltip is supplemental. Escape/outside/route-change dismissal and focus return work. Preserve off-canvas/mobile/header-toggle behavior across layout preferences.
- [x] Mobile sheet supports disclosure without dismissing, closes on link resolution, scrolls long lists and restores focus. No hover-only or too-small targets; verify merged v0.6.2 density floors.
- [x] Versioned bounded expansion storage hydrates safely, prunes invalid IDs, handles corrupt/disabled storage, follows route-entry policy and respects manual collapse. Existing sidebar cookies/preferences stay unchanged; stars/status dots remain read-only with text alternatives.
- [x] Palette/header use project-qualified labels and typed params from guarded summaries, preserve Cmd/Ctrl+K behavior and include a Projects group. Exploration counts use concrete destinations; aliases are absent from search. No protected project fetch occurs on public root/auth surfaces.
- [x] All four legacy paths use the README permanent redirect table, including Kanban list/table compatibility and Calendar mode, validated File view, hash and trailing slash cases. Auth login-return/revocation and direct RPC guards remain intact; unknown projects never fall back to default.
- [x] Remove old primary/Pages entries only with their working redirects. Move reused presentation under the project owner and leave thin old route aliases; no wholesale rewrite or destructive database cleanup. Generate routeTree and reconcile concrete capture inventory/redirect coverage.
- [x] README documents canonical paths, aliases, dynamic capture IDs, navigation state and read-only boundaries. Resolve shared-file merges as a union of v0.7/v0.8 changes; retain compact density and completed legacy-removal behavior.

## Tests

Run common test floor, dedicated HTTP/client redirect checks in demo/auth modes, direct RPC denial/session expiry and nested-nav storage/keyboard/focus tests. npm run screenshots covers Home/index/all views plus default/Chat/Assistant when present, before/after light/dark desktop/mobile; add --sidebar-states and all supported sidebar styles/collapse modes. Inspect palette project search, empty/error summaries, deep links, cross-project switching, no raw $projectId paths and PLAN-approved Home root destinations on dev and immutable demo preview.

Every task passes `npm run build`, `npm run check`, `npm run typecheck` and dev `/` → `/dashboard/home` smoke without console errors. Attach a demo-only immutable preview and alias; use only `npm run preview:deploy -- --preview-alias pr-NNN`. Evidence stays on pr-assets/PR attachments. Report inherited warnings separately.

## Dependencies and handoff

Depends on 004 and all earlier v0.8 tasks. Rebase onto latest merged v0.6.2 and any v0.7 changes; reviewer resolves shared files at merge. Blocks 006. Do not make Assistant a prerequisite or delete it if it arrives concurrently.

One approved task per branch/PR; declare any stack and layer compare URL. Conventional commit with DCO sign-off and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Claude reviews and alone merges.

## Verification — 2026-10-24

PR #74, stacked on #73. Build/check/typecheck and default smoke pass; inherited Biome one warning/four infos and build deprecation/chunk warnings remain. Node auth: 458 scenarios across 12 suites; compiled workerd auth: 277 protection + 15 account + 12 security. Node and actual `AUTH_TEST_RUNTIME=workerd` project access pass. Full Node/Worker parity: 29 reads/210 scenarios. Worker runtime/security and project migration/preservation checks pass. Existing redirects: 96 cases; project aliases: 80 demo/auth HTTP/client/query/hash/trailing-slash/revocation cases.

Four-state Home/index/five views/Default/Chat captures plus expanded/collapsed/mobile navigation pass. Focused navigation verifies exact active state, same-path rail dismissal, mobile collapse persistence, six layout/collapse configurations and corrupt/disabled storage. A separate isolated `_v08_` database verifies navigation schema error, retry recovery and empty state. Board/List, views, workspace and three-zone civil-date/delayed hydration suites pass. Impeccable finish review: SHIP after fixing exact parent activation, mobile state lifetime and same-path flyout dismissal. Main remains v0.6.2; no merged Assistant was present.

Preview: https://8835c63b-tenboards-preview.mohanadgh.workers.dev and https://pr-74-tenboards-preview.mohanadgh.workers.dev. Immediate post-upload API verification failed transiently; separate read-only verification subsequently confirmed ASSETS only/no secrets, and hosted four-state smoke passed. Evidence: pr-assets/v08-005. Claude reviews/merges; implementer performed neither merge nor production deployment.


### Round 4 integration — 2026-10-25

This layer owns v0.7 navigation integration and the locked PLAN Home landing decision. Home → Projects → Email → Chat → AI Assistant is verified; the palette/catalog retains Assistant and the demo card derives 35 concrete dashboard destinations. Root/dashboard/index and invalid/missing auth fallback lead to Home while validated returns (including the revenue dashboard) win. Recovery links and deploy/auth/capture expectations agree. Legacy redirects omit defaults; Kanban drag-and-drop removal is explicit in README/CHANGELOG. Build/check/typecheck, 82 demo/auth redirect cases, 10 auth-return cases, deployment checker negative cases, 16 root/dashboard/Assistant smoke captures and navigation across themes/viewports/sidebar modes pass. No approval, merge or production deploy claimed.

---
id: "006"
title: Integrated Projects acceptance and documentation
milestone: v0.8-projects
status: in-review
category: acceptance
files: ["scripts/", "README.md", "CHANGELOG.md", "DESIGN.md", "docs/data.md", "docs/auth.md", "dev/milestones/v0.8-projects/", "dev/milestones.json", "dev/open-questions.md"]
---

## Goal and scope

Verify the complete milestone, reconcile delivered documentation and hand release readiness to Claude. Fix only narrow in-scope acceptance failures; any expanded auth/dependency/product work must be logged and paused.

Follow the [milestone contract](README.md), PLAN Decisions and AGENTS. Implementation evidence is recorded below; reviewer approval remains pending.

## Files and ownership

- `scripts/`
- `README.md`
- `CHANGELOG.md`
- `DESIGN.md`
- `docs/data.md`
- `docs/auth.md`
- `dev/milestones/v0.8-projects/`
- `dev/milestones.json`
- `dev/open-questions.md`

Changes stay within the named task. Shared route metadata is generated only by the existing tool; protected UI/calendar wrappers and PLAN stay intact. README/status changes belong to the same PR.

## Before implementation

Inspect task evidence, final route/read registries and latest density/Assistant merges before adding checks. Reuse focused existing capture/parity/auth harnesses; avoid a new test framework or tests that merely mirror implementation.

## Acceptance criteria

- [x] All previous acceptance criteria have evidence; no TODO view, dead link, mutation-looking placeholder, duplicated task domain or unlicensed-reference material remains. Every default/second/empty project view is usable.
- [x] Full data parity plus fresh/populated/repeat migration-seed checks pass with preserved auth/adopter/unrelated data; report actual new read/scenario counts. Home/Overview/Board/List/Timeline share verified totals and identity.
- [x] Node and compiled local workerd verify demo/DB/auth modes, guarded new route/RPC access, malformed/cross-project/missing IDs, revocation, DB/schema/config failure and recovery. No hosted DB or tenancy claim; previews remain ASSETS-only.
- [x] Legacy HTTP/client redirects, query/hash/trailing slash rules, login returns and PLAN-approved Home entry/auth fallback destinations and preserved validated returns pass. Route catalog/generated metadata agree; static inventory has concrete project samples and dedicated redirect coverage.
- [x] Full retained-route matrix plus new project cases passes light/dark × desktop/mobile across Default/Graphite/Pine/Iris. Inspect captures; sidebar variants/rail/off-canvas/mobile sheet, nested persistence and palette/header active labels agree. Preserve v0.7 Assistant/Chat if merged.
- [x] Timeline chart/table/calendar data equality, keyboard/assistive-tech semantics, mobile table fallback, range clipping/unscheduled items, reduced motion and DST/leap/rollover cases pass. Delayed direct/refresh real-clock hydration shows no console errors.
- [x] Read-only boundaries hold: no task mutation/DnD, favorite toggles, file upload/download service or membership/permission claims. Any generated data is clearly synthetic and counts reflect actual reads or explicitly labeled fixture summaries.
- [x] README, CHANGELOG release draft, data/auth/capture documentation and DESIGN usage descriptions reflect delivered compact UI, new routes, redirects, additive migrations and storage behavior. Do not bump package versions, tag, release or edit PLAN.
- [x] Milestone/task status and checked boxes reflect verified evidence only; record inherited warnings separately from failures and unresolved blockers in open questions. Publish pr-assets evidence plus immutable and alias demo preview URLs for review.
- [x] Claude reviews, merges/rebases and owns production deployment/release; implementer reports readiness without performing those actions.

## Tests

Run npm run build/check/typecheck, default dev smoke, full npm run screenshots matrix with project-specific interactions and concrete IDs, npm run data:parity and relevant auth/migration/local workerd checks. Repeat only failed or materially changed cases. Required artifacts include consolidated pass/fail report, route/read counts, redirect table, migration preservation, keyboard/focus and timeline data-equivalence evidence. Upload artifacts only to pr-assets or attachments; no credentials, auth storage or reference-site assets.

Every task passes `npm run build`, `npm run check`, `npm run typecheck` and dev `/` → `/dashboard/home` smoke without console errors (layers001–004 used the then-current revenue-dashboard smoke). Attach a demo-only immutable preview and alias; use only `npm run preview:deploy -- --preview-alias pr-NNN`. Evidence stays on pr-assets/PR attachments. Report inherited warnings separately.

## Dependencies and handoff

Depends on merged 005 and v0.6.2; v0.7 can release independently. Rebase on the actual integrated tree and rerun affected checks if the reviewer merges concurrent shell/catalog changes. No implementer merge/deploy/release. Any true blocker remains explicit rather than marking the milestone done.

One approved task per branch/PR; declare any stack and layer compare URL. Conventional commit with DCO sign-off and final `Co-Authored-By: GPT-6-Astra <noreply@openai.com>` trailer. Claude reviews and alone merges.

## Historical verification — 2026-10-24

PR #75, stacked on #74. Build/check/typecheck and final four-state dev default smoke pass. Node auth: 458 scenarios/12 suites. Compiled local workerd auth: 277 protection + 15 accounts + 12 security. Node/workerd project access, runtime/security, 29-read/210-scenario parity, fresh/populated/repeated migration-seed preservation, 80 project and 96 existing redirect cases pass.

The final retry-resolved matrix passes 560 retained-route cases plus 160 secondary/empty-project cases across all four presets and four states. Both sidebar matrices pass (96 hydrated + 96 JavaScript-disabled); hosted immutable-preview smoke passes 36 cases. Shell interactions pass. Unchanged application-focused task005 evidence covers project views, Home/index, nested navigation/storage/focus, isolated navigation schema error/retry/empty state, civil date edges and delayed direct/refresh hydration in three timezones. No application code changed in this layer.

Impeccable Operate finish review: SHIP. Full inventory contact sheets and representative full-size project/empty renders were inspected. Original navigation/dev-transport failures remain uploaded with 64 explicit retry cases; all final replacements pass. A screenshot guard now detects Vite error overlays that diagnostics alone missed. The first Node auth attempt hit a host Node socket EINVAL; its complete rerun passed. Inherited Biome one warning/four infos and build dependency directive warnings remain separate from failures.

Evidence: [consolidated acceptance report](https://github.com/moeghashim/tenboards/blob/pr-assets/v08-006/acceptance.md). Preview: https://082cd8e9-tenboards-preview.mohanadgh.workers.dev and https://pr-75-tenboards-preview.mohanadgh.workers.dev; remote ASSETS-only/no-secrets inventory verified. No scope blocker remains. That round used main 3703f76/v0.6.2 before Assistant merged; the round-4 integration below supersedes that baseline. All six tasks are in review; Claude owns final review, stack integration, merges and production/release. Milestone completion remains pending that review.


## Round-4 verification — 2026-10-25

Rebuilt on main `f228231` with v0.7 Assistant preserved. [Round-4 evidence and exact layer tips](https://github.com/moeghashim/tenboards/blob/pr-assets/v08-r4/acceptance.md) supersede the historical baseline above. Node auth: 480 scenarios/12 suites. Local workerd: 291 protection + 15 account + 12 security cases; runtime and rate-limit checks pass. All Assistant/Projects checks, 29 reads/211 parity scenarios, fresh/populated/repeated migration preservation, 82 project aliases and 96 retired aliases pass. No real provider credentials or calls were used.

The visual matrix passes 736 unique cases across Default/Graphite/Pine/Iris, with two Graphite navigation-context failures explicitly replaced; originals remain in evidence. Focused dev captures pass 60 cases, hosted preview 36, sidebar checks 96 hydrated + 96 JavaScript-disabled, and delayed auth hydration 64. The latter count reflects four retained routes after V1 removal. Home layout and linked/current breadcrumb semantics pass at 1280 and 1440. Final lint matches main's 35 warnings and reduces infos from 14 to 10; build/typecheck pass on every layer. The report lists exact failures and passing reruns, all six previews, and before/after evidence. Status remains in review; no reviewer approval, merge, production deployment or release is claimed.

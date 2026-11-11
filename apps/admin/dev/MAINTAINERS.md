# Contributor instructions

PLAN.md is the canonical contract; its Decisions log wins conflicts. PRODUCT.md records product facts and DESIGN.md records the design system. docs/upstream-AGENTS.md is archived provenance, not a competing authority.

## Before coding

Inspect affected code for small, behavior-preserving prefactors that make the requested change simpler, safer, or more local. Extract a helper, clarify a name, isolate a conditional, tighten a type, or add a focused test seam only when it clearly reduces complexity or risk. Make the change easy, then make the easy change. Preserve user changes and avoid unrelated refactors.

## Workflow and authority

- Implement only an approved task. One task per branch and PR: feat/v0.1/NNN-slug; PRs target main. Declare any stack and link its layer compare URL.
- GPT-6-Astra implements and never merges. Claude Opus 5.5 reviews every PR and holds user-delegated authority to squash-merge approved PRs and rebase stacks (PLAN Decisions log, 2026-10-23).
- main is protected. The reviewer redeploys production from main after merges. Implementers use npm run preview:deploy -- --preview-alias pr-NNN, which builds/uploads only the demo-only tenboards-preview Worker with ASSETS and no secrets. Never upload PR versions to tenboards or run npm run deploy. First-use --initialize may create only tenboards-preview. Production binding IDs, secrets and cutover belong to the reviewer.
- Use Conventional Commits. Every implementation commit ends with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`.
- Tick acceptance boxes only after verification; update dev/milestones.json status. Record blockers in dev/open-questions.md, finish independent work, and report.

## README upkeep

Every PR updates README.md in the same PR whenever it changes user-visible behavior, features/screens, commands, setup, deployment, URLs, or milestone status. State "README: updated (sections …)" or "README: no change needed (reason)" in the PR body. A stale README is a review blocker (PLAN Decisions log, README upkeep).

## Test floor

Every task PR must pass npm run build, npm run check, npm run typecheck, and a dev-server / → /dashboard/home smoke without console errors. From task 004 onward, run npm run screenshots and attach before/after light/dark × desktop/mobile evidence for affected screens. Capture output is gitignored; upload only to pr-assets or PR attachments, never main. Report inherited warnings separately from failures. Include a version-preview URL in every PR.

## UI work

Use the global Impeccable skill for all UI work. Run its scripts/impeccable context once from the repo root at session start. Read reference/craft-floor.md immediately before UI edits. App surfaces use Operate mode; PLAN §7 controls the design. Inspect the incumbent render and local components first, then inspect final renders at desktop/mobile in light/dark. Preserve keyboard access, accessible names, visible focus, reduced motion, and WCAG AA supported token pairs. Record contrast evidence when editing tokens or presets.

## Decide or escalate

| Decide within the task | Escalate in dev/open-questions.md and pause dependent work |
| --- | --- |
| Small behavior-preserving prefactors, exact token values within the approved spec, original brand geometry, tooling details | Conflicting PLAN requirements, scope expansion, missing required assets or access |
| PLAN-approved Playwright dev tooling; Geist font packages | Any other new runtime dependency |
| Safe fixture choices, narrow type fixes, documentation aligned with verified implementation | Auth behavior changes, destructive actions, changes to protected plan/task content |

## Protected paths and scope

Never edit PLAN.md. dev/** may change only for acceptance/status updates or open-question entries. Preserve LICENSE notices and archived provenance. Never hand-edit src/routeTree.gen.ts or generated build/Worker configuration. Keep src/components/ui/ and src/components/calendar/ intact; style through tokens or usage sites. No dashboard/app-page content restyles before v0.2/v0.3. No sidebar/header/palette/settings redesign in tasks 003–007.

## Code conventions

Use npm, Node 22+, strict TypeScript, existing @/ aliases, and Biome conventions. Keep feature code colocated under the owning route's -components directory until genuinely shared. Route groups add no URL segment; route.tsx defines layouts, $param names dynamic segments, and dash-prefixed files are excluded from generation. Read current official TanStack documentation before routing/framework changes. SSR is enabled: browser APIs belong in guarded client code or effects; do not add use client directives. Inspect local Base UI wrappers before use. Reuse existing dependencies and preserve the font/preferences registries.

## PR body template

Task: NNN — title
Linked: dev/milestones/v0.1-design-system-shell/NNN-slug.md
Preview: version-specific URL and reusable alias

Stack: base branch/PR, merge order, and layer compare URL (or main for the first layer).

### Acceptance criteria
Verified checklist copied from the task; leave unmet criteria unchecked.

### Files touched
Files and why they changed, scoped to this layer.

### Tests
Commands, outcomes, smoke evidence, contrast checks where applicable, and exact failure output or linked logs.

### Screenshots
Before/after light/dark × desktop/mobile table with pr-assets links; explain any nonvisual-task exemption.

### Decisions
Applicable PLAN decisions, prefactor inspection/result, dependency decisions, and unresolved questions. Claude has merge authority; implementer never merges.

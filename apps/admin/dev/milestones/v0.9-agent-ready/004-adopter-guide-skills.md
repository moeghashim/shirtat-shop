# 004 — Adopter guide and Agent Skills

Status: merged (#80). Branch: `feat/v0.9/004-adopter-guide-skills`. Depends on 002 and 003.

## Scope

- Move today's maintainer rules from root `AGENTS.md` to `dev/MAINTAINERS.md` verbatim (content-preserving; update references in CONTRIBUTING, PR template text and task docs).
- Rewrite root `AGENTS.md` for adopters' agents: stack summary, where things live, the build loop (generator → blocks → data layer → `check:design` → `verify:page`), hard rules (no raw colors/arbitrary values, don't edit `ui/`, SSR-safe browser code, no `use client`), and a one-line pointer: “Maintaining tenboards upstream? Read dev/MAINTAINERS.md first.” Keep it under ~120 lines.
- Add root `CLAUDE.md` containing `@AGENTS.md` (plus nothing else that duplicates it).
- Skills per the Agent Skills spec (agentskills.io/specification), canonical in `.agents/skills/`, mirrored to `.claude/skills/<name>` as relative symlinks:
  - `tenboards-build-ui`: add dashboards, app pages, KPIs, charts and tables. Defaults not menus; a progress checklist; validation loop with `check:design` and `verify:page`; a Gotchas section seeded from real review history (SSR/hydration clocks, tokens not literals, chart motion hook, compact density floors, route groups add no URL segment, never hand-edit `routeTree.gen.ts`). Block API details in `references/blocks.md`, loaded on demand.
  - `tenboards-connect-data`: typed reads, demo fixtures, Drizzle migrations (additive only), seeds, parity scenarios, auth-guarded server functions. Details in `references/`.
  - Frontmatter: `name` = directory, `description` states what + when with trigger keywords (≤1024 chars), `license: MIT`, `metadata.version`. Body < 500 lines.
- `npm run check:skills` (chained into `npm run check`): validates frontmatter constraints, name/dir match, description length, body line count, that relative references resolve, and that `.claude/skills` mirrors resolve to `.agents/skills`. No new dependency.
- Eval evidence: give a fresh agent session two prompts (“add a Sales dashboard with revenue KPIs and a top-products table”, “add a Vendors page listing vendors”) with skills present; attach the diffs and `check:design`/`verify:page` results. Record any correction as a new gotcha.

## Acceptance criteria

- [x] Maintainer rules preserved in `dev/MAINTAINERS.md`; all references updated; root AGENTS.md is adopter-facing; CLAUDE.md imports it.
- [x] Both skills pass `check:skills`; `.claude/skills` symlinks resolve; skills appear in Claude Code and Codex skill discovery (evidence).
- [x] Two eval runs produce on-system pages that pass `check:design` and `verify:page` without manual fixes; transcripts summarized in PR.
- [x] README (“Building with agents” section), CHANGELOG draft, milestone status; preview in PR.

## Verification — PR #80

- Original maintainer rules match the base AGENTS.md byte-for-byte; root guide is 57 lines; CLAUDE.md imports it. Current workflow references point to dev/MAINTAINERS.md; historical records retain relocation notes.
- build/check/typecheck, check:skills and 16 validator rejection cases pass; no new dependency.
- Fresh Codex Sales and Claude Code Vendors sessions discover both skills and produce pages passing check:design and verify:page in all four states without manual implementation fixes. Agent corrections and the scratch dependency-symlink startup failure are recorded as gotchas.
- Root → Default and Home dev smoke passes 8/8 with no console/hydration errors. Nonvisual task: no application source changes; eval diffs/captures live only on pr-assets.
- Evidence: https://github.com/moeghashim/tenboards/tree/pr-assets/v09-004. Preview: https://78ecdd04-tenboards-preview.mohanadgh.workers.dev (alias https://pr-80-tenboards-preview.mohanadgh.workers.dev).

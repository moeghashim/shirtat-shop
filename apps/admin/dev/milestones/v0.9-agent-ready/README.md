# v0.9 — Agent-ready template

Status: **done** — released as v0.9.0 (2026-10-26). Contract: PLAN.md Decisions log, “v0.9 …” rows (2026-10-26).

Goal: coding agents adopting tenboards use its real building blocks instead of generating look-alike UI. The on-system path is the shortest path; the off-system path fails a check.

| Task | Depends on | Contract |
| --- | --- | --- |
| 001 — Public blocks and kit page (merged #77) | main | [001](001-blocks-kit.md) |
| 002 — Page generators (merged #79) | 001 | [002](002-page-generators.md) |
| 003 — Design guardrails and verify:page (merged #78) | 001 | [003](003-design-guardrails.md) |
| 004 — Adopter guide and Agent Skills (merged #80) | 002, 003 | [004](004-adopter-guide-skills.md) |
| 005 — shadcn registry and llms.txt (merged #82) | 001 (docs after 004) | [005](005-registry-llms.md) |
| 006 — Inherited accessibility findings (merged #81) | 003 | [006](006-accessibility-debt.md) |

Branches: `feat/v0.9/NNN-slug`, one PR per task to main. 002 and 003 may run in parallel after 001 merges. v0.8.1 (default landing) merges first; v0.9 rebases onto it.

Out of scope: real CRUD, RBAC, i18n, redesign of existing screens (blocks migration must be visually identical), new runtime dependencies (only `@axe-core/playwright` as a dev dependency).

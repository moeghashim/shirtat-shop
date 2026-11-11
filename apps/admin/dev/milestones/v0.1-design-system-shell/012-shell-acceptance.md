---
id: 012
title: Verify v0.1 shell coverage and handoff
milestone: v0.1-design-system-shell
category: tooling
priority: medium
files: ["README.md", "DESIGN.md", "dev/milestones.json", "dev/milestones/v0.1-design-system-shell/README.md"]
---

## Acceptance criteria
- [x] Run all retained routes through the screenshot matrix and fix only v0.1 shell regressions.
- [x] Verify keyboard navigation, responsive shell, light/dark presets, reduced motion, and no route removals.
- [ ] Build, check, typecheck, local smoke, Workers preview smoke, and captures pass.
- [x] Document commands, live/preview URLs, manual main deploy procedure, and known upstream limitations.
- [x] Update milestone/task status only from evidence; leave v0.2+ work deferred and user merge authority intact.

## Suggested approach
Audit the integrated shell against this milestone DoD and PLAN. Escalate failures requiring auth, new config, unapproved runtime dependencies, or another milestone.

## Execution order
A final integration pass catches interactions among independently reviewed shell PRs.

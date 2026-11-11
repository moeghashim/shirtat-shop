---
id: 004
title: Add repeatable route screenshots
milestone: v0.1-design-system-shell
category: tooling
priority: high
files: ["scripts/screenshots.ts", "package.json", "package-lock.json", ".gitignore", "README.md"]
---

## Acceptance criteria
- [x] npm run screenshots captures every retained route in light/dark × desktop/mobile to gitignored screenshots/.
- [x] Use Playwright; make route inventory explicit, resolve dynamic routes to valid demo fixtures, and report missing routes.
- [x] Wait for fonts, hydration, and stable content; honor reduced motion; report console/page errors and failed captures with nonzero exit.
- [x] Support a route subset and base URL for local and Workers PR evidence without requiring new environment variables.
- [x] Document uploading screenshots to an assets branch or PR attachments, never main.
- [x] Build, check, typecheck, and representative capture run pass.

## Suggested approach
Add the PLAN-approved Playwright dev tooling. Reuse generated route metadata where reliable; avoid hand-editing routeTree.gen.ts. Capture pre-change baselines for later UI tasks.

## Execution order
Moved ahead of tokens so every remaining UI PR can include the full required comparison matrix.

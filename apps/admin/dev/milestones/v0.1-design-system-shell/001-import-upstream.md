---
id: 001
title: Import upstream and establish tenboards basics
milestone: v0.1-design-system-shell
category: scaffolding
priority: high
files: ["package.json", "package-lock.json", "LICENSE", "README.md", "docs/upstream-AGENTS.md", "src/config/app-config.ts"]
---

## Acceptance criteria
- [ ] Import the entire upstream tree without its Git history; preserve all screens and route colocation.
- [ ] Preserve the upstream MIT notice, add tenboards copyright, and record upstream URL and exact revision in README.
- [ ] Rename upstream AGENTS.md to docs/upstream-AGENTS.md; do not generate a root AGENTS.md yet.
- [ ] Set package name to tenboards, retain npm and Node 22+, and rebrand central app identity.
- [ ] Add typecheck (tsc --noEmit); npm install, build, check, and typecheck pass. Document any inherited failures with exact output.
- [ ] Render /dashboard/default without console errors and attach desktop light/dark before/after evidence outside main.

## Suggested approach
Clone to a temporary directory outside the repo. Inspect for focused prefactors before changing code; the existing app-config is the preferred branding seam. Import in one chore: import commit with attribution. Do not alter auth or screen designs.

## Execution order
A runnable, attributed baseline is needed by every later task.

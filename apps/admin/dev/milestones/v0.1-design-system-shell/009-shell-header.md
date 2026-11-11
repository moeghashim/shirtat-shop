---
id: 009
title: Refine the responsive shell header
milestone: v0.1-design-system-shell
category: shell
priority: medium
files: ["src/routes/(main)/dashboard/route.tsx", "src/routes/(main)/dashboard/-components/header/"]
---

## Acceptance criteria
- [x] Rebuild header hierarchy, spacing, route context, and actions using tenboards tokens.
- [x] Keep mobile navigation, account demo controls, theme access, and content-width behavior functional.
- [x] Avoid duplicate search entry points where the sidebar already supplies them; preserve discoverability on mobile.
- [x] Verify long titles, narrow widths, keyboard focus, and both themes.
- [x] Build, check, typecheck, smoke, and screenshot matrix pass.

## Suggested approach
Inspect the existing route/layout seam and extract a focused header component only if it simplifies ownership. Do not add real auth or account behavior.

## Execution order
Header layout follows finalized sidebar dimensions and navigation.

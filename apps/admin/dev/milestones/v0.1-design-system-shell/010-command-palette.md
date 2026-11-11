---
id: 010
title: Connect a searchable command palette across all routes
milestone: v0.1-design-system-shell
category: shell
priority: high
files: ["src/routes/(main)/dashboard/-components/header/search-dialog.tsx", "src/navigation/", "src/routes/__root.tsx"]
---

## Acceptance criteria
- [x] Search retained routes from a shared route catalog, including standalone app and legacy routes.
- [x] Open from sidebar search and ⌘K/Ctrl+K across routes without duplicate event handlers.
- [x] Support keyboard navigation, Escape, focus return, empty results, and accessible labeling.
- [x] Navigate accurately, close after selection, and avoid capturing shortcuts while inappropriate modal interactions are active.
- [x] Build, check, typecheck, route-search smoke, and screenshot matrix pass.

## Suggested approach
Inspect the current search implementation and share catalog data with navigation/capture tooling where appropriate; avoid a new runtime dependency.

## Execution order
Final shell entry points are known before expanding palette behavior.

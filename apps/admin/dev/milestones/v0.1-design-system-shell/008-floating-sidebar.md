---
id: 008
title: Rebuild the sidebar to match the locked reference
milestone: v0.1-design-system-shell
category: shell
priority: high
files: ["src/routes/(main)/dashboard/-components/sidebar/", "src/navigation/sidebar/sidebar-items.ts", "src/routes/(main)/dashboard/route.tsx"]
---

## Acceptance criteria
- [x] Match the floating rounded panel, inset canvas, hairline border, soft shadow, workspace row, and collapse control from the reference.
- [x] Add full-width search pill with ⌘K chip opening the existing palette; flat primary rows use outline icons and soft filled active/hover pills.
- [x] Map Dashboards and Pages to collapsible sections while retaining links to every screen.
- [x] Add bottom-pinned demo status/progress card and Settings/help/docs/feedback actions with truthful copy and working destinations.
- [x] Preserve icon collapse, mobile sheet, keyboard access, visible focus, and dark-mode visual language.
- [x] Build, check, typecheck, smoke, and screenshot matrix pass.

## Suggested approach
Use the existing search dialog as a seam until task 010 expands it. Do not duplicate nav metadata or restyle dashboard content. Compare directly to docs/design-refs/sidebar-reference.png.

## Execution order
Sidebar defines shell geometry and supplies palette and settings entry points.

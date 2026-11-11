---
id: 011
title: Redesign the layout-settings panel
milestone: v0.1-design-system-shell
category: shell
priority: medium
files: ["src/routes/(main)/dashboard/-components/header/layout-controls.tsx", "src/lib/preferences/", "src/stores/preferences/"]
---

## Acceptance criteria
- [x] Expose rebuilt presets, theme, font, sidebar variant/collapse, and content width with clear labels and accessible controls.
- [x] Keep existing preference persistence and provide a predictable reset to tenboards defaults.
- [x] Verify preview/application, reload persistence, mobile sheet fit, and light/dark appearance.
- [x] Preserve sidebar reference language across supported variants and resolve incompatible options visibly.
- [x] Build, check, typecheck, preference smoke, and screenshot matrix pass.

## Suggested approach
Reuse established preference contracts. Read craft-floor and verify rendered panel states; avoid new persistence keys unless approved via open-questions.

## Execution order
Customizer is finalized after the shell and presets it controls.

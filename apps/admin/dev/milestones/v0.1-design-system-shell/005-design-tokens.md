---
id: 005
title: Define accessible tenboards design tokens
milestone: v0.1-design-system-shell
category: design-system
priority: high
files: ["src/styles/styles.css", "src/lib/preferences/theme.ts", "DESIGN.md"]
---

## Acceptance criteria
- [x] Define semantic color, type, spacing, radius, shadow, and 150–200ms motion tokens in light and dark.
- [x] Use Geist Sans/Mono defaults while preserving the font registry; metrics use tabular numerals.
- [x] Document supported foreground/background pairs and verify WCAG AA contrast, including interactive focus and disabled-state distinctions where applicable.
- [x] Respect prefers-reduced-motion and preserve existing shadcn variable compatibility.
- [x] Avoid dashboard/widget redesign; attach before/after light/dark desktop/mobile captures.
- [x] Build, check, typecheck, and dashboard smoke pass.

## Suggested approach
Read craft-floor before edits. Inspect token/preference seams and prefactor only to reduce change risk. Use neutral-first surfaces and one accent; support restrained borders, radii, and shadows.

## Execution order
Tokens are the foundation for brand, presets, and all shell components.

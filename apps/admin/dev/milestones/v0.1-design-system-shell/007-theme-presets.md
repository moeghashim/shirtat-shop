---
id: 007
title: Rebuild presets on tenboards tokens
milestone: v0.1-design-system-shell
category: design-system
priority: high
files: ["src/styles/presets/", "src/lib/preferences/", "src/scripts/generate-theme-presets.ts", "src/stores/preferences/"]
---

## Acceptance criteria
- [x] Replace Tangerine, Neo Brutalism, and Soft Pop with cohesive tenboards presets using the new token system.
- [x] Keep the customizer and font registry; migrate obsolete persisted preset selections to a valid default.
- [x] Verify all new presets in light/dark, including semantic contrast and focus states.
- [x] Keep SSR and hydration preference behavior consistent.
- [x] Build, check, typecheck, preset generation, smoke, and screenshot matrix pass.

## Suggested approach
Inspect existing preset generation and persistence before making a narrowly scoped migration helper. Document final presets in DESIGN.md.

## Execution order
Stable preset contracts prevent shell work from relying on discarded colors.

---
id: 006
title: Create the tenboards identity and assets
milestone: v0.1-design-system-shell
category: design-system
priority: medium
files: ["src/components/brand/", "src/config/app-config.ts", "src/routes/__root.tsx", "public/", "README.md"]
---

## Acceptance criteria
- [x] Create an SVG mark and tenboards wordmark, favicon, and OG asset.
- [x] Replace residual Studio Admin branding in the shipped app and active project documentation.
- [x] Preserve mandatory upstream copyright and explicitly archived provenance documents.
- [x] Verify accessible names, small-size legibility, dark/light contrast, and metadata asset URLs.
- [x] Build, check, typecheck, smoke, and before/after screenshot matrix pass.

## Suggested approach
Use the established tokens and DESIGN.md. Inspect auth routes for branding references; if changes touch auth behavior or exceed approved brand scope, file a question and pause. Do not change auth logic.

## Execution order
Identity uses finalized tokens and is ready for the rebuilt shell.

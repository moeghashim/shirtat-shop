# 005 — shadcn registry and llms.txt

Status: merged (#82). Branch: `feat/v0.9/005-registry-llms`. Depends on 001; final docs after 004.

## Scope

- `registry.json` describing each block (and its token/chart-helper dependencies) using the existing `shadcn` package; `npm run registry:build` outputs static JSON into `public/r/`, served by the Worker's ASSETS (`/r/<block>.json`).
- Registry items declare required CSS variables/tokens so an external project gets a working, on-theme block, not just markup.
- `/llms.txt` and `/llms-full.txt` in `public/`: what tenboards is, blocks with one-line purposes and registry URLs, generators, skills, docs links. Generated from source by a script so they cannot drift; a check fails if stale.
- Kit page links each block to its registry URL and `npx shadcn add` command.

## Acceptance criteria

- [x] `npx shadcn add <preview-url>/r/stat-card.json` (and one chart block) installs into a scratch Vite+shadcn project and renders correctly (evidence).
- [x] `/llms.txt` and `/llms-full.txt` are served by the preview Worker and match a fresh generation; staleness check wired into `npm run check`.
- [x] Preview Worker remains ASSETS-only with no secrets.
- [x] README (registry + llms sections), CHANGELOG draft, milestone status; preview in PR.

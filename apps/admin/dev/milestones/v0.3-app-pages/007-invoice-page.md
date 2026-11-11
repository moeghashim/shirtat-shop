---
id: "007"
title: Restyle Invoice and fix hydration
milestone: v0.3-app-pages
status: merged
category: ui
files: ["src/routes/(main)/dashboard/invoice/", "README.md", "dev/milestones.json"]
---

## Scope

Routes: `/dashboard/invoice`, including editor, preview and print presentation.

- Restyle page actions, client/issuer fields, invoice details, line items, tax/discount adjustments, totals and preview paper. Preserve current form schema, validation, calculations, edit interactions and print behavior.
- Diagnose the recorded text hydration mismatch across `data.ts` module-clock defaults, date formatting and preview/print paths. Keep date fields editable and actual financial calculations unchanged; do not present speculative causes as verified fixes.
- Replace issuer `Arham Khan` and any related author-specific identity in the form, preview and print with a neutral demo issuer. Preserve demo status; Save/Send placeholders must not gain real side effects.

## Before implementation

Read dev/MAINTAINERS.md, PLAN.md end to end (Decisions log wins; §7 governs), PRODUCT.md and DESIGN.md. Use Impeccable in Operate mode, run its context once per session from the repo root, inspect incumbent renders and local/Base UI wrappers, and read `reference/craft-floor.md` immediately before UI edits. Preserve existing demo behavior and all screens. Read current official TanStack documentation before any routing/framework change.

Prefactor inspection: Inspect date defaults/formatters, form initialization, paper/preview/print sharing and current positioning hook. Isolate a narrow shared formatter/default contract only where it removes the proven mismatch.

## Acceptance criteria

- [x] No React #418 hydration error in dev or Workers preview, light/dark × desktop/mobile.
- [x] Root-cause fix only: no suppressHydrationWarning, no SSR disabling, no frozen clocks. Direct/refresh and delayed hydration pass under real time and differing server/browser timezones; editable invoice dates retain their meaning.
- [x] Add/remove/update line items, quantity/price, taxes, discounts, client selection and totals work as before; preview and print agree and stay legible with long addresses and multi-line descriptions.
- [x] Print evidence verifies page fit, readable totals and issuer identity; mobile editor/preview controls remain reachable without clipping.
- [x] Every issuer/name/email fixture is neutral; resolve the Invoice hydration entry with linked verification only after dev and Workers pass.
- [x] Capture and inspect before/after with `npm run screenshots` for every affected URL in light/dark × desktop (1440×900)/mobile (390×844); attach a four-state comparison table per route plus meaningful interaction/variant states. Store captures, reports and logs only on `pr-assets` or PR attachments, never main. For foundation/acceptance, compare their limited changes and integrated baseline explicitly; do not invent visual changes.
- [x] `npm run build`, `npm run check` and `npm run typecheck` pass. Report inherited warnings separately from failures; baseline failures are not a passing gate.
- [x] Dev `/dashboard/default` and every owned route smoke without console errors; repeat on the Workers version preview, including iframe contents and refresh where relevant. Existing errors on an owned page cannot be waived.
- [x] Upload with `npm run preview:deploy -- --preview-alias pr-NNN` (actual PR number); include the version-specific preview URL and reusable alias in the PR. Never run `npm run deploy`.
- [x] Update root README.md for verified screens/behavior/commands/status and state `README: updated (sections …)` in the PR. Tick this file and update `dev/milestones.json` only from evidence.
- [x] Preserve keyboard access, accessible names, visible focus, reduced motion and all four presets. Check relevant changed foreground/background, status and meaningful graphic pairs for WCAG AA; record measured contrast for token/preset changes. Keep font/preferences registries, v0.1 shell and `src/components/ui/` intact. Reuse shared dashboard primitives and chart theme where applicable, without adding decorative charts.

## Execution order and delivery

After 006 by default (hard dependency 001). Resolve the second date-heavy page and reuse the proven heading/form presentation conventions.

One approved task per branch `feat/v0.3/NNN-slug` and PR targeting main. Prefer updated main after predecessors merge; declare any approved stack, base PR, merge order and layer compare URL. One commit per stacked layer; use Conventional Commits and `git commit -s` for DCO, ending with a blank line and `Co-Authored-By: GPT-6-Astra <noreply@openai.com>`. Claude Opus 5.5 reviews and holds delegated squash-merge/rebase authority; the implementer never merges, deploys production, or creates tags/releases.

Do not edit PLAN.md or generated route/build/Worker files. No new runtime dependencies, auth behavior changes, or structural calendar edits without escalation/reviewer approval. Record blockers in `dev/open-questions.md`, pause dependent work and finish independent work. This planned task does not authorize implementation before breakdown approval.


## Verification — batch A

Proven root cause: module-clock defaults produced October 23 in server Chicago and October 24 in browser Kiritimati, changing Issued Date during hydration. A narrow createDefaultInvoiceValues(requestTimestamp) prefactor now emits UTC civil strings through the route loader; form/math schemas and editable civil dates remain intact. No suppressHydrationWarning, SSR disabling or frozen clock. The print portal also previously remained visible in normal document flow, widening mobile to 816px; route-local print CSS hides it on screen and isolates it for Letter output.

Dev delayed direct/refresh passes 16/16 invoice/default cases and final Invoice 8/8. Workers delayed direct/refresh passes Kiritimati interactions 8/8 and Chicago invoice/default 16/16. All four presets pass 4/4 form scenarios each. Both dates edit correctly; known totals $6,003.20 → $2,538.18 → $945.18, client/address, multiline descriptions, item reorder/cancel and add/remove pass. Preview/print text agrees. Four dev plus eight Workers PDFs render as one Letter page with readable total and Jordan Lee issuer; paper body/footer/header contrast exceeds 4.5:1. Build/check/typecheck and 280 semantic contrast pairs pass. Inherited warnings are retained separately.

Evidence: https://github.com/moeghashim/tenboards/tree/pr-assets/v03-007. Version: https://0befc4c3-tenboards.mohanadgh.workers.dev; alias v03-007 per batch brief. README Invoice section updated; no runtime dependencies, protected wrappers, financial calculation changes or new save/send side effects. Task 008 remains planned.

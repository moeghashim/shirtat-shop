# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers who clone an admin dashboard starter for SaaS products, admin panels, and internal tools. The template's demo lets them evaluate screens and customize a working foundation.

## Product Purpose

tenboards upgrades the full MIT-licensed TanStack Start dashboard fork with a coherent design system first, then a real backend with a zero-configuration demo fallback. Success means a developer can clone, install, and run every retained screen without environment variables.

## Operating Context

Use npm and Node 22+. `npm install` followed by `npm run dev` serves the demo at port 3000. The public demo runs on Cloudflare Workers. PR version previews support review without replacing production.

## Capabilities and Constraints

Keep all ten dashboards, legacy v1 variants, mail, chat, calendar, kanban, invoice, files, products, users, roles, profile, and all auth variants. Preserve route colocation and the preferences system, including the font registry. Existing mock data powers the current demo; it is not evidence of real customers or operational results.

Postgres/Drizzle on Neon is planned for v0.4, Better Auth for v0.5, and Hyperdrive production integration for v0.6. These are future capabilities, not implemented claims. RBAC, multi-tenancy, i18n/RTL, real CRUD, and broader tests/CI each need a later planning round.

## Brand Commitments

tenboards is the product name. Preserve the upstream MIT copyright and README attribution; do not add an upstream remote. PLAN.md §7 and its Decisions log govern the approved design upgrade, including its locked sidebar reference.

## Evidence on Hand

PLAN.md is the canonical, user-approved brief. The full imported implementation and demo fixtures are available in src/. The locked sidebar image is docs/design-refs/sidebar-reference.png. docs/upstream-AGENTS.md archives provenance, not current instructions.

## Product Principles

- Preserve screen coverage and working behavior throughout the design upgrade.
- Make the starter useful with no backend configuration.
- Keep customization consistent across modes and presets.
- Separate demo data from claims about production functionality.

## Accessibility & Inclusion

Supported foreground/background token pairs must pass WCAG AA in light and dark. Respect reduced motion, keyboard navigation, visible focus, accessible names, and responsive layouts.

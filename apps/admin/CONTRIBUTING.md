# Contributing to tenboards

Thanks for showing interest in improving **tenboards** (repo: `tenboards`).
Follow [dev/MAINTAINERS.md](dev/MAINTAINERS.md) for task branches, required checks, screenshot evidence, PR structure, and reviewer merge authority. PLAN.md and its Decisions log are authoritative.

---

## Overview

This project is built with **TanStack Start**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Shadcn UI**.
The goal is to keep the codebase modular, scalable, and easy to extend.

---

## Project Layout

We use a **colocation-based file system**. Each feature keeps its own routes, components, and logic.

```text
src
├── routes                  # TanStack Router routes
│   ├── (external)          # External routes
│   ├── (main)              # Main application routes
│   │   ├── auth            # Auth layouts and screens
│   │   ├── chat            # Chat screen
│   │   ├── mail            # Mail screen
│   │   └── dashboard       # Dashboard layout and screens
│   └── __root.tsx          # Root document and providers
├── components              # Shared components
├── hooks                   # Reusable hooks
├── lib                     # Configuration and utilities
├── navigation              # Sidebar navigation
├── server                  # Server functions
├── stores                  # Global stores
└── styles                  # Tailwind and theme setup
```

Files and folders prefixed with `-`, such as `-components`, are excluded from route generation and can be colocated with their route.

---

## Getting Started

### Fork and Clone the Repository

1. Fork the Repository

   [Fork the repository](https://github.com/moeghashim/tenboards/fork).

2. Clone the Repository

   ```bash
   git clone https://github.com/YOUR_USERNAME/tenboards.git
   ```

3. Navigate into the Project

   ```bash
   cd tenboards
   ```

4. Install dependencies

   ```bash
   npm install
   ```

5. Run the development server

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Contribution Flow

- Always create a new branch before working on changes:

  ```bash
  git checkout -b feature/my-update
  ```

- Use clear commit messages:

  ```bash
  git commit -m "feat: add finance dashboard screen"
  ```

- Open a pull request once ready.
- Include a screenshot in the pull request when adding or changing a UI screen.

---

## Where to Contribute

- **External Routes:** Non-dashboard routes → `src/routes/(external)/`
- **Auth Screens:** Login, register, and authentication layouts → `src/routes/(main)/auth/`
- **Dashboard Screens:** CRM, Finance, Analytics, and other dashboards → `src/routes/(main)/dashboard/`
- **Components:** Reusable UI → `src/components/`
- **Hooks:** Shared logic → `src/hooks/`
- **Server Functions:** Server-side operations → `src/server/`
- **Themes:** New presets → `src/styles/presets/`

---

## Guidelines

- Prefer **TypeScript types** over `any`.
- Keep feature components in the route's `-components` folder.
- Do not manually edit `src/routeTree.gen.ts`.
- Husky pre-commit hooks are enabled. Theme presets are generated and staged files are checked automatically.
- Follow **Shadcn UI**, Base UI, and Tailwind CSS v4 conventions.
- Keep accessibility in mind, including ARIA labels and keyboard navigation.
- Use clear commit messages with conventional prefixes such as `feat:`, `fix:`, and `chore:`.
- Avoid unnecessary dependencies and prefer existing utilities.

---

## Submitting PRs

- Open a pull request once your changes are ready.
- Ensure your branch is up to date with `main` before submitting.
- Reference any related issue in your pull request for context.

---

## Questions & Support

Report bugs, suggestions, or issues through [GitHub Issues](https://github.com/moeghashim/tenboards/issues).

---

Your contributions keep this project growing. 🚀

**Happy Vibe Coding!**

## Isolated previews and production ownership

Use `npm run preview:deploy -- --preview-alias pr-NNN`. The command checks input
files/environment, builds with a stripped environment, generates an independent
ASSETS-only config and verifies remote version bindings/secrets before upload.
It accepts only `tenboards-preview`; never override the name or upload PR versions
to `tenboards`. Move local `.env*` (except `.env.example`) and `.dev.vars*` files
outside the checkout and unset DB/auth/provider/build-override variables first.

On first use, add `--initialize` to create only the separate demo Worker. Existing
remote secrets or service/database bindings are a hard failure, not an invitation
to remove production resources. Every PR supplies the immutable URL and alias.
The root production config has an inactive Hyperdrive slot: before the reviewer
adds the real ID, a binding-less/no-secret deployment remains demo. A secret without
a binding/URL fails closed. The reviewer alone provisions production, handles
secret/deployment ordering, merges, deploys main and releases.


## Design guardrails and page verification (v0.9 / 003)

Run `npm run check:design:test` and `npm run verify:page:test` when changing the design/verifier tooling, alongside the standard build/check/typecheck floor. For a page change, run `npm run verify:page -- /your/route --base-url http://127.0.0.1:3000`; `--all` verifies the capture catalog. First install the existing Playwright Chromium browser with `npx playwright install chromium` if it is missing.

Use `@/components/blocks` for cards and page headings, `@/components/blocks/charts` for chart primitives, and named DESIGN.md token classes. [Design guardrails](docs/design-guardrails.md) documents the deliberately bounded heuristics, exceptions and report format. Add an exception only with an exact file/value/count and a reason explaining why an existing block/token cannot represent the requirement; never add a blanket directory exclusion. Remove stale exceptions as their usages migrate.

Page verification records all axe/runtime failures and exits nonzero. Log inherited axe findings separately in `dev/open-questions.md` with route/theme/viewport, rule, affected selectors and report links; do not silently suppress them or restyle existing pages in a tooling task. The reviewer assesses those inherited findings separately from regressions. Keep `verify/` and `screenshots/` artifacts on `pr-assets` or PR attachments.

Design exceptions in `scripts/design-exceptions.json` are for inherited code only. New pages and generator output must use tokens or blocks; do not add exceptions. CSS variable references and grid track templates are already permitted.

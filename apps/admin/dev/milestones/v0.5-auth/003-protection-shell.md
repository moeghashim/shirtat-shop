---
id: "003"
title: Protect all app entry points and show the signed-in shell user
milestone: v0.5-auth
status: merged
category: auth
files: ["src/lib/auth/", "src/routes/(main)/dashboard/", "src/routes/(main)/mail/route.tsx", "src/routes/(main)/chat/route.tsx", "src/routes/(external)/index.tsx", "src/routes/__root.tsx", "src/server/server-actions.ts", "scripts/auth-protection-check.ts", "README.md", "docs/auth.md", "dev/milestones.json"]
---

## Goal and scope

Make authentication enforceable at both navigation and server-function boundaries. Cover every app page/dashboard, aliases, standalone Mail/Chat and iframe wrappers while keeping auth/system errors public. Show the actual current user and sign-out in the existing shell account menu.

## Files and ownership

- `src/lib/auth/`: shared route guard and server-function require-session middleware/helper using 001 session resolution and 002 redirect logic.
- Dashboard parent, child/legacy loaders, index and splat; standalone Mail/Chat route files and dashboard wrappers: guard plumbing only, no content restyles or data-model changes.
- Dashboard `-components/header/shell-header.tsx`, `account-switcher.tsx` and a route-local signed-in menu if needed: mode-specific identity and sign-out. The existing switcher is the nav-user equivalent.
- Root/index and `src/server/server-actions.ts` only where alias/public-boundary auditing requires it; preserve public root rendering and validated preferences.
- `scripts/auth-protection-check.ts`: complete route and callable-function inventory, direct HTTP checks and shell/iframe interactions; docs/status.

## Before implementation

Prefactor inspection: reuse one `beforeLoad` helper on the existing dashboard/Mail/Chat ancestors instead of moving the whole tree into a new layout. Inspect parent loader ordering and every data `createServerFn`; apply a shared server-side assertion before each read. Separate the dashboard splat's public rendering from its current inherited account loader. Model shell props as demo versus authenticated identity so demo accounts cannot accidentally appear in auth mode; avoid a generic account-management abstraction.

## Acceptance criteria

- [x] Every row of the milestone route matrix passes on direct SSR, refresh and client navigation: all 14 current/legacy dashboards, all app pages including Coming Soon, `/mail`, `/chat`, both dashboard wrappers and root/dashboard aliases. Signed-out requests reach canonical login with a validated attempted destination before app data is rendered or fetched successfully.
- [x] Every callable app-data server function independently checks the actual request session before invoking a read. Audit all 22 read domains and their multiple route/variant call sites, including shell accounts, Profile, legacy dashboards and standalone Mail/Chat. Signed-out/expired/revoked/tampered requests reject safely even when invoked directly without a route guard; valid requests succeed.
- [x] Auth screens, bare V2, `/unauthorized`, root error/not-found and dashboard splat remain public. Public error rendering does not execute protected account/data loaders or leak cached data. Do not exempt a broad dashboard prefix; actual app paths remain protected. Auth service errors fail closed rather than becoming null/demo sessions.
- [x] Keep the auth handler public with library endpoint checks; retain safe mode/session bootstrap and allowlisted UI preferences. Audit unrelated server functions for bypasses without adding RBAC or changing v0.4 domain parity/CLI semantics.
- [x] Auth-on header account control uses current name/email/initials and working Sign out, with no demo switching. Demo mode retains the existing demo menu/accounts. Preserve menu accessible names, keyboard selection, Escape/focus return and narrow-screen layout; long names/emails do not break the header.
- [x] Account menu links to Profile; 004 changes its destination to the new account tab when that tab exists. Do not ship a dead account-tab link in this layer. Sign-out clears route/user data and the next protected request fails; other open views revalidate on navigation/refocus rather than retaining authority from a stale client session.
- [x] Both standalone documents and iframe wrappers require a session. Valid same-origin cookies reach the inner document; signed-out direct iframe URLs cannot disclose data. Expiration while a wrapper is open yields a usable login flow, not an iframe redirect loop. Existing theme/preset/focus and layout cookies work in both modes.
- [x] Responses carrying identity/app data are not publicly cached. Existing v0.4 reads/seed output and all demo behaviors remain intact; no directory role, sample Profile or selected demo account becomes an auth identity.

## Tests

- Enumerate generated visual routes and all server functions; map each to a protected/public reason and fail on unclassified additions. Exercise all protected pages as signed out and signed in, with legacy variants and alias normalization.
- Directly call every app-data server-function endpoint with valid inputs but no cookie, expired/revoked/tampered cookies and a valid session. Assert rejection precedes the read and no records appear; a UI-only login redirect is not evidence. Check valid-session DB failures separately.
- Test public 404/error/unauthorized with no cookie, including `/dashboard/missing-page`, and verify neither shell accounts nor protected data are returned. Test app-to-auth-to-app return paths including open-redirect attempts.
- Exercise shell sign-out, back/refresh/client navigation, two contexts, standalone/embedded communication routes, and menu keyboard/long-name/focus states. Capture four-state demo/auth shell and iframe evidence.
- Run [common gates](README.md#test-floor-and-evidence), full data parity, no-secret DB-open regression, forced-demo/secret failure and zero-env Workers demo smoke. UI edits follow Impeccable; no protected-wrapper/token redesign.

## Execution order and delivery

Depends on 001–002. Merge before 004. Follow [delivery rules](README.md#stack-and-merge-order), update README with actual coverage and authentication-versus-authorization limits, link preview/evidence and set status only from verification.

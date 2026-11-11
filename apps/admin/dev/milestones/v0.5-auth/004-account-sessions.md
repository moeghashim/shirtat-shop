---
id: "004"
title: Add Profile account settings and active-session management
milestone: v0.5-auth
status: merged
category: auth
files: ["src/routes/(main)/dashboard/profile/", "src/routes/(main)/dashboard/-components/header/", "src/lib/auth/", "scripts/auth-account-check.ts", "README.md", "docs/auth.md", "dev/milestones.json"]
---

## Goal and scope

Add a focused Account & security tab to the existing Profile page for the current sign-in identity. Support name editing, credential-password change and active-session revocation while all six existing Profile tabs continue to read v0.4 sample employee data.

## Files and ownership

- Profile `route.tsx` and new colocated `-components` account form/session list: validated `tab=account`, accessible presentation and state handling.
- Header account menu: direct link to `/dashboard/profile?tab=account` using the 003 signed-in identity seam.
- `src/lib/auth/`: current-user account/session projection, credential capability and owned-session revocation helpers. Use Better Auth APIs; no direct password/token mutation SQL.
- `scripts/auth-account-check.ts`, README, auth guide and registry: tests and verified user-facing documentation. No edits to v0.4 Profile schema/fixtures/read contract.

## Before implementation

Prefactor inspection: Profile already has a loader-backed sample record and six tabs. Keep that seam and add a separate typed auth-account result; do not replace the sample record with a user DTO or relabel its employment data as the user's. Extract small name/password/session sections only to separate pending/error lifecycles. Inspect local Field, Tabs, Button and confirmation wrappers before using them; keep shared wrappers intact.

## Acceptance criteria

- [x] Add auth-only seventh Account & security tab, directly addressable via validated `?tab=account` and shell menu link. Default remains Overview; existing six tabs/data/actions remain intact. Demo retains six tabs and safely handles the account query without any auth calls. Clearly distinguish Your sign-in account from sample employee content.
- [x] Current user's name is editable with trimmed, nonempty, bounded validation; email is read-only. Save has pending/error/success states, persists through Better Auth, survives reload and refreshes header initials/name. No supplied user ID can select another identity or a v0.4 record.
- [x] Detect credential capability using server-side account information; never serialize password hashes/provider tokens. Credential users can change password with current/new/confirm fields and server-aligned validation. OAuth-only users see explanatory text, no password-setting/reset controls. Wrong current password and fresh-session requirements produce safe recoverable feedback.
- [x] Successful password change invalidates the old credential, accepts the new credential and revokes other sessions. Follow the documented current-session outcome; clear password inputs and refresh session state. Do not add forgot/reset, verification, email changes or account-linking flows.
- [x] List only the caller's active sessions with safe IDs, available device/browser description, creation/expiry and Current session marker. No raw token, OAuth credential, fingerprinting service or new parser dependency. Present loading, failure/retry and empty/expired states; wrap rows/actions on mobile.
- [x] Revoke validates current session and same-origin mutation request, resolves the supplied session ID within that user's active list, then calls Better Auth. Reject cross-user/forged IDs; handle already-revoked rows safely. A different browser's next protected request fails immediately; current-session revoke follows sign-out and clears stale UI state.
- [x] Cookie-setting server API calls propagate Set-Cookie correctly; custom server-function mutation boundaries do not rely on client guards or assume Better Auth HTTP origin/rate checks apply automatically. Keep credential/name mutations on the Better Auth HTTP client path, document any wrapper protection explicitly.
- [x] Forms have labels, field errors, focus recovery, pending announcements and success feedback. Revocation confirmation names the target session and is keyboard operable. Preserve light/dark, reduced motion, supported tokens, all six original tabs and shell geometry.

## Tests

- Real Docker auth with two users and multiple independent browser contexts: name save/reload/header update, OAuth-only capability state, wrong-current/new-password validation, old-password rejection and new-password login. Obtain OAuth-only test identity through an isolated supported fixture seam; do not label it a completed real-provider login.
- Revoke another session and prove its next route and direct data-server-function requests fail; revoke current session and prove sign-out; attempt a different user's ID and confirm neither session is affected. Test stale rows, service failure/retry and expired/fresh-session behavior.
- Verify no writes to sample Profile/directory tables and full v0.4 parity. Capture existing six tabs in demo and new account name/password/session/error/confirmation states in auth mode, light/dark × desktop/mobile, including keyboard/focus/long-name content.
- Run [common gates](README.md#test-floor-and-evidence), including `npm run screenshots`, required build/check/typecheck and version-preview demo smoke. Use Impeccable context/craft floor before UI edits and attach before/after evidence.

## Execution order and delivery

Depends on 001–003. Merge before 005. Follow [delivery rules](README.md#stack-and-merge-order); update README/Profile and auth documentation, evidence-backed acceptance/status, preview URL/alias. No production deployment or release.

---
id: "002"
title: Connect shared V1 and V2 sign-in and registration flows
milestone: v0.5-auth
status: merged
category: auth
files: ["src/lib/auth/", "src/routes/(main)/auth/-components/", "src/routes/(main)/auth/v1/", "src/routes/(main)/auth/v2/", "scripts/auth-flows-check.ts", "README.md", "docs/auth.md", "dev/milestones.json"]
---

## Goal and scope

Wire all four retained auth forms to one real flow contract, with optional Google/GitHub, remember me and safe return destinations. Preserve distinct V1/V2 presentation and visual-only demo behavior. Supply shared sign-out behavior for the shell owner in 003; do not redesign the shell here.

## Files and ownership

- Shared `login-form.tsx`, `register-form.tsx` and `social-auth/`: RHF/Zod validation, asynchronous states, conditional Name field and GitHub button matching the incumbent Google treatment.
- V1 login/register routes, V2 login/register routes and `-components/auth-frame.tsx`: mode/provider props, search validation and variant-preserving cross-links; preserve V2 request-year loader.
- `src/lib/auth/`: shared pure redirect validator, client flow/error helpers, session invalidation/sign-out behavior using the 001 boundary.
- `scripts/auth-flows-check.ts`: focused Playwright/API checks; README and auth guide describe only working behavior.

## Before implementation

Prefactor inspection: both variants already share RHF forms; extend those rather than fork forms by route. Google placement differs between V1 and V2, so isolate a small provider-controls component only if it removes repeated enabled/pending/empty-divider logic. Extract a safe submit/error adapter from the demo JSON-toast callbacks. A pure redirect helper gives both route and OAuth consumers one independently testable policy.

## Acceptance criteria

- [x] V1/V2 login/register submit to Better Auth when auth is on. Registration includes Name, email, password and confirmation; email/password remains available regardless of OAuth configuration. Server and client validation agree; confirmation is never sent as an account field. Successful signup establishes a session and follows the safe destination.
- [x] Implement inline field and form errors for malformed input, wrong credentials, duplicate registration, network/service failure and rate limiting. Pending states prevent duplicate submissions and announce progress; focus/error associations, password-manager autocomplete and keyboard submission work. Never echo submitted passwords/confirmation or raw server errors.
- [x] Both Google/GitHub controls render independently from server-provided complete-pair flags. GitHub uses installed `simple-icons` and the existing Google button style. Hide absent providers and empty dividers in auth mode; do not leave disabled provider buttons suggesting unavailable setup.
- [x] Use Better Auth's provider flow and configured callback base. Preserve the validated app return path across provider initiation and error/retry; validate all callback destinations server-side too. Cancellation/denial returns to a usable auth screen with safe feedback. No custom OAuth token exchange or account-linking UI.
- [x] Wire the initially unchecked Remember me control explicitly to `rememberMe`; auth-on label is truthful about the selected lifetime policy. Verify persistent versus session-cookie attributes and sign-out invalidation, not just form state. Document OAuth/signup persistence separately rather than implying the email checkbox controls them.
- [x] Implement the milestone's shared redirect policy: canonical `/auth/v1/login`, fallback `/dashboard/default`, valid relative app path/search/hash, rejection of absolute/protocol-relative/backslash/control/encoded bypass and auth/API loops. Both variants retain a safe destination across login/register links and success; already-signed-in login/register visits go there without flashing a form. Bare V2 remains a public layout state.
- [x] Shared sign-out invokes the real endpoint, clears stale route/session state only on success and returns to canonical login; errors retain a retryable signed-in state. Prove via the library/client test even before the shell entry lands in 003.
- [x] Demo remains public and visual-only: existing field set/layout and validation interaction, new decorative GitHub beside Google, no auth endpoint call/session/write/redirect. Replace credential-bearing demo toast with a safe demonstration acknowledgment. Preserve V2 copyright hydration and all other copy/layout except changes needed to describe actual auth-mode behavior.

## Tests

- Real Docker auth: submit all four forms; signup/session, login/wrong-password, duplicate registration, missing/invalid inputs, pending double-submit, failure/retry, sign-out and refresh. Verify no secret values appear in toasts/logs/hydration payloads.
- Provider matrix on every variant: neither, Google only, GitHub only, both, each incomplete pair; generate provider authorization URLs with dummy test credentials and inspect registered `redirect_uri`/safe callback state without contacting a real account or claiming completed provider login.
- Redirect table tests and browser direct/refresh/cross-link/signed-in tests include query/hash, `https://evil.example`, `//evil.example`, backslashes, encoded separators, double encoding, control characters and auth/API loops.
- Cookie tests distinguish session-only and persistent remember-me results; do not serialize session cookies into a new context and call that a browser-close test.
- Run [common gates](README.md#test-floor-and-evidence), full v0.4 parity and four-state before/demo/auth captures for all four forms, bare V2, inline errors and provider states. Delayed V2 direct/refresh in Chicago/Kiritimati passes on dev and Workers demo. Use Impeccable context/craft floor before UI edits.

## Execution order and delivery

Depends on 001. Merge after 001, before 003. Follow [delivery rules](README.md#stack-and-merge-order); record README decision, version preview/alias and verified status. No protected app claim until 003; no production auth activation.

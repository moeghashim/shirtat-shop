import { chromium, type Page } from "playwright";
import postgres from "postgres";

import { callRpc, localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const evidenceDir = process.env.AUTH_EVIDENCE_ROOT
  ? `${process.env.AUTH_EVIDENCE_ROOT}/account`
  : "screenshots/v05-004/auth";
let cases = 0;
const pass = (name: string) => {
  cases++;
  console.log(`PASS ${name}`);
};
const secret = testSecret();
const server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
});
const browser = await chromium.launch();
const db = postgres(localDatabase);
const emails: string[] = [];
const password = testSecret();
const newPassword = testSecret();
const rpcFile = "/src/lib/auth/account-functions.ts";
const dataFile = "/src/routes/(main)/dashboard/projects/-components/workspace-functions.ts";
async function visit(page: Page) {
  await page.goto(`${server.baseURL}/dashboard/profile?tab=account`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Name", { exact: true }).waitFor();
}
try {
  await mkdir(evidenceDir, { recursive: true });
  const a = await browser.newContext({
    extraHTTPHeaders: testHeaders,
    reducedMotion: "reduce",
    userAgent: "Account test browser A",
  });
  const a2 = await browser.newContext({
    extraHTTPHeaders: testHeaders,
    reducedMotion: "reduce",
    userAgent: "Account test browser B",
  });
  const b = await browser.newContext({
    extraHTTPHeaders: testHeaders,
    reducedMotion: "reduce",
    userAgent: "Different user's browser",
  });
  for (const ctx of [a, a2, b]) await cacheCaptureFonts(ctx);
  const emailA = `account-a-${Date.now()}@example.test`,
    emailB = `account-b-${Date.now()}@example.test`;
  emails.push(emailA, emailB);
  const signup = async (ctx: typeof a, email: string) => {
    const response = await ctx.request.post(`${server.baseURL}/api/auth/sign-up/email`, {
      headers: { origin: server.baseURL },
      data: { name: "Account tester", email, password },
    });
    assert.equal(response.status(), 200);
    return (await response.json()).user;
  };
  const userA = await signup(a, emailA),
    userB = await signup(b, emailB);
  const login = async (ctx: typeof a, email: string, credential = password) => {
    const response = await ctx.request.post(`${server.baseURL}/api/auth/sign-in/email`, {
      headers: { origin: server.baseURL },
      data: { email, password: credential },
    });
    assert.equal(response.status(), 200);
  };
  await login(a2, emailA);
  const page = await a.newPage(),
    other = await a2.newPage(),
    outsider = await b.newPage();
  page.setDefaultTimeout(15000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await visit(page);
  await visit(other);
  await visit(outsider);
  const get = async (p: Page) => {
    const result = await callRpc(p, rpcFile, "getAccountDetails", "GET");
    assert.equal(result.ok, true);
    return result.result;
  };
  const details = await get(page),
    outsiderDetails = await get(outsider);
  assert.equal(details.hasPassword, true);
  assert.equal(details.sessions.length, 2);
  assert.equal(outsiderDetails.sessions.length, 1);
  assert.deepEqual(Object.keys(details).sort(), ["hasPassword", "sessions", "status", "user"]);
  for (const session of details.sessions)
    assert.deepEqual(Object.keys(session).sort(), ["createdAt", "current", "description", "expiresAt", "id"]);
  pass("Current-user account/session projections contain only safe fields; two users isolated");
  await page.getByLabel("Name", { exact: true }).fill("  ");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page.getByText("Enter a name of 1–100 characters.", { exact: true }).waitFor();
  assert.equal(await page.getByLabel("Name", { exact: true }).evaluate((el) => el === document.activeElement), true);
  await page.getByLabel("Name", { exact: true }).fill("  Alexandra Example Long Account Name  ");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page.getByText("Name saved.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Signed in as Alexandra Example Long Account Name", exact: true }).waitFor();
  await visit(page);
  assert.equal(await page.getByLabel("Name", { exact: true }).inputValue(), "Alexandra Example Long Account Name");
  assert.equal(await page.getByLabel("Email", { exact: true }).getAttribute("readonly"), "");
  assert.equal((await get(outsider)).user.name, "Account tester");
  pass("Trimmed name save persists/reloads, refreshes header, validates/focuses and leaves other identity unchanged");
  for (const data of [
    { name: " " },
    { name: "x".repeat(101) },
    { name: "Hijack", userId: userB.id },
    { name: "Hijack", email: emailB },
  ]) {
    const response = await a.request.post(`${server.baseURL}/api/auth/update-user`, {
      headers: { origin: server.baseURL },
      data,
    });
    assert.equal(response.status(), 400);
  }
  pass("Direct name bounds and supplied identity/email fields rejected server-side");
  const target = details.sessions.find((s: { current: boolean }) => !s.current);
  const foreign = outsiderDetails.sessions[0];
  for (const id of [foreign.id, "forged-session-id"]) {
    const result = await callRpc(page, rpcFile, "revokeAccountSession", "POST", { id });
    assert.equal(result.result.status, "unavailable");
  }
  assert.equal((await get(page)).sessions.length, 2);
  assert.equal((await get(outsider)).sessions.length, 1);
  for (const origin of ["https://evil.example", ""]) {
    const result = await callRpc(page, rpcFile, "revokeAccountSession", "POST", { id: target.id }, origin);
    assert.equal(result.ok, false);
  }
  assert.equal((await get(page)).sessions.length, 2);
  pass("Cross-user/forged session IDs and forged/missing origins cannot revoke any session");
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 1000 },
      mobile: { width: 390, height: 844 },
    })) {
      await a.addCookies([{ name: "theme_mode", value: theme, url: server.baseURL }]);
      await page.setViewportSize(viewport);
      await visit(page);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${evidenceDir}/account-${theme}-${size}.png`, fullPage: true });
      await page.getByRole("button", { name: "Change password", exact: true }).click();
      await page.getByText("Enter your current password.", { exact: true }).waitFor();
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${evidenceDir}/error-${theme}-${size}.png`, fullPage: true });
      await page
        .locator(`[data-session-id="${target.id}"]`)
        .getByRole("button", { name: "Revoke session", exact: true })
        .click();
      await page.getByRole("button", { name: "Cancel", exact: true }).waitFor();
      await page.waitForFunction(() => document.activeElement?.textContent === "Cancel");
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${evidenceDir}/confirm-${theme}-${size}.png`, fullPage: true });
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.activeElement?.textContent === "Revoke session");
      pass(`Account/error/confirmation ${theme}/${size} with keyboard focus recovery`);
    }
  await page
    .locator(`[data-session-id="${target.id}"]`)
    .getByRole("button", { name: "Revoke session", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm revocation", exact: true }).click();
  await page.getByText("Session revoked.", { exact: true }).waitFor();
  assert.equal((await callRpc(other, dataFile, "loadProjectNavigation", "GET")).ok, false);
  await other.goto(`${server.baseURL}/dashboard/tasks`, { waitUntil: "domcontentloaded" });
  assert.equal(new URL(other.url()).pathname, "/auth/v2/login");
  assert.equal(
    (await callRpc(page, rpcFile, "revokeAccountSession", "POST", { id: target.id })).result.status,
    "unavailable",
  );
  pass("Owned other-session revoke invalidates route and direct RPC; stale ID handled safely");
  await login(a2, emailA);
  await page.getByLabel("Current password", { exact: true }).fill("wrong-password-123");
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password", { exact: true }).fill("mismatch");
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await page.getByText("Passwords do not match.", { exact: true }).waitFor();
  await page.getByLabel("Confirm new password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await page.getByText("The current password is incorrect.", { exact: true }).waitFor();
  pass("Password confirmation/current-password errors are inline and recoverable");
  await page.getByLabel("Current password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Change password", exact: true }).click();
  await page.getByText("Password changed. Other browsers have been signed out.", { exact: true }).waitFor();
  assert.equal(await page.getByLabel("New password", { exact: true }).inputValue(), "");
  assert.equal((await get(page)).sessions.length, 1);
  assert.equal((await callRpc(other, dataFile, "loadProjectNavigation", "GET")).ok, false);
  const currentState = await a.storageState();
  await delay(10200);
  const old = await a2.request.post(`${server.baseURL}/api/auth/sign-in/email`, {
    headers: { origin: server.baseURL },
    data: { email: emailA, password },
  });
  assert.equal(old.status(), 401);
  await login(a2, emailA, newPassword);
  pass(
    "Password change rotates current session, clears inputs, revokes other sessions, rejects old and accepts new password",
  );
  const [currentRow] = await db`select id from auth_session where user_id=${userA.id} order by created_at asc limit 1`;
  await db`update auth_session set created_at = now() - interval '2 days' where id=${currentRow.id}`;
  await page.getByRole("button", { name: "Refresh sessions", exact: true }).click();
  await page.getByRole("button", { name: "Sign in again", exact: true }).waitFor();
  await page.getByRole("button", { name: "Sign in again", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/auth/v2/login");
  assert.equal(new URL(page.url()).searchParams.get("redirect"), "/dashboard/profile?tab=account");
  pass("Fresh-session requirement has working signout/re-login return flow without auth loop");
  await login(a, emailA, newPassword);
  await visit(page);
  const restore = await browser.newContext({ extraHTTPHeaders: testHeaders, storageState: currentState });
  assert.equal(await (await restore.request.get(`${server.baseURL}/api/auth/get-session`)).json(), null);
  await restore.close();
  // Supported isolated adapter fixture: convert only this test-owned account to
  // a provider-only identity. This is capability testing, not an OAuth login.
  process.env.DATABASE_URL = localDatabase;
  process.env.BETTER_AUTH_SECRET = secret;
  process.env.BETTER_AUTH_URL = server.baseURL;
  const { getAuth } = await import("../src/lib/auth/auth.server.ts");
  const auth = getAuth();
  assert.ok(auth);
  const fixture = await auth.$context;
  const credentials = await fixture.internalAdapter.findCredentialAccount(userB.id);
  assert.ok(credentials);
  await fixture.internalAdapter.deleteAccount(credentials.id);
  await fixture.internalAdapter.linkAccount({
    userId: userB.id,
    providerId: "github",
    accountId: `fixture-${userB.id}`,
  });
  await visit(outsider);
  await outsider
    .getByText("You sign in through a provider. Manage your password with that provider.", { exact: true })
    .waitFor();
  assert.equal(await outsider.getByRole("button", { name: "Change password", exact: true }).count(), 0);
  pass("Provider-only supported adapter fixture hides password controls; no real OAuth round-trip claimed");
  // Fail only the account RPC request, then retry against the real server.
  await page.route("**/_serverFn/**", (route) => route.abort());
  await page.getByRole("button", { name: "Refresh sessions", exact: true }).click();
  await page.getByRole("button", { name: "Retry account details", exact: true }).waitFor();
  await page.unroute("**/_serverFn/**");
  await page.getByRole("button", { name: "Retry account details", exact: true }).click();
  await page.getByRole("button", { name: "Revoke current session", exact: true }).waitFor();
  pass("Account service/network failure displays retry and recovers with real data");
  await page.getByRole("button", { name: "Revoke current session", exact: true }).click();
  await page.getByRole("button", { name: "Confirm revocation", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/auth/v2/login");
  assert.equal(await (await a.request.get(`${server.baseURL}/api/auth/get-session`)).json(), null);
  assert.ok(!(await a.cookies()).some((c) => c.name === "better-auth.session_token"));
  assert.equal((await callRpc(page, dataFile, "loadProjectNavigation", "GET")).ok, false);
  pass("Current-session revoke propagates cleared cookie and invalidates direct RPC");
  assert.deepEqual(errors, []);
  await a.close();
  await a2.close();
  await b.close();
  console.log(`Auth accounts: ${cases}/${cases} passing.`);
} finally {
  for (const email of emails) await db`delete from auth_user where email=${email}`;
  await db.end();
  const { closeDatabase } = await import("../src/server/db/client.server.ts");
  await closeDatabase();
  await browser.close();
  await server.stop();
}

import { chromium } from "playwright";
import postgres from "postgres";

import {
  assertSafeError,
  callRpc,
  localDatabase,
  startTestServer,
  testHeaders,
  testSecret,
} from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";

let cases = 0;
const pass = (label: string) => {
  cases++;
  console.log(`PASS ${label}`);
};
// Wrangler rewrites URL-related headers containing its local proxy host.
// A reserved canonical host preserves HTTPS-origin/header semantics in this probe.
const secureOrigin =
  process.env.AUTH_TEST_RUNTIME === "workerd" ? "https://secure.example.test" : testOrigin("https://localhost:3011");
const secret = testSecret();
const password = testSecret();
const db = postgres(localDatabase);
const emails: string[] = [];
let server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: secureOrigin,
});
const browser = await chromium.launch();
try {
  const secureEmail = `secure-cookie-${Date.now()}@example.test`;
  emails.push(secureEmail);
  const secure = await server.api.post("/api/auth/sign-up/email", {
    headers: { origin: secureOrigin },
    data: { email: secureEmail, password, name: "Secure cookie fixture" },
  });
  assert.equal(secure.status(), 200);
  const secureCookie = secure
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value)
    .join(";");
  for (const flag of [
    /__Secure-better-auth.session_token=/,
    /; Secure/i,
    /HttpOnly/i,
    /SameSite=Lax/i,
    /Path=\//i,
    /Max-Age=604800/i,
  ])
    assert.ok(flag.test(secureCookie), "Required secure cookie attribute missing.");
  assert.ok(!/Domain=/i.test(secureCookie), "Unexpected cookie attribute.");
  pass(
    "HTTPS canonical configuration issues actual Secure/HttpOnly/host-only/Lax cookie (loopback HTTP transport checks headers only)",
  );
  await server.stop();
  const config = {
    DATABASE_URL: localDatabase,
    BETTER_AUTH_SECRET: secret,
    BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
  };
  server = await startTestServer(config);
  const context = await browser.newContext({ extraHTTPHeaders: testHeaders });
  await cacheCaptureFonts(context);
  const email = `security-${Date.now()}@example.test`;
  emails.push(email);
  const signup = await context.request.post(`${server.baseURL}/api/auth/sign-up/email`, {
    headers: { origin: server.baseURL },
    data: { email, password, name: "Security fixture" },
  });
  assert.equal(signup.status(), 200);
  const user = (await signup.json()).user;
  const [session] = await db`select id, token from auth_session where user_id=${user.id}`;
  await db`update auth_session set updated_at=now()-interval '2 days', expires_at=now()+interval '1 day' where id=${session.id}`;
  const refreshed = await context.request.get(`${server.baseURL}/api/auth/get-session`);
  assert.equal(refreshed.status(), 200);
  const refreshCookie = refreshed
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value)
    .join(";");
  assert.ok(/HttpOnly/i.test(refreshCookie), "Required cookie attribute missing.");
  assert.ok(/Max-Age=604800/i.test(refreshCookie), "Required cookie attribute missing.");
  const [updated] = await db`select expires_at from auth_session where id=${session.id}`;
  assert.ok(new Date(updated.expires_at).getTime() > Date.now() + 6 * 24 * 60 * 60 * 1000);
  pass("Real session refresh extends DB expiry and propagates persistent HttpOnly cookie");
  for (const [endpoint, data] of [
    ["update-user", { name: "Forged change" }],
    ["change-password", { currentPassword: password, newPassword: testSecret() }],
    ["sign-out", {}],
    ["revoke-session", { token: session.token }],
  ] as const) {
    const result = await context.request.post(`${server.baseURL}/api/auth/${endpoint}`, {
      headers: { origin: "https://evil.example" },
      data,
    });
    assert.equal(result.status(), 403, endpoint);
    assertSafeError(await result.text());
    pass(`Forged Origin rejected: ${endpoint}`);
  }
  const page = await context.newPage();
  const response = await page.goto(`${server.baseURL}/dashboard/default`, { waitUntil: "domcontentloaded" });
  assert.ok(response);
  assert.match(response.headers()["cache-control"], /private.*no-store/);
  const html = await response.text();
  const [account] = await db`select password from auth_account where user_id=${user.id} and provider_id='credential'`;
  for (const privateValue of [secret, password, session.token, account.password, localDatabase])
    assert.ok(!html.includes(privateValue), "Private material leaked into SSR");
  const details = await callRpc(page, "/src/lib/auth/account-functions.ts", "getAccountDetails", "GET");
  assert.equal(details.ok, true);
  assert.match(details.cacheControl, /private.*no-store/);
  const projected = JSON.stringify(details.result);
  for (const privateValue of [secret, password, session.token, account.password, localDatabase])
    assert.ok(!projected.includes(privateValue), "Private material leaked into account projection");
  pass("SSR and account projection omit credentials/tokens/hashes/connection strings and are private no-store");
  const forgedInput = await callRpc(page, "/src/lib/auth/account-functions.ts", "revokeAccountSession", "POST", {
    id: session.id,
    userId: "another-user",
  });
  assert.equal(forgedInput.ok, false);
  const wrongMethod = await callRpc(page, "/src/lib/auth/account-functions.ts", "revokeAccountSession", "GET", {
    id: session.id,
  });
  assert.equal(wrongMethod.ok, false);
  assert.equal((await (await context.request.get(`${server.baseURL}/api/auth/get-session`)).json()).user.id, user.id);
  pass("Session mutation rejects extra identity fields and GET without revoking current session");
  await server.stop();
  server = await startTestServer({ ...config, DATABASE_URL: "postgresql://test:private@127.0.0.1:1/absent" });
  for (const path of ["/dashboard/default", "/api/auth/get-session"]) {
    const unavailable = await context.request.get(`${server.baseURL}${path}`);
    assert.equal(unavailable.status(), 503);
    assertSafeError(await unavailable.text());
  }
  pass("Previously valid cookie fails closed during DB outage; no signed-out/demo downgrade");
  await server.stop();
  server = await startTestServer(config);
  assert.equal((await context.request.get(`${server.baseURL}/dashboard/default`)).status(), 200);
  assert.equal((await (await context.request.get(`${server.baseURL}/api/auth/get-session`)).json()).user.id, user.id);
  pass("Same valid cookie recovers after DB configuration restoration");
  const second = await browser.newContext({ extraHTTPHeaders: testHeaders });
  const secondLogin = await second.request.post(`${server.baseURL}/api/auth/sign-in/email`, {
    headers: { origin: server.baseURL },
    data: { email, password },
  });
  assert.equal(secondLogin.status(), 200);
  const changed = await context.request.post(`${server.baseURL}/api/auth/change-password`, {
    headers: { origin: server.baseURL },
    data: { currentPassword: password, newPassword: testSecret(), revokeOtherSessions: false },
  });
  assert.equal(changed.status(), 200);
  assert.equal(await (await second.request.get(`${server.baseURL}/api/auth/get-session`)).json(), null);
  assert.equal((await (await context.request.get(`${server.baseURL}/api/auth/get-session`)).json()).user.id, user.id);
  await second.close();
  pass("Direct password change cannot opt out of other-session revocation; current cookie rotates");
  const signout = await context.request.post(`${server.baseURL}/api/auth/sign-out`, {
    headers: { origin: server.baseURL },
    data: {},
  });
  assert.equal(signout.status(), 200);
  const cleared = signout
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value)
    .join(";");
  assert.ok(/Max-Age=0/i.test(cleared), "Required cookie attribute missing.");
  assert.ok(/HttpOnly/i.test(cleared), "Required cookie attribute missing.");
  assert.equal(await (await context.request.get(`${server.baseURL}/api/auth/get-session`)).json(), null);
  pass("Signout emits cookie expiry and removes DB authority");
  await context.close();
  console.log(`Auth security: ${cases}/${cases} passing.`);
} finally {
  for (const email of emails) await db`delete from auth_user where email=${email}`;
  await db.end();
  await browser.close();
  await server.stop();
}

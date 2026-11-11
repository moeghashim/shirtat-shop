import { authConfiguration } from "../src/lib/auth/config.ts";
import { assertSafeError, localDatabase, startTestServer, testSecret } from "./auth-test-support.ts";
import { testOrigin, testSentinelPort } from "./test-port.ts";
import assert from "node:assert/strict";
import { createServer } from "node:net";

let cases = 0;
const pass = (label: string) => {
  cases++;
  console.log(`PASS ${label}`);
};
const secret = testSecret();
for (const env of [
  {},
  { BETTER_AUTH_SECRET: "" },
  { DATABASE_URL: localDatabase },
  { DATA_SOURCE: "demo", DATABASE_URL: "broken" },
  { BETTER_AUTH_URL: "invalid", GOOGLE_CLIENT_ID: "x" },
]) {
  assert.equal(authConfiguration(env).enabled, false);
  pass("auth-off configuration");
}
for (const env of [
  { BETTER_AUTH_SECRET: secret },
  { BETTER_AUTH_SECRET: secret, DATABASE_URL: localDatabase, DATA_SOURCE: "demo" },
  ...["", "db", "auto"].map((DATA_SOURCE) => ({ DATA_SOURCE })),
  ...[" ", "short", "a".repeat(40)].map((BETTER_AUTH_SECRET) => ({ DATABASE_URL: localDatabase, BETTER_AUTH_SECRET })),
  ...[
    "",
    "invalid",
    "https://private:private@example.com",
    "https://example.com/path",
    "https://example.com?x=1",
    "https://example.com#x",
    "http://example.com",
  ].map((BETTER_AUTH_URL) => ({ DATABASE_URL: localDatabase, BETTER_AUTH_SECRET: secret, BETTER_AUTH_URL })),
]) {
  assert.throws(
    () => authConfiguration(env),
    (error: Error) => {
      assertSafeError(error.message);
      assert.ok(!error.message.includes(secret));
      return true;
    },
  );
  pass("invalid configuration rejected");
}
for (const [google, github] of [
  [false, false],
  [true, false],
  [false, true],
  [true, true],
]) {
  const config = authConfiguration({
    DATABASE_URL: localDatabase,
    BETTER_AUTH_SECRET: secret,
    GOOGLE_CLIENT_ID: "dummy",
    GOOGLE_CLIENT_SECRET: google ? "dummy" : " ",
    GITHUB_CLIENT_ID: github ? "dummy" : "",
    GITHUB_CLIENT_SECRET: "dummy",
  });
  assert.ok(config.enabled);
  assert.equal(config.baseURL, "http://localhost:3000");
  assert.equal(!!config.providers.google, google);
  assert.equal(!!config.providers.github, github);
  pass("provider pair matrix");
}
const sentinelPort = testSentinelPort();
let connections = 0;
const sentinel = createServer((socket) => {
  connections++;
  socket.destroy();
});
await new Promise<void>((resolve) => sentinel.listen(sentinelPort, "127.0.0.1", resolve));
try {
  const demo = await startTestServer({
    DATABASE_URL: `postgresql://sentinel:private@127.0.0.1:${sentinelPort}/absent`,
    DATA_SOURCE: "demo",
  });
  try {
    assert.equal((await demo.api.get("/dashboard/default")).status(), 200);
    for (const method of ["get", "post"] as const)
      assert.equal((await demo.api[method]("/api/auth/get-session")).status(), 404);
    assert.equal(connections, 0);
    pass("forced demo HTTP + auth disabled: zero TCP connections");
  } finally {
    await demo.stop();
  }
} finally {
  sentinel.close();
}
const server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
});
try {
  const email = `foundation-${Date.now()}@example.test`;
  const password = testSecret();
  const signup = await server.api.post("/api/auth/sign-up/email", { data: { name: "Auth test", email, password } });
  assert.equal(signup.status(), 200);
  const cookies = signup
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value)
    .join(";");
  assert.ok(/HttpOnly/i.test(cookies), "Required cookie attribute missing.");
  assert.ok(/SameSite=Lax/i.test(cookies), "Required cookie attribute missing.");
  assert.ok(/Path=\//i.test(cookies), "Required cookie attribute missing.");
  assert.ok(!/Domain=/i.test(cookies), "Unexpected cookie attribute.");
  assert.ok(/Max-Age=604800/i.test(cookies), "Required cookie attribute missing.");
  pass("real signup + persistent host-only HttpOnly cookie");
  const session = await server.api.get("/api/auth/get-session");
  assert.equal(session.status(), 200);
  assert.equal((await session.json()).user.email, email);
  pass("DB-backed session roundtrip");
  const forged = await server.api.post("/api/auth/sign-out", { headers: { origin: "https://evil.example" }, data: {} });
  assert.equal(forged.status(), 403);
  pass("forged origin rejected");
  assert.equal((await server.api.post("/api/auth/sign-out", { data: {} })).status(), 200);
  assert.equal(await (await server.api.get("/api/auth/get-session")).json(), null);
  pass("signout invalidates session");
  const signin = await server.api.post("/api/auth/sign-in/email", { data: { email, password, rememberMe: false } });
  assert.equal(signin.status(), 200);
  const sessionCookie =
    signin
      .headersArray()
      .find((h) => h.name.toLowerCase() === "set-cookie" && h.value.startsWith("better-auth.session_token="))?.value ??
    "";
  assert.ok(sessionCookie);
  assert.ok(!/Max-Age=|Expires=/i.test(sessionCookie), "Unexpected cookie attribute.");
  pass("unchecked remember me: session-only cookie");
  const { default: postgres } = await import("postgres");
  const db = postgres(localDatabase);
  try {
    const before = await db`select count(*)::int as count from auth_user where email = ${email}`;
    const { spawnSync } = await import("node:child_process");
    assert.equal(
      spawnSync(process.execPath, ["--experimental-strip-types", "scripts/database.ts", "seed"], {
        env: { ...process.env, DATABASE_URL: localDatabase },
        stdio: "pipe",
      }).status,
      0,
    );
    const after = await db`select count(*)::int as count from auth_user where email = ${email}`;
    assert.deepEqual(after, before);
    pass("reseed preserves auth identity");
    await db`delete from auth_user where email = ${email}`;
  } finally {
    await db.end();
  }
} finally {
  await server.stop();
}
console.log(`Auth foundation: ${cases}/${cases} passing.`);

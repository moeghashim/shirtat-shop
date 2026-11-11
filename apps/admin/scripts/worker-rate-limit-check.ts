import postgres from "postgres";

import { authConfiguration } from "../src/lib/auth/config.ts";
import { assertSafeError, localDatabase, testSecret } from "./auth-test-support.ts";
import { testOrigin } from "./test-port.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const db = postgres(localDatabase, { max: 1 });
const env = {
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: testSecret(),
  BETTER_AUTH_URL: testOrigin("http://localhost:3031"),
};
const pass = (s: string) => console.log(`PASS ${s}`);
for (const BETTER_AUTH_URL of [
  undefined,
  testOrigin("http://localhost:3031"),
  testOrigin("https://localhost:3031"),
  "http://example.test",
])
  assert.throws(() => authConfiguration({ ...env, BETTER_AUTH_URL, REQUIRE_AUTH_ORIGIN: true }));
assert.ok(
  authConfiguration({ ...env, BETTER_AUTH_URL: "https://tenboards.example.workers.dev", REQUIRE_AUTH_ORIGIN: true })
    .enabled,
);
pass("hosted auth requires explicit canonical non-loopback HTTPS origin");
let first = await startWorker(env, { binding: true, port: 3031 });
const second = await startWorker(env, { binding: true, port: 3032 });
const ip = "198.19.1.101";
const request = (server: typeof first, address: string, spoof = "203.0.113.9") =>
  server.api.post("/api/auth/sign-in/email", {
    headers: {
      origin: env.BETTER_AUTH_URL,
      "cf-connecting-ip": address,
      "x-forwarded-for": spoof,
      "x-real-ip": spoof,
      forwarded: `for=${spoof}`,
    },
    data: { email: "nonexistent-limiter@example.test", password: "wrong-review-password" },
  });
let renamed = false;
try {
  await db`delete from auth_rate_limit where key like '198.19.%' or key like 'no-trusted-ip%'`;
  for (const server of [first, second, first]) assert.equal((await request(server, ip)).status(), 401);
  let blocked = await request(second, ip, "192.0.2.99, 10.0.0.1");
  assert.equal(blocked.status(), 429);
  assert.ok(Number(blocked.headers()["retry-after"]) > 0);
  assert.match(blocked.headers()["cache-control"], /private.*no-store/);
  const [stored] = await db`select count from auth_rate_limit where key=${`${ip}|/sign-in/email`}`;
  assert.equal(stored.count, 3);
  await first.stop();
  first = await startWorker(env, { binding: true, port: 3031 });
  assert.equal((await request(first, ip, "198.51.100.77")).status(), 429);
  pass("database count shared by two Worker instances and restart; forwarding spoof cannot bypass 3/10s sign-in limit");
  const responses = await Promise.all(
    Array.from({ length: 12 }, (_, i) => request(i % 2 ? first : second, "198.19.1.102")),
  );
  assert.equal(responses.filter((r) => r.status() === 401).length, 3);
  assert.equal(responses.filter((r) => r.status() === 429).length, 9);
  pass("concurrent first-insert/increment race admits exactly 3 of 12 across two Workers");
  // Blank/invalid trusted headers must not promote a caller-controlled forwarding chain.
  for (let i = 0; i < 3; i++) assert.equal((await request(first, "invalid", `203.0.113.${i + 1}`)).status(), 401);
  const missingIp = await startWorker(env, { binding: true, port: 3033, stripClientIp: true });
  try {
    assert.equal((await request(missingIp, "", "192.0.2.201")).status(), 429);
  } finally {
    await missingIp.stop();
  }
  const [unknown] = await db`select count from auth_rate_limit where key='no-trusted-ip|/sign-in/email'`;
  assert.equal(unknown.count, 3);
  pass("missing/invalid trusted IP shares conservative per-path bucket; spoofed forwarding chains ignored");
  blocked = await request(first, ip);
  await delay((Number(blocked.headers()["retry-after"]) + 1) * 1000);
  assert.equal((await request(second, ip)).status(), 401);
  pass("Retry-After window recovers without resetting/disabling limits");
  const forged = await first.api.post("/api/auth/sign-up/email", {
    headers: { origin: "https://evil.example", "cf-connecting-ip": "198.19.1.103" },
    data: { name: "Forbidden", email: "forged@example.test", password: testSecret() },
  });
  assert.equal(forged.status(), 403);
  pass("exact runtime origin rejects forged credential write");
  await db`alter table auth_rate_limit rename to review_auth_rate_limit`;
  renamed = true;
  const missing = await first.api.get("/api/auth/get-session");
  assert.equal(missing.status(), 503);
  assertSafeError(await missing.text());
  await first.stop();
  first = await startWorker(env, { binding: true, port: 3031 });
  assert.equal((await first.api.get("/api/auth/get-session")).status(), 503);
  await db`alter table review_auth_rate_limit rename to auth_rate_limit`;
  renamed = false;
  assert.equal((await first.api.get("/api/auth/get-session")).status(), 200);
  pass("missing limiter storage fails safely before/after readiness; same-isolate recovery; no memory fallback");
} finally {
  if (renamed) await db`alter table review_auth_rate_limit rename to auth_rate_limit`;
  await first.stop();
  await second.stop();
  await db.end();
}

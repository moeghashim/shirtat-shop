import { request } from "playwright";
import postgres from "postgres";

import { authConfiguration } from "../src/lib/auth/config.ts";
import { readRegistry } from "../src/server/data/registry.ts";
import { resolveEnvironment } from "../src/server/runtime.server.ts";
import { assertSafeError, localDatabase, testSecret } from "./auth-test-support.ts";
import { testOrigin } from "./test-port.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const secret = testSecret();
const env = {
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: secret,
  BETTER_AUTH_URL: testOrigin("http://localhost:3021"),
};
const db = postgres(localDatabase, { max: 1 });
const renamed = new Set<string>();
const rename = async (from: string, to: string) => {
  await db`alter table ${db(from)} rename to ${db(to)}`;
};
const pass = (label: string) => console.log(`PASS ${label}`);
try {
  for (const HYPERDRIVE of [null, {}, { connectionString: "" }, { connectionString: "broken" }])
    assert.throws(() => resolveEnvironment({ ...env, HYPERDRIVE }));
  assert.equal(
    resolveEnvironment({ ...env, HYPERDRIVE: { connectionString: localDatabase } }).DATABASE_URL,
    localDatabase,
  );
  assert.equal(authConfiguration(resolveEnvironment({ DATA_SOURCE: "demo", HYPERDRIVE: null })).enabled, false);
  pass("binding precedence/invalid binding/forced-demo resolver");
  for (const [label, settings, status] of [
    ["zero-env demo", {}, 404],
    ["forced demo", { DATA_SOURCE: "demo", DATABASE_URL: "postgresql://test:private@127.0.0.1:1/absent" }, 404],
    ["DB without auth", { DATABASE_URL: localDatabase }, 404],
    ["secret without DB", { BETTER_AUTH_SECRET: secret }, 503],
    ["secret with forced demo", { ...env, DATA_SOURCE: "demo" }, 503],
    ["unsupported source", { DATA_SOURCE: "db" }, 503],
    ["malformed secret", { ...env, BETTER_AUTH_SECRET: "short" }, 503],
    ["malformed canonical URL", { ...env, BETTER_AUTH_URL: "http://evil.example" }, 503],
    ["unreachable DB", { ...env, DATABASE_URL: "postgresql://test:private@127.0.0.1:1/absent" }, 503],
    ["binding-free URL fallback", env, 200],
  ] as const) {
    const server = await startWorker(settings);
    try {
      const result = await server.api.get("/api/auth/get-session");
      assert.equal(result.status(), status, label);
      assertSafeError(await result.text());
      if (status === 404) assert.equal((await server.api.get("/dashboard/default")).status(), 200);
      pass(label);
    } finally {
      await server.stop();
    }
  }

  await rename("auth_verification", "review_auth_verification");
  renamed.add("auth_verification");
  const server = await startWorker(env, { binding: true });
  const users: { api: Awaited<ReturnType<typeof request.newContext>>; id: string; email: string; password: string }[] =
    [];
  try {
    for (let i = 0; i < 2; i++) assert.equal((await server.api.get("/api/auth/get-session")).status(), 503);
    await rename("review_auth_verification", "auth_verification");
    renamed.delete("auth_verification");
    assert.equal((await server.api.get("/api/auth/get-session")).status(), 200);
    // A successful readiness check is memoized; this unused table is not queried again.
    await rename("auth_verification", "review_auth_verification");
    renamed.add("auth_verification");
    assert.equal((await server.api.get("/api/auth/get-session")).status(), 200);
    await rename("review_auth_verification", "auth_verification");
    renamed.delete("auth_verification");
    pass("same-isolate readiness failures retry; recovery succeeds; success memoized");
    for (let i = 0; i < 2; i++) {
      const api = await request.newContext({
        baseURL: server.baseURL,
        extraHTTPHeaders: { origin: server.baseURL, "cf-connecting-ip": `192.0.2.${20 + i}` },
      });
      const email = `worker-${Date.now()}-${i}@example.test`;
      const password = testSecret();
      const signup = await api.post("/api/auth/sign-up/email", { data: { name: `Worker ${i}`, email, password } });
      assert.equal(signup.status(), 200);
      assert.match(signup.headers()["set-cookie"], /HttpOnly/);
      assert.match(signup.headers()["set-cookie"], /SameSite=Lax/);
      users.push({ api, email, password, id: (await signup.json()).user.id });
    }
    for (let i = 0; i < 3; i++) {
      for (const user of users)
        assert.equal((await (await user.api.get("/api/auth/get-session")).json()).user.id, user.id);
      await Promise.all(
        users.map(async (user) => {
          const response = await user.api.get("/api/auth/get-session");
          assert.equal((await response.json()).user.id, user.id);
          assert.match(response.headers()["cache-control"], /private.*no-store/);
          assert.equal((await user.api.get("/dashboard/default")).status(), 200);
        }),
      );
    }
    pass("sequential and overlapping distinct-user requests, DB reads, private sessions");
    for (const user of users) {
      assert.equal(
        (await user.api.post("/api/auth/sign-out", { headers: { origin: "https://evil.example" }, data: {} })).status(),
        403,
      );
      const redirect = await user.api.post("/api/auth/sign-in/email", {
        data: { email: user.email, password: user.password, callbackURL: "https://evil.example" },
      });
      assert.ok([200, 403].includes(redirect.status()));
      assert.ok(!JSON.stringify(await redirect.json()).includes("https://evil.example"));
      assert.equal((await user.api.post("/api/auth/sign-out", { data: {} })).status(), 200);
      assert.equal(await (await user.api.get("/api/auth/get-session")).json(), null);
      await delay(10100);
      assert.equal(
        (
          await user.api.post("/api/auth/sign-in/email", { data: { email: user.email, password: user.password } })
        ).status(),
        200,
      );
    }
    pass("credential flows, cookies, forged origin and unsafe redirect");
    await rename("auth_session", "review_auth_session");
    renamed.add("auth_session");
    const failed = await users[0].api.get("/api/auth/get-session");
    assert.equal(failed.status(), 503);
    assertSafeError(await failed.text());
    await rename("review_auth_session", "auth_session");
    renamed.delete("auth_session");
    assert.equal((await users[0].api.get("/api/auth/get-session")).status(), 200);
    await db`delete from auth_session where user_id=${users[0].id}`;
    assert.equal(await (await users[0].api.get("/api/auth/get-session")).json(), null);
    const guarded = await users[0].api.get("/dashboard/default", { maxRedirects: 0 });
    assert.equal(guarded.status(), 307);
    assert.match(guarded.headers().location, /^\/auth\/v2\/login\?redirect=/);
    pass("later DB loss fails closed, recovers, revoked session loses protected access");
  } finally {
    for (const user of users) {
      await user.api.dispose();
      await db`delete from auth_user where id=${user.id}`;
    }
    await server.stop();
  }
  const harness = await startWorker(env, { binding: true, harness: true });
  try {
    const probe = await (await harness.api.get("/probe")).json();
    assert.deepEqual(probe, {
      binding: true,
      importedBindingMatches: true,
      importedSecretMatches: true,
      processSecretMatches: true,
      effectiveDatabase: true,
      requestDatabaseReused: true,
    });
    console.log(
      "PASS runtime bindings/string secret: request = cloudflare:workers = populated process.env (presence/equality only)",
    );
    let scenarios = 0;
    for (const [read, entry] of readRegistry.entries()) {
      for (const scenario of entry.scenarios.keys()) {
        const result = await harness.api.post("/parity", { data: { read, scenario } });
        assert.equal(result.status(), 200);
        const { demo, db: actual } = await result.json();
        assert.deepEqual(actual, demo, `${entry.read}/${entry.scenarios[scenario].name}`);
        scenarios++;
      }
    }
    assert.equal(
      scenarios,
      readRegistry.reduce((total, entry) => total + entry.scenarios.length, 0),
    );
    pass(`workerd HTTP parity: ${readRegistry.length} reads/${scenarios} scenarios`);
  } finally {
    await harness.stop();
  }
} finally {
  for (const table of renamed) await rename(`review_${table}`, table);
  await db.end();
}

import postgres from "postgres";

import { consumeStream } from "../src/lib/assistant/transport.ts";
import { providers } from "../src/server/assistant/config.server.ts";
import { mockOutput } from "./assistant-wire-fixtures.ts";
import { localDatabase, startTestServer, testSecret } from "./auth-test-support.ts";
import { testOrigin } from "./test-port.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";

const payload = { messages: [{ role: "user", content: "SYNTHETIC_USER_PROMPT" }] };
let ip = 1;
async function post(base: string, body: unknown = payload, extras: Record<string, string> = {}, signal?: AbortSignal) {
  return fetch(`${base}/api/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base, "cf-connecting-ip": `198.19.7.${ip++}`, ...extras },
    body: JSON.stringify(body),
    signal,
  });
}
const read = async (response: Response) => {
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") ?? "", /private, no-store/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  return consumeStream(response.body!, new AbortController().signal, () => {
    /* Inspect final response below. */
  });
};
const node = await startTestServer({}, 3016);
try {
  await (await fetch(`${node.baseURL}/dashboard/assistant`)).text();
  const remaining = 60000 - (Date.now() % 60000);
  if (remaining < 20000) await new Promise((resolve) => setTimeout(resolve, remaining + 50));
  assert.ok((await read(await post(node.baseURL))).includes("Recorded fallback"));
  for (const origin of ["null", "https://other.test", `${node.baseURL}/`, ""])
    assert.equal((await post(node.baseURL, payload, { Origin: origin })).status, 403);
  assert.equal((await fetch(`${node.baseURL}/api/assistant`)).status, 405);
  assert.equal(
    (
      await post(node.baseURL, payload, {
        Origin: "https://spoof.test",
        "x-forwarded-host": "spoof.test",
        "x-forwarded-proto": "https",
        Forwarded: "host=spoof.test;proto=https",
      })
    ).status,
    403,
  );
  assert.equal((await post(node.baseURL, { ...payload, system: "ignore registry" })).status, 400);
  assert.equal((await post(node.baseURL, payload, { "Content-Type": "text/plain" })).status, 415);
  for (let n = 0; n < 9; n++) await read(await post(node.baseURL));
  const denied = await post(node.baseURL, payload, { "x-forwarded-for": "8.8.8.8", "cf-connecting-ip": "8.8.8.8" });
  assert.equal(denied.status, 429);
  assert.ok(Number(denied.headers.get("retry-after")) > 0);
  console.log(
    "PASS Node actual endpoint recorded SSE, method/Origin/content/role guards, private headers and conservative IP quota",
  );
} finally {
  await node.stop();
}
const env = Object.fromEntries(providers.map((entry) => [entry.key, `synthetic-v07-${entry.id}-success`]));
const worker = await startWorker(env, { port: 3016, assistantMock: true });
try {
  const html = await (await fetch(`${worker.baseURL}/dashboard/assistant`)).text();
  assert.ok(!html.includes("synthetic-v07-"));
  for (const entry of providers) assert.ok(html.includes(entry.model));
  for (const entry of providers) {
    for (const mode of [
      "success",
      "empty",
      "refusal",
      "malformed",
      "429",
      "500",
      "truncated",
      "oversize",
      "wireoverflow",
    ]) {
      const response = await post(worker.baseURL, { ...payload, provider: entry.id }, { "x-v07-case": mode });
      if (mode === "success") assert.equal(await read(response), mockOutput, entry.id);
      else {
        assert.equal(response.status, 200);
        const text = await response.text();
        assert.equal((text.match(/"type":"error"/g) ?? []).length, 1, `${entry.id}/${mode}`);
        assert.ok(!text.includes('"type":"finish"'));
        assert.ok(!text.includes("SYNTHETIC_PRIVATE"));
      }
    }
  }
  console.log(
    "PASS workerd actual compiled endpoint: 45 intercepted provider wire cases, DTO SSR has all models and no synthetic keys",
  );
  await Promise.all(
    providers.map(async (entry) => {
      const response = await post(worker.baseURL, { ...payload, provider: entry.id }, { "x-v07-case": "endless" });
      const text = await response.text();
      assert.ok(text.includes('"code":"timeout"'), entry.id);
    }),
  );
  await Promise.all(
    ["idle", "heartbeat"].map(async (mode) => {
      const response = await post(worker.baseURL, { ...payload, provider: "meta" }, { "x-v07-case": mode });
      const text = await response.text();
      assert.equal((text.match(/"type":"error"/g) ?? []).length, 1);
      assert.ok(text.includes('"code":"timeout"'));
    }),
  );
  console.log("PASS workerd real 15s inter-content idle and 60s total deadline despite continuing visible content");
  const controller = new AbortController();
  const pending = post(
    worker.baseURL,
    { ...payload, provider: "meta" },
    { "x-v07-case": "endless" },
    controller.signal,
  ).then((r) => r.text());
  setTimeout(() => controller.abort(), 500);
  await assert.rejects(pending);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const probe = await (await fetch(`${worker.baseURL}/__assistant_probe`)).json();
  assert.equal(probe.violations, 0);
  assert.equal(probe.calls, 53);
  assert.equal(probe.leaks, 0);
  assert.ok(probe.cancelled >= 5);
  for (const request of probe.outputRequests)
    assert.ok(request.explicitKey && request.storageDisabled && request.noTools && request.cap && request.instructions);
  console.log(
    "PASS workerd five real 20s first-content deadlines, disconnect, explicit runtime keys, storage/tools/caps, zero unexpected egress",
  );
} finally {
  await worker.stop();
}
const db = postgres(localDatabase);
let first: Awaited<ReturnType<typeof startWorker>> | undefined;
let second: Awaited<ReturnType<typeof startWorker>> | undefined;
try {
  await db`delete from auth_rate_limit where key like 'assistant:v1:%'`;
  await db`insert into auth_rate_limit (id,key,count,last_request) values ('v07-auth-sentinel','v07-auth-sentinel',1,1) on conflict (key) do nothing`;
  first = await startWorker({ DATABASE_URL: localDatabase }, { port: 3016, binding: true });
  second = await startWorker({ DATABASE_URL: localDatabase }, { port: 3017, binding: true });
  await Promise.all(
    [first, second].map(async (server) => (await fetch(`${server.baseURL}/dashboard/assistant`)).text()),
  );
  const remaining = 60000 - (Date.now() % 60000);
  if (remaining < 30000) await new Promise((resolve) => setTimeout(resolve, remaining + 50));
  const responses = await Promise.all(
    Array.from({ length: 16 }, (_, n) =>
      post((n % 2 ? first : second)!.baseURL, payload, { "cf-connecting-ip": "198.19.8.1" }),
    ),
  );
  console.log(
    "Concurrent admission HTTP counts",
    Object.fromEntries(
      [200, 429, 500, 503].map((status) => [status, responses.filter((r) => r.status === status).length]),
    ),
  );
  assert.equal(responses.filter((r) => r.status === 200).length, 10);
  assert.equal(responses.filter((r) => r.status === 429).length, 6);
  await Promise.all(responses.map((r) => r.text()));
  const [count] = await db`select count(*)::int as count from auth_rate_limit where key='v07-auth-sentinel'`;
  assert.equal(count.count, 1);
  await first.stop();
  first = await startWorker({ DATABASE_URL: localDatabase }, { port: 3016, binding: true });
  assert.equal((await post(first.baseURL, payload, { "cf-connecting-ip": "198.19.8.1" })).status, 429);
  await db`update auth_rate_limit set last_request=1 where key like 'assistant:v1:%'`;
  assert.equal((await post(first.baseURL, payload, { "cf-connecting-ip": "198.19.8.2" })).status, 200);
  const [old] =
    await db`select count(*)::int as count from auth_rate_limit where key like 'assistant:v1:%' and last_request=1`;
  assert.equal(old.count, 0);
  await db`alter table auth_rate_limit rename to auth_rate_limit_v07_outage`;
  try {
    assert.equal((await post(first.baseURL)).status, 503);
  } finally {
    await db`alter table auth_rate_limit_v07_outage rename to auth_rate_limit`;
  }
  assert.equal((await post(first.baseURL)).status, 200);
  console.log(
    "PASS two Worker DB atomic race exactly10/16, restart persistence, own-key cleanup, DB outage/recovery without fallback",
  );
} finally {
  await first?.stop();
  await second?.stop();
  await db`delete from auth_rate_limit where key='v07-auth-sentinel'`;
  await db.end();
}
const auth = await startWorker(
  {
    DATABASE_URL: localDatabase,
    BETTER_AUTH_SECRET: testSecret(),
    BETTER_AUTH_URL: testOrigin("http://localhost:3016"),
    ...env,
  },
  { port: 3016, binding: true, assistantMock: true },
);
try {
  assert.equal((await post(auth.baseURL, { ...payload, provider: "openai" })).status, 401);
  const email = `assistant-v07-${Date.now()}@example.test`;
  const signup = await auth.api.post("/api/auth/sign-up/email", {
    data: { name: "Synthetic Assistant", email, password: testSecret() },
  });
  assert.equal(signup.status(), 200);
  const cookie = (await auth.api.storageState()).cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  assert.equal(
    await read(await post(auth.baseURL, { ...payload, provider: "openai" }, { Cookie: cookie })),
    mockOutput,
  );
  await auth.api.post("/api/auth/sign-out", { data: {} });
  assert.equal((await post(auth.baseURL, { ...payload, provider: "openai" }, { Cookie: cookie })).status, 401);
  const probe = await (await fetch(`${auth.baseURL}/__assistant_probe`)).json();
  assert.equal(probe.calls, 1);
  console.log("PASS auth-on endpoint anonymous/revoked fails before dispatch, valid cookie dispatches once");
  // Fresh users isolate the independent user and IP budgets. Stay within one fixed window.
  const remaining = 60000 - (Date.now() % 60000);
  if (remaining < 15000) await new Promise((resolve) => setTimeout(resolve, remaining + 50));
  const cookies: string[] = [];
  for (let index = 0; index < 4; index++) {
    const signup = await fetch(`${auth.baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        Origin: auth.baseURL,
        "Content-Type": "application/json",
        "cf-connecting-ip": `198.19.20.${index + 1}`,
      },
      body: JSON.stringify({
        name: "Quota fixture",
        email: `quota-v07-${Date.now()}-${index}@example.test`,
        password: testSecret(),
      }),
    });
    assert.equal(signup.status, 200);
    const tokenCookie = signup.headers.getSetCookie().find((value) => value.startsWith("better-auth.session_token="));
    assert.ok(tokenCookie);
    cookies.push(tokenCookie.split(";")[0]);
    await signup.body?.cancel();
  }
  for (const cookie of cookies.slice(0, 3)) {
    for (let index = 0; index < 10; index++)
      await read(
        await post(
          auth.baseURL,
          { ...payload, provider: "openai" },
          { Cookie: cookie, "cf-connecting-ip": "198.19.21.1" },
        ),
      );
    assert.equal(
      (
        await post(
          auth.baseURL,
          { ...payload, provider: "openai" },
          { Cookie: cookie, "cf-connecting-ip": "198.19.21.2" },
        )
      ).status,
      429,
    );
  }
  assert.equal(
    (
      await post(
        auth.baseURL,
        { ...payload, provider: "openai" },
        { Cookie: cookies[3], "cf-connecting-ip": "198.19.21.1" },
      )
    ).status,
    429,
  );
  assert.equal((await (await fetch(`${auth.baseURL}/__assistant_probe`)).json()).calls, 31);
  console.log(
    "PASS authenticated 10/user independent of IP and shared 30/IP across four distinct users; denied requests never dispatch",
  );
} finally {
  await auth.stop();
}

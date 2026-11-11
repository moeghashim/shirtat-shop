import { consumeStream } from "../src/lib/assistant/transport.ts";
import { providers } from "../src/server/assistant/config.server.ts";
import { mockOutput } from "./assistant-wire-fixtures.ts";
import { localDatabase, startTestServer, testSecret } from "./auth-test-support.ts";
import { testOrigin } from "./test-port.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";

const keys = Object.fromEntries(providers.map((p) => [p.key, `synthetic-v07-${p.id}-success`]));
let ip = 1;
const payload = { messages: [{ role: "user", content: "SYNTHETIC_USER_PROMPT" }] };
for (const runtime of ["Node", "workerd"] as const) {
  for (const mode of ["no-env", "live", "forced-demo", "db-open", "auth", "invalid-auth"] as const) {
    const origin = testOrigin("http://localhost:3014");
    const env = {
      ...(mode === "no-env" ? {} : keys),
      ...(["db-open", "auth"].includes(mode) ? { DATABASE_URL: localDatabase } : {}),
      ...(mode === "forced-demo"
        ? { DATA_SOURCE: "demo", DATABASE_URL: "postgresql://synthetic:synthetic@127.0.0.1:1/tenboards_v07_absent" }
        : {}),
      ...(["auth", "invalid-auth"].includes(mode) ? { BETTER_AUTH_SECRET: testSecret(), BETTER_AUTH_URL: origin } : {}),
    };
    const launch =
      runtime === "Node"
        ? startTestServer(env, 3014, { assistantMock: true })
        : startWorker(env, { port: 3014, assistantMock: true, binding: ["db-open", "auth"].includes(mode) });
    const server = await launch.catch((error) => {
      if (mode === "invalid-auth" && runtime === "Node") return undefined;
      throw error;
    });
    if (!server) {
      console.log("PASS Node invalid-auth: configuration rejected at startup, no open fallback");
      continue;
    }
    const post = (provider?: string, cookie?: string) =>
      fetch(`${server.baseURL}/api/assistant`, {
        method: "POST",
        headers: {
          Origin: server.baseURL,
          "Content-Type": "application/json",
          "cf-connecting-ip": `198.19.40.${ip++}`,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify({ ...payload, provider }),
      });
    try {
      if (mode === "invalid-auth") {
        const response = await post("openai");
        assert.equal(response.status, 503);
        assert.ok(!(await response.text()).includes("synthetic-v07-"));
      } else if (mode === "auth") {
        assert.equal((await post("openai")).status, 401);
        const signup = await server.api.post("/api/auth/sign-up/email", {
          data: {
            name: "Assistant mode fixture",
            email: `assistant-mode-v07-${runtime}-${Date.now()}@example.test`,
            password: testSecret(),
          },
        });
        assert.equal(signup.status(), 200);
        const cookie = (await server.api.storageState()).cookies.map((c) => `${c.name}=${c.value}`).join("; ");
        const response = await post("openai", cookie);
        assert.equal(response.status, 200);
        assert.ok(response.body);
        assert.equal(
          await consumeStream(response.body, new AbortController().signal, () => {
            /* Test observes the final state. */
          }),
          mockOutput,
        );
        await server.api.post("/api/auth/sign-out", { data: {} });
        assert.equal((await post("openai", cookie)).status, 401);
      } else {
        const html = await (await fetch(`${server.baseURL}/dashboard/assistant`)).text();
        assert.ok(!/synthetic-v07-|SYNTHETIC_USER_PROMPT|Bearer /.test(html));
        if (mode === "no-env") {
          assert.ok(html.includes("Recorded demo"));
          const r = await post();
          assert.equal(r.status, 200);
          assert.ok((await r.text()).includes('"type":"finish"'));
        } else
          for (const provider of providers) {
            assert.ok(html.includes(provider.model));
            const r = await post(provider.id);
            assert.equal(r.status, 200);
            assert.ok(r.body);
            assert.equal(
              await consumeStream(r.body, new AbortController().signal, () => {
                /* Test observes the final state. */
              }),
              mockOutput,
            );
          }
      }
      if ("hasDiagnosticLeak" in server && typeof server.hasDiagnosticLeak === "function")
        assert.equal(server.hasDiagnosticLeak(), false);
      if (runtime === "workerd") {
        const probe = await (await fetch(`${server.baseURL}/__assistant_probe`)).json();
        assert.equal(probe.violations, 0);
        assert.equal(probe.leaks, 0);
      }
      console.log(
        `PASS ${runtime} ${mode}: actual Assistant route/config/protocol boundary, synthetic-only, safe bootstrap`,
      );
    } finally {
      await server.stop();
    }
  }
}

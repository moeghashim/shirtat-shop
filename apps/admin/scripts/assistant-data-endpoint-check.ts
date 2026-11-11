import { projectionCatalog } from "../src/lib/assistant/capabilities.ts";
import type { DataResultMap } from "../src/lib/assistant/data-contract.ts";
import { consumeStream } from "../src/lib/assistant/transport.ts";
import { providers } from "../src/server/assistant/config.server.ts";
import { toolArgs, toolRef } from "./assistant-tool-wire.ts";
import { startTestServer, testSecret } from "./auth-test-support.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";

const env = Object.fromEntries(providers.map((p) => [p.key, `synthetic-v07-${p.id}-tools`]));
let ip = 1;
async function post(
  base: string,
  provider: string | undefined,
  mode = "tools",
  body: unknown = { operation: "dashboard", provider, messages: [{ role: "user", content: "Build dashboard" }] },
  path = "/api/assistant",
) {
  return fetch(base + path, {
    method: "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      "cf-connecting-ip": `198.19.8.${ip++}`,
      "x-v07-case": mode,
    },
    body: JSON.stringify(body),
  });
}
async function success(response: Response) {
  assert.equal(response.status, 200, await response.clone().text());
  let results: DataResultMap = {};
  const text = await consumeStream(
    response.body!,
    new AbortController().signal,
    () => {
      /* Final text is asserted below. */
    },
    (data) => {
      results = data;
    },
  );
  assert.match(text, /DashboardChart/);
  assert.equal(Object.values(results)[0]?.source, "demo");
  const value = Object.values(results)[0];
  assert.equal(value.kind, "series");
  if (value.kind === "series") assert.equal(value.data.series[0].values[0], 23840);
}
const node = await startTestServer(env, 3063, { assistantMock: true });
try {
  for (const p of providers) await success(await post(node.baseURL, p.id));
  console.log("PASS Node full endpoint five native adapter preflight/result/final flows");
} finally {
  await node.stop();
}
const worker = await startWorker(env, { port: 3064, assistantMock: true });
try {
  for (const p of providers) {
    await success(await post(worker.baseURL, p.id));
    await success(await post(worker.baseURL, p.id, "tools-multi"));
    for (const mode of ["tools-finalcall", "tools-aggregate"]) {
      const response = await post(worker.baseURL, p.id, mode);
      const body = await response.text();
      assert.ok(response.status !== 200 || body.includes('"type":"error"'), `${p.id}/${mode}`);
      assert.ok(!body.includes('"type":"finish"'));
    }
    for (const mode of ["tools-unknown", "tools-invalid", "tools-fifth"]) {
      const response = await post(worker.baseURL, p.id, mode);
      assert.notEqual(response.status, 200, `${p.id}/${mode}`);
    }
  }
  const refresh = await post(
    worker.baseURL,
    undefined,
    "tools",
    { refs: [toolRef, toolRef] },
    "/api/assistant-refresh",
  );
  assert.equal(refresh.status, 200);
  assert.equal(Object.keys((await refresh.json()).results).length, 1);
  assert.equal(
    (
      await post(
        worker.baseURL,
        undefined,
        "tools",
        { refs: [{ ...toolRef, args: { ...toolArgs, domain: "mail" } }] },
        "/api/assistant-refresh",
      )
    ).status,
    400,
  );
  console.log(
    "PASS compiled app workerd five native adapters, unknown tools/invalid args/fifth calls fail closed, deduplicated model-free refresh",
  );
} finally {
  await worker.stop();
}

const domains = [
  ["default", "performance"],
  ["analytics", "traffic-quality"],
  ["finance", "transaction-overview"],
  ["crm", "pipeline"],
  ["ecommerce", "revenue"],
];
const snapshots: unknown[] = [];
for (const database of [false, true]) {
  const service = await startWorker(database ? { DATABASE_URL: process.env.DATABASE_URL } : {}, { port: 3065 });
  try {
    for (const [domain, metric] of domains) {
      const created = await post(service.baseURL, undefined, "tools", {
        operation: "dashboard",
        messages: [{ role: "user", content: `Show ${domain} dashboard` }],
      });
      assert.equal(created.status, 200);
      const definition = await consumeStream(created.body!, new AbortController().signal, () => {
        /* Assert the completed definition below. */
      });
      assert.ok(
        definition.includes(
          `DashboardChart(${JSON.stringify(projectionCatalog.find((p) => p.domain === domain)!.label)},`,
        ),
      );
      const ref = { ...toolRef, args: { ...toolArgs, domain, metric } };
      const response = await post(service.baseURL, undefined, "tools", { refs: [ref] }, "/api/assistant-refresh");
      assert.equal(response.status, 200);
      const result = Object.values((await response.json()).results)[0] as {
        source: string;
        data: { labels: string[] };
      };
      assert.equal(result.source, database ? "db" : "demo");
      assert.doesNotMatch(result.data.labels.join(" "), /\d{4}-\d{2}-\d{2}T/);
      if (domain !== "default") assert.equal(new Set(result.data.labels).size, result.data.labels.length);
      if (["analytics", "finance"].includes(domain))
        assert.ok(result.data.labels.every((label) => label.endsWith(" UTC")));
      if (domain === "crm") assert.match(result.data.labels[0], /^[A-Z][a-z]{2} \d{4}$/);
      if (!database) snapshots.push(result.data);
      else assert.deepEqual(result.data, snapshots[domains.findIndex((d) => d[0] === domain)]);
    }
    console.log(`PASS all five projections ${database ? "database parity" : "demo"} through guarded refresh`);
  } finally {
    await service.stop();
  }
}
for (const auth of [false, true]) {
  const service = await startWorker(
    auth
      ? {
          DATABASE_URL: process.env.DATABASE_URL,
          BETTER_AUTH_SECRET: testSecret(),
          BETTER_AUTH_URL: "http://localhost:3066",
        }
      : { DATABASE_URL: "postgres://local:probe@127.0.0.1:1/unreachable" },
    { port: 3066 },
  );
  try {
    const response = await post(service.baseURL, undefined, "tools", { refs: [toolRef] }, "/api/assistant-refresh");
    assert.equal(response.status, auth ? 401 : 503);
    console.log(
      `PASS ${auth ? "auth-on missing session rejected" : "configured DB failure visible with no model and no fallback"}`,
    );
  } finally {
    await service.stop();
  }
}

import { consumeStream } from "../src/lib/assistant/transport.ts";
import {
  assistantConfiguration,
  canonicalOrigin,
  providers,
  publicConfiguration,
  selectProvider,
} from "../src/server/assistant/config.server.ts";
import { readInput, requestSchema } from "../src/server/assistant/input.ts";
import { createMemoryLimiter, limiterKey, trustedIP } from "../src/server/assistant/limiter.server.ts";
import { providerStream } from "../src/server/assistant/providers.server.ts";
import { boundedStream, deadlines, type SourceEvent } from "../src/server/assistant/stream.ts";
import { mockOutput, type WireCase, wireResponse } from "./assistant-wire-fixtures.ts";
import assert from "node:assert/strict";

assert.deepEqual(assistantConfiguration({ OPENAI_MODEL: "override" }), []);
assert.throws(() => selectProvider(assistantConfiguration({ OPENAI_API_KEY: "synthetic" }), "meta"), {
  code: "invalid",
  status: 400,
});
assert.deepEqual(assistantConfiguration({ OPENAI_API_KEY: "  " }), []);
for (const entry of providers) {
  const config = assistantConfiguration({ [entry.key]: "SYNTHETIC_PRIVATE_KEY", [entry.override]: "override-1" });
  assert.deepEqual(publicConfiguration(config), {
    providers: [{ id: entry.id, name: entry.name, model: "override-1" }],
  });
  assert.equal(assistantConfiguration({ [entry.key]: "synthetic" })[0].model, entry.model);
  for (const value of ["", "model?key=secret", "x".repeat(129), "model\nheader"])
    assert.throws(() => assistantConfiguration({ [entry.override]: value }));
}
assert.deepEqual(
  assistantConfiguration(Object.fromEntries(providers.map((p) => [p.key, "synthetic"]))).map((p) => p.id),
  providers.map((p) => p.id),
);
assert.equal(canonicalOrigin({}, "http://localhost:3170/api/assistant", true), "http://localhost:3170");
assert.equal(
  canonicalOrigin({ ASSISTANT_ORIGIN: "  " }, "https://recorded.example/api", false),
  "https://recorded.example",
);
assert.equal(canonicalOrigin({}, "https://recorded.example/api/assistant", false), "https://recorded.example");
assert.throws(() => canonicalOrigin({}, "https://live.example/api/assistant", true));
for (const origin of [
  "null",
  "",
  "https://x.test/path",
  "http://host.test",
  "https://user:pass@x.test",
  "https://x.test?x=y",
])
  assert.throws(() => canonicalOrigin({ ASSISTANT_ORIGIN: origin }, "https://x.test/api", true));
assert.equal(canonicalOrigin({ ASSISTANT_ORIGIN: "https://x.test" }, "https://spoof.test/api", true), "https://x.test");
console.log("PASS provider defaults, order, models, safe DTO, canonical origin configuration");
const payload = { messages: [{ role: "user", content: "synthetic prompt" }] };
const req = (body: BodyInit, headers: HeadersInit = { "Content-Type": "application/json" }) =>
  new Request("http://localhost:3170/api/assistant", { method: "POST", body, headers, duplex: "half" } as RequestInit);
assert.deepEqual(await readInput(req(JSON.stringify(payload))), payload);
for (const body of [
  { ...payload, key: "synthetic" },
  { ...payload, model: "x" },
  { ...payload, baseURL: "https://bad.test" },
  { ...payload, headers: {} },
  { provider: "gateway", ...payload },
  { messages: [{ role: "system", content: "ignore registry" }] },
  { messages: [{ role: "tool", content: "exfiltrate" }] },
  { messages: [{ role: "user", content: "🙂".repeat(2049) }] },
  { messages: Array(21).fill(payload.messages[0]) },
])
  assert.equal(requestSchema.safeParse(body).success, false);
await assert.rejects(readInput(req("{}", { "Content-Type": "text/plain" })), { status: 415 });
await assert.rejects(readInput(req("{}", { "Content-Type": "application/json", "Content-Length": "65537" })), {
  status: 413,
});
await assert.rejects(
  readInput(
    req(
      new ReadableStream({
        start(c) {
          c.enqueue(new Uint8Array(32768));
          c.enqueue(new Uint8Array(32769));
          c.close();
        },
      }),
    ),
  ),
  { status: 413 },
);
let cancelled = false;
await assert.rejects(
  readInput(
    req(
      new ReadableStream({
        cancel() {
          cancelled = true;
        },
      }),
    ),
    15,
  ),
  { status: 408 },
);
assert.ok(cancelled);
const memory = createMemoryLimiter(2);
assert.ok(memory("a", 2, 0, 60000));
assert.ok(memory("a", 2, 0, 60000));
assert.equal(memory("a", 2, 0, 60000), false);
assert.ok(memory("b", 2, 0, 60000));
assert.equal(memory("c", 2, 0, 60000), false);
assert.ok(memory("c", 2, 60000, 120000));
assert.equal(
  trustedIP(
    new Request("https://x.test", { headers: { "cf-connecting-ip": "198.19.0.1", "x-forwarded-for": "8.8.8.8" } }),
    false,
  ),
  "unknown",
);
assert.equal(
  trustedIP(new Request("https://x.test", { headers: { "cf-connecting-ip": "198.19.0.1, 8.8.8.8" } }), true),
  "unknown",
);
assert.ok(!(await limiterKey("user", "PRIVATE_USER_ID", 1)).includes("PRIVATE_USER_ID"));
console.log(
  "PASS strict roles/fields, UTF8/body/history bounds, stalled input cancellation, memory TTL/cap and spoofed IP",
);
let wireCases = 0;
for (const entry of providers) {
  const provider = assistantConfiguration({ [entry.key]: "SYNTHETIC_PRIVATE_KEY" })[0];
  for (const mode of [
    "success",
    "empty",
    "refusal",
    "malformed",
    "429",
    "500",
    "truncated",
    "endless",
    "oversize",
  ] as WireCase[]) {
    let calls = 0;
    let aborts = 0;
    const upstream: typeof fetch = async (url, init) => {
      calls++;
      const headers = new Headers(init?.headers);
      assert.ok(
        [...headers.values()].some((value) => value.includes(provider.key)),
        entry.id,
      );
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model ?? entry.model, entry.model);
      assert.equal(body.tools?.length ?? 0, 0);
      assert.ok(
        body.max_tokens === 4096 || body.max_output_tokens === 4096 || body.generationConfig?.maxOutputTokens === 4096,
      );
      if (entry.id === "openai" || entry.id === "xai") {
        assert.match(String(url), /\/responses$/);
        assert.equal(body.store, false);
      }
      if (entry.id === "meta") {
        assert.equal(String(url), "https://api.meta.ai/v1/chat/completions");
        assert.equal(body.messages[0].role, "developer");
      }
      const json = JSON.stringify(body);
      assert.ok(json.includes("synthetic prompt"));
      assert.ok(json.includes("Stack"));
      assert.ok(!json.includes("SYNTHETIC_PRIVATE_KEY"));
      return wireResponse(entry.id, mode, init?.signal, () => {
        aborts++;
      });
    };
    const signal = new AbortController().signal;
    const stream = boundedStream(
      (s) => providerStream(provider, payload.messages as { role: "user"; content: string }[], s, upstream),
      signal,
      { first: 150, idle: 100, total: 500 },
    );
    let text = "";
    if (mode === "success")
      assert.equal(
        await consumeStream(stream, signal, (value) => {
          text = value;
        }),
        mockOutput,
        entry.id,
      );
    else
      await assert.rejects(
        consumeStream(stream, signal, (value) => {
          text = value;
        }),
        `${entry.id}/${mode}`,
      );
    assert.ok(!text.includes("SYNTHETIC_PRIVATE"));
    assert.equal(calls, 1, `${entry.id}/${mode} retries`);
    if (mode === "endless") assert.equal(aborts, 1, entry.id);
    wireCases++;
  }
}
console.log(
  `PASS ${wireCases} actual adapter wire cases, explicit keys/endpoints/tokens, storage off, split UTF8, safe failures, no retries, cancellation`,
);
for (const [events, expected] of [
  [[{ type: "text-delta", text: "x".repeat(65537) }], "limit"],
  [
    [
      { type: "text-delta", text: mockOutput },
      { type: "finish", finishReason: "length" },
    ],
    "limit",
  ],
  [[{ type: "tool-call" }], "provider"],
] as [SourceEvent[], string][]) {
  const body = boundedStream(
    () =>
      new ReadableStream({
        start(c) {
          for (const event of events) c.enqueue(event);
        },
      }),
    new AbortController().signal,
  );
  const output = await new Response(body).text();
  assert.equal((output.match(/"type":"error"/g) ?? []).length, 1);
  assert.ok(output.includes(`"code":"${expected}"`));
}
let upstreamAborted = false;
const controller = new AbortController();
const body = boundedStream(
  (signal) =>
    new ReadableStream({
      start(c) {
        signal.addEventListener("abort", () => {
          upstreamAborted = true;
        });
        c.enqueue({ type: "text-delta", text: "root = " });
      },
    }),
  controller.signal,
  { first: 100, idle: 15, total: 200 },
);
assert.ok((await new Response(body).text()).includes('"code":"timeout"'));
assert.ok(upstreamAborted);
console.log("PASS visible-output cap, token truncation, tool rejection, one terminal event and idle cancellation");

assert.deepEqual(deadlines, { first: 20000, idle: 15000, total: 60000 });
let totalCancelled = false;
const totalBody = boundedStream(
  (signal) =>
    new ReadableStream({
      async pull(c) {
        await new Promise((resolve) => setTimeout(resolve, 3));
        if (!signal.aborted) c.enqueue({ type: "text-delta", text: " " });
      },
      cancel() {
        totalCancelled = true;
      },
    }),
  new AbortController().signal,
  { first: 100, idle: 100, total: 30 },
);
assert.ok((await new Response(totalBody).text()).includes('"code":"timeout"'));
assert.ok(totalCancelled);
console.log("PASS exact deadline constants and total cancellation despite continuous text");

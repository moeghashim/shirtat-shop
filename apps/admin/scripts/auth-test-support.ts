import { request } from "playwright";

import { databaseUrl } from "../src/server/data/source.ts";
import { testPort } from "./test-port.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

export const testSecret = () => randomBytes(48).toString("base64url");
export const localDatabase =
  process.env.DATABASE_URL ?? "postgresql://tenboards:tenboards_local@127.0.0.1:54329/tenboards";
databaseUrl({ DATABASE_URL: localDatabase }, true);
export const testHeaders = { "cf-connecting-ip": "", "x-forwarded-for": "" };
export async function startTestServer(
  overrides: NodeJS.ProcessEnv = {},
  port = 3011,
  options: { assistantMock?: boolean } = {},
) {
  const address = `198.18.${randomBytes(1)[0]}.${randomBytes(1)[0]}`;
  testHeaders["cf-connecting-ip"] = address;
  testHeaders["x-forwarded-for"] = address;
  if (process.env.AUTH_TEST_RUNTIME === "workerd")
    return startWorker(overrides, {
      port,
      headers: testHeaders,
      binding: !!overrides.DATABASE_URL && !overrides.DATABASE_URL.includes(":1/"),
    });
  const nodePort = testPort(port);
  const baseURL = `http://localhost:${nodePort}`;
  const child = spawn(
    process.execPath,
    [
      ...(options.assistantMock
        ? ["--experimental-strip-types", "--import", "./scripts/node-assistant-harness.ts"]
        : []),
      "node_modules/vite/bin/vite.js",
      "dev",
      "--port",
      String(nodePort),
      "--strictPort",
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: undefined,
        DATA_SOURCE: undefined,
        BETTER_AUTH_SECRET: undefined,
        BETTER_AUTH_URL: undefined,
        GOOGLE_CLIENT_ID: undefined,
        GOOGLE_CLIENT_SECRET: undefined,
        GITHUB_CLIENT_ID: undefined,
        GITHUB_CLIENT_SECRET: undefined,
        ANTHROPIC_API_KEY: undefined,
        ANTHROPIC_MODEL: undefined,
        OPENAI_API_KEY: undefined,
        OPENAI_MODEL: undefined,
        XAI_API_KEY: undefined,
        XAI_MODEL: undefined,
        META_API_KEY: undefined,
        META_MODEL: undefined,
        GOOGLE_GENERATIVE_AI_API_KEY: undefined,
        GOOGLE_GENERATIVE_AI_MODEL: undefined,
        ASSISTANT_ORIGIN: undefined,
        ...overrides,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  // Keep only a bounded in-memory scan window; never persist or print server output.
  let diagnosticTail = "";
  let leaked = false;
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (chunk: Buffer) => {
      diagnosticTail = (diagnosticTail + chunk.toString()).slice(-16384);
      if (/synthetic-v07-|SYNTHETIC_USER_PROMPT|Synthetic Café|Authorization: Bearer/i.test(diagnosticTail))
        leaked = true;
    });
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) throw new Error("Test server failed to start (configuration rejected).");
    try {
      await fetch(`${baseURL}/favicon.svg`);
      break;
    } catch {
      await delay(250);
    }
  }
  const api = await request.newContext({ baseURL, extraHTTPHeaders: { ...testHeaders, origin: baseURL } });
  return {
    baseURL,
    api,
    hasDiagnosticLeak: () => leaked,
    async stop() {
      await api.dispose();
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        if (child.exitCode !== null) resolve();
        else child.once("exit", () => resolve());
      });
    },
  };
}
export function assertSafeError(text: string) {
  assert.ok(
    !/postgres(?:ql)?:\/\/|SELECT |INSERT |password authentication|client_secret|BETTER_AUTH_SECRET=/i.test(text),
    "Response leaked protected server details.",
  );
}

// Exercise the actual transformed RPC, including validators, without a route guard.
export async function callRpc(
  page: import("playwright").Page,
  file: string,
  name: string,
  method: "GET" | "POST",
  data?: unknown,
  origin?: string,
) {
  let id: string | undefined;
  if (process.env.AUTH_TEST_RUNTIME === "workerd") {
    for (const chunk of await readdir(".output/server/_ssr")) {
      if (!chunk.endsWith(".mjs")) continue;
      const source = await readFile(`.output/server/_ssr/${chunk}`, "utf8");
      for (const match of source.matchAll(
        /createServerRpc\(\{\s*id: "([^"]+)",\s*name: "([^"]+)",\s*filename: "([^"]+)"/g,
      ))
        if (match[2] === name && `/${match[3]}` === file) id = match[1];
    }
  } else {
    const source = await (await page.request.get(new URL(file, page.url()).href)).text();
    const ids = [...source.matchAll(/createClientRpc\("([^"]+)"\)/g)].map((m) => m[1]);
    id = ids.find(
      (value) => JSON.parse(Buffer.from(value, "base64url").toString()).export === `${name}_createServerFn_handler`,
    );
  }
  if (!id) throw new Error(`RPC not found: ${name}`);
  const rpcURL = new URL(`/_serverFn/${id}`, page.url());
  // Use Start's installed wire codec, not its runtime-context-dependent client wrapper.
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const { toJSONAsync, fromCrossJSON } = await import(require.resolve("seroval"));
  const payload = JSON.stringify(await toJSONAsync({ data }));
  if (method === "GET") rpcURL.searchParams.set("payload", payload);
  const response = await page.request.fetch(rpcURL.href, {
    method,
    headers: {
      "x-tsr-serverFn": "true",
      accept: "application/json",
      origin: origin ?? rpcURL.origin,
      "content-type": "application/json",
    },
    ...(method === "POST" ? { data: payload } : {}),
  });
  if (!response.ok()) {
    assertSafeError(await response.text());
    return {
      ok: false,
      message: "Request rejected.",
      result: undefined,
      cacheControl: response.headers()["cache-control"],
    };
  }
  const { createDefaultSerovalPlugins } = await import("@tanstack/react-router/ssr/client");
  const result = fromCrossJSON(await response.json(), { refs: new Map(), plugins: createDefaultSerovalPlugins() });
  const cacheControl = response.headers()["cache-control"];
  if (result?.error) return { ok: false, message: result.error.message, result: undefined, cacheControl };
  return { ok: true, result: result?.result, message: undefined, cacheControl };
}

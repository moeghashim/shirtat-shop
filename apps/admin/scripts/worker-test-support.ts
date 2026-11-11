import { request } from "playwright";

import type { RuntimeEnvironment } from "../src/server/assistant/config.server.ts";
import { databaseUrl } from "../src/server/data/source.ts";
import { testPort } from "./test-port.ts";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export async function startWorker(
  env: RuntimeEnvironment = {},
  options: {
    port?: number;
    binding?: boolean;
    harness?: boolean;
    assistantMock?: boolean;
    stripClientIp?: boolean;
    headers?: Record<string, string>;
  } = {},
) {
  const port = testPort(options.port ?? 3021);
  const baseURL = `http://localhost:${port}`;
  const directory = path.resolve(`.wrangler/review-${port}`);
  await mkdir(directory, { recursive: true });
  const vars = { ...env };
  const hyperdrive = options.binding
    ? [{ binding: "HYPERDRIVE", id: "00000000000000000000000000000000", localConnectionString: databaseUrl(env, true) }]
    : [];
  if (options.binding) delete vars.DATABASE_URL;
  // This is a separate local test source config, never a mutation of Nitro output.
  let entry = ".output/server/index.mjs";
  if (options.harness) entry = "scripts/worker-parity-harness.ts";
  if (options.assistantMock) entry = "scripts/worker-assistant-harness.ts";
  if (options.stripClientIp) entry = "scripts/worker-ip-harness.ts";
  const config = {
    name: "tenboards-local-test",
    compatibility_date: "2026-10-23",
    compatibility_flags: ["nodejs_compat"],
    main: path.resolve(entry),
    no_bundle: !options.harness && !options.stripClientIp && !options.assistantMock,
    rules:
      options.harness || options.stripClientIp || options.assistantMock
        ? []
        : [{ type: "ESModule", globs: ["**/*.mjs", "**/*.js"] }],
    assets: { binding: "ASSETS", directory: path.resolve(".output/public") },
    env: { local: { hyperdrive } },
  };
  const configPath = path.join(directory, "wrangler.json");
  await writeFile(configPath, JSON.stringify(config));
  await writeFile(
    path.join(directory, ".dev.vars.local"),
    Object.entries(vars)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join("\n"),
    { mode: 0o600 },
  );
  const child = spawn(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "dev",
      "--config",
      configPath,
      "--env",
      "local",
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: { ...process.env, WRANGLER_SEND_METRICS: "false", CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  // Do not persist Wrangler output: local bindings include credentials.
  child.stdout.resume();
  child.stderr.resume();
  const stop = async () => {
    child.kill("SIGTERM");
    if (child.exitCode === null) await new Promise<void>((resolve) => child.once("exit", () => resolve()));
    await rm(directory, { recursive: true, force: true });
  };
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseURL}/favicon.svg`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Local server is still starting. */
    }
    await delay(250);
  }
  if (!ready) {
    await stop();
    throw new Error("Local Worker failed to start (details redacted).");
  }
  const api = await request.newContext({
    baseURL,
    extraHTTPHeaders: { origin: baseURL, "cf-connecting-ip": "192.0.2.1", ...options.headers },
  });
  return {
    baseURL,
    api,
    async stop() {
      await api.dispose();
      await stop();
    },
  };
}

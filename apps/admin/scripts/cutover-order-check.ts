import { testSecret } from "./auth-test-support.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Syntax/bundle rehearsal only. This command can never upload or deploy a Worker.
const directory = path.resolve(".wrangler/cutover-rehearsal");
await mkdir(directory, { recursive: true });
const config = {
  name: "tenboards-cutover-rehearsal",
  main: path.resolve(".output/server/index.mjs"),
  compatibility_date: "2026-10-23",
  compatibility_flags: ["nodejs_compat"],
  no_bundle: true,
  assets: { binding: "ASSETS", directory: path.resolve(".output/public") },
  rules: [{ type: "ESModule", globs: ["**/*.mjs", "**/*.js"] }],
  hyperdrive: [{ binding: "HYPERDRIVE", id: "00000000000000000000000000000000" }],
};
const secret = testSecret();
try {
  await writeFile(path.join(directory, "wrangler.json"), JSON.stringify(config));
  await writeFile(
    path.join(directory, "secrets.json"),
    JSON.stringify({ BETTER_AUTH_SECRET: secret, BETTER_AUTH_URL: "https://cutover.example.test" }),
    { mode: 0o600 },
  );
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "versions",
      "upload",
      "--dry-run",
      "--config",
      path.join(directory, "wrangler.json"),
      "--secrets-file",
      path.join(directory, "secrets.json"),
    ],
    {
      encoding: "utf8",
      timeout: 60000,
      env: { ...process.env, WRANGLER_SEND_METRICS: "false", CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false" },
    },
  );
  assert.equal(result.status, 0, "Local atomic staging dry-run failed (details redacted).");
  assert.ok(!`${result.stdout}${result.stderr}`.includes(secret));
  console.log(
    "PASS pinned Wrangler accepts code/binding/secrets-file in one dry-run upload; secret redacted; no remote resource or version created",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}

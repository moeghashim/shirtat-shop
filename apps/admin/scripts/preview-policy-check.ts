import {
  assertPreviewConfig,
  assertPreviewEnvironment,
  assertPreviewInputs,
  assertRemotePreviewBindings,
  previewConfigPath,
  previewSource,
} from "./preview-policy.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";

assertPreviewConfig(previewSource);
for (const extra of [
  { name: "tenboards" },
  { hyperdrive: [{ binding: "HYPERDRIVE", id: "0".repeat(32) }] },
  { vars: { DATABASE_URL: "fixture" } },
  { env: { production: {} } },
  { services: [{ binding: "PRODUCTION", service: "tenboards" }] },
  { keep_vars: true },
  { unsafe: { bindings: [] } },
])
  assert.throws(() => assertPreviewConfig({ ...previewSource, ...extra }));
for (const key of [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "XAI_API_KEY",
  "XAI_MODEL",
  "META_API_KEY",
  "META_MODEL",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GOOGLE_GENERATIVE_AI_MODEL",
  "ASSISTANT_ORIGIN",
  "DATABASE_URL",
  "HYPERDRIVE",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_SECRET",
  "VITE_SECRET",
  "NITRO_PRESET",
  "NODE_OPTIONS",
  "DATA_SOURCE",
  "WRANGLER_ENV",
])
  assert.throws(() => assertPreviewEnvironment({ [key]: "fixture" }));
assertRemotePreviewBindings([{ name: "ASSETS", type: "assets" }]);
for (const type of ["hyperdrive", "service", "secret_text", "plain_text", "secret_key", "d1"])
  assert.throws(() =>
    assertRemotePreviewBindings([
      { name: "ASSETS", type: "assets" },
      { name: "FORBIDDEN", type },
    ]),
  );
console.log("PASS preview exact target, config/remote allowlists and environment contamination negatives");
for (const file of [".dev.vars.preview-fixture", ".wrangler/preview/.env"]) {
  await writeFile(file, "META_API_KEY=SYNTHETIC_ASSISTANT_KEY", { flag: "wx" });
  try {
    await assert.rejects(assertPreviewInputs);
  } finally {
    await rm(file);
  }
}
console.log("PASS root/generated-config dotenv contamination rejected before upload");
const source = await readFile("wrangler.jsonc", "utf8");
try {
  await writeFile(
    "wrangler.jsonc",
    source.replace(
      /\}\s*$/,
      ', "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "00000000000000000000000000000000" }], "vars": { "DATABASE_URL": "NONSECRET_PRODUCTION_FIXTURE" }\n}',
    ),
  );
  const result = spawnSync("npm", ["run", "preview:deploy", "--", "--build-only"], { encoding: "utf8" });
  assert.equal(result.status, 0, "Isolated fixture build failed (details in private build output).");
  const final = JSON.parse(await readFile(previewConfigPath, "utf8"));
  assertPreviewConfig(final, true);
  assert.ok(!JSON.stringify(final).includes("NONSECRET_PRODUCTION_FIXTURE"));
  assert.ok(!JSON.stringify(final).includes("hyperdrive"));
  console.log("PASS real preview build with production Hyperdrive/URL fixture: no inherited bindings or vars");
} finally {
  await writeFile("wrangler.jsonc", source);
}

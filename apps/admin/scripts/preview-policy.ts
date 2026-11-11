import { assertNoLocalEnvironmentFiles, cleanBuildEnvironment as baseBuildEnvironment } from "./build-environment.ts";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const previewSource = {
  $schema: "node_modules/wrangler/config-schema.json",
  name: "tenboards-preview",
  compatibility_date: "2026-10-23",
  compatibility_flags: ["nodejs_compat"],
  workers_dev: true,
  preview_urls: true,
  main: ".output/server/index.mjs",
  assets: { binding: "ASSETS", directory: ".output/public" },
  no_bundle: true,
  rules: [{ type: "ESModule", globs: ["**/*.mjs", "**/*.js"] }],
};
export const previewConfigPath = path.resolve(".wrangler/preview/wrangler.json");
export function assertPreviewConfig(config: unknown, generated = false) {
  const expected = structuredClone(previewSource);
  if (generated) {
    expected.$schema = path.resolve(previewSource.$schema);
    expected.main = path.resolve(previewSource.main);
    expected.assets.directory = path.resolve(previewSource.assets.directory);
  }
  try {
    assert.deepEqual(config, expected);
  } catch {
    throw new Error("Preview configuration rejected: only the exact tenboards-preview ASSETS-only target is allowed.");
  }
}
export function assertPreviewEnvironment(env: NodeJS.ProcessEnv) {
  const forbidden =
    /^(?:ANTHROPIC_|OPENAI_|XAI_|META_|GOOGLE_GENERATIVE_AI_|ASSISTANT_ORIGIN|DATABASE_URL|HYPERDRIVE|DATA_SOURCE|BETTER_AUTH_|GOOGLE_CLIENT_|GITHUB_CLIENT_|VITE_|NITRO_|WRANGLER_ENV|CLOUDFLARE_ENV|NODE_OPTIONS|TENBOARDS_PREVIEW_BUILD)/;
  if (Object.keys(env).some((key) => forbidden.test(key) && env[key] !== undefined))
    throw new Error(
      "Preview build rejected: database/auth/provider/build override environment is present. Unset it first.",
    );
}
export async function assertPreviewInputs() {
  assertPreviewEnvironment(process.env);
  await assertNoLocalEnvironmentFiles([".", path.dirname(previewConfigPath)]);
  assertPreviewConfig(JSON.parse(await readFile("wrangler.preview.jsonc", "utf8")));
}
export function cleanBuildEnvironment(): NodeJS.ProcessEnv {
  return { ...baseBuildEnvironment(), TENBOARDS_PREVIEW_BUILD: "1" };
}
export async function generatePreviewConfig() {
  await mkdir(path.dirname(previewConfigPath), { recursive: true });
  const config = structuredClone(previewSource);
  config.$schema = path.resolve(config.$schema);
  config.main = path.resolve(config.main);
  config.assets.directory = path.resolve(config.assets.directory);
  assertPreviewConfig(config, true);
  await writeFile(previewConfigPath, JSON.stringify(config, null, 2));
  return config;
}
export function assertRemotePreviewBindings(bindings: unknown) {
  try {
    assert.deepEqual(bindings, [{ name: "ASSETS", type: "assets" }]);
  } catch {
    throw new Error("Preview upload rejected: remote version has unexpected bindings (details redacted).");
  }
}

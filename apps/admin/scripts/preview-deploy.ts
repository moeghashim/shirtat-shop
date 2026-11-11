import {
  assertPreviewConfig,
  assertPreviewInputs,
  assertRemotePreviewBindings,
  cleanBuildEnvironment,
  generatePreviewConfig,
  previewConfigPath,
} from "./preview-policy.ts";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "preview-alias": { type: "string" },
    "build-only": { type: "boolean", default: false },
    initialize: { type: "boolean", default: false },
  },
});
function wrangler(args: string[], json = false) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", ...args, "--config", previewConfigPath],
    {
      encoding: "utf8",
      timeout: 180000,
      env: { ...process.env, WRANGLER_SEND_METRICS: "false", CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false" },
    },
  );
  if (result.status !== 0) {
    if (/Worker "tenboards-preview" not found/.test(result.stderr)) return null;
    throw new Error(
      "Preview command failed; no production target was selected. Inspect local Wrangler logs privately.",
    );
  }
  return json ? JSON.parse(result.stdout) : result.stdout;
}
try {
  if (!values["build-only"] && !/^pr-\d+$/.test(values["preview-alias"] ?? ""))
    throw new Error("Provide --preview-alias pr-NNN.");
  await assertPreviewInputs();
  await mkdir(".wrangler/preview-empty-env", { recursive: true });
  if ((await readdir(".wrangler/preview-empty-env")).length)
    throw new Error("Preview build environment directory must be empty.");
  // Do not leave Nitro's production redirect available for a later implicit command.
  await rm(".wrangler/deploy/config.json", { force: true });
  const build = spawnSync("npm", ["run", "build"], { env: cleanBuildEnvironment(), stdio: "inherit" });
  if (build.status !== 0) throw new Error("Preview build failed.");
  await generatePreviewConfig();
  await assertPreviewInputs();
  assertPreviewConfig(JSON.parse(await readFile(previewConfigPath, "utf8")), true);
  if (values["build-only"]) console.log("PASS isolated preview build/config: tenboards-preview, ASSETS only.");
  else {
    const secrets = wrangler(["secret", "list"], true);
    if (secrets === null) {
      if (!values.initialize)
        throw new Error("Preview Worker is absent. Repeat with --initialize for its first demo-only deployment.");
      console.log(wrangler(["deploy"]));
    } else if (!Array.isArray(secrets) || secrets.length)
      throw new Error("Preview upload rejected: remote secrets are present.");
    const versions = wrangler(["versions", "list", "--json"], true);
    if (!Array.isArray(versions) || !versions.length) throw new Error("Cannot verify preview version inventory.");
    for (const version of versions) {
      const detail = wrangler(["versions", "view", version.id, "--json"], true);
      assertRemotePreviewBindings(detail?.resources?.bindings);
    }
    // Re-read the generated allowlist at the upload boundary. No caller-provided flags pass through.
    assertPreviewConfig(JSON.parse(await readFile(previewConfigPath, "utf8")), true);
    const upload = wrangler(["versions", "upload", "--preview-alias", values["preview-alias"] as string]);
    console.log(upload);
    const versionId = typeof upload === "string" ? upload.match(/Worker Version ID: ([a-f0-9-]+)/)?.[1] : undefined;
    if (!versionId) throw new Error("Preview uploaded but its version ID could not be verified.");
    assertRemotePreviewBindings(wrangler(["versions", "view", versionId, "--json"], true)?.resources?.bindings);
    const finalSecrets = wrangler(["secret", "list"], true);
    if (!Array.isArray(finalSecrets) || finalSecrets.length)
      throw new Error("Preview uploaded but remote secret verification failed.");
    console.log("PASS remote preview inventory: ASSETS only; no secrets.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Preview operation failed (details redacted).");
  process.exitCode = 1;
}

import { assertNoLocalEnvironmentFiles, cleanBuildEnvironment } from "./build-environment.ts";
import {
  assertDeploymentConfig,
  createDeploymentSecrets,
  deploymentName,
  deploymentNextCommands,
  deploymentURL,
  externalSecretsPath,
} from "./deploy-prepare-core.ts";
import { spawnSync } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { parseArgs } from "node:util";

try {
  const { values } = parseArgs({
    options: {
      name: { type: "string" },
      url: { type: "string" },
      "secrets-file": { type: "string" },
      "include-assistant": { type: "boolean" },
    },
  });
  if (values["include-assistant"] && !values["secrets-file"]) throw new Error();
  const name = deploymentName(values.name);
  const url = deploymentURL(values.url);
  const filename = values["secrets-file"] ? await externalSecretsPath(values["secrets-file"]) : undefined;
  await assertNoLocalEnvironmentFiles([".", ".output/server"]);
  // Remove stale output/redirect so a failed build cannot pass validation on a prior build.
  await rm(".wrangler/deploy/config.json", { force: true });
  await rm(".output", { recursive: true, force: true });
  const build = spawnSync("npm", ["run", "build"], {
    env: cleanBuildEnvironment(),
    encoding: "utf8",
    timeout: 180000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (build.status !== 0)
    throw new Error("Clean build failed; build output withheld to avoid exposing configuration values.");
  assertDeploymentConfig(JSON.parse(await readFile(".output/server/wrangler.json", "utf8")), name);
  if (filename)
    await createDeploymentSecrets(filename, url, process.cwd(), values["include-assistant"] ? process.env : {});
  console.log("PASS clean build and deployment config. No Cloudflare or database operation performed.");
  console.log(
    filename
      ? "Created private 0600 secrets file outside the repository; values are not printed."
      : "No secrets generated. Supply an existing private secrets file in the upload command below.",
  );
  console.log("Run these commands in Bash after reviewing docs/deploy.md; preparation has not executed them:");
  console.log(deploymentNextCommands(url, filename));
} catch {
  // Filesystem/JSON/argument errors can contain credentials; never echo their raw messages.
  console.error(
    "Deployment preparation failed. Move dotenv/dev-vars files outside the repository. Check --name, --url, an unused external --secrets-file path, the build and source wrangler.jsonc. Requires nodejs_compat, one nonzero 32-hex HYPERDRIVE ID, no localConnectionString and no DB/auth/provider vars. No upload or database operation was performed.",
  );
  process.exitCode = 1;
}

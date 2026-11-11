import {
  type AssistantEnvironment,
  assistantConfiguration,
  canonicalOrigin,
  providers,
} from "../src/server/assistant/config.server.ts";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { realpath, writeFile } from "node:fs/promises";
import path from "node:path";

export function deploymentName(value: string | undefined): string {
  if (!value || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(value))
    throw new Error("Provide --name with your configured Worker name (lowercase letters, digits and hyphens).");
  return value;
}

export function deploymentURL(value: string | undefined): string {
  try {
    assert.ok(value);
    const url = new URL(value);
    assert.equal(url.protocol, "https:");
    assert.ok(!url.username && !url.password && !url.search && !url.hash && url.pathname === "/");
    assert.ok(!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    return url.origin;
  } catch {
    throw new Error(
      "Provide --url with your canonical public HTTPS origin, without credentials, path, query or fragment.",
    );
  }
}

export function assertDeploymentConfig(config: unknown, expectedName: string) {
  try {
    assert.ok(config && typeof config === "object");
    const value = config as Record<string, unknown>;
    assert.equal(value.name, deploymentName(expectedName));
    assert.ok(Array.isArray(value.compatibility_flags) && value.compatibility_flags.includes("nodejs_compat"));
    assert.ok(Array.isArray(value.hyperdrive) && value.hyperdrive.length === 1);
    const binding = value.hyperdrive[0];
    assert.equal(binding.binding, "HYPERDRIVE");
    assert.equal(typeof binding.id, "string");
    assert.match(binding.id, /^[a-f0-9]{32}$/i);
    assert.notEqual(binding.id, "0".repeat(32));
    assert.ok(!Object.hasOwn(binding, "localConnectionString"));
    // Reject hidden alternate environment/binding configuration, too.
    const inspect = (item: unknown): void => {
      if (!item || typeof item !== "object") return;
      for (const [key, child] of Object.entries(item)) {
        assert.notEqual(key, "localConnectionString");
        if (key === "vars") {
          assert.ok(child && typeof child === "object" && !Array.isArray(child));
          assert.ok(
            !Object.keys(child).some((name) =>
              /DATABASE|HYPERDRIVE|DATA_SOURCE|AUTH|GOOGLE|GITHUB|ANTHROPIC|OPENAI|XAI|META|ASSISTANT/i.test(name),
            ),
          );
        }
        inspect(child);
      }
    };
    inspect(value);
  } catch {
    throw new Error(
      "Deployment config rejected: check Worker name, nodejs_compat, one real HYPERDRIVE ID, no localConnectionString and no DB/auth/provider vars (values redacted).",
    );
  }
}

export async function externalSecretsPath(filename: string, root = process.cwd()): Promise<string> {
  const repo = await realpath(root);
  const parent = await realpath(path.dirname(path.resolve(filename)));
  const relative = path.relative(repo, parent);
  if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)))
    throw new Error("Secrets file must be outside the repository, including through symlinks.");
  return path.join(parent, path.basename(filename));
}

export async function createDeploymentSecrets(
  filename: string,
  url: string,
  root = process.cwd(),
  assistantEnv: AssistantEnvironment = {},
) {
  const destination = await externalSecretsPath(filename, root);
  const secrets = { BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"), BETTER_AUTH_URL: deploymentURL(url) };
  const configured = assistantConfiguration(assistantEnv);
  canonicalOrigin(
    { ...assistantEnv, ...secrets, DATABASE_URL: "postgres://synthetic:synthetic@localhost/validation" },
    url,
    configured.length > 0,
  );
  const assistant: Record<string, string> = {};
  for (const entry of providers)
    for (const key of [entry.key, entry.override])
      if (assistantEnv[key]?.trim()) assistant[key] = assistantEnv[key]!.trim();
  if (assistantEnv.ASSISTANT_ORIGIN?.trim()) assistant.ASSISTANT_ORIGIN = assistantEnv.ASSISTANT_ORIGIN.trim();
  // Exclusive creation rejects existing files and symlinks; never rotate an existing secret implicitly.
  await writeFile(destination, JSON.stringify({ ...secrets, ...assistant }, null, 2), { mode: 0o600, flag: "wx" });
  return destination;
}

const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
export function deploymentNextCommands(url: string, secretsFile?: string): string {
  const config = "--config .output/server/wrangler.json";
  return [
    "# Inspect existing deployments/secrets first; see docs/deploy.md for a first Worker.",
    `npx wrangler deployments list ${config}`,
    `npx wrangler versions list ${config}`,
    `npx wrangler secret list ${config}`,
    `npx wrangler versions upload ${config} --secrets-file ${quote(secretsFile ?? "/absolute/private/path/worker-secrets.json")}`,
    "read -r -p 'Candidate version ID: ' TENBOARDS_CANDIDATE_VERSION",
    "read -r -p 'Candidate immutable origin: ' TENBOARDS_CANDIDATE_ORIGIN",
    `npx wrangler versions view "$TENBOARDS_CANDIDATE_VERSION" ${config} --json`,
    'npm run deploy:check -- "$TENBOARDS_CANDIDATE_ORIGIN"',
    "# Only after candidate checks pass; verify ASSETS, HYPERDRIVE and both auth secret names.",
    `npx wrangler versions deploy "$TENBOARDS_CANDIDATE_VERSION@100%" ${config} --yes`,
    `npm run deploy:check -- ${quote(url)}`,
  ].join("\n");
}

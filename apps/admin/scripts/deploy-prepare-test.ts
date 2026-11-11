import { assertNoLocalEnvironmentFiles, cleanBuildEnvironment } from "./build-environment.ts";
import {
  assertDeploymentConfig,
  createDeploymentSecrets,
  deploymentName,
  deploymentNextCommands,
  deploymentURL,
  externalSecretsPath,
} from "./deploy-prepare-core.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const valid = {
  name: "adopter-dashboard",
  compatibility_flags: ["nodejs_compat"],
  hyperdrive: [{ binding: "HYPERDRIVE", id: "1234567890abcdef1234567890abcdef" }],
};
assertDeploymentConfig(valid, valid.name);
assertDeploymentConfig({ ...valid, vars: { PUBLIC_LABEL: "Example" } }, valid.name);
const badConfigs: unknown[] = [
  null,
  [],
  {},
  { ...valid, name: "another-worker" },
  { ...valid, compatibility_flags: [] },
  { ...valid, compatibility_flags: "nodejs_compat" },
  { ...valid, hyperdrive: [] },
  { ...valid, hyperdrive: [...valid.hyperdrive, ...valid.hyperdrive] },
  { ...valid, hyperdrive: [{ ...valid.hyperdrive[0], binding: "OTHER" }] },
  ...["", "REPLACE_ME", "0".repeat(32), "g".repeat(32), "a".repeat(31), "a".repeat(33), 123].map((id) => ({
    ...valid,
    hyperdrive: [{ ...valid.hyperdrive[0], id }],
  })),
  ...["", "postgresql://PRIVATE_MARKER", null].map((localConnectionString) => ({
    ...valid,
    hyperdrive: [{ ...valid.hyperdrive[0], localConnectionString }],
  })),
  ...[
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "XAI_API_KEY",
    "META_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "ASSISTANT_ORIGIN",
    "DATABASE_URL",
    "DATA_SOURCE",
    "HYPERDRIVE",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
  ].map((key) => ({ ...valid, vars: { [key]: "PRIVATE_MARKER" } })),
  { ...valid, env: { production: { vars: { BETTER_AUTH_SECRET: "PRIVATE_MARKER" } } } },
];
for (const config of badConfigs)
  assert.throws(
    () => assertDeploymentConfig(config, valid.name),
    (error: Error) => !error.message.includes("PRIVATE_MARKER"),
  );
console.log(`PASS deploy preparation: valid adopter config and ${badConfigs.length} invalid configs; errors redacted`);
for (const value of [undefined, "", "BAD", "../worker", "name;echo", "a".repeat(64)])
  assert.throws(() => deploymentName(value));
for (const value of [
  undefined,
  "",
  "invalid",
  "http://example.test",
  "https://localhost",
  "https://user:PRIVATE_MARKER@example.test",
  "https://example.test/path",
  "https://example.test?secret=PRIVATE_MARKER",
  "https://example.test#fragment",
])
  assert.throws(
    () => deploymentURL(value),
    (error: Error) => !error.message.includes("PRIVATE_MARKER"),
  );
const origin = deploymentURL("https://adopter.example.workers.dev/");
assert.equal(origin, "https://adopter.example.workers.dev");
assert.deepEqual(
  cleanBuildEnvironment({
    PATH: "/bin",
    DATABASE_URL: "PRIVATE_MARKER",
    BETTER_AUTH_SECRET: "PRIVATE_MARKER",
    VITE_PRIVATE: "PRIVATE_MARKER",
    NODE_OPTIONS: "--inspect",
    NITRO_PRESET: "node",
    CLOUDFLARE_API_TOKEN: "PRIVATE_MARKER",
  }),
  {
    PATH: "/bin",
    WRANGLER_SEND_METRICS: "false",
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
  },
);
const directory = await mkdtemp(path.join(tmpdir(), "tenboards-prepare-test-"));
try {
  const repo = path.join(directory, "repo");
  await mkdir(repo);
  await writeFile(path.join(repo, ".env.example"), "example");
  await assertNoLocalEnvironmentFiles([repo]);
  for (const name of [".env", ".env.production", ".dev.vars", ".dev.vars.local"]) {
    await writeFile(path.join(repo, name), "PRIVATE_MARKER");
    await assert.rejects(() => assertNoLocalEnvironmentFiles([repo]));
    await rm(path.join(repo, name));
  }
  await assert.rejects(() => externalSecretsPath(path.join(repo, "secrets.json"), repo));
  const linked = path.join(directory, "linked-repo");
  await symlink(repo, linked);
  await assert.rejects(() => externalSecretsPath(path.join(linked, "secrets.json"), repo));
  const filename = path.join(directory, "worker-secrets.json");
  await createDeploymentSecrets(filename, origin, repo);
  assert.equal((await stat(filename)).mode & 0o777, 0o600);
  const contents = await readFile(filename, "utf8");
  const secrets = JSON.parse(contents);
  assert.deepEqual(Object.keys(secrets).sort(), ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]);
  assert.equal(secrets.BETTER_AUTH_URL, origin);
  assert.match(secrets.BETTER_AUTH_SECRET, /^[A-Za-z0-9_-]{64}$/);
  await assert.rejects(() => createDeploymentSecrets(filename, origin, repo));
  assert.equal(await readFile(filename, "utf8"), contents);
  const link = path.join(directory, "linked-secrets.json");
  await symlink(filename, link);
  await assert.rejects(() => createDeploymentSecrets(link, origin, repo));
  const second = path.join(directory, "second.json");
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "SYNTHETIC_NOT_OPTED_IN";
  try {
    await createDeploymentSecrets(second, origin, repo);
    assert.ok(!("OPENAI_API_KEY" in JSON.parse(await readFile(second, "utf8"))));
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
  assert.notEqual(JSON.parse(await readFile(second, "utf8")).BETTER_AUTH_SECRET, secrets.BETTER_AUTH_SECRET);
  const assistantFile = path.join(directory, "assistant.json");
  await createDeploymentSecrets(assistantFile, origin, repo, {
    META_API_KEY: "SYNTHETIC_META_KEY",
    META_MODEL: "muse-spark-1.3",
    ASSISTANT_ORIGIN: origin,
  });
  const assistantSecrets = JSON.parse(await readFile(assistantFile, "utf8"));
  assert.equal(assistantSecrets.META_API_KEY, "SYNTHETIC_META_KEY");
  assert.equal((await stat(assistantFile)).mode & 0o777, 0o600);
  await assert.rejects(() =>
    createDeploymentSecrets(path.join(directory, "bad.json"), origin, repo, {
      OPENAI_API_KEY: "synthetic",
      ASSISTANT_ORIGIN: "https://other.test",
    }),
  );
  const commands = deploymentNextCommands(origin, filename);
  assert.ok(!commands.includes(secrets.BETTER_AUTH_SECRET));
  assert.ok(commands.indexOf("versions upload") < commands.indexOf("versions view"));
  assert.ok(commands.indexOf('deploy:check -- "$TENBOARDS_CANDIDATE_ORIGIN"') < commands.indexOf("versions deploy"));
  assert.ok(commands.includes("--secrets-file"));
  // Paths printed into commands cannot become shell syntax.
  const quotedPath = path.join(directory, "a'$(touch SHOULD_NOT_EXIST).json");
  const upload = deploymentNextCommands(origin, quotedPath)
    .split("\n")
    .find((line) => line.startsWith("npx wrangler versions upload"));
  assert.ok(upload);
  const parsed = spawnSync("bash", ["-c", `set -- ${upload}; printf '%s' "\${!#}"`], {
    cwd: directory,
    encoding: "utf8",
  });
  assert.equal(parsed.status, 0);
  assert.equal(parsed.stdout, quotedPath);
  await assert.rejects(() => stat(path.join(directory, "SHOULD_NOT_EXIST")));
  console.log(
    "PASS clean env/dotenv rejection, HTTPS target, private external 0600 secrets, random values, no overwrite/symlink escape, safe ordered commands",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
for (const args of [[], ["--name", valid.name], ["--name", valid.name, "--url", "PRIVATE_MARKER"]]) {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/deploy-prepare.ts", ...args], {
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.ok(!`${result.stdout}${result.stderr}`.includes("PRIVATE_MARKER"));
}
console.log("PASS CLI missing/invalid flags fail before build without exposing values");

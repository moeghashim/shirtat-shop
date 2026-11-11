import { databaseUrl, selectSource } from "../src/server/data/source.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";

const url = databaseUrl(process.env, true);
const cases = [
  [{}, "demo"],
  [{ DATABASE_URL: url }, "db"],
  [{ DATABASE_URL: "", DATA_SOURCE: "demo" }, "demo"],
  [{ DATABASE_URL: "" }, "db"],
  [{ DATABASE_URL: "malformed" }, "db"],
] as const;
for (const [env, expected] of cases) assert.equal(selectSource(env), expected);
for (const DATA_SOURCE of ["db", "", "auto", "invalid"]) assert.throws(() => selectSource({ DATA_SOURCE }));
for (const DATABASE_URL of ["", "malformed", "https://example.com", "postgres://localhost/db"])
  assert.throws(() => databaseUrl({ DATABASE_URL }));

// A real TCP listener proves forced demo never contacts even a configured target.
let connections = 0;
const sentinel = createServer((socket) => {
  connections++;
  socket.destroy();
});
await new Promise<void>((resolve) => sentinel.listen(54328, "127.0.0.1", resolve));
const probe = async (name: string, env: NodeJS.ProcessEnv, expectSuccess: boolean) => {
  const { spawn } = await import("node:child_process");
  const child = spawn(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `
    import { readUsers } from './src/server/data/users.ts';
    import { closeDatabase } from './src/server/db/client.server.ts';
    try {
      if (!(await readUsers()).length) throw new Error('Empty read');
      if (process.env.DATA_SOURCE === 'demo') {
        const { readRegistry } = await import('./src/server/data/registry.ts');
        for (const entry of readRegistry) {
          const module = await import('./src/server/data/' + entry.module + '.ts');
          await module[entry.read](entry.scenarios[0].input);
        }
        console.log('Forced demo traversed every registered read');
      }
    }
    catch(e) { console.error(e.message); process.exitCode=1; }
    finally { await closeDatabase(); }
  `,
    ],
    {
      env: { ...process.env, DATABASE_URL: undefined, DATA_SOURCE: undefined, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (data) => {
    output += data;
  });
  child.stderr.on("data", (data) => {
    output += data;
  });
  const code = await new Promise<number | null>((resolve) => child.on("exit", resolve));
  assert.equal(code, expectSuccess ? 0 : 1, name);
  assert.ok(
    !output.includes("postgresql://") && !output.includes("password authentication") && !output.includes("SELECT "),
    "No driver/SQL secrets",
  );
  if (!expectSuccess) assert.match(output, /Unable to load database data|Unsupported DATA_SOURCE/);
  console.log(`PASS ${name}: ${expectSuccess ? "read" : output.trim()}`);
};
try {
  await probe("absent URL", {}, true);
  await probe("configured database", { DATABASE_URL: url }, true);
  await probe(
    "forced demo",
    { DATABASE_URL: "postgresql://sentinel:private@127.0.0.1:54328/absent", DATA_SOURCE: "demo" },
    true,
  );
  assert.equal(connections, 0, "Demo must not attempt any database connection");
  await probe("refused connection", { DATABASE_URL: "postgresql://test:private@127.0.0.1:1/absent" }, false);
  const invalid = new URL(url);
  invalid.password = "invalid-test-password";
  await probe("bad credentials", { DATABASE_URL: invalid.href }, false);
  const missing = new URL(url);
  missing.pathname = "/tenboards_missing_schema";
  await probe("missing schema", { DATABASE_URL: missing.href }, false);
  await probe("empty configuration", { DATABASE_URL: "" }, false);
  await probe("malformed configuration", { DATABASE_URL: "malformed" }, false);
  await probe("unsupported selector", { DATA_SOURCE: "auto" }, false);
  await probe("recovered database", { DATABASE_URL: url }, true);
  for (const flag of ["--inject-mismatch", "--omit-registration"]) {
    const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/data-parity.ts", flag], {
      env: process.env,
      encoding: "utf8",
    });
    assert.equal(result.status, 1, flag);
    assert.match(result.stderr, /Parity failed:/);
    console.log(`PASS negative ${flag}: ${result.stderr.trim()}`);
  }
} finally {
  sentinel.close();
}

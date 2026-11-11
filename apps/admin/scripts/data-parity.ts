import { readRegistry } from "../src/server/data/registry.ts";
import { databaseUrl } from "../src/server/data/source.ts";
import { closeDatabase } from "../src/server/db/client.server.ts";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

try {
  databaseUrl(process.env, true);
  const registry = process.argv.includes("--omit-registration") ? readRegistry.slice(1) : readRegistry;
  const registered = registry.map((entry) => `${entry.module}:${entry.read}`).sort();
  const exported = [];
  for (const file of await readdir("src/server/data")) {
    if (["registry.ts", "source.ts"].includes(file) || !file.endsWith(".ts")) continue;
    const source = await readFile(`src/server/data/${file}`, "utf8");
    for (const match of source.matchAll(/export async function (read\w+)\(/g))
      exported.push(`${file.slice(0, -3)}:${match[1]}`);
  }
  assert.deepEqual(registered, exported.sort(), "Every domain read must be registered exactly once");
  let scenarios = 0;
  for (const entry of registry) {
    assert.notEqual(entry.demo, entry.db, "Parity requires distinct implementations");
    assert.ok(entry.scenarios.length);
    for (const scenario of entry.scenarios) {
      const demo = await scenario.demo();
      const db = await scenario.db();
      if (process.argv.includes("--inject-mismatch") && scenarios === 0) {
        assert.ok(db && typeof db === "object", "Negative control requires an object result");
        if (Array.isArray(db)) db.reverse();
        else Reflect.set(db, Object.keys(db)[0], "QA_MISMATCH");
      }
      assert.deepEqual(db, demo, `${entry.read}/${scenario.name}`);
      // Caller mutations cannot contaminate future requests.
      if (Array.isArray(demo)) demo.splice(0);
      else if (demo && typeof demo === "object") Reflect.set(demo, Object.keys(demo)[0], "QA_MUTATION");
      assert.deepEqual(await scenario.demo(), db);
      scenarios++;
      console.log(`PASS ${entry.read}/${scenario.name}`);
    }
  }
  console.log(JSON.stringify({ reads: registry.length, scenarios, passing: true }));
} catch (error) {
  console.error(
    error instanceof assert.AssertionError
      ? `Parity failed: ${error.message}`
      : "Parity failed: database or input error (details redacted).",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

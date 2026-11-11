import postgres from "postgres";

import { localDatabase, testSecret } from "./auth-test-support.ts";
import { databaseCommandTarget } from "./database-target.ts";
import { checkDeployment } from "./deploy-check-core.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

await import("./deploy-prepare-test.ts");

const remote = "postgresql://review:PRIVATE_MARKER@ep-review.example.test/review?sslmode=require";
assert.throws(() => databaseCommandTarget({ DATABASE_URL: remote }, false));
assert.equal(databaseCommandTarget({ DATABASE_URL: remote }, true), remote);
for (const DATABASE_URL of [
  remote.replace("?sslmode=require", ""),
  remote.replace("require", "disable"),
  `${remote}&sslmode=disable`,
  remote.replace("ep-review.", "ep-review-pooler."),
  "invalid",
])
  assert.throws(() => databaseCommandTarget({ DATABASE_URL }, true));
assert.throws(() => databaseCommandTarget({ DATABASE_URL: localDatabase, HYPERDRIVE: {} }, true));
for (const command of ["migrate", "seed"]) {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/database.ts", command], {
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: remote },
  });
  assert.equal(result.status, 1);
  assert.ok(!`${result.stdout}${result.stderr}`.includes("PRIVATE_MARKER"));
}
console.log("PASS remote migrate/seed rejected without opt-in; explicit direct TLS targets validated; errors redacted");
const db = postgres(localDatabase, { max: 1 });
const name = `tenboards_ops_${Date.now()}`;
await db`create database ${db(name)}`;
const url = new URL(localDatabase);
url.pathname = `/${name}`;
try {
  for (const flag of [[], ["--allow-remote"], ["--allow-remote"]])
    for (const command of ["migrate", "seed"]) {
      const result = spawnSync(
        process.execPath,
        ["--experimental-strip-types", "scripts/database.ts", command, ...flag],
        { encoding: "utf8", env: { ...process.env, DATABASE_URL: url.href } },
      );
      assert.equal(result.status, 0, `isolated ${command} failed (details redacted)`);
    }
  const isolated = postgres(url.href);
  try {
    assert.equal(Number((await isolated`select count(*) as count from auth_user`)[0].count), 0);
  } finally {
    await isolated.end();
  }
  console.log(
    "PASS default and explicit-opt-in migrate/seed repeat successfully on fresh isolated Docker target; no auth identities seeded",
  );
} finally {
  await db`drop database ${db(name)} with (force)`;
}
const before = Number((await db`select count(*) as count from auth_user`)[0].count);
const server = await startWorker(
  { DATABASE_URL: localDatabase, BETTER_AUTH_SECRET: testSecret(), BETTER_AUTH_URL: "http://localhost:3035" },
  { binding: true, port: 3035 },
);
const retained: string[] = [];
try {
  await checkDeployment(server.baseURL);
  assert.equal(Number((await db`select count(*) as count from auth_user`)[0].count), before);
  console.log("PASS real workerd default smoke creates no accounts");
  await checkDeployment(server.baseURL, {
    authRoundtrip: true,
    report: (message) => {
      console.log(message);
      const email = message.match(/deploy-check-[\w-]+@example.test/)?.[0];
      if (email) retained.push(email);
    },
  });
  assert.equal(retained.length, 1);
  const [account] = await db`select id from auth_user where email=${retained[0]}`;
  assert.ok(account);
  assert.equal(Number((await db`select count(*) as count from auth_session where user_id=${account.id}`)[0].count), 0);
  console.log("PASS explicit round-trip retains exactly its throwaway account but no sessions; local cleanup verified");
} finally {
  for (const email of retained) await db`delete from auth_user where email=${email}`;
  await server.stop();
  await db.end();
}
const demo = await startWorker({}, { port: 3036 });
try {
  await checkDeployment(demo.baseURL, { demo: true });
  await assert.rejects(() => checkDeployment(demo.baseURL, { report: () => undefined }));
} finally {
  await demo.stop();
}
console.log("PASS local demo accepted only with explicit demo expectation; no false production success");

for (const [label, env, binding, expected] of [
  ["secret without binding", { BETTER_AUTH_SECRET: testSecret() }, false, 503],
  ["database without auth", { DATABASE_URL: localDatabase }, true, 404],
] as const) {
  const incomplete = await startWorker(env, { binding, port: 3036 });
  try {
    assert.equal((await incomplete.api.get("/api/auth/get-session")).status(), expected);
    await assert.rejects(() => checkDeployment(incomplete.baseURL, { report: () => undefined }));
    console.log(`PASS incomplete cutover state rejected by production smoke: ${label}`);
  } finally {
    await incomplete.stop();
  }
}

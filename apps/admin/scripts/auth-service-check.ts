import postgres from "postgres";

import { assertSafeError, localDatabase, startTestServer, testSecret } from "./auth-test-support.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";

// A fresh test-owned empty database; removed after the suite.
const missingURL = new URL(localDatabase);
const missingName = `tenboards_${process.env.TEST_DATABASE_INFIX ?? "auth"}_unmigrated_${Date.now()}`;
missingURL.pathname = `/${missingName}`;
const admin = postgres(localDatabase, { connect_timeout: 3 });
try {
  await admin`create database ${admin(missingName)}`;
} finally {
  await admin.end();
}
const empty = postgres(missingURL.href, { connect_timeout: 3 });
try {
  const [result] = await empty`select to_regclass('public.auth_user') as table_name`;
  assert.equal(result.table_name, null, "Missing-schema test database must remain unmigrated.");
} finally {
  await empty.end();
}

try {
  for (const [label, DATABASE_URL, auth, expected] of [
    ["zero environment", undefined, false, 404],
    ["DB without secret", localDatabase, false, 404],
    ["unreachable auth DB", "postgresql://test:private@127.0.0.1:1/absent", true, 503],
    ["missing auth schema", missingURL.href, true, 503],
    ["recovered auth DB", localDatabase, true, 200],
  ] as const) {
    const server = await startTestServer({
      DATABASE_URL,
      BETTER_AUTH_SECRET: auth ? testSecret() : undefined,
      BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
    });
    try {
      const response = await server.api.get("/api/auth/get-session");
      assert.equal(response.status(), expected, label);
      assertSafeError(await response.text());
      if (!auth) assert.equal((await server.api.get("/dashboard/default")).status(), 200);
      console.log(`PASS ${label}`);
    } finally {
      await server.stop();
    }
  }
} finally {
  const cleanup = postgres(localDatabase);
  try {
    await cleanup`drop database ${cleanup(missingName)} with (force)`;
  } finally {
    await cleanup.end();
  }
}

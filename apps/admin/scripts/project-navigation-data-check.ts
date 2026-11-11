import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { chromium } from "playwright";
import postgres from "postgres";

import { closeDatabase } from "../src/server/db/client.server.ts";
import { seed } from "../src/server/db/seed.ts";
import { localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const url = new URL(localDatabase),
  name = `tenboards_v08_nav_${process.pid}`;
url.pathname = "/postgres";
const admin = postgres(url.href, { max: 1, onnotice: () => undefined });
await admin.unsafe(`create database ${name}`);
url.pathname = `/${name}`;
const db = postgres(url.href, { max: 1, onnotice: () => undefined });
let server: Awaited<ReturnType<typeof startTestServer>> | undefined;
const browser = await chromium.launch();
const out = process.argv[2] ?? "screenshots/v08-005/navigation-data";
await mkdir(out, { recursive: true });
try {
  await migrate(drizzle(db), { migrationsFolder: "src/server/db/migrations" });
  process.env.DATABASE_URL = url.href;
  await seed();
  await closeDatabase();
  server = await startTestServer({
    DATABASE_URL: url.href,
    BETTER_AUTH_SECRET: testSecret(),
    BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
  });
  const c = await browser.newContext({ extraHTTPHeaders: testHeaders, viewport: { width: 1440, height: 900 } });
  await cacheCaptureFonts(c);
  const signup = await c.request.post(`${server.baseURL}/api/auth/sign-up/email`, {
    headers: { origin: server.baseURL },
    data: { name: "Navigation fixture", email: "nav@example.test", password: testSecret() },
  });
  assert.equal(signup.status(), 200);
  const p = await c.newPage();
  await p.goto(`${server.baseURL}/dashboard/default`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Operations rollout views/ }).waitFor();
  await db`alter table projects rename to nav_test_projects`;
  await p.reload({ waitUntil: "networkidle" });
  await p.getByText("Projects could not be loaded.", { exact: true }).waitFor();
  assert.equal(await p.getByRole("button", { name: /Operations rollout views/ }).count(), 0);
  await p.screenshot({ path: `${out}/navigation-error.png` });
  await db`alter table nav_test_projects rename to projects`;
  await p.getByRole("button", { name: "Retry projects", exact: true }).click();
  await p.getByRole("button", { name: /Operations rollout views/ }).waitFor();
  await db`truncate table projects cascade`;
  await p.reload({ waitUntil: "networkidle" });
  await p.getByText("No projects yet.", { exact: true }).waitFor();
  await p.screenshot({ path: `${out}/navigation-empty.png` });
  assert.equal(await p.getByRole("button", { name: /Operations rollout views/ }).count(), 0);
  await c.close();
  console.log(
    "PASS isolated authenticated navigation data: real schema failure yields honest error, retry recovers guarded summaries, empty DB yields empty section without demo fallback.",
  );
} finally {
  await browser.close();
  await server?.stop();
  await db.end();
  await admin.unsafe(`drop database ${name} with (force)`);
  await admin.end();
}

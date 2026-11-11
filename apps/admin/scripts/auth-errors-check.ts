import { chromium } from "playwright";
import postgres from "postgres";

import { localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: testSecret(),
  BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
});
const browser = await chromium.launch();
const db = postgres(localDatabase);
const email = `errors-${Date.now()}@example.test`;
const password = testSecret();
let cases = 0;
const pass = (name: string) => {
  cases++;
  console.log(`PASS ${name}`);
};
try {
  assert.equal(
    (await server.api.post("/api/auth/sign-up/email", { data: { name: "Error test", email, password } })).status(),
    200,
  );
  const context = await browser.newContext({ extraHTTPHeaders: testHeaders });
  await cacheCaptureFonts(context);
  const page = await context.newPage();
  async function visit(path: string) {
    await page.goto(server.baseURL + path, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() =>
      Object.keys(document.querySelector("form") ?? {}).some((key) => key.startsWith("__reactProps")),
    );
  }
  await visit("/auth/v2/register");
  await page.getByLabel("Name", { exact: true }).fill("Error test");
  await page.getByLabel("Email Address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await page.getByText("Unable to register with this email. Try signing in.").waitFor();
  pass("duplicate registration safe inline error");
  await visit(`/auth/v2/login?redirect=${encodeURIComponent("//evil.example")}`);
  await page.getByLabel("Email Address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.route("**/api/auth/sign-in/email", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.getByText("Unable to complete this request. Check your details and connection, then try again.").waitFor();
  assert.equal(await page.getByLabel("Email Address", { exact: true }).inputValue(), email);
  pass("network failure preserves non-secret input and permits retry");
  await page.unroute("**/api/auth/sign-in/email");
  let submissions = 0;
  await page.route("**/api/auth/sign-in/email", async (route) => {
    submissions++;
    await delay(350);
    await route.continue();
  });
  await page.locator("form").evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
    (form as HTMLFormElement).requestSubmit();
  });
  await page.getByRole("button", { name: "Signing in…" }).waitFor();
  assert.ok(await page.getByRole("button", { name: "Signing in…" }).isDisabled());
  await page.waitForURL("**/dashboard/default");
  assert.equal(submissions, 1);
  pass("duplicate submit blocked; retry succeeds at safe fallback");
  await context.close();
  await delay(10200);
  const statuses = [];
  for (let i = 0; i < 5; i++)
    statuses.push(
      (await server.api.post("/api/auth/sign-in/email", { data: { email, password: "wrong-password" } })).status(),
    );
  assert.ok(statuses.includes(429));
  pass("enabled local sensitive-endpoint limiter returns 429");
  await delay(10200);
  assert.equal((await server.api.post("/api/auth/sign-in/email", { data: { email, password } })).status(), 200);
  pass("rate window recovers without disabling limiter");
  console.log(`Auth error/pending/rate checks: ${cases}/${cases} passing.`);
} finally {
  await db`delete from auth_user where email = ${email}`;
  await db.end();
  await browser.close();
  await server.stop();
}

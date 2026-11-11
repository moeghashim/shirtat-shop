import { chromium } from "playwright";
import postgres from "postgres";

import { localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";

const server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: testSecret(),
  BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
});
const browser = await chromium.launch();
const db = postgres(localDatabase);
const emails: string[] = [];
let cases = 0;
try {
  for (const entry of ["guard", "login"]) {
    const variant = "v2";
    const context = await browser.newContext({ extraHTTPHeaders: testHeaders });
    await cacheCaptureFonts(context);
    const page = await context.newPage();
    const destination = "/dashboard/tasks?search=guard-return#task-table";
    const url =
      entry === "guard"
        ? destination
        : `/auth/v2/login?redirect=${encodeURIComponent(destination.split("#")[0])}#task-table`;
    await page.goto(server.baseURL + url, { waitUntil: "domcontentloaded" });
    assert.equal(new URL(page.url()).pathname, `/auth/${variant}/login`);
    await page.waitForFunction(() => {
      const link = document.querySelector('a[href*="register"]');
      return link?.getAttribute("href")?.includes("task-table");
    });
    for (const [name, path] of [
      ["Register", "register"],
      ["Login", "login"],
      ["Register", "register"],
    ]) {
      await page.getByRole("link", { name, exact: true }).click();
      await page.waitForURL((url) => url.pathname === `/auth/${variant}/${path}`, { waitUntil: "domcontentloaded" });
      assert.equal(new URL(page.url()).searchParams.get("redirect"), destination);
    }
    cases++;
    console.log(`PASS ${variant} recovered fragment survives login/register cross-links`);
    const email = `return-${variant}-${Date.now()}@example.test`;
    emails.push(email);
    const password = testSecret();
    await page.getByLabel("Name", { exact: true }).fill("Return fixture");
    await page.getByLabel("Email Address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await page.waitForURL(
      (url) =>
        url.pathname === "/dashboard/projects/sample-operations/list" &&
        url.hash === "#task-table" &&
        !url.searchParams.has("search"),
      {
        waitUntil: "domcontentloaded",
      },
    );
    assert.equal(
      (await (await context.request.get(`${server.baseURL}/api/auth/get-session`)).json()).user.email,
      email,
    );
    cases++;
    console.log(`PASS ${variant} real signup returns to protected pathname/search/hash`);
    for (const [search, expected] of [
      ["", "/dashboard/default"],
      ["?redirect=https%3A%2F%2Fevil.example", "/dashboard/default"],
      ["?redirect=%2Fdashboard%2Fhome", "/dashboard/home"],
    ]) {
      await page.goto(`${server.baseURL}/auth/v2/login${search}`, { waitUntil: "networkidle" });
      assert.equal(new URL(page.url()).pathname, expected);
      cases++;
    }
    console.log("PASS missing/unsafe returns use Default; validated workspace Home destination wins");
    await context.close();
  }
  console.log(`Auth return paths: ${cases}/${cases} passing.`);
} finally {
  for (const email of emails) await db`delete from auth_user where email=${email}`;
  await db.end();
  await browser.close();
  await server.stop();
}

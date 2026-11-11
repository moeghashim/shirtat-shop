import { chromium, type Page } from "playwright";
import postgres from "postgres";

import { localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

async function visit(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (await page.locator("form").count())
    await page.waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((key) => key.startsWith("__reactProps"));
    });
}
const server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: testSecret(),
  BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
});
const browser = await chromium.launch();
const emails: string[] = [];
const db = postgres(localDatabase);
const evidenceDir = process.env.AUTH_EVIDENCE_ROOT
  ? `${process.env.AUTH_EVIDENCE_ROOT}/flows`
  : "screenshots/v05-002/auth";
let cases = 0;
const pass = (name: string) => {
  cases++;
  console.log(`PASS ${name}`);
};
const destination = "/dashboard/projects/sample-operations/list?query=auth-test#table";
try {
  await mkdir(evidenceDir, { recursive: true });
  for (const remember of [false, true]) {
    const variant = "v2";
    const context = await browser.newContext({ extraHTTPHeaders: testHeaders });
    await cacheCaptureFonts(context);
    context.setDefaultTimeout(15000);
    context.setDefaultNavigationTimeout(20000);
    const page = await context.newPage();
    page.on("response", (response) => {
      if (response.url().includes("/api/auth/"))
        console.log(`HTTP ${new URL(response.url()).pathname}: ${response.status()}`);
    });
    page.on("pageerror", (error) => console.log(`Browser error: ${error.message}`));
    const email = `flow-${variant}-${Date.now()}@example.test`;
    emails.push(email);
    const password = testSecret();
    await visit(page, `${server.baseURL}/auth/${variant}/register?redirect=${encodeURIComponent(destination)}`);
    await page.waitForFunction(() => {
      const form = document.querySelector("form");
      return form && Object.keys(form).some((key) => key.startsWith("__reactProps"));
    });
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await page.getByText("Enter your name.", { exact: true }).waitFor();
    assert.equal(await page.locator("#register-name").evaluate((el) => document.activeElement === el), true);
    pass(`${variant} validation and first-field focus`);
    await page.getByLabel("Name", { exact: true }).fill("Auth flow user");
    await page.getByLabel("Email Address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Register", exact: true }).click();
    await page.waitForURL((url) => url.pathname + url.search + url.hash === destination);
    assert.equal(
      (await (await context.request.get(`${server.baseURL}/api/auth/get-session`)).json()).user.email,
      email,
    );
    pass(`${variant} signup persists session and pathname/search/hash`);
    assert.ok(!(await page.content()).includes(password));
    pass(`${variant} no credential echo`);
    await visit(page, `${server.baseURL}/auth/${variant}/login?redirect=${encodeURIComponent("/dashboard/profile")}`);
    await page.waitForURL("**/dashboard/profile");
    pass(`${variant} signed-in auth redirect`);
    await page.evaluate(async () => {
      const moduleURL = "/src/lib/auth/client.ts";
      await (await import(moduleURL)).signOut();
    });
    // The revoked-route guard may win the sign-out navigation race and retain
    // the protected return path. Both routes must still end at local login.
    await page.waitForURL((url) => url.origin === server.baseURL && url.pathname === "/auth/v2/login");
    const signOutReturn = new URL(page.url()).searchParams.get("redirect");
    assert.ok(signOutReturn === null || signOutReturn === "/dashboard/profile");
    assert.equal(await (await context.request.get(`${server.baseURL}/api/auth/get-session`)).json(), null);
    pass(`${variant} client sign-out invalidates session`);
    await visit(page, `${server.baseURL}/auth/${variant}/login?redirect=${encodeURIComponent(destination)}`);
    await page.getByLabel("Email Address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Incorrect-password-123!");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await page.getByText("Email or password is incorrect. Please try again.", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Email Address", { exact: true }).inputValue(), email);
    pass(`${variant} inline server error preserves email`);
    await page.getByLabel("Password", { exact: true }).fill(password);
    if (remember) await page.getByRole("checkbox", { name: "Remember me", exact: true }).check();
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await page.waitForURL((url) => url.pathname + url.search + url.hash === destination);
    const cookie = (await context.cookies()).find((c) => c.name === "better-auth.session_token");
    assert.ok(cookie);
    assert.equal(cookie.expires === -1, !remember);
    pass(`${variant} login and remember-me persistence`);
    await context.close();
    await delay(10200); // Keep the real 3/10s email limiter enabled.
  }
  const capture = await browser.newContext({ extraHTTPHeaders: testHeaders, reducedMotion: "reduce" });
  await cacheCaptureFonts(capture);
  const page = await capture.newPage();
  for (const theme of ["light", "dark"] as const)
    for (const [viewportName, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      await page.setViewportSize(viewport);
      await capture.addCookies([{ name: "theme_mode", value: theme, url: server.baseURL }]);
      for (const variant of ["v2"])
        for (const mode of ["login", "register"]) {
          const errors: string[] = [];
          const listener = (error: Error) => errors.push(error.message);
          page.on("pageerror", listener);
          await visit(page, `${server.baseURL}/auth/${variant}/${mode}`);
          await page.getByRole("button", { name: mode === "login" ? "Login" : "Register", exact: true }).waitFor();
          assert.equal(await page.getByRole("button", { name: "Continue with Google" }).count(), 0);
          assert.equal(await page.getByRole("button", { name: "Continue with GitHub" }).count(), 0);
          assert.equal(await page.getByText("Or continue with", { exact: true }).count(), 0);
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({
            path: `${evidenceDir}/${variant}-${mode}-${theme}-${viewportName}.png`,
            fullPage: true,
          });
          await page.getByRole("button", { name: mode === "login" ? "Login" : "Register", exact: true }).click();
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({
            path: `${evidenceDir}/${variant}-${mode}-errors-${theme}-${viewportName}.png`,
            fullPage: true,
          });
          assert.deepEqual(errors, []);
          page.off("pageerror", listener);
          pass(`${variant}/${mode} ${theme}/${viewportName} + errors/providers hidden`);
        }
    }
  await capture.close();
  console.log(`Auth flows: ${cases}/${cases} passing.`);
} finally {
  for (const email of emails) await db`delete from auth_user where email = ${email}`;
  await db.end();
  await browser.close();
  await server.stop();
}

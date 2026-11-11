import { chromium } from "playwright";
import postgres from "postgres";

import { callRpc, localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { captureRoutes, httpRoutes } from "./screenshot-routes.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";
import { mkdir, readdir, readFile } from "node:fs/promises";

const evidenceDir = process.env.AUTH_EVIDENCE_ROOT
  ? `${process.env.AUTH_EVIDENCE_ROOT}/protection`
  : "screenshots/v05-003/auth";
let cases = 0;
const pass = (name: string) => {
  cases++;
  console.log(`PASS ${name}`);
};
const publicRoutes = new Set(["/", "/unauthorized", "/auth/v2", "/auth/v2/login", "/auth/v2/register", "/dashboard/$"]);
const protectedRoutes = captureRoutes.filter(({ route }) => !publicRoutes.has(route));
const rpc: { file: string; name: string }[] = [];
const allowedPublic = new Set([
  "getAuthState",
  "getValueFromCookieServer",
  "setValueToCookieServer",
  "getPreferenceServer",
  "getDashboardLayoutServer",
]);
for (const file of await readdir("src", { recursive: true })) {
  if (!/\.tsx?$/.test(file)) continue;
  const source = await readFile(`src/${file}`, "utf8");
  for (const [, name] of source.matchAll(/(?:const|function) (\w+)\s*=\s*createServerFn\(/g)) {
    if (source.includes("@/server/data/")) {
      assert.ok(source.indexOf("await requireSession()") < source.indexOf('await import("@/server/data/'));
      rpc.push({ file: `/src/${file}`, name });
    } else if (
      (file === "lib/auth/account-functions.ts" && name === "getAccountDetails") ||
      (file === "lib/assistant/server-functions.ts" && name === "getAssistantConfig")
    ) {
      rpc.push({ file: `/src/${file}`, name });
    } else if (file === "lib/auth/account-functions.ts" && name === "revokeAccountSession") {
      assert.match(source, /revokeOwnedSession/);
    } else assert.ok(allowedPublic.has(name), `Unclassified server function ${file}:${name}`);
  }
}
assert.ok(rpc.length >= 24, "Preserve the existing guarded-read inventory");
const tree = await readFile("src/routeTree.gen.ts", "utf8");
const fullPaths = tree.match(/export interface FileRoutesByFullPath \{([\s\S]*?)\n\}/)?.[1];
assert.ok(fullPaths);
for (const [, path] of fullPaths.matchAll(/'([^']+)':/g))
  assert.ok(httpRoutes.includes(path) || captureRoutes.some((r) => r.route === path), `Unclassified route ${path}`);
pass(
  `Inventory: ${captureRoutes.length} visual routes, HTTP auth handler, ${rpc.length} protected read functions, one owned session mutation and five public preference/bootstrap functions`,
);
const db = postgres(localDatabase);
const server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: testSecret(),
  BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
});
const browser = await chromium.launch();
const email = `protection-${Date.now()}@example.test`;
const password = testSecret();
try {
  const anonymous = await browser.newContext({ extraHTTPHeaders: testHeaders });
  await cacheCaptureFonts(anonymous);
  const page = await anonymous.newPage();
  page.setDefaultTimeout(15000);
  for (const { path } of protectedRoutes) {
    await page.goto(server.baseURL + path, { waitUntil: "domcontentloaded" });
    assert.equal(new URL(page.url()).pathname, "/auth/v2/login", path);
    await page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(new URL(page.url()).pathname, "/auth/v2/login");
    await page.waitForFunction(() => !!window.__TSR_ROUTER__);
    await page.evaluate(async (href) => {
      await window.__TSR_ROUTER__?.navigate({ href });
    }, path);
    assert.equal(new URL(page.url()).pathname, "/auth/v2/login");
    pass(`Anonymous SSR/refresh/client navigation ${path}`);
  }
  for (const path of [
    ...captureRoutes.filter((r) => publicRoutes.has(r.route)).map((r) => r.path),
    "/missing-root-page",
  ]) {
    await page.goto(server.baseURL + path, { waitUntil: "domcontentloaded" });
    assert.equal(new URL(page.url()).pathname, path);
    assert.equal(await page.getByRole("button", { name: /Demo account:|Signed in as/ }).count(), 0);
    pass(`Public system/auth ${path}: no account shell`);
  }
  await page.goto(`${server.baseURL}/auth/v2/login`, { waitUntil: "domcontentloaded" });
  for (const item of rpc) {
    const result = await callRpc(
      page,
      item.file,
      item.name,
      "GET",
      item.file.includes("/projects/") ? { projectId: "sample-operations" } : undefined,
    );
    assert.equal(result.ok, false, item.file);
    assert.equal(result.message, "Sign in to continue.");
    assert.match(result.cacheControl, /private.*no-store/);
    pass(`No-cookie direct RPC ${item.file}:${item.name}`);
  }
  const signed = await browser.newContext({ extraHTTPHeaders: testHeaders, reducedMotion: "reduce" });
  await cacheCaptureFonts(signed);
  const response = await signed.request.post(`${server.baseURL}/api/auth/sign-up/email`, {
    headers: { origin: server.baseURL },
    data: { email, password, name: "Alexandra Longname Authentication Example" },
  });
  assert.equal(response.status(), 200);
  const user = (await response.json()).user;
  const storage = await signed.storageState();
  const authenticated = await signed.newPage();
  const openMenu = async () => {
    await authenticated.waitForFunction(() => {
      const button = document.querySelector('[aria-label^="Signed in as"]');
      return button && Object.keys(button).some((key) => key.startsWith("__reactProps"));
    });
    await authenticated.getByRole("button", { name: `Signed in as ${user.name}` }).click();
  };
  const errors: string[] = [];
  authenticated.on("pageerror", (e) => errors.push(e.message));
  for (const { path } of protectedRoutes) {
    await authenticated.goto(server.baseURL + path, { waitUntil: "domcontentloaded" });
    assert.ok(!new URL(authenticated.url()).pathname.startsWith("/auth/"), path);
    await authenticated.reload({ waitUntil: "domcontentloaded" });
    assert.ok(!new URL(authenticated.url()).pathname.startsWith("/auth/"), path);
    await authenticated.waitForFunction(() => !!window.__TSR_ROUTER__);
    await authenticated.evaluate(async (href) => {
      await window.__TSR_ROUTER__?.navigate({ href });
    }, path);
    assert.ok(!new URL(authenticated.url()).pathname.startsWith("/auth/"), path);
    pass(`Valid SSR/refresh/client navigation ${path}`);
  }
  await authenticated.goto(`${server.baseURL}/dashboard/default`, { waitUntil: "domcontentloaded" });
  for (const item of rpc) {
    const result = await callRpc(
      authenticated,
      item.file,
      item.name,
      "GET",
      item.file.includes("/projects/") ? { projectId: "sample-operations" } : undefined,
    );
    assert.equal(result.ok, true, item.file);
    assert.match(result.cacheControl, /private.*no-store/);
    assert.ok(result.result !== undefined);
    pass(`Valid direct RPC ${item.file}:${item.name}`);
  }
  assert.deepEqual(errors, []);
  for (const state of ["tampered", "expired", "revoked"]) {
    const invalid = await browser.newContext({ extraHTTPHeaders: testHeaders, storageState: storage });
    if (state === "tampered") {
      const cookie = (await invalid.cookies()).find((c) => c.name === "better-auth.session_token");
      assert.ok(cookie);
      await invalid.addCookies([{ ...cookie, value: `${cookie.value}tampered` }]);
    } else if (state === "expired")
      await db`update auth_session set expires_at = now() - interval '1 minute' where user_id = ${user.id}`;
    else await db`delete from auth_session where user_id = ${user.id}`;
    const invalidPage = await invalid.newPage();
    await invalidPage.goto(`${server.baseURL}/auth/v2/login`, { waitUntil: "domcontentloaded" });
    for (const item of rpc) {
      const result = await callRpc(invalidPage, item.file, item.name, "GET");
      assert.equal(result.ok, false, item.file);
      assert.equal(result.message, "Sign in to continue.");
      assert.match(result.cacheControl, /private.*no-store/);
      pass(`${state} direct RPC ${item.file}:${item.name}`);
    }
    if (state === "expired" || state === "revoked") {
      for (const { path } of protectedRoutes) {
        await invalidPage.goto(server.baseURL + path, { waitUntil: "domcontentloaded" });
        assert.equal(new URL(invalidPage.url()).pathname, "/auth/v2/login");
        await invalidPage.reload({ waitUntil: "domcontentloaded" });
        assert.equal(new URL(invalidPage.url()).pathname, "/auth/v2/login");
        await invalidPage.waitForFunction(() => !!window.__TSR_ROUTER__);
        await invalidPage.evaluate(async (href) => {
          await window.__TSR_ROUTER__?.navigate({ href });
        }, path);
        assert.equal(new URL(invalidPage.url()).pathname, "/auth/v2/login");
        pass(`${state} SSR/refresh/client navigation ${path}`);
      }
    }
    await invalid.close();
  }
  await signed.request.post(`${server.baseURL}/api/auth/sign-in/email`, {
    headers: { origin: server.baseURL },
    data: { email, password },
  });
  await authenticated.goto(`${server.baseURL}/dashboard/default`, { waitUntil: "domcontentloaded" });
  await mkdir(evidenceDir, { recursive: true });
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      await signed.addCookies([{ name: "theme_mode", value: theme, url: server.baseURL }]);
      await authenticated.setViewportSize(viewport);
      for (const path of ["/dashboard/default", "/dashboard/mail", "/dashboard/chat"]) {
        await authenticated.goto(server.baseURL + path, { waitUntil: "domcontentloaded" });
        await authenticated.evaluate(() => document.fonts.ready);
        await authenticated.waitForTimeout(1800);
        await openMenu();
        await authenticated.getByRole("menuitem", { name: "Sign out", exact: true }).waitFor();
        assert.equal(await authenticated.getByText("Demo accounts", { exact: true }).count(), 0);
        await authenticated.screenshot({
          path: `${evidenceDir}/${path.replaceAll("/", "_")}-${theme}-${size}.png`,
          fullPage: true,
        });
        await authenticated.keyboard.press("Escape");
        await authenticated.waitForFunction(() =>
          document.activeElement?.getAttribute("aria-label")?.startsWith("Signed in as"),
        );
        pass(`Authenticated shell/iframe menu focus ${path} ${theme}/${size}`);
      }
    }
  await authenticated.goto(`${server.baseURL}/dashboard/mail`, { waitUntil: "domcontentloaded" });
  await authenticated.frameLocator("iframe").getByText("Inbox", { exact: true }).first().waitFor();
  await db`delete from auth_session where user_id = ${user.id}`;
  await authenticated.locator("iframe").evaluate((el: HTMLIFrameElement) => el.contentWindow?.location.reload());
  await authenticated.waitForURL((url) => url.pathname === "/auth/v2/login");
  assert.equal(new URL(authenticated.url()).searchParams.get("redirect"), "/dashboard/mail");
  pass("Expired iframe escapes to top-level login with wrapper return path");
  await signed.request.post(`${server.baseURL}/api/auth/sign-in/email`, {
    headers: { origin: server.baseURL },
    data: { email, password },
  });
  await authenticated.goto(`${server.baseURL}/dashboard/default`, { waitUntil: "domcontentloaded" });
  const otherView = await signed.newPage();
  await otherView.goto(`${server.baseURL}/dashboard/tasks`, { waitUntil: "domcontentloaded" });
  await otherView.waitForFunction(() => {
    const button = document.querySelector('[aria-label^="Signed in as"]');
    return button && Object.keys(button).some((key) => key.startsWith("__reactProps"));
  });
  await otherView.waitForTimeout(100);
  await openMenu();
  await authenticated.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await authenticated.waitForURL("**/auth/v2/login");
  await authenticated.goto(`${server.baseURL}/dashboard/default`, { waitUntil: "domcontentloaded" });
  assert.equal(new URL(authenticated.url()).pathname, "/auth/v2/login");
  pass("Shell sign-out clears session and next protected document redirects");
  await otherView.bringToFront();
  await otherView.evaluate(() => window.dispatchEvent(new Event("focus")));
  await otherView.waitForURL((url) => url.pathname === "/auth/v2/login");
  pass("Another open view drops revoked authority on refocus");
  await anonymous.close();
  await signed.close();
  console.log(`Auth protection: ${cases}/${cases} passing.`);
} finally {
  await db`delete from auth_user where email = ${email}`;
  await db.end();
  await browser.close();
  await server.stop();
}

import { chromium } from "playwright";
import postgres from "postgres";

import { localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";

const scenarios = [
  ["kanban", "", "board", ""],
  ["kanban", "?view=list&bad=drop", "list", ""],
  ["kanban", "?view=table", "list", ""],
  ["kanban", "?view=invalid", "board", ""],
  ["tasks", "?search=discard&bad=drop", "list", ""],
  ["calendar", "?mode=gantt&bad=drop", "timeline", "calendar"],
  ["file-manager", "?view=list&bad=drop", "files", "list"],
  ["file-manager", "?view=grid", "files", ""],
  ["file-manager", "?view=invalid", "files", ""],
];
const browser = await chromium.launch(),
  db = postgres(localDatabase, { max: 1 });
let cases = 0;
try {
  for (const auth of [false, true]) {
    const server = await startTestServer(
      auth
        ? {
            DATABASE_URL: localDatabase,
            BETTER_AUTH_SECRET: testSecret(),
            BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
          }
        : {},
    );
    const c = await browser.newContext({ extraHTTPHeaders: testHeaders });
    await cacheCaptureFonts(c);
    const p = await c.newPage(),
      email = `redirect-v08-${Date.now()}@example.test`;
    try {
      const homepage = await c.request.get(server.baseURL, { maxRedirects: 0 });
      assert.equal(homepage.status(), 200);
      assert.match(await homepage.text(), /An agent-ready foundation for your next dashboard/);
      cases++;
      if (auth) {
        for (const [old] of scenarios) {
          const response = await c.request.get(`${server.baseURL}/dashboard/${old}`, { maxRedirects: 0 });
          assert.equal(response.status(), 307);
          assert.match(response.headers().location, /auth\/v2\/login/);
          cases++;
        }
        const signup = await c.request.post(`${server.baseURL}/api/auth/sign-up/email`, {
          headers: { origin: server.baseURL },
          data: { name: "Redirect test", email, password: testSecret() },
        });
        assert.equal(signup.status(), 200);
      }
      for (const [old, query, view, mode] of scenarios) {
        for (const slash of ["", "/"]) {
          let response = await c.request.get(`${server.baseURL}/dashboard/${old}${slash}${query}`, { maxRedirects: 0 });
          let location = new URL(response.headers().location, server.baseURL);
          if (location.pathname === `/dashboard/${old}`) {
            assert.equal(slash, "/");
            response = await c.request.get(location.href, { maxRedirects: 0 });
            location = new URL(response.headers().location, server.baseURL);
          }
          assert.equal(response.status(), 308);
          assert.equal(location.pathname, `/dashboard/projects/sample-operations/${view}`);
          assert.equal(location.origin, server.baseURL);
          assert.equal(location.searchParams.has("bad"), false);
          assert.equal(location.searchParams.has("search"), false);
          assert.equal(location.search, mode ? `?${view === "timeline" ? "mode" : "view"}=${mode}` : "");
          cases++;
        }
        const errors: string[] = [];
        const listener = (e: Error) => errors.push(e.message);
        p.on("pageerror", listener);
        await p.goto(`${server.baseURL}/dashboard/${old}${query}#bookmark`, { waitUntil: "networkidle" });
        assert.equal(new URL(p.url()).pathname, `/dashboard/projects/sample-operations/${view}`);
        assert.equal(new URL(p.url()).hash, "#bookmark");
        assert.deepEqual(errors, []);
        p.off("pageerror", listener);
        cases++;
      }
      // Exercise the actual client router, replacement history, and Default landing fallback.
      await p.goto(`${server.baseURL}/dashboard/default`, { waitUntil: "networkidle" });
      await p.evaluate(async () => {
        await window.__TSR_ROUTER__?.navigate({ href: "/dashboard/kanban?view=table&bad=drop#client" });
      });
      await p.waitForURL(/sample-operations\/list/);
      assert.equal(new URL(p.url()).hash, "#client");
      assert.equal(new URL(p.url()).searchParams.has("bad"), false);
      await p.goBack({ waitUntil: "networkidle" });
      assert.equal(new URL(p.url()).pathname, "/dashboard/default");
      cases++;
      await p.goto(`${server.baseURL}/dashboard/tasks#back`, { waitUntil: "networkidle" });
      await p.goBack({ waitUntil: "networkidle" });
      assert.equal(new URL(p.url()).pathname, "/dashboard/default");
      cases++;
      for (const root of ["/dashboard", "/dashboard/"]) {
        let target = server.baseURL + root;
        for (const expected of root === "/dashboard/" ? ["/dashboard", "/dashboard/default"] : ["/dashboard/default"]) {
          const response = await c.request.get(target, { maxRedirects: 0 });
          assert.equal(response.status(), 307);
          const location = new URL(response.headers().location, server.baseURL);
          assert.equal(location.origin, server.baseURL);
          assert.equal(location.pathname, expected);
          target = location.href;
        }
        await p.goto(server.baseURL + root, { waitUntil: "networkidle" });
        assert.equal(new URL(p.url()).pathname, "/dashboard/default");
        cases++;
      }
      await p.goto(`${server.baseURL}/dashboard/home`, { waitUntil: "networkidle" });
      const brand = p.getByRole("link", { name: "tenboards dashboard", exact: true });
      assert.equal(await brand.getAttribute("href"), "/dashboard/default");
      await brand.focus();
      await p.keyboard.press("Enter");
      await p.waitForURL("**/dashboard/default");
      await p.goBack({ waitUntil: "networkidle" });
      assert.equal(new URL(p.url()).pathname, "/dashboard/home");
      for (const root of ["/dashboard", "/dashboard/"]) {
        await p.evaluate(async (href) => {
          await window.__TSR_ROUTER__?.navigate({ href });
        }, root);
        await p.waitForURL("**/dashboard/default");
        await p.goBack({ waitUntil: "networkidle" });
        assert.equal(new URL(p.url()).pathname, "/dashboard/home");
        cases++;
      }
      await p.evaluate(async () => {
        await window.__TSR_ROUTER__?.navigate({ href: "/" });
      });
      await p.waitForURL(`${server.baseURL}/`);
      await p.getByRole("heading", { name: "An agent-ready foundation for your next dashboard." }).waitFor();
      await p.goBack({ waitUntil: "networkidle" });
      assert.equal(new URL(p.url()).pathname, "/dashboard/home");
      cases++;
      if (auth) {
        await db`delete from auth_session where user_id in (select id from auth_user where email=${email})`;
        for (const [old] of scenarios) {
          const res = await c.request.get(`${server.baseURL}/dashboard/${old}`, { maxRedirects: 0 });
          assert.equal(res.status(), 307);
          assert.match(res.headers().location, /auth\/v2\/login/);
          cases++;
        }
      }
      console.log(
        `PASS project aliases ${auth ? "auth" : "demo"}: HTTP 308, view allowlist, query discard, trailing slash, hash, back, root, guards/revocation`,
      );
    } finally {
      await c.close();
      if (auth) await db`delete from auth_user where email=${email}`;
      await server.stop();
    }
  }
} finally {
  await browser.close();
  await db.end();
}
console.log(`Project redirects: ${cases}/${cases} passing.`);

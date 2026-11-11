import { chromium } from "playwright";

import { authDestination } from "../src/lib/auth/redirect.ts";
import { localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";

const aliases = [
  ...["default", "crm", "finance", "analytics"].map((name) => [`/dashboard/${name}-v1`, `/dashboard/${name}`]),
  ...["login", "register"].map((name) => [`/auth/v1/${name}`, `/auth/v2/${name}`]),
];
const inputs = [
  undefined,
  "/dashboard/tasks?search=legacy#task-table",
  "//evil.example",
  "/auth/v2/login",
  "/%252fevil",
  "/\\evil",
  "/dashboard/../api/auth",
];
let cases = 0;
for (const enabled of [false, true]) {
  const server = await startTestServer(
    enabled
      ? {
          DATABASE_URL: localDatabase,
          BETTER_AUTH_SECRET: testSecret(),
          BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
        }
      : {},
  );
  const browser = await chromium.launch();
  try {
    for (const [from, to] of aliases) {
      for (const value of inputs) {
        const query = value === undefined ? "" : `?redirect=${encodeURIComponent(value)}`;
        const response = await server.api.get(from + query, { maxRedirects: 0 });
        assert.equal(response.status(), 308, `${from}${query}`);
        const target = new URL(response.headers().location, server.baseURL);
        assert.equal(target.origin, server.baseURL);
        assert.equal(target.pathname, to);
        assert.equal(target.searchParams.get("redirect"), value === undefined ? null : authDestination(value));
        cases++;
      }
      const context = await browser.newContext({ extraHTTPHeaders: testHeaders });
      await cacheCaptureFonts(context);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(server.baseURL + from, { waitUntil: "networkidle" });
      const target = new URL(page.url());
      if (enabled && to.startsWith("/dashboard/")) {
        assert.equal(target.pathname, "/auth/v2/login");
        assert.equal(target.searchParams.get("redirect"), to);
      } else assert.equal(target.pathname, to);
      assert.deepEqual(errors, []);
      await context.close();
      cases++;
    }
    console.log(
      `PASS all six permanent redirects, validated query, browser destination and auth guard (${enabled ? "auth" : "demo"})`,
    );
  } finally {
    await browser.close();
    await server.stop();
  }
}
console.log(`Legacy redirects: ${cases}/${cases} passing.`);

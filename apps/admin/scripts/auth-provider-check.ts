import { chromium } from "playwright";
import postgres from "postgres";

import { localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";

let cases = 0;
for (const [label, google, github, extra] of [
  ["none", false, false, {}],
  ["google", true, false, {}],
  ["github", false, true, {}],
  ["both", true, true, {}],
  ["partial-google", false, false, { GOOGLE_CLIENT_ID: "dummy-id" }],
  ["partial-github", false, false, { GITHUB_CLIENT_SECRET: "dummy-secret" }],
  [
    "blank-halves",
    false,
    false,
    {
      GOOGLE_CLIENT_ID: "dummy-id",
      GOOGLE_CLIENT_SECRET: " ",
      GITHUB_CLIENT_ID: "",
      GITHUB_CLIENT_SECRET: "dummy-secret",
    },
  ],
] as const) {
  const server = await startTestServer({
    DATABASE_URL: localDatabase,
    BETTER_AUTH_SECRET: testSecret(),
    BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
    ...(google ? { GOOGLE_CLIENT_ID: "dummy-google-id", GOOGLE_CLIENT_SECRET: "dummy-google-secret" } : {}),
    ...(github ? { GITHUB_CLIENT_ID: "dummy-github-id", GITHUB_CLIENT_SECRET: "dummy-github-secret" } : {}),
    ...extra,
  });
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ extraHTTPHeaders: testHeaders });
    await cacheCaptureFonts(context);
    const page = await context.newPage();
    for (const variant of ["v2"])
      for (const mode of ["login", "register"]) {
        await page.goto(`${server.baseURL}/auth/${variant}/${mode}`, { waitUntil: "domcontentloaded" });
        assert.equal(await page.getByRole("button", { name: "Continue with Google" }).count(), google ? 1 : 0);
        assert.equal(await page.getByRole("button", { name: "Continue with GitHub" }).count(), github ? 1 : 0);
        console.log(`PASS ${label} ${variant}/${mode} controls`);
        cases++;
      }
    for (const [provider, enabled, host] of [
      ["google", google, "accounts.google.com"],
      ["github", github, "github.com"],
    ] as const) {
      const response = await server.api.post("/api/auth/sign-in/social", {
        data: {
          provider,
          callbackURL: "/dashboard/tasks?search=provider#table",
          errorCallbackURL: "/auth/v2/login",
          disableRedirect: true,
        },
      });
      if (!enabled) assert.equal(response.status(), 404);
      else {
        assert.equal(response.status(), 200);
        const url = new URL((await response.json()).url);
        assert.equal(url.hostname, host);
        assert.equal(url.searchParams.get("redirect_uri"), `${server.baseURL}/api/auth/callback/${provider}`);
        assert.ok(url.searchParams.get("state"));
        const db = postgres(localDatabase);
        try {
          const identifier = `auth-state:${url.searchParams.get("state")}`;
          const rows = await db`select value from auth_verification where identifier = ${identifier}`;
          assert.equal(rows.length, 1);
          const state = JSON.parse(rows[0].value);
          assert.equal(state.callbackURL, "/dashboard/tasks?search=provider#table");
          assert.ok(state.errorURL.startsWith("/auth/v2/login?"));
          await db`delete from auth_verification where identifier = ${identifier}`;
        } finally {
          await db.end();
        }
        if (label === "google") {
          const hostile = await server.api.post("/api/auth/sign-in/social", {
            data: { provider, callbackURL: "https://evil.example", disableRedirect: true },
          });
          assert.equal(hostile.status(), 403);
        }
        assert.ok(!url.href.includes("evil.example"));
        if (provider === "github") assert.ok(url.searchParams.get("scope")?.includes("user:email"));
      }
      console.log(
        `PASS ${label} ${provider} ${enabled ? "real authorize URL/state/callback" : "direct initiation rejected"}`,
      );
      cases++;
    }
  } finally {
    await browser.close();
    await server.stop();
  }
}
console.log(`Provider matrix: ${cases}/${cases} passing. Dummy credentials; no provider round-trip attempted.`);

import { chromium } from "playwright";
import postgres from "postgres";

import { localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const output = process.env.AUTH_EVIDENCE_ROOT ?? "screenshots/v06-003/auth-hydration";
await mkdir(output, { recursive: true });
const server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: testSecret(),
  BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
});
const browser = await chromium.launch();
const db = postgres(localDatabase);
const email = `hydration-${Date.now()}@example.test`;
const rows: { route: string; timezone: string; theme: string; viewport: string; phase: string; errors: string[] }[] =
  [];
try {
  const signup = await server.api.post("/api/auth/sign-up/email", {
    data: { name: "Hydration review", email, password: testSecret() },
  });
  assert.equal(signup.status(), 200);
  const state = await server.api.storageState();
  for (const timezone of ["America/Chicago", "Pacific/Kiritimati"])
    for (const theme of ["light", "dark"] as const)
      for (const [viewport, size] of Object.entries({
        desktop: { width: 1440, height: 900 },
        mobile: { width: 390, height: 844 },
      }))
        for (const route of [
          "/auth/v2/login",
          "/auth/v2/register",
          "/dashboard/default",
          "/dashboard/profile?tab=account",
        ]) {
          const context = await browser.newContext({
            viewport: size,
            colorScheme: theme,
            timezoneId: timezone,
            reducedMotion: "reduce",
            extraHTTPHeaders: testHeaders,
            ...(route.startsWith("/dashboard") ? { storageState: state } : {}),
          });
          await cacheCaptureFonts(context);
          await context.addCookies([{ name: "theme_mode", value: theme, url: server.baseURL }]);
          const page = await context.newPage();
          let errors: string[] = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("console", (m) => {
            if (m.type() === "error") errors.push(m.text());
          });
          let allowScriptsAt = Date.now() + 1500;
          await page.route("**/*", async (request) => {
            if (request.request().resourceType() === "script" && Date.now() < allowScriptsAt)
              await new Promise((resolve) => setTimeout(resolve, allowScriptsAt - Date.now()));
            await request.fallback();
          });
          for (const phase of ["direct", "refresh"]) {
            errors = [];
            allowScriptsAt = Date.now() + 1500;
            const response = phase === "direct" ? await page.goto(server.baseURL + route) : await page.reload();
            assert.equal(response?.status(), 200);
            await page.waitForFunction(() =>
              Array.from(document.querySelectorAll("body *")).some((node) =>
                Object.keys(node).some((key) => key.startsWith("__reactFiber$")),
              ),
            );
            await page.waitForFunction(
              (dark) => document.documentElement.classList.contains("dark") === dark,
              theme === "dark",
            );
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(500);
            if (route.includes("tab=account"))
              await page
                .getByRole("tabpanel", { name: "Account & security", exact: true })
                .getByRole("heading", { name: "Your sign-in account", exact: true })
                .waitFor();
            else if (route.startsWith("/auth")) await page.locator("form").waitFor();
            else await page.getByText("Total Revenue", { exact: true }).waitFor();
            const name = `${timezone.replace("/", "-")}-${route.replace(/[^\w-]/g, "_")}-${theme}-${viewport}-${phase}`;
            await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
            rows.push({ route, timezone, theme, viewport, phase, errors: [...errors] });
            console.log(`${errors.length ? "FAIL" : "PASS"} auth delayed hydration ${name}`);
          }
          await context.close();
        }
  await writeFile(`${output}/report.json`, JSON.stringify(rows, null, 2));
  assert.equal(rows.length, 64);
  assert.ok(
    rows.every((row) => !row.errors.length),
    "Hydration/console failures; inspect report.",
  );
} finally {
  await db`delete from auth_user where email=${email}`;
  await db.end();
  await browser.close();
  await server.stop();
}

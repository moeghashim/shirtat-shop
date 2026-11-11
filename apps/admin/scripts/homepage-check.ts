import { chromium } from "playwright";

import { localDatabase, startTestServer, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";

const heading = "An agent-ready foundation for your next dashboard.";
const browser = await chromium.launch();
const results: string[] = [];
const output = `screenshots/v091/${process.env.AUTH_TEST_RUNTIME === "workerd" ? "workerd" : "dev"}`;
await mkdir(output, { recursive: true });
try {
  for (const auth of [false, true]) {
    const secret = testSecret();
    const server = await startTestServer(
      auth
        ? {
            DATABASE_URL: localDatabase,
            BETTER_AUTH_SECRET: secret,
            BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
          }
        : {},
    );
    try {
      const response = await server.api.get("/", { maxRedirects: 0 });
      assert.equal(response.status(), 200);
      const html = await response.text();
      assert.ok(html.includes(heading), "Homepage content must be server rendered");
      assert.ok(!html.includes(secret));
      assert.match(html, /<title>tenboards — An agent-ready dashboard template<\/title>/);
      assert.match(html, /property="og:title" content="tenboards — An agent-ready dashboard template"/);
      if (auth) {
        const dashboard = await server.api.get("/dashboard/default", { maxRedirects: 0 });
        assert.equal(dashboard.status(), 307);
        assert.match(dashboard.headers().location, /auth\/v2\/login/);
      } else {
        for (const route of ["/dashboard", "/dashboard/"]) {
          let target = route;
          for (const expected of route.endsWith("/") ? ["/dashboard", "/dashboard/default"] : ["/dashboard/default"]) {
            const redirect = await server.api.get(target, { maxRedirects: 0 });
            assert.equal(redirect.status(), 307);
            const destination = new URL(redirect.headers().location, server.baseURL);
            assert.equal(destination.origin, server.baseURL);
            assert.equal(destination.pathname, expected);
            target = destination.pathname;
          }
        }
      }
      for (const theme of ["light", "dark"] as const) {
        const context = await browser.newContext({
          viewport: { width: 375, height: 812 },
          colorScheme: theme,
          reducedMotion: "reduce",
          permissions: ["clipboard-read", "clipboard-write"],
        });
        await cacheCaptureFonts(context);
        await context.addCookies([{ name: "theme_mode", value: theme, url: server.baseURL }]);
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        try {
          await page.goto(server.baseURL, { waitUntil: "networkidle" });
          assert.equal(new URL(page.url()).pathname, "/");
          assert.equal(await page.locator("h1").count(), 1);
          for (const name of ["Agent build workflow commands", "Quick start commands"]) {
            const panel = page.getByRole("region", { name, exact: true });
            assert.equal(await panel.count(), 1);
            assert.equal(await panel.getAttribute("tabindex"), "0");
          }
          await page.getByRole("heading", { name: heading }).waitFor();
          assert.equal(await page.locator('meta[name="description"]').count(), 1);
          assert.equal(await page.locator('meta[property="og:title"]').count(), 1);
          await page.keyboard.press("Tab");
          assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Skip to content");
          await page.keyboard.press("Enter");
          assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content");
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          const targets = await page.locator("a, button").evaluateAll((nodes) =>
            nodes
              .filter((node) => {
                const rect = node.getBoundingClientRect();
                return (
                  getComputedStyle(node).clip !== "rect(0px, 0px, 0px, 0px)" &&
                  getComputedStyle(node).clipPath !== "inset(50%)" &&
                  rect.width > 1 &&
                  rect.height > 1 &&
                  (rect.width < 24 || rect.height < 24)
                );
              })
              .map((node) => node.textContent),
          );
          assert.deepEqual(targets, [], "Visible targets must meet the 24px floor");
          for (const image of await page.locator("main img").all()) {
            assert.equal(await image.getAttribute("width"), "1440");
            assert.equal(await image.getAttribute("height"), "900");
            assert.ok(await image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth === 1440));
          }
          const links = await page
            .locator("main a")
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") ?? ""));
          if (!auth && theme === "light") {
            for (const href of new Set(links.filter((href) => href.startsWith("/") && !href.startsWith("//")))) {
              assert.equal((await server.api.get(href)).status(), 200, href);
            }
          }
          await page.getByRole("button", { name: "Copy commands", exact: true }).click();
          await page.getByRole("status").filter({ hasText: "Quick start commands copied." }).waitFor();
          const copied = await page.evaluate(() => navigator.clipboard.readText());
          assert.match(copied, /^git clone https:\/\/github.com\/moeghashim\/tenboards.git/);
          assert.ok(copied.includes("OPENUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 npm install"));
          await page.evaluate(() => {
            navigator.clipboard.writeText = async () => {
              throw new Error("Denied by test");
            };
          });
          await page.getByRole("button", { name: "Copy commands", exact: true }).click();
          await page
            .getByRole("status")
            .filter({ hasText: "Copy unavailable. Select and copy the commands below." })
            .waitFor();
          await page.getByRole("button", { name: /Current theme:/ }).click();
          const expected = theme === "light" ? "dark" : "system";
          await page.getByRole("button", { name: `Current theme: ${expected}. Click to cycle themes` }).waitFor();
          await page.reload({ waitUntil: "networkidle" });
          await page.getByRole("button", { name: `Current theme: ${expected}. Click to cycle themes` }).waitFor();
          assert.deepEqual(errors, []);
          results.push(
            `PASS ${auth ? "auth" : "demo"}/${theme}: public SSR/metadata, 375px, skip/focus, targets, images, links, clipboard success/failure, persisted theme, no runtime errors`,
          );
        } finally {
          await context.close();
        }
      }
    } finally {
      await server.stop();
    }
  }
  const imageBytes = (
    await Promise.all(
      (
        await readdir("public/homepage")
      )
        .filter((file) => /\.(webp|avif)$/.test(file))
        .map(async (file) => (await stat(`public/homepage/${file}`)).size),
    )
  ).reduce((sum, size) => sum + size, 0);
  assert.ok(imageBytes <= 600_000, `Image budget exceeded: ${imageBytes}`);
  results.push(`PASS image budget: ${imageBytes} bytes`);
  console.log(results.join("\n"));
  await writeFile(`${output}/homepage-check.json`, JSON.stringify({ passed: true, results }, null, 2));
} finally {
  await browser.close();
}

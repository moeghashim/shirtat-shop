import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [baseURL, output] = process.argv.slice(2);
assert.ok(baseURL && output, "Provide a dev URL and evidence directory");
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results: string[] = [];
try {
  for (const theme of ["light", "dark"] as const) {
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce" });
      await cacheCaptureFonts(context);
      await context.addCookies([{ name: "theme_mode", value: theme, url: baseURL }]);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(baseURL);
        await page.getByRole("heading", { name: "An agent-ready foundation for your next dashboard." }).waitFor();
        await page.getByRole("link", { name: "Open live demo", exact: true }).first().click();
        await page.waitForURL("**/dashboard/default");
        await page.getByText("Total Revenue").first().waitFor();
        await page.goto(`${baseURL}/dashboard/home`);
        await page.getByRole("heading", { name: "My tasks", exact: true }).waitFor();
        await page.waitForLoadState("networkidle");
        for (const [slug, title] of [
          ["generator-dashboard", 'Operations "weekly" & <review>'],
          ["generator-page", "Generator Page"],
        ]) {
          await page.keyboard.press("Control+k");
          await page.getByRole("combobox").fill(title);
          await page.getByRole("option").filter({ hasText: title }).waitFor();
          await page.keyboard.press("Enter");
          await page.waitForURL(`**/dashboard/${slug}`);
          await page.getByRole("heading", { level: 1, name: title, exact: true }).waitFor();
          await page.waitForLoadState("networkidle");
          assert.equal(await page.locator("h1").count(), 1);
          assert.equal(
            await page
              .locator("html")
              .getAttribute("class")
              .then((value) => value?.includes("dark") ?? false),
            theme === "dark",
          );
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No page overflow");
          const table = page.getByRole("table", { name: "Illustrative requests", exact: true });
          await page
            .getByRole("navigation", { name: "Illustrative requests pages" })
            .getByRole("button", { name: "Next", exact: true })
            .press("Space");
          await table.getByRole("cell", { name: "Publish release notes", exact: true }).waitFor();
          await page
            .getByRole("navigation", { name: "Illustrative requests pages" })
            .getByRole("button", { name: "Previous", exact: true })
            .press("Space");
          if (size === "desktop") {
            await table.getByRole("button", { name: "Sort by Title", exact: true }).click();
            await table.getByRole("cell", { name: "Check mobile navigation", exact: true }).waitFor();
          }
          if (slug === "generator-dashboard") {
            await page.getByText("View chart data", { exact: true }).click();
            await page.getByRole("table", { name: "Illustrative requests by weekday", exact: true }).waitFor();
            await page.getByText("View chart data", { exact: true }).click();
          }
          await page.reload();
          await page.getByRole("heading", { level: 1, name: title, exact: true }).waitFor();
          await page.waitForLoadState("networkidle");
        }
        assert.deepEqual(errors, [], `${theme}/${size}: console/hydration errors`);
        results.push(
          `PASS ${theme}/${size}: homepage → demo → Home, palette discovery, both generated pages, pagination, chart data, refresh, no console errors or overflow`,
        );
      } catch (error) {
        await page.screenshot({ path: path.join(output, `failure-${theme}-${size}.png`), fullPage: true });
        await writeFile(path.join(output, `failure-${theme}-${size}.html`), await page.content());
        await writeFile(
          path.join(output, `failure-${theme}-${size}.json`),
          JSON.stringify({ url: page.url(), errors }, null, 2),
        );
        throw error;
      } finally {
        await context.close();
      }
    }
  }
  console.log(results.join("\n"));
} finally {
  await writeFile(path.join(output, "interactions.json"), JSON.stringify(results, null, 2));
  await browser.close();
}

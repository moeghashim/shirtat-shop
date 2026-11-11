import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.BLOCKS_TEST_URL ?? "http://127.0.0.1:3000";
const output = "screenshots/v0.9-001/interactions";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results: string[] = [];
try {
  for (const theme of ["light", "dark"] as const) {
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const context = await browser.newContext({
        viewport,
        colorScheme: theme,
        reducedMotion: "reduce",
        permissions: ["clipboard-read", "clipboard-write"],
      });
      await cacheCaptureFonts(context);
      await context.addCookies([{ name: "theme_mode", value: theme, url: baseURL }]);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(baseURL);
      await page.getByRole("heading", { name: "An agent-ready foundation for your next dashboard." }).waitFor();
      await page.getByRole("link", { name: "Open live demo", exact: true }).first().click();
      await page.waitForURL("**/dashboard/default");
      await page.getByText("Total Revenue").first().waitFor();
      await page.goto(new URL("/dashboard/home", baseURL).href);
      await page.getByRole("heading", { name: "My tasks", exact: true }).waitFor();
      await page.waitForLoadState("networkidle");
      await page.keyboard.press("Control+k");
      const search = page.getByRole("combobox");
      await search.fill("Blocks kit");
      await page.getByRole("option", { name: /Blocks kit/ }).waitFor();
      await page.keyboard.press("Enter");
      await page.waitForURL("**/dashboard/kit");
      await page.getByRole("heading", { name: "Blocks kit", exact: true }).waitFor();
      await page.waitForLoadState("networkidle");
      assert.equal(await page.locator("h1").count(), 1);
      if (size === "desktop") {
        await page.getByRole("button", { name: "Developer", exact: true }).waitFor();
        assert.equal(
          await page.getByRole("link", { name: "Blocks kit", exact: true }).getAttribute("aria-current"),
          "page",
        );
      }
      const description = page.getByRole("button", { name: "Description", exact: true });
      await description.focus();
      await page.keyboard.press("Space");
      assert.equal(await description.getAttribute("aria-pressed"), "false");
      assert.equal(
        await page
          .locator("p")
          .filter({ hasText: /^Build with the same presentation/ })
          .count(),
        0,
      );
      await page.keyboard.press("Space");
      for (const name of ["PageHeader", "Cards", "Charts", "DataTable"]) {
        const summary = page.locator("summary").filter({ hasText: `View ${name} source` });
        await summary.focus();
        await page.keyboard.press("Enter");
        await page.getByRole("button", { name: `Copy ${name} source`, exact: true }).click();
        assert.match(await page.evaluate(() => navigator.clipboard.readText()), /@\/components\/blocks/);
        await summary.focus();
        await page.keyboard.press("Enter");
      }
      // Exercise clipboard rejection, without altering the protected CodeBlock wrapper.
      await page.locator("summary").filter({ hasText: "View PageHeader source" }).click();
      await page.evaluate(() => {
        Object.defineProperty(navigator.clipboard, "writeText", {
          configurable: true,
          value: () => Promise.reject(new Error("Denied")),
        });
      });
      await page.getByRole("button", { name: "Copy PageHeader source", exact: true }).click();
      await page.getByText("Copy unavailable. Select and copy the source below.").waitFor();
      await page.locator("summary").filter({ hasText: "View PageHeader source" }).click();
      const table = page.getByRole("table", { name: "Illustrative requests", exact: true });
      const titleSort = page.getByRole("button", { name: "Sort by Title", exact: true });
      await titleSort.focus();
      await page.keyboard.press("Enter");
      assert.equal(await table.locator("th").filter({ has: titleSort }).getAttribute("aria-sort"), "ascending");
      assert.match((await table.locator("tbody tr").first().textContent()) ?? "", /Check mobile navigation/);
      await page.keyboard.press("Enter");
      assert.equal(await table.locator("th").filter({ has: titleSort }).getAttribute("aria-sort"), "descending");
      assert.match((await table.locator("tbody tr").first().textContent()) ?? "", /Verify keyboard focus/);
      await page.getByRole("button", { name: "Next", exact: true }).click();
      assert.equal(await table.locator("tbody tr").count(), 2);
      assert.equal(await page.getByRole("button", { name: "Next", exact: true }).isDisabled(), true);
      await page.getByRole("button", { name: "Empty state", exact: true }).click();
      await page.getByText("No requests to display.", { exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Previous", exact: true }).isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: "Next", exact: true }).isDisabled(), true);
      await page.getByRole("button", { name: "Restore examples", exact: true }).click();
      assert.equal(await table.locator("tbody tr").count(), 3);
      await page.getByRole("button", { name: "Mobile reflow", exact: true }).click();
      assert.equal(await table.evaluate((el) => getComputedStyle(el).display), "table");
      await page.getByRole("button", { name: "Mobile reflow", exact: true }).click();
      if (size === "mobile")
        assert.equal(
          await table
            .locator("tbody tr")
            .first()
            .evaluate((el) => getComputedStyle(el).display),
          "grid",
        );
      const compare = page.getByRole("button", { name: "Compare series", exact: true });
      await compare.click();
      assert.equal(await page.locator(".recharts-line").count(), 1);
      await compare.click();
      assert.equal(await page.locator(".recharts-line").count(), 2);
      await page.locator("summary").filter({ hasText: "View chart data" }).click();
      assert.equal(
        await page
          .getByRole("table", { name: "Illustrative requests by weekday", exact: true })
          .locator("tbody tr")
          .count(),
        5,
      );
      const chart = page.locator(".recharts-surface").first();
      await chart.focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(await chart.evaluate((el) => getComputedStyle(el).outlineStyle), "solid");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${output}/${theme}-${size}.png`, fullPage: true, animations: "disabled" });
      assert.deepEqual(errors, []);
      results.push(
        `PASS ${theme}/${size}: homepage→demo, home, palette→kit, sidebar, keyboard/source/copy/recovery, sorting, pagination, empty, mobile reflow/scroll, chart variants/data/focus, no overflow or console/hydration errors`,
      );
      console.log(results.at(-1));
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2));
}

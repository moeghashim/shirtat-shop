import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.ASSISTANT_TEST_URL ?? "http://127.0.0.1:3170";
const output = process.env.ASSISTANT_EVIDENCE_ROOT ?? "verify/blocks";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const reports = [];
try {
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce" });
      await cacheCaptureFonts(context);
      await context.addCookies([{ name: "theme_mode", value: theme, url: baseURL }]);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(`${baseURL}/dashboard/assistant`);
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `${output}/${theme}-${size}-before.png`, fullPage: true });
      if (process.env.ASSISTANT_BLOCKS_PROBE === "1") {
        const proof = await page.evaluate(async () => {
          const path = "/scripts/assistant-renderer-probe.tsx";
          return (await import(path)).runBlocks();
        });
        assert.deepEqual(proof, { initial: true, refreshed: true, stable: true });
      }
      const input = page.getByRole("textbox", { name: "Message", exact: true });
      await input.fill("Show sample blocks");
      await input.press("Enter");
      await page.getByRole("heading", { name: "Sample activity", exact: true }).waitFor();
      await page.getByRole("button", { name: "Stop", exact: true }).waitFor({ state: "hidden" });
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.locator("[data-panel-id]").count(), 5);
      assert.equal(await page.getByRole("table", { name: "Sample plans", exact: true }).count(), 1);
      assert.equal(await page.getByText("could not be displayed", { exact: false }).count(), 0);
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      await page.screenshot({ path: `${output}/${theme}-${size}-after.png`, fullPage: true });
      for (const id of ["summary", "plans", "bar", "line", "area"]) {
        const panel = page.locator(`[data-panel-id="${id}"]`);
        await panel.scrollIntoViewIfNeeded();
        await panel.screenshot({ path: `${output}/${theme}-${size}-${id}.png` });
      }
      reports.push({ theme, size, errors, violations: axe.violations });
      assert.deepEqual(errors, []);
      assert.deepEqual(axe.violations, []);
      console.log(`PASS blocks ${theme}/${size}`);
      await context.close();
    }
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(reports, null, 2));
  await browser.close();
}

import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const output = process.env.ASSISTANT_EVIDENCE_ROOT ?? "screenshots/v07-002/configured";
await mkdir(output, { recursive: true });
const worker = await startWorker(
  { OPENAI_API_KEY: "synthetic-v07-openai-success", META_API_KEY: "synthetic-v07-meta-success" },
  { port: 3018, assistantMock: true },
);
const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce" });
      await cacheCaptureFonts(context);
      await context.addCookies([{ name: "theme_mode", value: theme, url: worker.baseURL }]);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(`${worker.baseURL}/dashboard/assistant`);
      await page.waitForLoadState("networkidle");
      const picker = page.getByRole("combobox", { name: "Provider", exact: true });
      assert.deepEqual(await picker.locator("option").allTextContents(), [
        "OpenAI · gpt-6.1-sol",
        "Meta · muse-spark-1.3",
      ]);
      await picker.selectOption("meta");
      await picker.focus();
      await page.screenshot({ path: `${output}/${theme}-${size}-empty.png`, fullPage: true });
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let selected: string | undefined;
      await page.route("**/api/assistant", async (route) => {
        selected = route.request().postDataJSON().provider;
        await gate;
        await route.continue();
      });
      await page.getByRole("textbox", { name: "Message", exact: true }).fill("SYNTHETIC_UI_PROMPT");
      await page.getByRole("button", { name: "Send", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Stop", exact: true }).waitFor();
      assert.ok(await picker.isDisabled());
      await page.getByText("Meta · muse-spark-1.3 · streaming", { exact: true }).waitFor();
      await page.screenshot({ path: `${output}/${theme}-${size}-streaming.png`, fullPage: true });
      release();
      await page.getByText("Meta · muse-spark-1.3 · completed", { exact: true }).waitFor();
      assert.equal(selected, "meta");
      assert.ok(await picker.isEnabled());
      await picker.selectOption("openai");
      await page.getByText("Meta · muse-spark-1.3 · completed", { exact: true }).waitFor();
      assert.equal(await page.locator("article").count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      await page.screenshot({ path: `${output}/${theme}-${size}-completed.png`, fullPage: true });
      await context.close();
      console.log(
        `PASS configured picker, selected POST, disabled while busy, frozen attribution, overflow/console ${theme}/${size}`,
      );
    }
} finally {
  await browser.close();
  await worker.stop();
}

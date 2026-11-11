import { chromium } from "playwright";

import { encodeEvent } from "../src/lib/assistant/transport.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.ASSISTANT_TEST_URL ?? "http://127.0.0.1:3170";
const output = process.env.ASSISTANT_EVIDENCE_ROOT ?? "screenshots/v07-r2/ui";
const reply =
  'root = Stack([Text("Illustrative launch snapshot"), Stat("Ready tasks", "18 of 24", "6 tasks remain in this sample."), Table(["Stage", "Tasks"], [["Ready", 18], ["In review", 6]]), Chart("Sample completion trend", "bar", ["Mon", "Tue"], [{label: "Completed", values: [12,18]}])])';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"] as const)
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
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      let count = 0;
      let release = () => {
        /* No request is waiting yet. */
      };
      let gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route("**/api/assistant", async (route) => {
        count++;
        await gate;
        await route
          .fulfill({
            contentType: "text/event-stream",
            body: Buffer.concat([
              encodeEvent({ v: 1, type: "text-delta", text: reply }),
              encodeEvent({ v: 1, type: "finish" }),
            ]),
          })
          .catch(() => {
            /* The Stop case intentionally cancels this request. */
          });
      });
      await page.goto(`${baseURL}/dashboard/assistant`);
      await page.waitForLoadState("networkidle");
      const input = page.getByRole("textbox", { name: "Message", exact: true });
      const log = page.getByRole("log", { name: "Conversation", includeHidden: true });
      assert.equal(await log.getAttribute("aria-live"), "polite");
      await page.screenshot({ path: `${output}/${theme}-${size}-empty.png` });
      const oneRow = (await input.boundingBox())!.height;
      await input.fill(Array.from({ length: 12 }, () => "A line").join("\n"));
      const manyRows = (await input.boundingBox())!.height;
      const metrics = await input.evaluate((el) => ({
        line: Number.parseFloat(getComputedStyle(el).lineHeight),
        padding:
          Number.parseFloat(getComputedStyle(el).paddingTop) + Number.parseFloat(getComputedStyle(el).paddingBottom),
        scroll: el.scrollHeight,
        height: el.clientHeight,
      }));
      assert.ok(manyRows > oneRow * 2 && manyRows <= metrics.line * 8 + metrics.padding + 2);
      assert.ok(metrics.scroll > metrics.height);
      await input.fill("Sample launch");
      await input.press("Shift+Enter");
      assert.equal(await input.inputValue(), "Sample launch\n");
      assert.equal(count, 0);
      await input.press("Enter");
      await page.getByRole("button", { name: "Stop", exact: true }).waitFor();
      await page.getByText("Preparing response…", { exact: true }).waitFor();
      await page.getByRole("heading", { name: "Assistant reply", exact: true }).waitFor();
      assert.ok(await input.evaluate((el) => document.activeElement === el));
      assert.equal(await log.getAttribute("aria-busy"), "true");
      await page.screenshot({ path: `${output}/${theme}-${size}-streaming.png` });
      await page.getByRole("button", { name: "Stop", exact: true }).press("Enter");
      await page.getByText("Response stopped. This reply is incomplete.", { exact: true }).waitFor();
      assert.ok(await input.evaluate((el) => document.activeElement === el));
      release();
      await page.getByRole("button", { name: "Regenerate", exact: true }).press("Enter");
      await page.getByText("Recorded demo · completed", { exact: true }).waitFor();
      assert.equal(await page.locator("article").count(), 1);
      assert.ok(await input.evaluate((el) => document.activeElement === el));
      await page.getByRole("button", { name: "Copy reply", exact: true }).click();
      await page.getByText("Reply copied.", { exact: true }).waitFor();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      assert.ok(copied.includes("Ready tasks") && copied.includes("Sample completion trend"));
      assert.ok(!copied.includes("root =") && !copied.includes("Regenerate"));
      await page.locator("[data-assistant-scroll]").evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({ path: `${output}/${theme}-${size}-completed.png` });
      const jump = page.getByRole("button", { name: "Jump to latest", exact: true });
      if (await jump.count()) await jump.click();
      await page.screenshot({ path: `${output}/${theme}-${size}-completed-latest.png` });
      gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await input.fill("Another question");
      await input.press("Enter");
      await page.getByRole("button", { name: "Stop", exact: true }).waitFor();
      await page.locator("[data-assistant-scroll]").evaluate((el) => {
        el.scrollTop = 0;
      });
      await jump.waitFor();
      release();
      await page.locator("article").last().getByText("Recorded demo · completed", { exact: true }).waitFor();
      assert.ok(await page.locator("[data-assistant-scroll]").evaluate((el) => el.scrollTop < 2));
      await jump.click();
      await page.waitForFunction(() => {
        const el = document.querySelector("[data-assistant-scroll]")!;
        return el.scrollHeight - el.clientHeight - el.scrollTop < 2;
      });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && scrollY === 0));
      const bounds = (await page.locator("form").boundingBox())!;
      assert.ok(Math.abs(bounds.y + bounds.height - viewport.height) < 2);
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${theme}/${size}: Enter/Shift+Enter, 1–8 rows, pre-token indicator, Stop, regenerate, copy, paused/resumed scrolling, fixed composer, log, zero console errors`,
      );
      await context.close();
    }
} finally {
  await browser.close();
}

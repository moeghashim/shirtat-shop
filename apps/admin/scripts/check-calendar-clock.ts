import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";

const browser = await chromium.launch();
try {
  await Promise.all(
    process.argv.slice(2).map(async (baseURL) => {
      const page = await browser.newPage({ timezoneId: "America/Chicago", reducedMotion: "reduce" });
      await cacheCaptureFonts(page.context());
      await page.goto(`${baseURL}/dashboard/calendar`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("combobox", { name: "Calendar view", exact: true }).click();
      await page.getByRole("option", { name: "Day", exact: true }).click();
      await page.getByRole("button", { name: "Today", exact: true }).click();
      const sample = () =>
        page.evaluate(() => {
          const line = document.querySelector("div.border-destructive");
          if (!line) throw new Error("Missing now marker");
          return { top: parseFloat(getComputedStyle(line).top), now: Date.now() };
        });
      const before = await sample();
      await page.waitForTimeout(65000);
      const after = await sample();
      assert.ok(after.now - before.now >= 64000);
      assert.notEqual(before.top, after.top, "Calendar marker must advance with the real clock");
      console.log(JSON.stringify({ baseURL, before, after, passing: true }));
      await page.close();
    }),
  );
} finally {
  await browser.close();
}

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch();
const output = "screenshots/controls-interactions";
await mkdir(output, { recursive: true });
const measurements = [];
try {
  for (const mode of ["light", "dark"] as const) {
    for (const [name, width, height] of [
      ["desktop", 1440, 1000],
      ["mobile", 390, 844],
    ] as const) {
      const context = await browser.newContext({ viewport: { width, height }, colorScheme: mode });
      const page = await context.newPage();
      await page.context().addCookies([{ name: "theme_mode", value: mode, domain: "127.0.0.1", path: "/" }]);
      await page.goto("http://127.0.0.1:3000/dashboard/kit");
      await page.waitForLoadState("networkidle");
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), mode === "dark");
      const row = page.locator('[data-testid="control-regression-row"]');
      const boxes = await row
        .locator('[data-slot="select-trigger"], [data-slot="native-select"], [data-slot="input"], [data-slot="button"]')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const r = element.getBoundingClientRect();
            return { slot: element.getAttribute("data-slot"), height: r.height, bottom: r.bottom };
          }),
        );
      assert.equal(boxes.length, 5);
      assert(Math.max(...boxes.map((b) => b.height)) - Math.min(...boxes.map((b) => b.height)) <= 0.5);
      assert(Math.max(...boxes.map((b) => b.bottom)) - Math.min(...boxes.map((b) => b.bottom)) <= 0.5);
      measurements.push({ mode, viewport: name, boxes });
      await page.screenshot({ animations: "disabled", path: `${output}/kit-${mode}-${name}.png`, fullPage: true });
      for (const id of ["kit-phase", "kit-area", "kit-start", "kit-end"]) {
        await page.keyboard.press("Tab");
        await page.locator(`#${id}`).focus();
        await page.screenshot({ animations: "disabled", path: `${output}/focus-${id}-${mode}-${name}.png` });
      }
      await row.getByRole("button", { name: "Apply", exact: true }).focus();
      await page.screenshot({ animations: "disabled", path: `${output}/focus-button-${mode}-${name}.png` });
      await page.goto("http://127.0.0.1:3000/dashboard/users");
      await page.waitForLoadState("networkidle");
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), mode === "dark");
      if ((await page.getByRole("textbox", { name: "Search users" }).count()) === 0) {
        console.log(`PASS ${mode}/${name}: kit row aligned; Users and Products routes are not mounted`);
        await context.close();
        continue;
      }
      await page.getByRole("textbox", { name: "Search users" }).focus();
      await page.screenshot({ animations: "disabled", path: `${output}/focus-input-${mode}-${name}.png` });
      await page.locator('button[aria-label="Role"]').click();
      const search = page.getByRole("combobox", { name: "Search Role options" });
      await search.fill("Admin");
      await page.screenshot({ animations: "disabled", path: `${output}/role-search-${mode}-${name}.png` });
      const violations = (
        await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()
      ).violations;
      assert.equal(violations.length, 0, JSON.stringify(violations));
      await page.getByRole("option", { name: /^Admin/ }).click();
      const clear = page.getByRole("button", { name: "Clear Role filter" });
      await clear.focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator('button[aria-label="Role"]').evaluate((e) => e === document.activeElement), true);
      await page.getByRole("combobox", { name: "Team", exact: true }).click();
      await page.screenshot({ animations: "disabled", path: `${output}/select-${mode}-${name}.png` });
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: /actions for/i })
        .first()
        .click();
      await page.screenshot({ animations: "disabled", path: `${output}/dropdown-${mode}-${name}.png` });
      await page.keyboard.press("Escape");
      await page.goto("http://127.0.0.1:3000/dashboard/products");
      await page.waitForLoadState("networkidle");
      await page.getByRole("combobox", { name: "Status", exact: true }).click();
      await page.getByRole("option").nth(1).click();
      await page.getByRole("button", { name: "Clear Status filter" }).click();
      assert.equal(
        await page.getByRole("combobox", { name: "Status", exact: true }).evaluate((e) => e === document.activeElement),
        true,
      );
      await context.close();
      console.log(
        `PASS ${mode}/${name}: equal heights/bottom edges, Role search, keyboard clear/focus return, open-popup axe`,
      );
    }
  }
} finally {
  await writeFile(`${output}/measurements.json`, JSON.stringify(measurements, null, 2));
  await browser.close();
}

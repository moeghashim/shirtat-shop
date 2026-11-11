import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { measureDensity } from "./screenshot-density.ts";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "base-url": { type: "string", default: "http://127.0.0.1:3000" },
    output: { type: "string", default: "screenshots/density/fonts" },
  },
});
const baseURL = new URL(values["base-url"]);
// Read keys without importing the registry's Vite-only CSS URL imports into Node.
const registry = await readFile("src/lib/fonts/registry.ts", "utf8");
const fonts = Array.from(registry.matchAll(/^ {2}(\w+): \{\n {4}label:/gm), (match) => match[1]);
assert.ok(fonts.length > 0);
await mkdir(values.output, { recursive: true });
const browser = await chromium.launch();
const results: unknown[] = [];
try {
  for (const font of fonts) {
    for (const theme of ["light", "dark"] as const) {
      for (const mobile of [false, true]) {
        const label = `${font}-${theme}-${mobile ? "mobile" : "desktop"}`;
        const context = await browser.newContext({
          viewport: { width: mobile ? 390 : 1440, height: 900 },
          colorScheme: theme,
          reducedMotion: "reduce",
        });
        const errors: string[] = [];
        try {
          await cacheCaptureFonts(context);
          await context.addCookies(
            Object.entries({ font, theme_mode: theme }).map(([name, value]) => ({ name, value, url: baseURL.origin })),
          );
          const page = await context.newPage();
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("console", (m) => {
            if (m.type() === "error") errors.push(m.text());
          });
          await page.goto(new URL("/dashboard/tasks", baseURL).href);
          await page.waitForFunction(() =>
            Object.keys(document.querySelector("header") ?? {}).some((key) => key.startsWith("__reactFiber$")),
          );
          await page.waitForLoadState("networkidle");
          await page.evaluate(() => document.fonts.ready);
          const metrics = await page.evaluate(() => {
            const shell = document.querySelector(".tenboards-shell") as HTMLElement;
            const visible = (el: Element) => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden";
            const targets = Array.from(shell.querySelectorAll("button,[data-slot=button],[data-slot=select-trigger]"))
              .filter(visible)
              .map((el) => ({
                name: el.getAttribute("aria-label") ?? el.textContent,
                width: el.getBoundingClientRect().width,
                height: el.getBoundingClientRect().height,
              }));
            const tinyText = Array.from(shell.querySelectorAll("*"))
              .filter(
                (el) =>
                  visible(el) &&
                  !el.closest("svg,.sr-only,[aria-hidden=true]") &&
                  Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) &&
                  parseFloat(getComputedStyle(el).fontSize) < 12,
              )
              .map((el) => ({ text: el.textContent?.slice(0, 50), font: getComputedStyle(el).fontSize }));
            return {
              font: document.documentElement.dataset.font,
              loaded: document.fonts.check(`13px ${getComputedStyle(document.body).fontFamily.split(",")[0]}`),
              root: getComputedStyle(document.documentElement).fontSize,
              body: getComputedStyle(document.body).fontSize,
              width: document.documentElement.scrollWidth,
              viewport: innerWidth,
              header: document.querySelector("header")?.getBoundingClientRect().height,
              tableFonts: Array.from(shell.querySelectorAll("td")).map((el) =>
                parseFloat(getComputedStyle(el).fontSize),
              ),
              smallTargets: targets.filter((t) => t.width < 23.99 || t.height < 23.99),
              tinyText,
            };
          });
          assert.equal(metrics.font, font);
          assert.equal(metrics.loaded, true, `${label}: selected face loaded`);
          assert.equal(metrics.root, "16px");
          assert.equal(metrics.body, "13px");
          assert.equal(metrics.width, metrics.viewport, `${label}: no page overflow`);
          assert.equal(metrics.header, mobile ? 56 : 48);
          assert.ok(
            metrics.tableFonts.every((size) => size >= 13),
            `${label}: table body floor`,
          );
          assert.deepEqual(metrics.smallTargets, [], `${label}: control target floor`);
          assert.deepEqual(metrics.tinyText, [], `${label}: metadata floor`);
          assert.deepEqual(errors, [], `${label}: console/hydration`);
          await page.screenshot({ path: `${values.output}/${label}.png`, fullPage: true });
          // The task table alone cannot catch fixed-width dashboard selects.
          await page.goto(new URL("/dashboard/default", baseURL).href);
          await page.waitForLoadState("networkidle");
          await page.evaluate(() => document.fonts.ready);
          const dashboard = await measureDensity(page);
          assert.deepEqual(
            dashboard.flatMap((frame) => frame.clippedSelectValues),
            [],
            `${label}: select labels fit`,
          );
          assert.deepEqual(errors, [], `${label}: dashboard console/hydration`);
          await page.screenshot({ path: `${values.output}/${label}-default.png`, fullPage: true });
          results.push({ label, metrics, dashboard, errors });
          console.log(`PASS ${label}`);
        } finally {
          await context.close();
        }
      }
    }
  }
} finally {
  await browser.close();
  await writeFile(`${values.output}/report.json`, JSON.stringify(results, null, 2));
  console.log(`${results.length} font/theme/viewport combinations passed`);
}

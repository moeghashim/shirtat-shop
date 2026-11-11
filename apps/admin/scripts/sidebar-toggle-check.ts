import { chromium } from "playwright";

import { SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "../src/lib/preferences/layout.ts";
import { THEME_PRESET_VALUES } from "../src/lib/preferences/theme.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "base-url": { type: "string", default: "http://127.0.0.1:3000" },
    ssr: { type: "boolean", default: false },
  },
});
const baseURL = new URL(values["base-url"]);
const browser = await chromium.launch();
let passed = 0;
try {
  for (const variant of SIDEBAR_VARIANT_VALUES) {
    for (const collapse of SIDEBAR_COLLAPSIBLE_VALUES) {
      for (const preset of THEME_PRESET_VALUES) {
        for (const theme of ["light", "dark"] as const) {
          for (const mobile of [false, true]) {
            const label = `${variant}/${collapse}/${preset}/${theme}/${mobile ? "mobile" : "desktop"}`;
            const context = await browser.newContext({
              viewport: { width: mobile ? 390 : 1440, height: 900 },
              colorScheme: theme,
              reducedMotion: "reduce",
              javaScriptEnabled: !values.ssr,
            });
            await cacheCaptureFonts(context);
            await context.addCookies(
              Object.entries({
                sidebar_variant: variant,
                sidebar_collapsible: collapse,
                sidebar_state: "false",
                theme_mode: theme,
                theme_preset: preset,
              }).map(([name, value]) => ({ name, value, url: baseURL.origin })),
            );
            const page = await context.newPage();
            const errors: string[] = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("console", (message) => {
              if (message.type() === "error") errors.push(message.text());
            });
            try {
              const response = await page.goto(new URL("/dashboard/default", baseURL).href);
              assert.equal(response?.status(), 200, label);
              const header = page.locator('[data-slot="sidebar-inset"] > header');
              const opener = header.getByRole("button", { name: "Toggle Sidebar", exact: true });
              const rail = page.locator('[data-slot="sidebar-inner"] [data-slot="sidebar-trigger"]');
              if (!values.ssr) {
                await page.waitForFunction(() =>
                  Object.keys(document.querySelector("header") ?? {}).some((key) => key.startsWith("__reactFiber$")),
                );
                if (mobile) await rail.waitFor({ state: "detached" });
                await page.waitForLoadState("networkidle");
              }
              assert.equal(await opener.isVisible(), mobile || collapse === "offcanvas", label);
              if (!mobile && collapse === "icon") {
                const alignment = await header.evaluate((el) => {
                  const label = el.querySelector("span:not(.sr-only)");
                  return (label?.getBoundingClientRect().left ?? 0) - el.getBoundingClientRect().left;
                });
                assert.equal(alignment, 21, `${label}: compact breadcrumb has no empty toggle gap`);
                assert.equal(await rail.isVisible(), true, label);
              }
              if (values.ssr) {
                await context.addCookies([{ name: "sidebar_state", value: "true", url: baseURL.origin }]);
                await page.reload();
                assert.equal(await opener.isVisible(), mobile, `${label}: expanded SSR`);
              } else if (mobile) {
                await opener.press("Enter");
                const sheet = page.getByRole("dialog", { name: "Sidebar", exact: true });
                await sheet.waitFor();
                await page.keyboard.press("Escape");
                await sheet.waitFor({ state: "hidden" });
                await page.waitForFunction(() => document.activeElement?.closest("header") !== null);
                assert.equal(await opener.evaluate((el) => el === document.activeElement), true, label);
                // A focused mobile opener must hand off to the rail when desktop hides it.
                if (collapse === "icon") {
                  await page.setViewportSize({ width: 1440, height: 900 });
                  await rail.waitFor();
                  await page.waitForFunction(() =>
                    document.activeElement?.matches('[data-slot="sidebar-inner"] [data-slot="sidebar-trigger"]'),
                  );
                  assert.equal(await opener.isVisible(), false, label);
                }
              } else {
                await (collapse === "icon" ? rail : opener).press("Enter");
                await page.locator('[data-slot="sidebar"][data-state="expanded"]').waitFor();
                assert.equal(await opener.isVisible(), false, label);
                assert.equal(
                  await rail.evaluate((el) => el === document.activeElement),
                  true,
                  `${label}: focus handoff`,
                );
                const focus = await rail.evaluate((el) => {
                  const style = getComputedStyle(el);
                  return el.matches(":focus-visible") && Number.parseFloat(style.outlineWidth) >= 2;
                });
                assert.equal(focus, true, `${label}: visible keyboard focus`);
                await page.keyboard.press("Control+b");
                await page.locator('[data-slot="sidebar"][data-state="collapsed"]').waitFor({ state: "attached" });
                assert.equal(await opener.isVisible(), collapse === "offcanvas", `${label}: Ctrl+B`);
                await page.reload();
                await page.locator('[data-slot="sidebar"][data-state="collapsed"]').waitFor({ state: "attached" });
                assert.equal(await opener.isVisible(), collapse === "offcanvas", `${label}: cookie reload`);
                await page.waitForFunction(() =>
                  Object.keys(document.querySelector("header") ?? {}).some((key) => key.startsWith("__reactFiber$")),
                );
                await page.waitForLoadState("networkidle");
                await page.keyboard.press("Meta+b");
                await page.locator('[data-slot="sidebar"][data-state="expanded"]').waitFor();
              }
              assert.deepEqual(errors, [], `${label}: browser errors`);
              passed++;
              console.log(`PASS ${label}${values.ssr ? " SSR (JavaScript disabled)" : " hydrated"}`);
            } finally {
              await context.close();
            }
          }
        }
      }
    }
  }
} finally {
  await browser.close();
  console.log(`${passed} sidebar combinations passed`);
}

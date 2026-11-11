import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3277",
  out = process.argv[3] ?? "screenshots/v08-005/navigation";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const key = "tenboards:project-nav:v1";
try {
  for (const theme of ["light", "dark"] as const)
    for (const mobile of [false, true]) {
      const c = await browser.newContext({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        colorScheme: theme,
        reducedMotion: "reduce",
      });
      await cacheCaptureFonts(c);
      await c.addCookies([{ name: "theme_mode", value: theme, url: base }]);
      await c.addInitScript(
        ({ key }) => {
          if (!sessionStorage.getItem("nav-seeded")) {
            localStorage.setItem(key, JSON.stringify({ "sample-docs": true, stale: true, "sample-empty": "bad" }));
            sessionStorage.setItem("nav-seeded", "yes");
          }
        },
        { key },
      );
      const p = await c.newPage(),
        errors: string[] = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await p.goto(`${base}/dashboard/projects/sample-operations/board`, { waitUntil: "networkidle" });
      const openMobile = async () => {
        if (mobile) {
          await p.waitForFunction(() => window.__TSR_ROUTER__?.state.status === "idle");
          await p.locator('[data-mobile="true"]').waitFor({ state: "hidden" });
          await p.locator("header").getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
          await p.locator('[data-mobile="true"]').waitFor();
        }
      };
      await openMobile();
      const nav = p.getByRole("navigation", { name: "Main navigation", exact: true });
      const primary = await nav
        .locator("a")
        .evaluateAll((nodes) => nodes.slice(0, 5).map((node) => node.textContent?.trim()));
      assert.deepEqual(primary, ["Home", "Projects", "Email", "Chat", "AI Assistant"]);
      const trigger = nav.getByRole("button", { name: /Operations rollout views/ });
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      assert.ok(await trigger.getAttribute("aria-controls"));
      assert.equal(
        await nav.locator('a[aria-current="page"]').getAttribute("href"),
        "/dashboard/projects/sample-operations/board",
      );
      const stored = await p.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), key);
      assert.deepEqual(Object.keys(stored).sort(), ["sample-docs", "sample-operations"]);
      await trigger.focus();
      await p.keyboard.press("Space");
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      await nav.locator('a[href^="/dashboard/projects/sample-operations/board"]').waitFor({ state: "hidden" });
      assert.equal(await nav.getByRole("link", { name: "Board", exact: true }).count(), 1); // Docs remains expanded.
      await p.keyboard.press("Enter");
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      if (mobile) assert.equal(await p.locator('[data-mobile="true"]').isVisible(), true);
      await nav.locator('a[href^="/dashboard/projects/sample-operations/list"]').click();
      await p.waitForURL(/sample-operations\/list/);
      if (mobile) {
        await p.locator('[data-mobile="true"]').waitFor({ state: "hidden" });
        await openMobile();
      }
      await trigger.click(); // Manual collapse survives changes to the same project's child view.
      if (mobile) await p.keyboard.press("Escape");
      await p
        .getByRole("navigation", { name: "Project views" })
        .getByRole("link", { name: "Overview", exact: true })
        .click();
      await p.waitForURL(/sample-operations\/overview/);
      await openMobile();
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      await nav.getByRole("link", { name: "Home", exact: true }).click();
      await p.waitForURL(/dashboard\/home/);
      await openMobile();
      await trigger.click();
      await nav.locator('a[href$="sample-operations/overview"]').click();
      await p.waitForURL(/sample-operations\/overview/);
      await openMobile();
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      await p
        .locator("h1")
        .filter({ hasText: /^Operations rollout$/ })
        .waitFor();
      await p
        .locator("h2")
        .filter({ hasText: /^Upcoming work$/ })
        .waitFor();
      await p.screenshot({ path: `${out}/expanded-${theme}-${mobile ? "mobile" : "desktop"}.png`, fullPage: true });
      if (mobile) await p.keyboard.press("Escape");
      await p.keyboard.press("Control+k");
      await p.getByRole("combobox", { name: "Search pages" }).fill("Documentation refresh Files");
      await p.getByRole("option", { name: "Documentation refresh · Files", exact: true }).click();
      await p.waitForURL(/sample-docs\/files/);
      assert.ok(!(await p.locator('a[href*="$projectId"]').count()));
      await openMobile();
      assert.equal(
        await nav.getByRole("button", { name: /Documentation refresh views/ }).getAttribute("aria-expanded"),
        "true",
      );
      if (mobile) await p.keyboard.press("Escape");
      else {
        await p.getByRole("button", { name: "Toggle Sidebar", exact: true }).first().click();
        const rail = nav.getByRole("button", { name: /Documentation refresh views/ });
        await rail.focus();
        await p.keyboard.press("Enter");
        const pop = p.getByRole("dialog", { name: "Documentation refresh", exact: true });
        await pop.waitFor();
        assert.equal(await pop.getByRole("link").count(), 5);
        await p.screenshot({ path: `${out}/rail-${theme}.png`, fullPage: true });
        await p.keyboard.press("Escape");
        await pop.waitFor({ state: "hidden" });
        await p.waitForFunction((el) => el === document.activeElement, await rail.elementHandle());
        await rail.click();
        await pop.getByRole("link", { name: "Files", exact: true }).click();
        await pop.waitFor({ state: "hidden" });
        await rail.click();
        await pop.getByRole("link", { name: "Timeline", exact: true }).click();
        await p.waitForURL(/sample-docs\/timeline/);
        await pop.waitFor({ state: "hidden" });
        await rail.click();
        await p.getByRole("heading", { name: "Documentation refresh", exact: true, level: 1 }).click();
        await pop.waitFor({ state: "hidden" });
      }
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      assert.deepEqual(errors, []);
      await c.close();
      console.log(
        `PASS ${theme}/${mobile ? "mobile" : "desktop"}: exact active, storage pruning, keyboard disclosure, route policy, mobile dismissal, palette typed links, rail escape/outside/route focus, overflow, console`,
      );
    }
  for (const variant of ["sidebar", "inset", "floating"])
    for (const collapsible of ["icon", "offcanvas"]) {
      const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      await cacheCaptureFonts(c);
      await c.addCookies([
        { name: "sidebar_variant", value: variant, url: base },
        { name: "sidebar_collapsible", value: collapsible, url: base },
      ]);
      const p = await c.newPage();
      await p.goto(`${base}/dashboard/projects/sample-operations/overview`, { waitUntil: "networkidle" });
      const side = p.locator('[data-slot="sidebar"][data-state]');
      assert.equal(await side.getAttribute("data-variant"), variant);
      await p.getByRole("button", { name: "Toggle Sidebar", exact: true }).first().click();
      await p.locator('[data-state="collapsed"][data-slot="sidebar"]').waitFor();
      assert.equal(await side.getAttribute("data-collapsible"), collapsible);
      await p.screenshot({ path: `${out}/layout-${variant}-${collapsible}.png`, fullPage: true });
      if (collapsible === "offcanvas")
        await p.locator("header").getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
      else
        await p
          .locator('[data-slot="sidebar-inner"]')
          .getByRole("button", { name: "Toggle Sidebar", exact: true })
          .click();
      assert.equal(
        await p.getByRole("button", { name: /Operations rollout views/ }).getAttribute("aria-expanded"),
        "true",
      );
      await p.reload({ waitUntil: "networkidle" });
      assert.equal(
        await p.getByRole("button", { name: /Operations rollout views/ }).getAttribute("aria-expanded"),
        "true",
      );
      await c.close();
      console.log(`PASS layout ${variant}/${collapsible}, toggle and restored disclosure`);
    }
  for (const storage of ["corrupt", "disabled"]) {
    const c = await browser.newContext();
    await cacheCaptureFonts(c);
    await c.addInitScript(
      ({ key, storage }) => {
        if (storage === "corrupt") localStorage.setItem(key, "{bad");
        else {
          Storage.prototype.getItem = () => {
            throw new DOMException("Disabled", "SecurityError");
          };
          Storage.prototype.setItem = () => {
            throw new DOMException("Disabled", "SecurityError");
          };
        }
      },
      { key, storage },
    );
    const p = await c.newPage();
    await p.goto(`${base}/dashboard/projects/sample-docs/overview`, { waitUntil: "networkidle" });
    const t = p.getByRole("button", { name: /Documentation refresh views/ });
    assert.equal(await t.getAttribute("aria-expanded"), "true");
    await t.click();
    assert.equal(await t.getAttribute("aria-expanded"), "false");
    await c.close();
    console.log(`PASS ${storage} expansion storage`);
  }
} finally {
  await browser.close();
}

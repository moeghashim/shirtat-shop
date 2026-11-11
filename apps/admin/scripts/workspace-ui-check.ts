import { chromium } from "playwright";

import { demoWorkspaceHome } from "../src/server/data/projects.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3277",
  out = process.argv[3] ?? "screenshots/v08-004/interactions";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce" });
      await cacheCaptureFonts(context);
      await context.addCookies([{ name: "theme_mode", value: theme, url: base }]);
      const page = await context.newPage(),
        errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(`${base}/dashboard/home`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: /Good morning|Good afternoon|Good evening/ }).waitFor();
      const home = await demoWorkspaceHome({ renderedAt: new Date().toISOString() });
      for (const [label, count] of [
        ["Open tasks", home.metrics.open],
        ["Overdue", home.metrics.overdue],
        ["Completed", home.metrics.completed],
        ["Active projects", home.activeProjects],
      ] as const) {
        assert.ok((await page.getByRole("group", { name: label, exact: true }).textContent())?.includes(String(count)));
      }
      await page.getByText("Jordan Lee · sample member", { exact: true }).waitFor();
      const taskLinks = page.locator('main a[href*="/list?"]');
      assert.equal(await taskLinks.count(), home.myTasks.length + home.upcoming.length);
      assert.ok(
        (await taskLinks.evaluateAll((ns) => ns.map((n) => (n as HTMLAnchorElement).href))).every(
          (h) => !/\$projectId/.test(h),
        ),
      );
      await taskLinks.first().click();
      await page.waitForURL(/\/projects\/sample-.*\/list/);
      await page.getByRole("heading", { name: "Operations rollout", exact: true }).waitFor();
      await page.goto(`${base}/dashboard/projects`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Projects", exact: true }).waitFor();
      assert.equal(await page.locator('main a[href$="/overview"]').count(), 3);
      const input = page.getByLabel("Search projects", { exact: true });
      await input.fill("documentation");
      await page.waitForURL(/query=documentation/);
      await page.getByText("1 of 3 projects", { exact: true }).waitFor();
      await page.getByRole("link", { name: "Documentation refresh", exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(/sample-docs\/overview/);
      await page.goto(`${base}/dashboard/projects`, { waitUntil: "networkidle" });
      await page.getByRole("combobox", { name: "Project status", exact: true }).click();
      await page.getByRole("option", { name: "Planning", exact: true }).click();
      await page.getByText("1 of 3 projects", { exact: true }).waitFor();
      await page.getByRole("link", { name: "Research queue", exact: true }).waitFor();
      await input.fill("no-such-project");
      await page.getByRole("heading", { name: "No matching projects", exact: true }).waitFor();
      await page.getByRole("button", { name: "Show all projects", exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.getByText("3 of 3 projects", { exact: true }).waitFor();
      await page.getByRole("link", { name: "Research queue", exact: true }).click();
      await page.waitForURL(/sample-empty\/overview/);
      await page.getByText("No upcoming work in Research queue.", { exact: true }).waitFor();
      await page.goto(`${base}/dashboard/home`, { waitUntil: "networkidle" });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await page.screenshot({ path: `${out}/home-${theme}-${size}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      await context.close();
      console.log(
        `PASS ${theme}/${size}: Home KPI parity, named sample person, owning-project links, index live search/status/keyboard/empty recovery, empty project, overflow and console`,
      );
    }
  for (const timezoneId of ["UTC", "America/Chicago", "Pacific/Kiritimati"]) {
    const c = await browser.newContext({ timezoneId });
    await cacheCaptureFonts(c);
    await c.route("**/*.js", async (route) => {
      await new Promise((r) => setTimeout(r, 150));
      await route.continue();
    });
    const p = await c.newPage(),
      errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(`${base}/dashboard/home`, { waitUntil: "networkidle" });
    await p.reload({ waitUntil: "networkidle" });
    await p.getByRole("heading", { name: /Good morning|Good afternoon|Good evening/ }).waitFor();
    assert.deepEqual(errors, []);
    await c.close();
    console.log(`PASS delayed Home direct/refresh hydration ${timezoneId}`);
  }
} finally {
  await browser.close();
}

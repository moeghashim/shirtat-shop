import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3270",
  out = process.argv[3] ?? "screenshots/v08-003/interactions";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const c = await browser.newContext({
        viewport,
        colorScheme: theme,
        reducedMotion: "reduce",
        timezoneId: "America/Chicago",
      });
      await cacheCaptureFonts(c);
      await c.addCookies([{ name: "theme_mode", value: theme, url: base }]);
      const p = await c.newPage(),
        errors: string[] = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      const visit = async (path: string) => {
        await p.goto(base + path, { waitUntil: "networkidle" });
        await p.getByRole("heading", { name: "Documentation refresh", exact: true }).waitFor();
      };
      await visit("/dashboard/projects/sample-docs");
      assert.match(p.url(), /\/overview$/);
      assert.equal(await p.getByRole("navigation", { name: "Project views" }).getByRole("link").count(), 5);
      await p.getByText("Upcoming work", { exact: true }).waitFor();
      await p.screenshot({ path: `${out}/overview-${theme}-${size}.png`, fullPage: true });
      await visit("/dashboard/projects/sample-docs/timeline");
      const mode = p.getByRole("group", { name: "Timeline mode", exact: true });
      assert.equal(
        await mode
          .getByRole("button", { name: size === "mobile" ? "Table" : "Gantt", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      assert.equal(await p.locator("main select").count(), 0);
      const ids = () =>
        p.locator("[data-schedule-id]").evaluateAll((ns) => ns.map((n) => n.getAttribute("data-schedule-id")));
      const original = await ids();
      assert.equal(original.length, 4);
      if (size !== "mobile") {
        await mode.getByRole("button", { name: "Table", exact: true }).click();
        await p.waitForURL(/mode=table/);
      }
      await p
        .getByRole("table")
        .filter({ has: p.getByRole("columnheader", { name: "Task", exact: true }) })
        .waitFor();
      assert.deepEqual(await ids(), original);
      await p.screenshot({ path: `${out}/table-${theme}-${size}.png`, fullPage: true });
      await mode.getByRole("button", { name: "Gantt", exact: true }).click();
      await p.waitForURL(/mode=gantt/);
      await p.getByRole("region", { name: "Gantt chart, scroll horizontally", exact: true }).waitFor();
      assert.deepEqual(await ids(), original);
      await p.screenshot({ path: `${out}/gantt-${theme}-${size}.png`, fullPage: true });
      assert.ok(await p.locator("[data-today-marker]").count());
      await p.getByRole("button", { name: "Unscheduled (1)", exact: true }).click();
      assert.equal((await ids()).length, 5);
      await p.getByRole("button", { name: "Unscheduled (1)", exact: true }).click();
      const initialStart = await p.getByLabel("Schedule range start").inputValue();
      const next = p.getByRole("button", { name: "Next schedule range" });
      await next.focus();
      await p.keyboard.press("Enter");
      await p.waitForFunction(
        (initial) => document.querySelector<HTMLInputElement>("#schedule-start")?.value !== initial,
        initialStart,
      );
      assert.equal(await p.locator("[data-schedule-id]").count(), 0, "out-of-range tasks are hidden");
      await p.getByRole("button", { name: "Previous schedule range" }).focus();
      await p.keyboard.press("Enter");
      await p.waitForFunction(
        (initial) => document.querySelector<HTMLInputElement>("#schedule-start")?.value === initial,
        initialStart,
      );
      await p
        .getByRole("group", { name: "Schedule scale", exact: true })
        .getByRole("button", { name: "Months", exact: true })
        .click();
      await p.waitForURL(/scale=months/);
      await p.getByRole("combobox", { name: "Visible periods", exact: true }).click();
      await p.getByRole("option", { name: "12", exact: true }).click();
      await p.waitForURL(/periods=12/);
      await p.getByRole("button", { name: "Today", exact: true }).focus();
      await p.keyboard.press("Enter");
      await p.waitForFunction(() => !new URL(location.href).searchParams.get("start")?.startsWith("2026-06"));
      await mode.getByRole("button", { name: "Calendar", exact: true }).click();
      await p.waitForURL(/mode=calendar/);
      await p.getByRole("region", { name: "Project calendar", exact: true }).waitFor();
      assert.equal(
        await p
          .getByRole("navigation", { name: "Project views" })
          .getByRole("link", { name: "Timeline", exact: true })
          .getAttribute("aria-current"),
        "page",
      );
      assert.equal(await p.getByRole("button", { name: "Add event", exact: true }).count(), 0);
      for (const label of ["Week", "Day", "Month"]) {
        await p.getByRole("combobox", { name: "Calendar view", exact: true }).click();
        await p.getByRole("option", { name: label, exact: true }).click();
        await p.waitForTimeout(100);
      }
      await p.getByRole("button", { name: "Previous period", exact: true }).focus();
      await p.keyboard.press("Enter");
      await p.getByRole("button", { name: "Today", exact: true }).focus();
      await p.keyboard.press("Enter");
      await p.screenshot({ path: `${out}/calendar-${theme}-${size}.png`, fullPage: true });
      await p
        .getByRole("navigation", { name: "Project views" })
        .getByRole("link", { name: "Files", exact: true })
        .click();
      await p.getByLabel("File display").waitFor();
      assert.equal(await p.getByRole("button", { name: /Upload|Download|Share|Delete|Unstar|Star / }).count(), 0);
      await p
        .getByRole("group", { name: "File display", exact: true })
        .getByRole("button", { name: "List", exact: true })
        .click();
      await p.waitForURL(/view=list/);
      assert.equal(
        await p
          .getByRole("navigation", { name: "Project views" })
          .getByRole("link", { name: "Files", exact: true })
          .getAttribute("aria-current"),
        "page",
      );
      await p.getByLabel("Search files").fill("no-such-file");
      await p.getByText(/No matching files in Documentation refresh/).waitFor();
      assert.equal(await p.getByRole("heading", { name: "Folders", exact: true }).count(), 0);
      await p.getByLabel("Search files").fill("");
      await p.screenshot({ path: `${out}/files-${theme}-${size}.png`, fullPage: true });
      await p.goto(`${base}/dashboard/projects/sample-operations/timeline?mode=gantt`, { waitUntil: "networkidle" });
      const unscheduled = p.getByRole("region", { name: "Unscheduled tasks, scroll vertically", exact: true });
      assert.equal(await unscheduled.isVisible(), false);
      await p.getByRole("button", { name: "Unscheduled (3)", exact: true }).click();
      await unscheduled.waitFor();
      assert.equal(await unscheduled.locator("li").count(), 3);
      await p.getByLabel("Search schedule", { exact: true }).fill("Salary Excel import");
      await p.waitForURL(/query=Salary/);
      await p.waitForFunction(
        () =>
          document.querySelectorAll("[data-schedule-id]").length === 1 &&
          document.querySelector("[data-schedule-id]")?.getAttribute("data-schedule-id") ===
            "board:salary-excel-import",
      );
      await p.getByRole("button", { name: "Reset filters", exact: true }).click();
      await p.waitForURL((url) => !url.searchParams.get("query"));
      const chart = p.getByRole("region", { name: "Gantt chart, scroll horizontally", exact: true });
      const aligned = await chart.evaluate((el) => {
        const grid = el.firstElementChild;
        const header = grid?.firstElementChild?.children[1]?.getBoundingClientRect();
        const row = grid?.querySelector("[data-schedule-id]")?.children[1]?.getBoundingClientRect();
        return header && row && Math.abs(header.x - row.x) < 1 && Math.abs(header.width - row.width) < 1;
      });
      assert.equal(aligned, true);
      await p.goto(`${base}/dashboard/projects/sample-empty/timeline?mode=calendar`, { waitUntil: "networkidle" });
      await p.getByRole("heading", { name: "Research queue", exact: true }).waitFor();
      await p.getByText(/No matching tasks/).waitFor();
      await p.screenshot({ path: `${out}/empty-calendar-${theme}-${size}.png`, fullPage: true });
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
      assert.deepEqual(errors, []);
      await c.close();
      console.log(
        `PASS ${theme}/${size}: validated index,5views,overview,schedule identity,mobile default,keyboard ranges,12months,live Today,Calendar modes,readonly files/filter,empty calendar and console`,
      );
    }
  for (const zone of ["UTC", "America/Chicago", "Pacific/Kiritimati"]) {
    const c = await browser.newContext({ timezoneId: zone });
    await cacheCaptureFonts(c);
    await c.route("**/*.js", async (route) => {
      await new Promise((r) => setTimeout(r, 150));
      await route.continue();
    });
    const p = await c.newPage(),
      errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(`${base}/dashboard/projects/sample-operations/timeline?mode=calendar`, { waitUntil: "networkidle" });
    await p.getByText(/Local time/).waitFor();
    await p.reload({ waitUntil: "networkidle" });
    await p.getByText(/Local time/).waitFor();
    assert.deepEqual(errors, []);
    await c.close();
    console.log(`PASS delayed direct/refresh Calendar hydration ${zone}`);
  }
} finally {
  await browser.close();
}

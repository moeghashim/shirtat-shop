import { chromium } from "playwright";

import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.argv[2] ?? "http://127.0.0.1:3000";
const output = process.argv[3] ?? "screenshots/accounts";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const theme of ["light", "dark"] as const) {
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce" });
      await context.addCookies([
        { name: "theme_mode", value: theme, url: baseURL },
        { name: "theme_preset", value: "default", url: baseURL },
      ]);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(`${baseURL}/dashboard/default`);
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll("body *")).some((node) =>
          Object.keys(node).some((key) => key.startsWith("__reactFiber$")),
        ),
      );
      await page.waitForLoadState("networkidle");
      const user = page.getByRole("button", { name: "Demo account: Demo User", exact: true });
      await user.press("Enter");
      await page.getByRole("menuitem").filter({ hasText: "Demo Admin" }).press("Enter");
      await page.getByRole("menu").waitFor({ state: "hidden" });
      const admin = page.getByRole("button", { name: "Demo account: Demo Admin", exact: true });
      await admin.press("Enter");
      await page.getByRole("menuitem").filter({ hasText: "Demo Admin" }).waitFor();
      await page.getByRole("menu").waitFor({ state: "visible" });
      await page.screenshot({ path: `${output}/${theme}-${size}.png`, animations: "disabled" });
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("aria-label") === "Demo account: Demo Admin",
      );
      await page.reload();
      await user.waitFor();
      await page.waitForLoadState("networkidle");
      if ((await page.evaluate(() => document.documentElement.classList.contains("dark"))) !== (theme === "dark"))
        throw new Error("Theme cookie changed");
      if ((await page.locator("html").getAttribute("data-theme-preset")) !== "default")
        throw new Error("Preset cookie changed");
      if (errors.length) throw new Error(errors.join("\n"));
      results.push({
        theme,
        size,
        errors,
        selection: "local only; reset on refresh",
        focusReturn: true,
        preferences: "preserved",
      });
      await context.close();
      console.log(`PASS accounts ${theme}/${size}`);
    }
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2));

import AxeBuilder from "@axe-core/playwright";
import type { Browser } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
export const viewports = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
export interface VerifyEntry {
  route: string;
  path: string;
  ready?: string;
  status?: number;
}
export async function verifyPage(
  browser: Browser,
  baseURL: URL,
  entry: VerifyEntry,
  output: string,
  options: { requireHydration?: boolean } = {},
) {
  await mkdir(output, { recursive: true });
  const results = [];
  for (const theme of ["light", "dark"] as const) {
    for (const [viewportName, viewport] of Object.entries(viewports)) {
      const context = await browser.newContext({
        viewport,
        colorScheme: theme,
        reducedMotion: "reduce",
        locale: "en-US",
        timezoneId: "America/Chicago",
      });
      await cacheCaptureFonts(context);
      await context.addCookies([
        { name: "theme_mode", value: theme, url: baseURL.origin },
        { name: "theme_preset", value: "default", url: baseURL.origin },
        { name: "font", value: "geist", url: baseURL.origin },
      ]);
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const errors: string[] = [];
      const warnings: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error" || /hydrat(?:ion|e|ing)|server rendered html/i.test(message.text()))
          errors.push(`console: ${message.text()}`);
        else if (message.type() === "warning") warnings.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
      page.on("requestfailed", (request) => {
        if (request.failure()?.errorText !== "net::ERR_ABORTED")
          errors.push(`request: ${request.url()} ${request.failure()?.errorText}`);
      });
      let axe: Awaited<ReturnType<AxeBuilder["analyze"]>> | null = null;
      const screenshot = `${theme}-${viewportName}.png`;
      let finalURL = "";
      try {
        const response = await page.goto(new URL(entry.path, baseURL).href, { waitUntil: "domcontentloaded" });
        if (response?.status() !== (entry.status ?? 200))
          throw new Error(`Unexpected HTTP status ${response?.status()}`);
        if (options.requireHydration !== false) {
          await page.waitForFunction(() =>
            Array.from(document.querySelectorAll("body *")).some((node) =>
              Object.keys(node).some((key) => key.startsWith("__reactFiber$")),
            ),
          );
          await page.waitForFunction(
            (mode) =>
              document.documentElement.classList.contains("dark") === (mode === "dark") &&
              document.documentElement.dataset.themePreset === "default",
            theme,
          );
        }
        if (entry.ready) await page.getByText(entry.ready, { exact: true }).first().waitFor();
        await page.waitForLoadState("networkidle");
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : img.decode())),
          );
        });
        // Match the existing capture suite's chart animation settling interval.
        await page.waitForTimeout(1800);
        if (await page.locator("vite-error-overlay").count()) throw new Error("Vite error overlay is present.");
        // Playwright otherwise adds inline caret styles to every input during capture,
        // which can race a lazy route hydration and create a false mismatch.
        await page.screenshot({
          path: path.join(output, screenshot),
          fullPage: true,
          animations: "disabled",
          caret: "initial",
        });
        axe = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      } finally {
        finalURL = page.url();
        await context.close();
      }
      const violations = axe?.violations ?? [];
      const passed = errors.length === 0 && axe !== null && violations.length === 0;
      results.push({
        theme,
        viewport: viewportName,
        screenshot,
        finalURL,
        passed,
        errors,
        warnings,
        violations,
        incomplete: axe?.incomplete ?? [],
        axeVersion: axe?.testEngine.version ?? null,
      });
      console.log(
        `${passed ? "PASS" : "FAIL"} ${entry.route} ${theme}/${viewportName}: ${violations.length} axe violations, ${errors.length} runtime errors`,
      );
      for (const violation of violations)
        console.error(
          `  axe ${violation.id}: ${violation.help} (${violation.nodes.length} nodes) — ${violation.helpUrl}`,
        );
      for (const error of errors) console.error(`  ${error}`);
    }
  }
  return {
    route: entry.route,
    path: entry.path,
    baseURL: baseURL.href,
    tags: wcagTags,
    passed: results.every((result) => result.passed),
    results,
  };
}

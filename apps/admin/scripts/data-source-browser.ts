import { chromium } from "playwright";

import { databaseUrl } from "../src/server/data/source.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const valid = databaseUrl(process.env, true);
const invalid = new URL(valid);
invalid.password = "invalid-test-password";
const missing = new URL(valid);
missing.pathname = "/tenboards_missing_schema";
const cases = [
  { name: "refused", url: "postgresql://qa:private@127.0.0.1:1/absent", error: true },
  { name: "bad-credentials", url: invalid.href, error: true },
  { name: "missing-schema", url: missing.href, error: true },
  { name: "forced-demo", url: "postgresql://qa:private@127.0.0.1:1/absent", source: "demo", error: false },
  { name: "recovered", url: valid, error: false },
];
const output = process.argv[2] ?? "screenshots/source-faults";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const scenario of cases) {
    let serverLog = "";
    const server = spawn(
      process.execPath,
      ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "3102", "--strictPort"],
      {
        env: { ...process.env, DATABASE_URL: scenario.url, DATA_SOURCE: scenario.source },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout.on("data", (data) => {
      serverLog += data;
    });
    server.stderr.on("data", (data) => {
      serverLog += data;
    });
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (serverLog.includes("Local:")) break;
        if (server.exitCode !== null) throw new Error("QA server failed to start");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      for (const theme of ["light", "dark"] as const) {
        for (const [size, viewport] of Object.entries({
          desktop: { width: 1440, height: 900 },
          mobile: { width: 390, height: 844 },
        })) {
          const context = await browser.newContext({
            viewport,
            colorScheme: theme,
            locale: "en-US",
            timezoneId: "America/Chicago",
            reducedMotion: "reduce",
          });
          await cacheCaptureFonts(context);
          await context.addCookies([{ name: "theme_mode", value: theme, url: "http://127.0.0.1:3102" }]);
          const page = await context.newPage();
          const diagnostics: string[] = [];
          page.on("pageerror", (error) => diagnostics.push(error.message));
          page.on("console", (message) => {
            if (message.type() === "error") diagnostics.push(message.text());
          });
          await page.goto("http://127.0.0.1:3102/dashboard/users");
          await page
            .getByRole("heading", { name: scenario.error ? "Something went wrong." : "Users", exact: true })
            .waitFor();
          const body = (await page.locator("body").textContent()) ?? "";
          if (scenario.error) {
            assert.match(body, /Unable to load database data/);
            assert.ok(!body.includes("Olivia Rhye"));
            await page.getByRole("button", { name: "Try again", exact: true }).click();
            await page.getByRole("heading", { name: "Something went wrong." }).waitFor();
          } else assert.deepEqual(diagnostics, []);
          assert.ok(
            !body.includes("postgresql://") && !body.includes("invalid-test-password") && !body.includes("select "),
          );
          await page.screenshot({ path: `${output}/${scenario.name}-${theme}-${size}.png`, fullPage: true });
          await writeFile(
            `${output}/${scenario.name}-${theme}-${size}.json`,
            JSON.stringify({ expectedFault: scenario.error, diagnostics, body }, null, 2),
          );
          await context.close();
          console.log(`PASS ${scenario.name}/${theme}/${size}`);
        }
      }
    } finally {
      server.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        if (server.exitCode !== null) resolve();
        else server.on("exit", () => resolve());
      });
      // Only write redacted diagnostics; no URL or credential escapes the harness.
      await writeFile(
        `${output}/${scenario.name}-server.log`,
        serverLog.replaceAll(scenario.url, "[DATABASE_URL]").replaceAll("invalid-test-password", "[REDACTED]"),
      );
    }
  }
} finally {
  await browser.close();
}

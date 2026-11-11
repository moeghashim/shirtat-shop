import { chromium } from "playwright";

import { captureRoutes } from "./screenshot-routes.ts";
import { type VerifyEntry, verifyPage } from "./verify-page-core.ts";
import { ensureVerifyServer } from "./verify-page-server.ts";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "base-url": { type: "string", default: "http://127.0.0.1:3000" },
    all: { type: "boolean", default: false },
  },
});
if ((!values.all && positionals.length !== 1) || (values.all && positionals.length))
  throw new Error("Usage: npm run verify:page -- <route> [--base-url URL], or --all [--base-url URL]");
const baseURL = new URL(values["base-url"]);
if (
  !["http:", "https:"].includes(baseURL.protocol) ||
  baseURL.username ||
  baseURL.password ||
  baseURL.pathname !== "/" ||
  baseURL.search ||
  baseURL.hash
)
  throw new Error("--base-url must be an HTTP(S) origin without credentials, path, query or hash.");
const requested = positionals[0];
if (
  requested &&
  (!requested.startsWith("/") ||
    requested.startsWith("//") ||
    /[?#\\]/.test(requested) ||
    requested.split("/").some((part) => part === ".." || part === "."))
)
  throw new Error("Route must be an absolute application path without query, hash or traversal.");
const known = captureRoutes.find((entry) => entry.route === requested || entry.path === requested);
if (requested?.includes("$") && !known) throw new Error("Unknown dynamic route; pass its concrete path.");
const entries: readonly VerifyEntry[] = values.all ? captureRoutes : [known ?? { route: requested, path: requested }];
const output = path.resolve("verify");
await mkdir(output, { recursive: true });
const reports = [];
let server: Awaited<ReturnType<typeof ensureVerifyServer>> | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  server = await ensureVerifyServer(baseURL);
  console.log(`${server.reused ? "Reusing" : "Started"} ${baseURL.origin}`);
  browser = await chromium.launch();
  for (const entry of entries) {
    const folder = path.join(output, encodeURIComponent(entry.route.replace(/^\//, "")) || "root");
    const report = await verifyPage(browser, baseURL, entry, folder);
    await writeFile(path.join(folder, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
    reports.push({
      route: entry.route,
      passed: report.passed,
      report: path.relative(output, path.join(folder, "report.json")),
    });
  }
  if (reports.some((report) => !report.passed)) process.exitCode = 1;
} catch (error) {
  process.exitCode = 1;
  console.error(error);
  await writeFile(
    path.join(output, "failure.json"),
    `${JSON.stringify({ error: String(error), baseURL: baseURL.href }, null, 2)}\n`,
  );
} finally {
  await browser?.close();
  await server?.stop();
  await writeFile(
    path.join(output, "report.json"),
    `${JSON.stringify({ baseURL: baseURL.href, passed: process.exitCode !== 1 && reports.length === entries.length, reports }, null, 2)}\n`,
  );
}

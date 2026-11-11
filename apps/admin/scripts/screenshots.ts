import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { measureDensity } from "./screenshot-density.ts";
import { captureInteractions } from "./screenshot-interactions.ts";
import { captureRoutes, httpRoutes } from "./screenshot-routes.ts";
import { captureSidebarStates } from "./screenshot-shell.ts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "base-url": { type: "string", default: "http://127.0.0.1:3000" },
    routes: { type: "string" },
    "project-id": { type: "string", default: "sample-operations" },
    search: { type: "string" },
    output: { type: "string", default: "screenshots" },
    preset: { type: "string", default: "default" },
    font: { type: "string", default: "geist" },
    density: { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    reference: { type: "string" },
    timezone: { type: "string", default: "America/Chicago" },
    reload: { type: "boolean", default: false },
    boundaries: { type: "boolean", default: false },
    interactions: { type: "boolean", default: false },
    "sidebar-states": { type: "boolean", default: false },
    "mask-live-clocks": { type: "boolean", default: false },
    "hydration-delay-ms": { type: "string", default: "0" },
  },
});
const reference = values.reference === undefined ? undefined : new Date(values.reference).toISOString();
const hydrationDelayMs = Number(values["hydration-delay-ms"]);
if (!Number.isFinite(hydrationDelayMs) || hydrationDelayMs < 0 || hydrationDelayMs > 10000)
  throw new Error("Hydration delay must be 0–10000 ms");
const baseURL = new URL(values["base-url"]);
// Validate the requested real timezone without replacing the runtime clock.
new Intl.DateTimeFormat("en-US", { timeZone: values.timezone }).format();
if (!["http:", "https:"].includes(baseURL.protocol)) throw new Error("Base URL must use HTTP(S).");
const generated = await readFile("src/routeTree.gen.ts", "utf8");
const routeBlock = generated.split("export interface FileRoutesByFullPath {")[1]?.split("\n}")[0];
if (!routeBlock) throw new Error("Missing generated route inventory. Run npm run generate-routes.");
const generatedRoutes = [...routeBlock.matchAll(/^\s*'([^']+)':/gm)].map((match) => match[1]);
const missing = generatedRoutes.filter(
  (route) => !httpRoutes.includes(route) && !captureRoutes.some((entry) => entry.route === route),
);
const stale = captureRoutes.filter((entry) => !generatedRoutes.includes(entry.route));
if (missing.length || stale.length) {
  throw new Error(`Route inventory mismatch: missing=${JSON.stringify(missing)}, stale=${JSON.stringify(stale)}`);
}
const projectNames: Record<string, string> = {
  "sample-operations": "Operations rollout",
  "sample-docs": "Documentation refresh",
  "sample-empty": "Research queue",
};
const projectId = values["project-id"];
if (!Object.hasOwn(projectNames, projectId))
  throw new Error("Capture project must be sample-operations, sample-docs or sample-empty.");
const requested = values.routes?.split(",");
const selected: Array<{ route: string; path: string; ready?: string; status?: number }> = captureRoutes
  .filter((entry) => !requested || requested.includes(entry.route))
  .map((entry) => ({ ...entry }));
// Explicit alias requests capture their canonical destination without adding aliases
// to the retained navigation inventory.
for (const route of requested ?? [])
  if (["/dashboard/kanban", "/dashboard/tasks", "/dashboard/calendar", "/dashboard/file-manager"].includes(route))
    selected.push({ route, path: route, ready: "Operations rollout" });
for (const entry of selected)
  if (entry.route.includes("$projectId")) {
    entry.path = entry.path.replace("sample-operations", projectId);
    entry.ready = projectNames[projectId];
  }
const unknown = requested?.filter(
  (route) => !httpRoutes.includes(route) && !captureRoutes.some((entry) => entry.route === route),
);
if (unknown?.length || !selected.length) throw new Error(`Unknown/empty route subset: ${unknown?.join(",")}`);
if (values.boundaries)
  selected.push(
    { route: "qa:root-not-found", path: "/capture-not-found", status: 404 },
    { route: "qa:root-error", path: "/dashboard/default", ready: "Total Revenue" },
  );
if (values.list) {
  console.log(JSON.stringify(selected, null, 2));
  process.exit(0);
}
const output = path.resolve(values.output);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results: Array<{
  route: string;
  theme: string;
  viewport: string;
  file: string;
  controlsFile: string | null;
  phase: string;
  interactionNotes: string[];
  expectedDiagnostics: string[];
  errors: string[];
}> = [];
try {
  for (const entry of selected) {
    for (const theme of ["light", "dark"] as const) {
      for (const [viewportName, viewport] of Object.entries({
        desktop: { width: 1440, height: 900 },
        mobile: { width: 390, height: 844 },
      })) {
        for (const phase of values.reload ? ["direct", "refresh"] : ["direct"]) {
          const context = await browser.newContext({
            viewport,
            colorScheme: theme,
            reducedMotion: "reduce",
            locale: "en-US",
            timezoneId: values.timezone,
          });
          let scriptsMayLoadAt = Date.now() + hydrationDelayMs;
          if (hydrationDelayMs > 0 || reference)
            await context.route("**/*", async (route) => {
              const remaining = scriptsMayLoadAt - Date.now();
              if (route.request().resourceType() === "script" && remaining > 0)
                await new Promise((resolve) => setTimeout(resolve, remaining));
              const sameOrigin = new URL(route.request().url()).origin === baseURL.origin;
              await route.continue(
                reference && sameOrigin
                  ? { headers: { ...route.request().headers(), "x-tenboards-qa-reference": reference } }
                  : undefined,
              );
            });
          await cacheCaptureFonts(context);
          await context.addCookies([
            { name: "theme_mode", value: theme, url: baseURL.origin },
            { name: "theme_preset", value: values.preset, url: baseURL.origin },
            { name: "font", value: values.font, url: baseURL.origin },
          ]);
          const page = await context.newPage();
          // Only the explicitly documented live monitor clock is masked. Waveforms
          // use their normal reduced-motion snapshot; no application clock is replaced.
          const liveClockMask =
            values["mask-live-clocks"] && entry.route === "/dashboard/patient-monitoring"
              ? [page.locator("[data-monitoring-clock]")]
              : [];
          const errors: string[] = [];
          const expectedDiagnostics: string[] = [];
          const recordError = (message: string, source?: string) => {
            const expectedFault =
              entry.route === "qa:root-error" &&
              (message.includes("QA_ONLY_ROOT_ERROR") || message.includes("The above error occurred in the"));
            const expected404 =
              entry.route === "qa:root-not-found" &&
              source === new URL(entry.path, baseURL).href &&
              /status of 404 \(.*\)/.test(message);
            (expectedFault || expected404 ? expectedDiagnostics : errors).push(message);
          };
          let interactionNotes: string[] = [];
          page.on("console", (message) => {
            if (message.type() === "error") recordError(`console: ${message.text()}`, message.location().url);
          });
          page.on("pageerror", (error) => recordError(`page: ${error.message}`));
          page.on("requestfailed", (request) => {
            if (request.failure()?.errorText !== "net::ERR_ABORTED") {
              errors.push(`request: ${request.url()} ${request.failure()?.errorText}`);
            }
          });
          const file = `${entry.route.replaceAll(/[^a-z0-9-]/gi, "_") || "root"}-${theme}-${viewportName}${phase === "refresh" ? "-refresh" : ""}${values.interactions ? "-interactive" : ""}.png`;
          const controlsFile = values.interactions ? file.replace(".png", "-controls.png") : null;
          try {
            const targetURL = new URL(entry.path, baseURL);
            if (values.search) targetURL.search = values.search;
            let response = await page.goto(targetURL.href, { waitUntil: "domcontentloaded" });
            if (phase === "refresh") {
              await page.waitForFunction(() =>
                Array.from(document.querySelectorAll("body *")).some((node) =>
                  Object.keys(node).some((key) => key.startsWith("__reactFiber$")),
                ),
              );
              await page.waitForLoadState("networkidle");
              scriptsMayLoadAt = Date.now() + hydrationDelayMs;
              response = await page.reload({ waitUntil: "domcontentloaded" });
            }
            if (!response || response.status() !== (entry.status ?? 200)) {
              throw new Error(`Unexpected HTTP status ${response?.status()}`);
            }
            // React adds these DOM bindings during hydration; SSR markup alone cannot satisfy this gate.
            await page.waitForFunction(() =>
              Array.from(document.querySelectorAll("body *")).some((node) =>
                Object.keys(node).some((key) => key.startsWith("__reactFiber$")),
              ),
            );
            await page.waitForFunction(() => document.fonts.status === "loaded");
            await page.waitForFunction(
              ({ mode, preset }) =>
                document.documentElement.classList.contains("dark") === (mode === "dark") &&
                document.documentElement.dataset.themePreset === preset,
              { mode: theme, preset: values.preset },
            );
            if (entry.ready) await page.getByText(entry.ready, { exact: true }).first().waitFor();
            await page.waitForLoadState("networkidle");
            // Allow JS chart animations to finish too; reduced-motion CSS does not stop every chart library.
            await page.waitForTimeout(1800);
            await page.evaluate(async () => {
              await document.fonts.ready;
              await Promise.all(
                Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : img.decode())),
              );
              window.scrollTo(0, 0);
            });
            if (values.density) {
              const density = await measureDensity(page);
              if (density.some((frame) => frame.clippedSelectValues.length))
                throw new Error(
                  `Clipped select values: ${JSON.stringify(density.map((frame) => frame.clippedSelectValues))}`,
                );
              await writeFile(
                path.join(output, file.replace(".png", "-density.json")),
                `${JSON.stringify(density, null, 2)}\n`,
              );
              if (density.some((frame) => frame.overflowingCards.length))
                throw new Error("Kanban card content overflows its sortable wrapper");
            }
            if (values["sidebar-states"])
              interactionNotes.push(
                ...(await captureSidebarStates(page, async (state) => {
                  await page.screenshot({
                    path: path.join(output, file.replace(".png", `-sidebar-${state}.png`)),
                    animations: "disabled",
                  });
                })),
              );
            if (values.interactions || entry.route.startsWith("qa:"))
              interactionNotes = await captureInteractions(page, entry.route, async (variant) => {
                if (variant === "print")
                  await page.pdf({
                    path: path.join(output, file.replace(".png", "-print.pdf")),
                    preferCSSPageSize: true,
                    printBackground: true,
                  });
                await page.screenshot({
                  mask: liveClockMask,
                  path: path.join(output, file.replace(".png", `-${variant}.png`)),
                  fullPage: !variant.includes("drag") && !variant.startsWith("shell-"),
                  animations: variant.includes("drag") ? "allow" : "disabled",
                });
              });
            let previous = "";
            let stable = 0;
            for (let attempt = 0; attempt < 20 && stable < 3; attempt++) {
              const current = await page.evaluate(() =>
                JSON.stringify({ text: document.body.textContent, height: document.body.scrollHeight }),
              );
              stable = current === previous ? stable + 1 : 0;
              previous = current;
              await page.waitForTimeout(150);
            }
            if (stable < 3) throw new Error("Content did not stabilize before capture.");
            if (await page.locator("vite-error-overlay").count())
              throw new Error("Vite error overlay is present; this capture is not valid evidence.");
            // Full-page capture can resize the viewport and dismiss anchored menus.
            if (controlsFile)
              await page.screenshot({
                mask: liveClockMask,
                path: path.join(output, controlsFile),
                animations: "disabled",
              });
            await page.screenshot({
              mask: liveClockMask,
              path: path.join(output, file),
              fullPage: true,
              animations: "disabled",
            });
          } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
            await page
              .screenshot({
                mask: liveClockMask,
                path: path.join(output, file.replace(".png", "-failed.png")),
                animations: "disabled",
              })
              .catch(() => {
                /* The original error remains in the report if the browser cannot capture. */
              });
          } finally {
            await context.close();
          }
          results.push({
            route: entry.route,
            theme,
            viewport: viewportName,
            file,
            controlsFile,
            phase,
            interactionNotes,
            expectedDiagnostics,
            errors,
          });
          console.log(`${errors.length ? "FAIL" : "PASS"} ${entry.route} ${theme}/${viewportName} ${phase}`);
          if (errors.length) console.error(errors.join("\n"));
        }
      }
    }
  }
} finally {
  await browser.close();
  await writeFile(
    path.join(output, "report.json"),
    `${JSON.stringify({ baseURL, projectId, fontAssets: "exact public responses cached between contexts", maskedLiveClocks: values["mask-live-clocks"], reference, search: values.search, hydrationDelayMs, preset: values.preset, timezone: values.timezone, reload: values.reload, interactions: values.interactions, sidebarStates: values["sidebar-states"], results }, null, 2)}\n`,
  );
}
if (results.some((result) => result.errors.length)) process.exitCode = 1;

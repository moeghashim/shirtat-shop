import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

import { projectionCatalog } from "../src/lib/assistant/capabilities.ts";
import { consumeStream } from "../src/lib/assistant/transport.ts";
import { providers } from "../src/server/assistant/config.server.ts";
import { toolText } from "./assistant-tool-wire.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const output = process.env.ASSISTANT_EVIDENCE_ROOT ?? "verify/canvas";
await mkdir(output, { recursive: true });
const service = await startWorker(Object.fromEntries(providers.map((p) => [p.key, `synthetic-v07-${p.id}-tools`])), {
  port: 3074,
  assistantMock: true,
});
const browser = await chromium.launch();
let ip = 1;
try {
  // Exercise edit output and reused references through every actual native adapter.
  for (const provider of providers)
    for (const mode of ["tools", "tools-editnocall"]) {
      const response = await fetch(`${service.baseURL}/api/assistant`, {
        method: "POST",
        headers: {
          Origin: service.baseURL,
          "Content-Type": "application/json",
          "cf-connecting-ip": `198.19.${Math.floor(ip / 250)}.${(ip++ % 250) + 1}`,
          "x-v07-case": mode,
        },
        body: JSON.stringify({
          operation: "edit",
          provider: provider.id,
          messages: [{ role: "user", content: "Make this a line chart" }],
          edit: { definition: toolText, baseRevision: 0, op: "replace", targetId: "overview" },
        }),
      });
      assert.equal(response.status, 200, await response.clone().text());
      let map: unknown;
      await consumeStream(
        response.body!,
        new AbortController().signal,
        () => {
          /* Assert final terminal below. */
        },
        (data) => {
          map = data;
        },
      );
      assert.deepEqual(map, {}, `${provider.id}: reused refs must not execute tools`);
    }
  const probe = async () => await (await fetch(`${service.baseURL}/__assistant_probe`)).json();
  const before = await probe();
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce" });
      await context.addCookies([{ name: "theme_mode", value: theme, url: service.baseURL }]);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let refreshes = 0,
        edits = 0;
      let holdEdit = false;
      let releaseEdit = () => {
        /* No pending edit. */
      };
      let failRefresh = false,
        expire = false;
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (new URL(request.url()).origin !== service.baseURL) return route.abort();
        if (request.url().endsWith("/api/assistant-refresh")) {
          refreshes++;
          assert.deepEqual(Object.keys(request.postDataJSON()), ["refs"]);
          if (expire) return route.fulfill({ status: 401, body: "{}" });
          if (failRefresh) return route.fulfill({ status: 503, body: '{"error":"unavailable"}' });
        }
        if (request.url().endsWith("/api/assistant") && request.postDataJSON().operation === "edit") {
          edits++;
          if (holdEdit) {
            await new Promise<void>((resolve) => {
              releaseEdit = resolve;
            });
            await route.fulfill({ status: 503, body: "{}" }).catch(() => undefined);
            return;
          }
        }
        await route.continue({
          headers: {
            ...request.headers(),
            "x-v07-providers": "",
            "cf-connecting-ip": `198.19.${Math.floor(ip / 250)}.${(ip++ % 250) + 1}`,
          },
        });
      });
      await page.goto(`${service.baseURL}/dashboard/assistant`);
      await page.waitForLoadState("networkidle");
      for (const prompt of ["Show analytics dashboard", "Show finance dashboard", "Show revenue dashboard"]) {
        await page.getByRole("button", { name: prompt, exact: true }).press("Enter");
        await page
          .getByRole("region", { name: "Dashboard canvas" })
          .waitFor()
          .catch(async (error) => {
            console.log(await page.locator("main").innerText());
            throw error;
          });
        await page.getByText("Recorded demo · completed", { exact: true }).waitFor();
        const domain = prompt.includes("analytics")
          ? "analytics"
          : prompt.includes("finance")
            ? "finance"
            : "ecommerce";
        await page
          .getByRole("heading", { name: projectionCatalog.find((p) => p.domain === domain)!.label, exact: true })
          .waitFor();
        assert.doesNotMatch(
          await page.getByRole("region", { name: "Dashboard canvas" }).innerText(),
          /\d{4}-\d{2}-\d{2}T/,
        );
        if (prompt !== "Show revenue dashboard")
          await page.getByRole("button", { name: "New conversation", exact: true }).click();
      }
      const canvas = page.getByRole("region", { name: "Dashboard canvas" });
      await page.locator("[data-assistant-scroll]").evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({ fullPage: false, path: `${output}/${theme}-${size}-before.png` });
      await page.getByRole("button", { name: "Apply panel edit", exact: true }).press("Enter");
      await page.getByText("Choose a panel or Add panel, then describe the edit.").waitFor();
      assert.equal(edits, 0);
      await page.getByLabel("Edit a panel", { exact: true }).selectOption("add");
      await page.getByLabel("Panel edit instruction").fill("Add analytics chart");
      await page.getByRole("button", { name: "Apply panel edit", exact: true }).press("Enter");
      await page.waitForSelector('[data-canvas-revision="1"]');
      const stable = await page.locator('[data-panel-id="panel-1"]').elementHandle();
      const stableText = await stable!.textContent();
      await page.getByLabel("Edit a panel", { exact: true }).selectOption("overview");
      await page.getByLabel("Panel edit instruction").fill("Make this a bar chart");
      await page.getByRole("button", { name: "Apply panel edit", exact: true }).press("Enter");
      await page.waitForSelector('[data-canvas-revision="2"]');
      assert.equal(await stable!.evaluate((el) => el === document.querySelector('[data-panel-id="panel-1"]')), true);
      assert.equal(await stable!.textContent(), stableText);
      await page.locator("[data-assistant-scroll]").evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({ fullPage: false, path: `${output}/${theme}-${size}-edit.png` });
      assert.equal(await page.locator('[data-panel-id="overview"] .recharts-legend-wrapper rect').count(), 2);
      assert.equal(await page.locator('[data-panel-id="overview"] .recharts-legend-wrapper line').count(), 0);
      const editCount = edits;
      await page.getByRole("button", { name: "Refresh data", exact: true }).press("Enter");
      await page.getByText("Data refreshed. Layout unchanged.").waitFor();
      assert.equal(edits, editCount);
      assert.equal(refreshes, 1);
      assert.equal(await stable!.evaluate((el) => el.isConnected), true);
      await page.locator("[data-assistant-scroll]").evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.screenshot({ fullPage: false, path: `${output}/${theme}-${size}-refresh.png` });
      assert.deepEqual(
        (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations,
        [],
      );
      assert.ok(
        await page
          .getByRole("region", { name: "Dashboard canvas" })
          .getByText("Range: Available · Segment: All")
          .count(),
      );
      holdEdit = true;
      await page.getByLabel("Panel edit instruction").fill("Make this a line chart");
      await page.getByRole("button", { name: "Apply panel edit", exact: true }).click();
      await page.getByRole("button", { name: "Stop dashboard update" }).waitFor();
      await page.waitForTimeout(100);
      await page.getByRole("button", { name: "Stop dashboard update" }).press("Enter");
      releaseEdit();
      await page.getByText("Stopped. The dashboard is unchanged.").waitFor();
      assert.equal(await canvas.getAttribute("data-canvas-revision"), "2");
      assert.equal(await stable!.evaluate((el) => el.isConnected), true);
      holdEdit = false;
      failRefresh = true;
      await page.getByRole("button", { name: "Refresh data", exact: true }).click();
      await page.getByText(/Data may be stale/).waitFor();
      assert.equal(await stable!.evaluate((el) => el.isConnected), true);
      expire = true;
      await page.getByRole("button", { name: "Refresh data", exact: true }).click();
      await page.getByRole("link", { name: "Sign in to continue" }).waitFor();
      assert.equal(await canvas.count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
    }
  const after = await probe();
  assert.equal(after.calls, before.calls, "Recorded creates/edits/refresh must make zero provider calls");
  assert.equal(after.violations, 0);
  console.log(
    "PASS five native edit adapters; four-state recorded creates/add/replace/refresh, keyed DOM identity, ambiguous target, stale-data/session recovery, keyboard, axe, reduced motion, zero provider egress",
  );
} finally {
  await browser.close();
  await service.stop();
}

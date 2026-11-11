import { chromium } from "playwright";

import { encodeEvent } from "../src/lib/assistant/transport.ts";
import { providers } from "../src/server/assistant/config.server.ts";
import { mockOutput } from "./assistant-wire-fixtures.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { startWorker } from "./worker-test-support.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const output = process.env.ASSISTANT_EVIDENCE_ROOT ?? "screenshots/v07-003/lifecycle";
await mkdir(output, { recursive: true });
const worker = await startWorker(Object.fromEntries(providers.map((p) => [p.key, `synthetic-v07-${p.id}-success`])), {
  port: 3018,
  assistantMock: true,
});
const browser = await chromium.launch();
let ip = 1;
try {
  for (const entry of providers) {
    const context = await browser.newContext({ extraHTTPHeaders: { "x-v07-providers": entry.id } });
    await cacheCaptureFonts(context);
    const page = await context.newPage();
    const response = await page.goto(`${worker.baseURL}/dashboard/assistant`);
    assert.ok(response);
    const html = await response.text();
    assert.ok(!html.includes("synthetic-v07-"));
    assert.ok(!html.includes("SYNTHETIC_USER_PROMPT"));
    const picker = page.getByRole("combobox", { name: "Provider", exact: true });
    assert.deepEqual(await picker.locator("option").allTextContents(), [`${entry.name} · ${entry.model}`]);
    await context.close();
  }
  console.log(
    "PASS five single-key SSR/hydrated pickers expose exactly one effective model and no synthetic keys/prompts",
  );
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      const context = await browser.newContext({
        viewport,
        colorScheme: theme,
        reducedMotion: "reduce",
        extraHTTPHeaders: { "x-v07-providers": "openai,meta" },
      });
      await cacheCaptureFonts(context);
      await context.addCookies([{ name: "theme_mode", value: theme, url: worker.baseURL }]);
      const page = await context.newPage();
      const errors: string[] = [],
        external: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("request", (req) => {
        if (new URL(req.url()).origin !== worker.baseURL && !/fonts\.(googleapis|gstatic)\.com/.test(req.url()))
          external.push(req.url());
      });
      let mode = "success";
      let metadataRequests = 0;
      page.on("request", (req) => {
        if (new URL(req.url()).pathname.includes("_server")) metadataRequests++;
      });
      const requests: { provider?: string; messages: { role: string; content: string }[] }[] = [];
      await page.route("**/api/assistant", async (route) => {
        requests.push(route.request().postDataJSON());
        if (mode === "rate")
          return route.fulfill({ status: 429, headers: { "Retry-After": "2" }, body: '{"error":"rate"}' });
        if (mode === "unavailable" || mode === "configuration")
          return route.fulfill({ status: 503, body: JSON.stringify({ error: mode }) });
        if (mode === "expired") return route.fulfill({ status: 401, body: '{"error":"unauthorized"}' });
        if (mode === "malicious")
          return route.fulfill({
            status: 200,
            contentType: "text/event-stream",
            body: Buffer.concat([
              encodeEvent({ v: 1, type: "text-delta", text: 'root = iframe("https://evil.test")' }),
              encodeEvent({ v: 1, type: "finish" }),
            ]),
          });
        await route.continue({
          headers: { ...route.request().headers(), "cf-connecting-ip": `198.19.25.${ip++}`, "x-v07-case": mode },
        });
      });
      await page.goto(`${worker.baseURL}/dashboard/assistant`);
      await page.waitForLoadState("networkidle");
      const picker = page.getByRole("combobox", { name: "Provider", exact: true });
      const input = page.getByRole("textbox", { name: "Message", exact: true });
      const send = async (text: string) => {
        await input.fill(text);
        await input.press("Enter");
        await page.locator("article").last().getByText(text, { exact: true }).waitFor();
        await page
          .locator("article")
          .last()
          .getByText(/ · completed$/)
          .waitFor();
      };
      await send("First synthetic question");
      await send("Second synthetic question");
      assert.deepEqual(requests.at(-1)?.messages, [
        { role: "user", content: "First synthetic question" },
        { role: "assistant", content: mockOutput },
        { role: "user", content: "Second synthetic question" },
      ]);
      await picker.selectOption("meta");
      await page.getByRole("button", { name: "Regenerate", exact: true }).press("Enter");
      await page.locator("article").last().getByText("Meta · muse-spark-1.3 · completed", { exact: true }).waitFor();
      assert.equal(await page.locator("article").count(), 2);
      assert.equal(requests.at(-1)?.provider, "meta");
      assert.equal(requests.at(-1)?.messages.length, 3);
      assert.equal(await page.getByText("OpenAI · gpt-6.1-sol · completed", { exact: true }).count(), 1);
      assert.ok(await input.evaluate((el) => el === document.activeElement));
      await page.screenshot({ path: `${output}/${theme}-${size}-regenerated.png`, fullPage: true });
      mode = "slow";
      await input.fill("Stopped synthetic question");
      await input.press("Enter");
      await page.locator("article").last().getByText("Synthetic Café 🙂 response", { exact: true }).last().waitFor();
      await page.getByRole("button", { name: "Stop", exact: true }).press("Enter");
      await page.getByText("Response stopped. This reply is incomplete.", { exact: true }).waitFor();
      assert.ok(await input.evaluate((el) => el === document.activeElement));
      await page.screenshot({ path: `${output}/${theme}-${size}-stopped.png`, fullPage: true });
      mode = "success";
      await page.getByRole("button", { name: "Regenerate", exact: true }).press("Enter");
      await page
        .locator("article")
        .last()
        .getByText("Meta · muse-spark-1.3 · completed", { exact: true })
        .last()
        .waitFor();
      assert.equal(requests.at(-1)?.messages.length, 5);
      assert.equal(requests.at(-1)?.messages.at(-1)?.content, "Stopped synthetic question");
      mode = "slow";
      await input.fill("Cancelled generation");
      await input.press("Enter");
      await page.getByRole("button", { name: "New conversation", exact: true }).click();
      mode = "success";
      await send("New generation");
      await page.waitForTimeout(300);
      assert.equal(await page.locator("article").count(), 1);
      assert.equal(requests.at(-1)?.messages.length, 1);
      mode = "rate";
      await input.fill("Retry draft");
      await input.press("Enter");
      await page.getByText(/Too many requests/).waitFor();
      assert.equal(await input.inputValue(), "Retry draft");
      assert.ok(await page.getByRole("button", { name: "Send", exact: true }).isDisabled());
      const count = requests.length;
      await page.screenshot({ path: `${output}/${theme}-${size}-rate.png`, fullPage: true });
      await page.waitForTimeout(2200);
      assert.equal(requests.length, count);
      assert.ok(await page.getByRole("button", { name: "Send", exact: true }).isEnabled());
      mode = "unavailable";
      const metadataBeforeOutage = metadataRequests;
      await input.press("Enter");
      await page
        .getByText("The Assistant is unavailable. Try again when the service is ready.", { exact: true })
        .waitFor();
      await page.waitForLoadState("networkidle");
      assert.equal(metadataRequests, metadataBeforeOutage, "Outages must not refresh provider configuration");
      assert.equal(await input.inputValue(), "Retry draft");
      await page.screenshot({ path: `${output}/${theme}-${size}-unavailable.png`, fullPage: true });
      mode = "configuration";
      await input.press("Enter");
      await page.getByText(/provider configuration changed or is unavailable/).waitFor();
      await page.waitForLoadState("networkidle");
      assert.ok(metadataRequests > metadataBeforeOutage, "Configuration errors must refresh metadata");
      await page.screenshot({ path: `${output}/${theme}-${size}-configuration.png`, fullPage: true });
      mode = "malicious";
      // Configuration refresh may still disable submission after the network becomes idle.
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.getByText(/reply or request was not supported/).waitFor();
      await page.waitForLoadState("networkidle");
      assert.equal(await page.locator("article iframe, article script, article a").count(), 0);
      mode = "empty";
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.getByText(/No usable reply was returned/).waitFor();
      await page.screenshot({ path: `${output}/${theme}-${size}-refused.png`, fullPage: true });
      mode = "500";
      await input.fill("Provider error draft");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page
        .getByText(/provider could not reply/)
        .waitFor()
        .catch(async (error) => {
          await page.screenshot({ path: `${output}/${theme}-${size}-failure.png`, fullPage: true });
          console.log("Recovery diagnostics", {
            count: requests.length,
            lastProvider: requests.at(-1)?.provider,
            disabled: await page.getByRole("button", { name: "Send", exact: true }).isDisabled(),
            alerts: await page.locator('[role="alert"]').count(),
          });
          throw error;
        });
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `${output}/${theme}-${size}-provider-error.png`, fullPage: true });
      await context.setExtraHTTPHeaders({ "x-v07-providers": "openai" });
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.getByText(/Available providers changed/).waitFor();
      assert.equal(await picker.inputValue(), "");
      assert.ok(await page.getByRole("button", { name: "Send", exact: true }).isDisabled());
      const noFallback = requests.length;
      await page.waitForTimeout(200);
      assert.equal(requests.length, noFallback);
      await page.screenshot({ path: `${output}/${theme}-${size}-removed-provider.png`, fullPage: true });
      await picker.selectOption("openai");
      mode = "success";
      await input.press("Enter");
      await page.locator("article").last().getByText("OpenAI · gpt-6.1-sol · completed", { exact: true }).waitFor();
      await context.setExtraHTTPHeaders({ "x-v07-providers": "" });
      await input.fill("Removed last provider");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.getByRole("button", { name: "Use recorded demo", exact: true }).waitFor();
      const beforeRecorded = requests.length;
      await page.waitForTimeout(100);
      assert.equal(requests.length, beforeRecorded);
      await page.getByRole("button", { name: "Use recorded demo", exact: true }).click();
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await page.locator("article").last().getByText("Recorded demo · completed", { exact: true }).waitFor();
      await page.screenshot({ path: `${output}/${theme}-${size}-explicit-recorded.png`, fullPage: true });
      mode = "expired";
      await input.fill("Expired draft");
      await input.press("Enter");
      await page.getByRole("link", { name: "Sign in to continue", exact: true }).waitFor();
      assert.equal(await page.locator("article").count(), 0);
      assert.equal(await input.inputValue(), "");
      assert.ok(await input.isDisabled());
      assert.ok(
        await page
          .getByRole("link", { name: "Sign in to continue", exact: true })
          .evaluate((el) => el === document.activeElement),
      );
      await page.screenshot({ path: `${output}/${theme}-${size}-session-ended.png`, fullPage: true });
      await page.reload();
      assert.equal(await page.locator("article").count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      await context.close();
      console.log(
        `PASS history/regenerate/Stop/clear race, safe errors, Retry-After no retry, removed provider no fallback, session clear, focus/overflow ${theme}/${size}`,
      );
    }
  const probe = await (await fetch(`${worker.baseURL}/__assistant_probe`)).json();
  assert.equal(probe.violations, 0);
  assert.equal(probe.leaks, 0);
  console.log("PASS compiled provider egress barrier and application console sentinel sinks");
} finally {
  await browser.close();
  await worker.stop();
}

import { chromium } from "playwright";

import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { captureSidebarStates } from "./screenshot-shell.ts";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.ASSISTANT_TEST_URL ?? "http://127.0.0.1:3170";
const probeURL = process.env.ASSISTANT_PROBE_URL ?? baseURL;
const output = process.env.ASSISTANT_EVIDENCE_ROOT ?? "screenshots/v07-001/interaction";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const theme of ["light", "dark"] as const)
    for (const [size, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 },
    })) {
      // The real POST counts recorded admissions too. Isolate each mode in a fresh fixed window.
      if (process.env.ASSISTANT_ENDPOINT_TEST === "1")
        await new Promise((resolve) => setTimeout(resolve, 61000 - (Date.now() % 60000)));
      const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce" });
      await cacheCaptureFonts(context);
      await context.addCookies([{ name: "theme_mode", value: theme, url: baseURL }]);
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      const external: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== baseURL && !/fonts\.(googleapis|gstatic)\.com/.test(request.url()))
          external.push(new URL(request.url()).hostname);
      });
      await page.goto(`${baseURL}/dashboard/assistant`);
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll("body *")).some((node) =>
          Object.keys(node).some((key) => key.startsWith("__reactFiber$")),
        ),
      );
      await page.waitForLoadState("networkidle");
      // Source-only safety probes run on dev; interaction checks may target a built preview.
      const probePage = probeURL === baseURL ? page : await context.newPage();
      if (probePage !== page) {
        await probePage.goto(`${probeURL}/dashboard/assistant`);
        await probePage.waitForLoadState("networkidle");
      }
      const registryProof = await probePage.evaluate(async () => {
        const rendererPath = "/src/routes/(main)/dashboard/assistant/-components/registry.tsx";
        const schemaPath = "/src/lib/assistant/registry.ts";
        const { getAssistantLibrary, validateEvaluatedProps } = await import(rendererPath);
        const { getLibrarySpec } = await import(schemaPath);
        let rejected = 0;
        for (const [name, props] of [
          ["Text", { text: "valid", dangerouslySetInnerHTML: { __html: "<script>bad</script>" } }],
          [
            "Card",
            {
              title: "bad",
              children: [{ type: "element", typeName: "Text", partial: false, props: { text: { html: "bad" } } }],
            },
          ],
          [
            "Stack",
            {
              children: [{ type: "element", typeName: "iframe", partial: false, props: { src: "https://evil.test" } }],
            },
          ],
          ["Stack", { children: [{ type: "element", typeName: "Text", partial: true, props: { text: "partial" } }] }],
          ["Badge", { label: "bad", tone: "javascript:bad" }],
          ["Chart", { title: "bad", kind: "bar", labels: ["x"], series: [{ label: "x", values: [NaN] }] }],
        ]) {
          try {
            validateEvaluatedProps(name, props);
          } catch {
            rejected++;
          }
        }
        validateEvaluatedProps("Text", { text: "<script>escaped</script>" });
        return {
          rejected,
          specMatches: JSON.stringify(getAssistantLibrary().toSpec()) === JSON.stringify(getLibrarySpec()),
        };
      });
      assert.deepEqual(registryProof, { rejected: 6, specMatches: true });

      await page.getByRole("button", { name: "Summarize a sample launch" }).waitFor();
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `${output}/${theme}-${size}-empty.png`, fullPage: true });
      for (const [label, ready] of [
        ["Summarize a sample launch", "Launch snapshot"],
        ["Compare sample plans", "Sample plans"],
        ["Chart a sample week", "Sample review trend"],
      ]) {
        await page.getByRole("button", { name: new RegExp(`^${label}(?: |$)`) }).press("Enter");
        assert.ok(
          await page
            .getByRole("textbox", { name: "Message", exact: true })
            .evaluate((el) => el === document.activeElement),
        );
        if (label.startsWith("Summarize"))
          await page.screenshot({ path: `${output}/${theme}-${size}-streaming-focus.png`, fullPage: true });
        await page
          .getByText("Recorded demo · completed", { exact: true })
          .waitFor()
          .catch(async (error) => {
            console.error("Recorded browser assertion failed; inspect the synthetic screenshot evidence.");
            await page.screenshot({ path: `${output}/failure.png` });
            throw error;
          });
        await page.getByText(ready, { exact: true }).first().waitFor();
        assert.equal(await page.locator("[data-openui-devtools-auto-mount]").count(), 0);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        await page.screenshot({
          path: `${output}/${theme}-${size}-${label.split(" ")[0].toLowerCase()}.png`,
          fullPage: true,
        });
        await page.getByRole("button", { name: "New conversation", exact: true }).click();
      }
      const input = page.getByRole("textbox", { name: "Message", exact: true });
      await input.fill("two lines");
      await input.press("Shift+Enter");
      assert.equal(await input.inputValue(), "two lines\n");
      await input.evaluate((node) =>
        node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing: true })),
      );
      assert.equal(await page.locator("article").count(), 0);
      await input.press("Enter");
      await page.getByRole("button", { name: "Stop", exact: true }).press("Enter");
      await page.getByText("Response stopped. This reply is incomplete.", { exact: true }).waitFor();
      assert.ok(await input.evaluate((el) => el === document.activeElement));
      assert.equal(await page.getByText("Preparing response…", { exact: true }).count(), 0);
      await page.screenshot({ path: `${output}/${theme}-${size}-stopped-focus.png`, fullPage: true });
      await page.getByRole("button", { name: "New conversation", exact: true }).click();
      await page.getByRole("button", { name: /^Chart a sample week(?: |$)/ }).click();
      await page.getByRole("button", { name: "New conversation", exact: true }).click();
      await page.waitForTimeout(600);
      assert.equal(await page.locator("article").count(), 0);
      await page.reload();
      assert.equal(await page.locator("article").count(), 0);
      await page.waitForLoadState("networkidle");
      await captureSidebarStates(page, async (state) => {
        await page.screenshot({ path: `${output}/${theme}-${size}-nav-${state}.png`, fullPage: true });
      });
      await page.keyboard.press("Control+k");
      await page.getByRole("combobox", { name: "Search pages" }).fill("assistant");
      await page.getByRole("option").filter({ hasText: "AI Assistant" }).waitFor();
      await page.screenshot({ path: `${output}/${theme}-${size}-palette.png`, fullPage: true });
      await page.keyboard.press("Escape");
      const recovery = await probePage.evaluate(async () => {
        const path = "/scripts/assistant-renderer-probe.tsx";
        return (await import(path)).run();
      });
      assert.deepEqual(recovery, { rejected: true, recovered: true, boundary: true });
      await probePage.screenshot({ path: `${output}/${theme}-${size}-error.png`, fullPage: true });
      assert.deepEqual(external, []);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(
        `PASS Assistant recorded examples, no egress, IME, Stop/clear races, reload, overflow, console ${theme}/${size}`,
      );
    }
} finally {
  await browser.close();
}

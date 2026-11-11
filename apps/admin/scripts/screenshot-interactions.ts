import type { Page } from "playwright";

import { captureAuth } from "./screenshot-auth.ts";
import { captureCore } from "./screenshot-core.ts";
import { captureDirectories } from "./screenshot-directories.ts";
import { captureProducts } from "./screenshot-products.ts";
import { captureProfile } from "./screenshot-profile.ts";
import { captureShell } from "./screenshot-shell.ts";
import { captureSystem } from "./screenshot-system.ts";

// Opt-in interaction evidence for the dashboard batch. Never replace the runtime clock.
export async function captureInteractions(
  page: Page,
  route: string,
  captureVariant: (name: string) => Promise<void>,
): Promise<string[]> {
  if (["/", "/dashboard", "/dashboard/"].includes(route)) return captureSystem(page, route, captureVariant);
  if (route === "/dashboard/default")
    return [...(await captureShell(page, captureVariant)), ...(await captureCore(page, route, captureVariant))];
  if (route === "/dashboard/crm") return captureCore(page, route, captureVariant);
  if (route.startsWith("qa:") || ["/dashboard/coming-soon", "/dashboard/$", "/unauthorized"].includes(route))
    return captureSystem(page, route, captureVariant);
  if (route.startsWith("/auth/")) return captureAuth(page, route, captureVariant);
  if (route === "/dashboard/users" || route === "/dashboard/roles")
    return captureDirectories(page, route, captureVariant);
  if (route === "/dashboard/profile") return captureProfile(page, captureVariant);
  if (route === "/dashboard/products") return captureProducts(page, captureVariant);
  if (route === "/dashboard/invoice") {
    const paper = page.locator("form [data-print-paper]");
    await page.locator('[data-ready="true"]').waitFor();
    await page.locator("[data-invoice-total]").getByText("$6,003.20", { exact: true }).waitFor();
    const originalIssued = (await paper.textContent())?.match(/Issued: (\d{4}-\d{2}-\d{2})/)?.[1];
    if (!originalIssued) throw new Error("Invoice initial civil date missing");
    await page.getByRole("textbox", { name: "Reference Number", exact: true }).fill("NORTHWIND-DEMO-2026-0123");
    await page.getByRole("button", { name: /^Issued Date:/ }).press("Enter");
    const next = new Date(`${originalIssued}T12:00:00`);
    next.setDate(next.getDate() + 1);
    const nextDay = `${next.getMonth() + 1}/${next.getDate()}/${next.getFullYear()}`;
    const nextCivil = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    await page.locator(`[data-day="${nextDay}"]`).press("Enter");
    await paper.getByText(`Issued: ${nextCivil}`, { exact: true }).waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label")?.startsWith("Issued Date:"));
    const originalDue = (await paper.textContent())?.match(/Payment due: (\d{4}-\d{2}-\d{2})/)?.[1];
    if (!originalDue) throw new Error("Invoice due date missing");
    const due = new Date(`${originalDue}T12:00:00`);
    due.setDate(due.getDate() + 1);
    await page.getByRole("button", { name: /^Due Date:/ }).press("Enter");
    await page.locator(`[data-day="${due.getMonth() + 1}/${due.getDate()}/${due.getFullYear()}"]`).press("Enter");
    const dueCivil = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
    await paper.getByText(`Payment due: ${dueCivil}`, { exact: true }).waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label")?.startsWith("Due Date:"));
    await page.getByRole("combobox", { name: "Client", exact: true }).click();
    await page.getByRole("option", { name: "Bright Enterprises", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Item 1 description", exact: true })
      .fill(
        "Implementation and accessibility review\nDocumentation, handover and long-description coverage for the demo invoice.",
      );
    await page.getByRole("spinbutton", { name: "Item 1 quantity", exact: true }).fill("2");
    await page.getByRole("spinbutton", { name: "Item 1 unit price", exact: true }).fill("125");
    await page.getByRole("button", { name: "Add Item", exact: true }).click();
    await page.getByRole("textbox", { name: "Item 4 description", exact: true }).fill("Follow-up review");
    await page.getByRole("spinbutton", { name: "Item 4 quantity", exact: true }).fill("3");
    await page.getByRole("spinbutton", { name: "Item 4 unit price", exact: true }).fill("80");
    await page.getByRole("combobox", { name: "Tax", exact: true }).click();
    await page.getByRole("option", { name: "GST (18%)", exact: true }).click();
    await page.getByRole("combobox", { name: "Discount type", exact: true }).click();
    await page.getByRole("option", { name: "Percent", exact: true }).click();
    await page.getByRole("spinbutton", { name: "Discount value", exact: true }).fill("10");
    await page.locator("[data-invoice-total]").getByText("$2,538.18", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Remove item 2", exact: true }).click();
    await page.locator("[data-invoice-total]").getByText("$945.18", { exact: true }).waitFor();
    const orderBefore = await page
      .locator("[data-invoice-item]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-invoice-item")));
    const drag = page.getByRole("button", { name: "Reorder item 1", exact: true });
    await drag.scrollIntoViewIfNeeded();
    await drag.press("Space");
    await page.waitForTimeout(250);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(250);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    const orderCanceled = await page
      .locator("[data-invoice-item]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-invoice-item")));
    if (JSON.stringify(orderBefore) !== JSON.stringify(orderCanceled))
      throw new Error("Invoice reorder cancellation changed items");
    await drag.press("Space");
    await page.waitForTimeout(250);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(250);
    await page.keyboard.press("Space");
    await page.waitForFunction(
      (first) => document.querySelector("[data-invoice-item]")?.getAttribute("data-invoice-item") !== first,
      orderBefore[0],
    );
    await page.locator("[data-invoice-total]").getByText("$945.18", { exact: true }).waitFor();
    const print = page.locator("[data-print-root] [data-print-paper]");
    if ((await print.textContent()) !== (await paper.textContent()))
      throw new Error("Preview and print contents differ");
    if (!(await print.textContent())?.includes("Issued by Jordan Lee")) throw new Error("Neutral print issuer missing");
    const contrast = await paper.evaluate((node) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Missing color canvas");
      const luminance = (value: string) => {
        ctx.fillStyle = value;
        ctx.fillRect(0, 0, 1, 1);
        const channels = Array.from(ctx.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .map((c) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const bg = luminance(getComputedStyle(node).backgroundColor);
      return [node, node.querySelector("footer"), node.querySelector(".bg-neutral-100")].map((el) => {
        if (!el) throw new Error("Paper footer missing");
        const fg = luminance(getComputedStyle(el).color);
        const background = el.classList.contains("bg-neutral-100")
          ? luminance(getComputedStyle(el).backgroundColor)
          : bg;
        return (Math.max(background, fg) + 0.05) / (Math.min(background, fg) + 0.05);
      });
    });
    if (contrast.some((ratio) => ratio < 4.5)) throw new Error(`Invoice paper text contrast: ${contrast}`);
    await page.getByRole("heading", { name: "Preview", exact: true }).scrollIntoViewIfNeeded();
    await captureVariant("preview");
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error("Invoice document overflow");
    await page.emulateMedia({ media: "print" });
    await captureVariant("print");
    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => window.scrollTo(0, 0));
    return [
      `Date edited ${originalIssued} → ${nextCivil} as a civil date`,
      "Client changed; multiline description and quantity/price edits",
      "Add/remove items, GST 18%, discount 10%; totals $2,538.18 → $945.18",
      "Keyboard reorder and cancellation preserve values/totals",
      "Preview/print content agrees; Jordan Lee issuer",
      `Paper text contrast ${contrast.map((r) => r.toFixed(2)).join(" / ")}:1`,
      "Print PDF exported and screen portal hidden; no page overflow",
    ];
  }
  if (route === "/dashboard/tasks") {
    const search = page.getByRole("textbox", { name: "Filter tasks", exact: true });
    await search.fill("neural TCP");
    await page.getByRole("button", { name: "Status", exact: true }).press("Enter");
    await page.getByRole("menuitemcheckbox", { name: "Todo", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Priority", exact: true }).press("Enter");
    await page.getByRole("menuitemcheckbox", { name: "High", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.locator('tbody [data-task-id="TASK-7839"]').waitFor();
    if ((await page.locator("tbody [data-task-id]").count()) !== 1)
      throw new Error("Combined task filters did not yield the known single task");
    await page.getByRole("checkbox", { name: "Select TASK-7839", exact: true }).press("Space");
    await page.getByText("1 of 1 row(s) selected.", { exact: true }).waitFor();
    await captureVariant("filtered-selected");
    await search.fill("no-matching-demo-task-xyz");
    await page.getByText("No matching tasks", { exact: true }).waitFor();
    await captureVariant("empty");
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page.getByText("1 of 100 row(s) selected.", { exact: true }).waitFor();
    await page.getByRole("checkbox", { name: "Select all", exact: true }).press("Space");
    await page.getByText("10 of 100 row(s) selected.", { exact: true }).waitFor();
    await page.getByRole("checkbox", { name: "Select all", exact: true }).press("Space");
    await page.getByText("0 of 100 row(s) selected.", { exact: true }).waitFor();
    await page.getByRole("checkbox", { name: "Select TASK-7839", exact: true }).press("Space");
    await page.getByRole("button", { name: "Title", exact: true }).press("Enter");
    await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector("tbody [data-task-id]")?.getAttribute("data-task-id") === "TASK-1075",
    );
    await page.getByRole("button", { name: "Title", exact: true }).press("Enter");
    await page.getByRole("menuitem", { name: "Desc", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector("tbody [data-task-id]")?.getAttribute("data-task-id") === "TASK-3360",
    );
    await page.getByRole("button", { name: "Column visibility", exact: true }).press("Enter");
    await page.getByRole("menuitemcheckbox", { name: "priority", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("columnheader", { name: "Priority", exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Column visibility", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "priority", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("columnheader", { name: "Priority", exact: true }).waitFor();
    await page.getByRole("combobox", { name: "Rows per page", exact: true }).click();
    await page.getByRole("option", { name: "20", exact: true }).click();
    await page.getByText("Page 1 of 5", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Go to next page", exact: true }).press("Enter");
    await page.getByText("Page 2 of 5", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Go to previous page", exact: true }).press("Enter");
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      await page.getByRole("button", { name: "Go to last page", exact: true }).press("Enter");
      await page.getByText("Page 5 of 5", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Go to first page", exact: true }).press("Enter");
    }
    await page.getByRole("button", { name: /^Status/ }).click();
    await page.getByRole("menuitemcheckbox", { name: "Done", exact: true }).click();
    await page.getByRole("menuitem", { name: "Clear filters", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^Priority/ }).click();
    await page.getByRole("menuitemcheckbox", { name: "Low", exact: true }).click();
    await page.getByRole("menuitem", { name: "Clear filters", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByText("1 of 100 row(s) selected.", { exact: true }).waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error("Tasks document overflow");
    await page
      .getByRole("button", { name: /^Actions for TASK-/ })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    return [
      "Search + Todo + High returns TASK-7839; Space selects row",
      "No results and Reset preserve selected count",
      "Asc/Desc sorting and column visibility",
      "Page size 20, next/previous and desktop first/last pages",
      "Both filter Clear actions work; row action menu remains demo",
      "No page overflow",
    ];
  }
  if (route === "/dashboard/kanban") {
    // dnd-kit commits sensor/overlay transitions on animation frames. Settle between gestures.
    const settleDrag = () => page.waitForTimeout(250);
    const choose = async (view: string) => {
      await page.getByRole("tab", { name: view, exact: true }).press("Enter");
      await page.waitForURL((url) => url.searchParams.get("view") === view.toLowerCase());
      await page.getByRole("tab", { name: view, exact: true }).waitFor();
    };
    await choose("Board");
    const task = page.locator('[data-task-id="tender-workflow-map"]').first();
    await task.press("Space");
    await settleDrag();
    await page.keyboard.press("ArrowRight");
    await settleDrag();
    await page.locator('[data-column-id="planned"] [data-task-id="tender-workflow-map"]').waitFor();
    await captureVariant("drag-overlay");
    await settleDrag();
    await page.keyboard.press("Escape");
    await settleDrag();
    await page
      .locator('[data-column-id="ideas"] [data-task-id="tender-workflow-map"]')
      .waitFor()
      .catch(async () => {
        throw new Error(
          `Task return to Ideas failed: ${await page.evaluate(() => ({ columns: Array.from(document.querySelectorAll('[data-task-id="tender-workflow-map"]')).map((e) => e.closest("[data-column-id]")?.getAttribute("data-column-id")), live: Array.from(document.querySelectorAll("[aria-live]")).map((e) => e.textContent) })).then(JSON.stringify)}`,
        );
      });
    await task.press("Space");
    await settleDrag();
    await page.keyboard.press("ArrowRight");
    await settleDrag();
    await page.locator('[data-column-id="planned"] [data-task-id="tender-workflow-map"]').waitFor();
    await page.keyboard.press("Space");
    await settleDrag();
    const column = page.getByRole("button", { name: "Drag Ideas column", exact: true });
    await column.scrollIntoViewIfNeeded();
    await column.press("Space");
    await settleDrag();
    await page.keyboard.press("ArrowRight");
    await settleDrag();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("[aria-live]")).some(
        (node) => node.textContent?.includes("column:ideas") && node.textContent.includes("column:planned"),
      ),
    );
    await page.keyboard.press("Space");
    await settleDrag();
    await page.waitForFunction(
      () => document.querySelector("[data-column-id]")?.getAttribute("data-column-id") === "planned",
    );
    if ((page.viewportSize()?.width ?? 0) > 768) {
      const moving = await page
        .locator('[data-column-id="planned"] [data-task-id="tender-workflow-map"]')
        .boundingBox();
      const target = await page.locator('[data-column-id="ideas"] [data-task-id]').first().boundingBox();
      if (!moving || !target) throw new Error("Pointer task targets missing");
      await page.mouse.move(moving.x + moving.width / 2, moving.y + 20);
      await page.mouse.down();
      await page.mouse.move(moving.x + moving.width / 2 + 12, moving.y + 30, { steps: 4 });
      await page.mouse.move(target.x + target.width / 2, target.y + 20, { steps: 15 });
      await page
        .locator('[data-column-id="ideas"] [data-task-id="tender-workflow-map"]')
        .waitFor()
        .catch(async () => {
          throw new Error(
            `Task return to Ideas failed: ${await page.evaluate(() => ({ columns: Array.from(document.querySelectorAll('[data-task-id="tender-workflow-map"]')).map((e) => e.closest("[data-column-id]")?.getAttribute("data-column-id")), live: Array.from(document.querySelectorAll("[aria-live]")).map((e) => e.textContent) })).then(JSON.stringify)}`,
          );
        });
      await page.mouse.up();
      await settleDrag();
    }
    await captureVariant("board");
    await choose("List");
    await page.reload();
    await page.locator('[aria-roledescription="draggable"]').first().waitFor();
    await page.getByRole("tab", { name: "List", exact: true }).waitFor();
    const firstList = page.locator('[data-task-id="tender-workflow-map"]');
    await firstList.press("Space");
    await settleDrag();
    await page.keyboard.press("ArrowDown");
    await settleDrag();
    await page.waitForFunction(
      () => document.querySelector("[data-task-id]")?.getAttribute("data-task-id") === "license-strategy-research",
    );
    await page.keyboard.press("Escape");
    await settleDrag();
    await page.waitForFunction(
      () => document.querySelector("[data-task-id]")?.getAttribute("data-task-id") === "tender-workflow-map",
    );
    await firstList.press("Space");
    await settleDrag();
    await page.keyboard.press("ArrowDown");
    await settleDrag();
    await page.waitForFunction(
      () => document.querySelector("[data-task-id]")?.getAttribute("data-task-id") === "license-strategy-research",
    );
    await page.keyboard.press("Space");
    await settleDrag();
    await page.waitForFunction(
      () => document.querySelector("[data-task-id]")?.getAttribute("data-task-id") === "license-strategy-research",
    );
    await captureVariant("list");
    await choose("Table");
    await page.reload();
    await page.locator('[aria-roledescription="draggable"]').first().waitFor();
    const drag = page.getByRole("button", { name: "Drag Tender workflow map", exact: true });
    await drag.press("Space");
    await settleDrag();
    await page.keyboard.press("ArrowDown");
    await settleDrag();
    await page.waitForFunction(
      () => document.querySelector("[data-task-id]")?.getAttribute("data-task-id") === "license-strategy-research",
    );
    await page.keyboard.press("Escape");
    await settleDrag();
    await page.waitForFunction(
      () => document.querySelector("tbody [data-task-id]")?.getAttribute("data-task-id") === "tender-workflow-map",
    );
    await drag.press("Space");
    await settleDrag();
    await page.keyboard.press("ArrowDown");
    await settleDrag();
    await page.waitForFunction(
      () => document.querySelector("[data-task-id]")?.getAttribute("data-task-id") === "license-strategy-research",
    );
    await page.keyboard.press("Space");
    await settleDrag();
    await page.waitForFunction(
      () =>
        document.querySelector("tbody [data-task-id]")?.getAttribute("data-task-id") === "license-strategy-research",
    );
    await page.getByRole("combobox", { name: "Change status for Tender workflow map", exact: true }).click();
    await page.getByRole("option", { name: "QA", exact: true }).click();
    await captureVariant("table");
    await page.getByRole("combobox", { name: "Rows per page", exact: true }).click();
    await page.getByRole("option", { name: "50", exact: true }).click();
    const statusSelects = page.getByRole("combobox", { name: /^Change status for/ });
    for (let index = 0; index < (await statusSelects.count()); index++) {
      const select = statusSelects.nth(index);
      if (((await select.textContent()) ?? "").trim().startsWith("QA")) {
        await select.click();
        await page.getByRole("option", { name: "Shipped", exact: true }).click();
      }
    }
    await choose("Board");
    await page.locator('[data-column-id="qa"]').getByText("No tasks", { exact: true }).waitFor();
    await page.locator('[data-column-id="qa"]').scrollIntoViewIfNeeded();
    await captureVariant("empty-column");
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error("Kanban document overflow");
    return [
      "Query Board/List/Table selections and list/table refresh",
      "Keyboard task move and Escape rollback; desktop pointer move",
      "Keyboard column and table ordering; list/table cancellation",
      "Table status edit reflected in board; empty QA column",
      "Local horizontal scrolling and neutral owner across all views",
    ];
  }
  if (route === "/dashboard/calendar") {
    const today = await page.evaluate(() => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    });
    const current = page.locator(`[data-date="${today}"][aria-current="date"]`).first();
    await current.waitFor();
    const heading = await page.getByRole("heading", { level: 1 }).textContent();
    await page.getByRole("button", { name: "Next period", exact: true }).press("Enter");
    await page.waitForFunction((previous) => document.querySelector("h1")?.textContent !== previous, heading);
    await page.getByRole("button", { name: "Previous period", exact: true }).press("Enter");
    await current.waitFor();
    await page.getByRole("combobox", { name: "Calendar", exact: true }).press("Enter");
    await page.getByRole("option", { name: "Work", exact: true }).click();
    for (const view of ["Week", "Day", "Month"]) {
      await page.getByRole("combobox", { name: "Calendar view", exact: true }).press("Enter");
      await page.getByRole("option", { name: view, exact: true }).click();
      await page.getByRole("button", { name: "Today", exact: true }).press("Enter");
      await current.waitFor();
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
        throw new Error(`Calendar ${view} page overflow`);
      if (view === "Day") {
        const clock = await page.evaluate(() => {
          const line = document.querySelector("div.border-destructive");
          const slot = Array.from(document.querySelectorAll("[data-time='00:30:00']")).find(
            (node) => node.getBoundingClientRect().height > 0,
          );
          if (!line || !slot) throw new Error("Live now indicator or time axis missing");
          const minute = (parseFloat(getComputedStyle(line).top) / slot.getBoundingClientRect().height) * 30;
          const now = new Date();
          return { minute, expected: now.getHours() * 60 + now.getMinutes() };
        });
        if (Math.abs(clock.minute - clock.expected) > 2)
          throw new Error(`Live local now indicator mismatch: ${JSON.stringify(clock)}`);
      }
      await captureVariant(view.toLowerCase());
    }
    const more = page.getByTitle(/Show .* more event/).first();
    await more.press("Enter");
    await page.getByRole("button", { name: "Close", exact: true }).waitFor();
    await page.getByText("Team retrospective", { exact: true }).last().waitFor();
    await page.getByRole("button", { name: "Close", exact: true }).press("Enter");
    await more.press("Enter");
    return [
      `Browser-local Today ${today} after hydration`,
      "Previous/next, Month/Week/Day and Today via keyboard",
      "Calendar selector retains demo selection",
      "Live now marker matches real browser-local minute (within two-minute rendering tolerance)",
      "Crowded-day popover contains long title and closes by keyboard",
      "Calendar grid scrolls locally; no page overflow",
    ];
  }
  if (route === "/chat" || route === "/dashboard/chat") {
    const embedded = route === "/dashboard/chat";
    if (embedded)
      await page
        .frameLocator('iframe[title="Chat preview"]')
        .getByRole("heading", { name: "tenboards Chat", exact: true })
        .waitFor();
    const surface = embedded ? page.frames().find((frame) => new URL(frame.url()).pathname === "/chat") : page;
    if (!surface) throw new Error("Chat iframe missing");
    const inner = await surface.evaluate(() => ({
      width: innerWidth,
      dark: document.documentElement.classList.contains("dark"),
      preset: document.documentElement.dataset.themePreset,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    const parent = await page.evaluate(() => ({
      dark: document.documentElement.classList.contains("dark"),
      preset: document.documentElement.dataset.themePreset,
    }));
    if (inner.dark !== parent.dark || inner.preset !== parent.preset || inner.overflow)
      throw new Error(`Chat frame layout/theme: ${JSON.stringify(inner)}`);
    const row = surface.locator("[data-conversation-id]").first();
    await row.press("Enter");
    if (inner.width < 768) {
      await surface.waitForFunction(
        () => document.activeElement?.getAttribute("aria-label") === "Back to conversations",
      );
      if (!(await row.evaluate((node) => !!node.closest("[inert]"))))
        throw new Error("Offscreen list remains focusable");
    }
    await surface
      .getByRole("textbox", { name: "Type your message...", exact: true })
      .fill(
        "A longer demo reply with averylongunbrokenmessagethatmustremaininsideitscomposer and multiple lines.\nSecond line.",
      );
    await surface.getByRole("tab", { name: "Internal note", exact: true }).press("Enter");
    await surface.getByRole("textbox", { name: "Write an internal note...", exact: true }).fill("Internal demo note");
    await surface.getByRole("tab", { name: "Reply", exact: true }).press("Enter");
    await surface.getByRole("button", { name: "More actions", exact: true }).press("Enter");
    await surface.getByRole("menuitem", { name: "View profile", exact: true }).click();
    await surface.getByRole("button", { name: "Close profile", exact: true }).waitFor();
    await surface.getByRole("button", { name: "Close profile", exact: true }).focus();
    await page.keyboard.press("Escape");
    await surface.getByRole("button", { name: "Close profile", exact: true }).waitFor({ state: "hidden" });
    await surface
      .waitForFunction(() => document.activeElement?.hasAttribute("data-contact-trigger"))
      .catch(() => {
        throw new Error("Profile focus return failed");
      });
    if (inner.width < 768) {
      await surface.getByRole("button", { name: "Back to conversations", exact: true }).press("Enter");
      await surface
        .waitForFunction(() => document.activeElement?.hasAttribute("data-conversation-id"))
        .catch(() => {
          throw new Error("Mobile back focus return failed");
        });
      if (!(await surface.locator('[aria-label="Type your message..."]').evaluate((node) => !!node.closest("[inert]"))))
        throw new Error("Offscreen thread remains focusable");
      await row.press("Enter");
    }
    await surface.getByRole("button", { name: "More actions", exact: true }).press("Enter");
    await surface.getByRole("menuitem", { name: "View profile", exact: true }).click();
    return [
      "Iframe preset/theme and no page overflow",
      "Conversation selection, multiline composer and note tab",
      "Profile Escape and trigger focus return",
      "Mobile back returns row focus; hidden list/thread/contact panels inert",
      "Existing sends/search/filter remain demo behavior",
    ];
  }
  if (route === "/mail" || route === "/dashboard/mail") {
    const embedded = route === "/dashboard/mail";
    if (embedded)
      await page
        .frameLocator('iframe[title="Mail preview"]')
        .getByRole("heading", { name: "Inbox", exact: true })
        .waitFor();
    const surface = embedded ? page.frames().find((frame) => new URL(frame.url()).pathname === "/mail") : page;
    if (!surface) throw new Error("Mail iframe missing");
    const parentTheme = await page.evaluate(() => ({
      dark: document.documentElement.classList.contains("dark"),
      preset: document.documentElement.dataset.themePreset,
    }));
    const inner = await surface.evaluate(() => ({
      dark: document.documentElement.classList.contains("dark"),
      preset: document.documentElement.dataset.themePreset,
      width: innerWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    if (inner.dark !== parentTheme.dark || inner.preset !== parentTheme.preset || inner.overflow)
      throw new Error(`Mail frame geometry/theme: ${JSON.stringify(inner)}`);
    const row = surface.locator("[data-mail-id]").first();
    await row.press("Enter");
    await surface
      .getByRole("textbox", { name: "Reply message", exact: true })
      .fill("Thanks — reviewing the attached documents.");
    await surface.getByRole("button", { name: "Attachments (3)", exact: true }).press("Enter");
    await surface.getByRole("button", { name: "Attachments (3)", exact: true }).press("Enter");
    await surface.getByRole("button", { name: "More actions", exact: true }).press("Enter");
    await surface.getByRole("menuitem", { name: "Reply all", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    if (inner.width < 768) {
      await page.keyboard.press("Escape");
      await surface.getByRole("dialog", { name: "Mail message", exact: true }).waitFor({ state: "hidden" });
      if (!(await row.evaluate((node) => node === document.activeElement)))
        throw new Error("Mail drawer did not return focus");
      await row.press("Enter");
    } else {
      const handle = surface.locator('[data-slot="resizable-handle"]');
      const oldWidth = await surface
        .locator("#mail-message-list-panel")
        .evaluate((node) => node.getBoundingClientRect().width);
      await handle.press("ArrowRight");
      await surface.waitForFunction(
        (previous) =>
          Math.abs(
            (document.getElementById("mail-message-list-panel")?.getBoundingClientRect().width ?? previous) - previous,
          ) >= 1,
        oldWidth,
      );
      const newWidth = await surface
        .locator("#mail-message-list-panel")
        .evaluate((node) => node.getBoundingClientRect().width);
      if (Math.abs(newWidth - oldWidth) < 1) throw new Error("Keyboard resize did not change panel width");
      const cookie = (await page.context().cookies()).find((item) => item.name === "mail_panel_layout");
      if (!cookie || (!cookie.value.includes("%") && !cookie.value.includes("[")))
        throw new Error("Mail layout cookie missing");
      await surface.getByRole("button", { name: "Close message", exact: true }).press("Enter");
      await surface.getByText("Select an email to read its message", { exact: true }).waitFor();
      await row.press("Enter");
    }
    await surface.getByRole("textbox", { name: "Reply message", exact: true }).focus();
    return [
      "Standalone/iframe theme and preset match; no page overflow",
      "Keyboard selection, attachments and reply menu/composer",
      inner.width < 768
        ? "Mobile Escape restores row focus; drawer reopens"
        : "Resizable panels persist layout cookie; empty selection and reselection",
      "Existing search/filter/send actions remain demo placeholders",
    ];
  }
  if (route === "/dashboard/file-manager" || route === "/dashboard/products") {
    const title = page.getByRole("heading", { level: 1 });
    const original = await title.textContent();
    await title.evaluate((node) => {
      node.textContent =
        "Workspace documents and product catalog for international operations with a verylongunbrokentitlethatmustwrapwithoutclipping";
    });
    const fits = await title.evaluate((node) => {
      const header = node.parentElement?.parentElement;
      return header && header.scrollWidth <= header.clientWidth && node.scrollWidth <= node.clientWidth;
    });
    if (!fits) throw new Error("Long page heading clips");
    await title.evaluate((node, value) => {
      node.textContent = value;
    }, original);
    if (route === "/dashboard/file-manager") {
      await page.getByRole("button", { name: "List View", exact: true }).press("Enter");
      await page.waitForURL("**view=list");
      await page.reload();
      await page.getByRole("button", { name: "List View", exact: true }).waitFor();
      await page.waitForLoadState("networkidle");
      if (!page.url().includes("view=list")) throw new Error("File view did not survive refresh");
      await page.getByRole("button", { name: "Grid View", exact: true }).press("Enter");
      await page.waitForURL("**view=grid");
      await page.getByRole("button", { name: "Unstar Product roadmap 2027.pdf", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Star Product roadmap 2027.pdf", exact: true }).waitFor();
      await page.getByRole("button", { name: "Actions for Product roadmap 2027.pdf", exact: true }).press("Enter");
      await page.getByRole("menuitem", { name: "Add to starred", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Unstar Product roadmap 2027.pdf", exact: true }).waitFor();
      await captureVariant("grid-starred");
      await page.getByRole("button", { name: "List View", exact: true }).press("Enter");
      const table = page.getByRole("table");
      for (const label of ["Owner", "Modified", "Size"])
        await table.getByRole("columnheader", { name: label, exact: true }).waitFor();
      if ((await table.textContent())?.includes("AK")) throw new Error("Stale author initials");
      await page.getByRole("button", { name: "Actions for Product roadmap 2027.pdf", exact: true }).press("Enter");
      await page.getByRole("menuitem", { name: "Remove from starred", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Star Product roadmap 2027.pdf", exact: true }).waitFor();
      const scroller = page.locator('[data-slot="table-container"]');
      await scroller.evaluate((node) => {
        node.scrollLeft = node.scrollWidth;
      });
      await captureVariant("list-metadata");
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
        throw new Error("File manager document overflow");
      await page.getByRole("button", { name: "Filter & sort", exact: true }).press("Enter");
      await page.getByRole("menuitemradio", { name: "Starred", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Actions for Brand assets", exact: true }).press("Enter");
      await page.getByRole("menuitem", { name: "Open folder", exact: true }).press("Enter");
      await page.getByRole("heading", { name: "My files", exact: true }).waitFor();
      return [
        "Long h1 wraps; keyboard view query survives refresh",
        "Grid/list button and menu star actions work",
        "All table metadata remains visible in local horizontal scroll; neutral initials",
        "Existing folder/search/filter/upload placeholders preserved; no document overflow",
      ];
    }
    await page.getByRole("button", { name: "Add product", exact: true }).press("Enter");
    await page.getByRole("dialog", { name: "Add product", exact: true }).waitFor();
    await page.getByRole("textbox", { name: "Product name", exact: true }).fill("Demo catalog item");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "Add product", exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Add product", exact: true }).press("Enter");
    if (await page.getByRole("textbox", { name: "Product name", exact: true }).inputValue())
      throw new Error("Drawer did not retain reset-on-close behavior");
    return ["Long h1 wraps without clipping", "Keyboard drawer opens, Escape closes, form resets on reopen"];
  }
  if (route === "/dashboard/finance") {
    const period = page.getByRole("combobox", { name: "Spending period", exact: true });
    await period.press("Enter");
    await page.getByRole("option", { name: "Monthly", exact: true }).click();
    await page.getByRole("tab", { name: "Accounts", exact: true }).click();
    await page.getByText("Accounts view coming soon.", { exact: true }).waitFor();
    await page.getByRole("tab", { name: "Dashboard", exact: true }).click();
    await page.getByRole("textbox", { name: "Transfer amount in USD", exact: true }).fill("125.00");
    await period.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    const geometry = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-slot="card"]'));
      const rect = (title: string) =>
        cards.find((card) => card.querySelector("h2,h3")?.textContent === title)?.getBoundingClientRect();
      const spending = rect("Spending Overview");
      const allocation = rect("Account Allocation");
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        aligned: innerWidth < 1280 || (spending && allocation && Math.abs(spending.bottom - allocation.bottom) < 1),
        outline: document.activeElement ? getComputedStyle(document.activeElement).outlineStyle : "none",
      };
    });
    if (geometry.overflow || !geometry.aligned || geometry.outline === "none")
      throw new Error(`Finance layout/focus: ${JSON.stringify(geometry)}`);
    return [
      "Spending period keyboard menu; Accounts placeholder and Dashboard return",
      "Transfer field editable; named select retains visible focus",
      "Desktop Spending/Allocation bottoms aligned; no page overflow",
    ];
  }
  if (route === "/dashboard/patient-monitoring") {
    const clock = page.locator("[data-monitoring-clock]");
    const beforeClock = await clock.textContent();
    const waveform = page
      .getByRole("img", { name: "C01 II ecg waveform", exact: true })
      .locator(".recharts-line-curve");
    const reducedPath = await waveform.getAttribute("d");
    await page.waitForTimeout(1200);
    if (beforeClock === (await clock.textContent())) throw new Error("Live clock did not advance");
    if (reducedPath !== (await waveform.getAttribute("d"))) throw new Error("Reduced-motion waveform moved");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(300);
    const runningPath = await waveform.getAttribute("d");
    await page.waitForTimeout(400);
    if (runningPath === (await waveform.getAttribute("d"))) throw new Error("Normal-motion waveform did not update");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(250);
    const pausedPath = await waveform.getAttribute("d");
    await page.waitForTimeout(300);
    if (pausedPath !== (await waveform.getAttribute("d"))) throw new Error("Waveform did not pause after media change");
    await page.getByRole("button", { name: "Acknowledge", exact: true }).press("Enter");
    if (!(await page.getByRole("button", { name: "Acknowledged", exact: true }).isDisabled()))
      throw new Error("Acknowledgement did not persist");
    await page.getByRole("button", { name: /^Open C01 Ethan Brooks/ }).press("Enter");
    await page.getByRole("tab", { name: "Event review", exact: true }).click();
    await page
      .getByRole("tabpanel", { name: "Event review", exact: true })
      .getByText("Lead II selected", { exact: true })
      .waitFor();
    await page.getByRole("tab", { name: "Trends", exact: true }).click();
    await page.getByRole("button", { name: "Print", exact: true }).focus();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error("Page-wide overflow");
    return [
      "Real clock advances across second boundary",
      "Reduced-motion trace stable",
      "Normal-motion trace updates; runtime reduction pauses it",
      "Keyboard acknowledgement persists; patient selection and event/trend tabs work",
      "Footer keyboard focus and no page-wide overflow",
    ];
  }
  if (route === "/dashboard/infrastructure") {
    const group = page.getByRole("button", { name: "Weblabs Studio (Admin Console)", exact: true });
    await group.press("Enter");
    if ((await group.getAttribute("aria-expanded")) !== "false") throw new Error("Project did not collapse");
    await group.press("Enter");
    await page.getByRole("button", { name: "Project actions for Admin Console", exact: true }).press("Enter");
    await page.getByRole("menuitem", { name: "Activity Logs", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Environment actions for workspace.example.com/dashboard", exact: true })
      .press("Enter");
    await page.getByRole("menuitem", { name: "View Logs", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("textbox", { name: "Search environments", exact: true }).fill("demo");
    if ((await page.locator("tbody tr").count()) !== 4) throw new Error("Fixture rows changed");
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error("Page-wide overflow");
    await page.getByRole("button", { name: "Project actions for Inbox", exact: true }).press("Enter");
    await page
      .getByRole("menu", { name: "Project actions for Inbox", exact: true })
      .getByRole("menuitem", { name: "Project Settings", exact: true })
      .waitFor();
    return [
      "Enter collapses/reopens project",
      "Named project/environment action menus open; Escape closes",
      "All four fixture rows and empty project retained",
      "Search remains a demo input; no page-wide overflow",
      "Empty-project menu open",
    ];
  }
  if (route === "/dashboard/logistics") {
    const shipment = page.getByRole("button", { name: /^Select shipment #SDA-02-2402/ });
    await shipment.focus();
    await shipment.press("Enter");
    const mobile = (page.viewportSize()?.width ?? 1440) < 1024;
    const region = mobile
      ? page.getByRole("dialog", { name: "Shipment SDA-02-2402", exact: true })
      : page.locator("main");
    await region.getByRole("heading", { name: "#SDA-02-2402", exact: true }).waitFor();
    await region.getByRole("tab", { name: "Route", exact: true }).click();
    await region.getByText("Route view coming soon.", { exact: true }).waitFor();
    await region.getByRole("tab", { name: "Overview", exact: true }).click();
    if (mobile) {
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page.waitForFunction(() => document.activeElement?.textContent?.startsWith("Select shipment #SDA-02-2402"));
      await shipment.press("Enter");
      await region.waitFor();
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error("Page-wide overflow");
    return [
      "Enter selects second shipment and correct details",
      "Route placeholder and Overview tabs preserved",
      mobile ? "Mobile sheet named; Escape closes and returns focus; Enter reopens" : "Desktop split pane updated",
      "No page-wide overflow",
    ];
  }
  if (route === "/dashboard/academy") {
    const student = page.getByRole("button", { name: "Olivia Davis", exact: true });
    await page.keyboard.press("Tab");
    await student.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await page.locator('[data-slot="tooltip-content"]').filter({ hasText: "Top Performer" }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Gradebook", exact: true }).press("Enter");
    await page.getByText("Modern European History", { exact: true }).waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error("Page-wide overflow");
    await page.keyboard.press("Tab");
    await student.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await page.locator('[data-slot="tooltip-content"]').filter({ hasText: "Top Performer" }).waitFor();
    return [
      "Student achievement tooltip opens by keyboard focus",
      "Escape dismisses tooltip",
      "Gradebook demo action retains screen",
      "Full course name and no page overflow",
    ];
  }
  if (route === "/dashboard/ecommerce") {
    await page.getByRole("combobox", { name: "Store period" }).click();
    await page.getByRole("option", { name: "Last Month", exact: true }).click();
    await page.getByRole("combobox", { name: "Sales channel" }).click();
    await page.getByRole("option", { name: "Online Store", exact: true }).click();
    await page.getByRole("button", { name: "Returns", exact: true }).click();
    if ((await page.locator("tbody tr").count()) === 0) throw new Error("Returns filter removed all rows");
    await page.getByRole("checkbox", { name: "Select all orders", exact: true }).press("Space");
    await page.getByText(/orders selected/).waitFor();
    await page.getByRole("button", { name: "Sort orders by date" }).press("Enter");
    await page.getByRole("button", { name: "Open order actions" }).first().click();
    await page.getByRole("menuitem", { name: "View order", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error("Page-wide overflow");
    return [
      "Last Month / Online Store selected",
      "Returns filter, Space selects orders, Enter sorts dates",
      "Order menu opens, Escape closes",
      "No page-wide overflow",
    ];
  }
  if (route === "/dashboard/productivity") {
    const task = page.getByRole("checkbox", { name: "Finalize Q2 roadmap" });
    await task.focus();
    await task.press("Space");
    if ((await task.getAttribute("aria-checked")) !== "true") throw new Error("Keyboard task completion failed.");
    await page.getByRole("combobox", { name: "Task period" }).click();
    await page.getByRole("option", { name: "Tomorrow", exact: true }).click();
    await page.getByRole("combobox", { name: "Task period" }).getByText("Tomorrow", { exact: true }).waitFor();
    await page.getByRole("combobox", { name: "Project status" }).click();
    await page.getByRole("option", { name: "Planning", exact: true }).click();
    await page.getByRole("combobox", { name: "Project status" }).getByText("Planning", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Go to the Next Month", exact: true }).press("Enter");
    const day = page.getByRole("button", { name: "Wednesday, 4 November 2026", exact: true });
    await day.click();
    await page.getByRole("button", { name: "Wednesday, 4 November 2026, selected", exact: true }).press("ArrowRight");
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("aria-label") === "Thursday, 5 November 2026",
      undefined,
      { timeout: 3000 },
    );
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Thursday, 5 November 2026, selected", exact: true }).waitFor();
    await page.getByRole("button", { name: "Start focus session" }).press("Enter");
    await page.getByText("90:00", { exact: true }).waitFor();
    await page.getByRole("combobox", { name: "Task period" }).press("Enter");
    await page.getByRole("option", { name: "Tomorrow", exact: true }).waitFor();
    return [
      "Space completes first task",
      "Tomorrow / Planning selected",
      "Enter navigates to November; ArrowRight + Enter selects November 5",
      "Focus Start retains existing 90:00 placeholder; Task period menu open",
    ];
  }
  if (route === "/dashboard/analytics") {
    await page.getByRole("combobox", { name: "Analytics period" }).click();
    await page.getByRole("option", { name: "Last 7 days", exact: true }).click();
    await page.getByRole("combobox", { name: "Analytics period" }).getByText("Last 7 days", { exact: true }).waitFor();
    await page.getByRole("tab", { name: "Campaigns", exact: true }).click();
    for (const source of ["Spring Launch", "Newsletter", "Retargeting", "Brand Search", "Partners"])
      await page.locator("svg").getByText(source, { exact: true }).waitFor();
    return [
      "Last 7 days selected",
      "Campaigns displays Spring Launch / Newsletter / Retargeting / Brand Search / Partners",
    ];
  }
  throw new Error(`No interaction scenario for ${route}. Use an explicit supported --routes subset.`);
}

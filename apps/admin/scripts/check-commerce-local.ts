import { chromium } from "playwright";

import { captureProducts } from "./screenshot-products.ts";
import assert from "node:assert/strict";

const browser = await chromium.launch();
try {
  for (const baseURL of process.argv.slice(2)) {
    const page = await browser.newPage({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseURL}/dashboard/products`);
    await page.waitForLoadState("networkidle");
    await captureProducts(page, async () => undefined);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Organic Cotton Crew Tee", exact: true }).waitFor();
    assert.equal(
      await page.getByText("Demo catalog item with a long name for narrow table layouts", { exact: true }).count(),
      0,
    );
    assert.equal(await page.getByText("Organic Cotton Crew Tee (copy)", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Organic Cotton Crew Tee", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit product", exact: true });
    await editor.getByRole("textbox", { name: "Product name", exact: true }).fill("QA original edited");
    await editor.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByRole("button", { name: "QA original edited", exact: true }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: "Organic Cotton Crew Tee", exact: true }).waitFor();
    assert.equal(await page.getByText("QA original edited", { exact: true }).count(), 0);
    await page.goto(`${baseURL}/dashboard/invoice`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("textbox", { name: "Reference Number", exact: true }).fill("QA-LOCAL-ONLY");
    await page.reload();
    await page.waitForLoadState("networkidle");
    assert.equal(await page.getByRole("textbox", { name: "Reference Number", exact: true }).inputValue(), "FL-0425");
    await page.locator("[data-invoice-total]").getByText("$6,003.20", { exact: true }).waitFor();
    console.log(`PASS ${baseURL}: duplicate, edited copy, edited original and invoice changes reset after reload`);
    await page.close();
  }
} finally {
  await browser.close();
}

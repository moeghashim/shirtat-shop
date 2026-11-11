import type { Page } from "playwright";

export async function captureProducts(page: Page, capture: (name: string) => Promise<void>): Promise<string[]> {
  const search = page.getByRole("textbox", { name: "Search products", exact: true });
  const table = page.getByRole("table", { name: "Products", exact: true });
  await search.fill("Clothing");
  await page.getByRole("combobox", { name: "Filter product status", exact: true }).press("Enter");
  await page.getByRole("option", { name: "Draft", exact: true }).press("Enter");
  await table.getByRole("button", { name: "Merino Wool Cardigan", exact: true }).waitFor();
  if ((await table.locator("tbody tr").count()) !== 1) throw new Error("Product search/status count");
  await page.getByRole("checkbox", { name: "Select all products on this page", exact: true }).check();
  await page.getByText(/1 selected/).waitFor();
  await capture("filtered-selected");
  await search.fill("no-such-product");
  await page.getByText("No products found", { exact: true }).waitFor();
  await capture("empty");
  await page.getByRole("button", { name: "Clear filters", exact: true }).first().press("Enter");
  await page.getByRole("combobox", { name: "Filter product category", exact: true }).press("Enter");
  await page.getByRole("option", { name: "Footwear", exact: true }).press("Enter");
  if ((await table.locator("tbody tr").count()) !== 4) throw new Error("Product category count");
  await page.getByRole("button", { name: "Clear filters", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Next page", exact: true }).press("Enter");
  await page.getByText(/11 – 20 of 24 products/).waitFor();
  await page.getByRole("button", { name: "Previous page", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Actions for Organic Cotton Crew Tee", exact: true }).press("Enter");
  await page.getByRole("menuitem", { name: "Duplicate", exact: true }).press("Enter");
  const copy = table.getByRole("row").filter({ hasText: "Organic Cotton Crew Tee (copy)" });
  await copy.getByText("Draft", { exact: true }).waitFor();
  await copy.getByRole("button", { name: "Organic Cotton Crew Tee (copy)", exact: true }).press("Enter");
  const editor = page.getByRole("dialog", { name: "Edit product", exact: true });
  await editor.getByRole("textbox", { name: "SKU", exact: true }).fill("CL-TEE-101");
  await editor.getByRole("button", { name: "Save changes", exact: true }).press("Enter");
  await editor.getByText("This SKU is already in use. Enter a unique SKU.", { exact: true }).waitFor();
  await capture("edit-validation");
  await editor.getByRole("textbox", { name: "SKU", exact: true }).fill("DEMO-009");
  await editor
    .getByRole("textbox", { name: "Product name", exact: true })
    .fill("Demo catalog item with a long name for narrow table layouts");
  await editor.getByRole("spinbutton", { name: "Price (USD)", exact: true }).fill("0");
  await editor.getByRole("spinbutton", { name: "Stock quantity", exact: true }).fill("0");
  await editor.getByRole("button", { name: "Save changes", exact: true }).press("Enter");
  await editor.waitFor({ state: "hidden" });
  const saved = table.getByRole("button", {
    name: "Demo catalog item with a long name for narrow table layouts",
    exact: true,
  });
  await saved.press("Enter");
  await editor.waitFor();
  await page.keyboard.press("Escape");
  await editor.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.textContent?.includes("Demo catalog item with a long name"));
  await capture("edited");
  await page.getByRole("button", { name: "Add product", exact: true }).press("Enter");
  const drawer = page.getByRole("dialog", { name: "Add product", exact: true });
  await drawer.getByRole("button", { name: "Validate product", exact: true }).press("Enter");
  await drawer.getByText("Enter a product name.", { exact: true }).waitFor();
  await capture("add-errors");
  await drawer.getByRole("textbox", { name: "Product name", exact: true }).fill("Demo item");
  await drawer.getByRole("textbox", { name: "Description", exact: true }).fill("A local validation example.");
  await drawer.getByRole("textbox", { name: "SKU", exact: true }).fill("DEMO-NEW");
  await drawer.getByRole("spinbutton", { name: "Price (USD)", exact: true }).fill("1000000");
  await drawer.getByRole("spinbutton", { name: "Stock quantity", exact: true }).fill("1000000");
  await drawer.locator('input[type="file"]').setInputFiles({
    name: "demo-image-with-a-long-readable-name.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await drawer.getByRole("img", { name: "demo-image-with-a-long-readable-name.png", exact: true }).waitFor();
  await capture("add-image");
  await drawer.getByRole("button", { name: "Clear images", exact: true }).press("Enter");
  await drawer.getByRole("button", { name: "Validate product", exact: true }).press("Enter");
  await drawer.getByText("Product details are valid.", { exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await drawer.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.textContent?.includes("Add product"));
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error("Products document overflow");
  return [
    "Search/status/category exact results; empty/clear, selection and pagination",
    "Duplicate to draft and edit unique-SKU validation; zero price/stock saved",
    "Edit Escape returns focus to product",
    "Add validation-only at upper bounds; image preview/clear, Escape and focus return",
    "Long name wraps; table scrolls locally without document overflow",
  ];
}

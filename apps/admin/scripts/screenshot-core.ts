import type { Page } from "playwright";

export async function captureCore(page: Page, route: string, capture: (name: string) => Promise<void>) {
  if (route === "/dashboard/default") {
    const search = page.getByPlaceholder("Search customers...");
    await search.fill("no-matching-customer");
    await page.getByText("No results.", { exact: true }).waitFor();
    await capture("customers-empty");
    await search.fill("");
    await page.getByRole("combobox").filter({ hasText: "All segments" }).click();
    await page.getByRole("option", { name: "Paid", exact: true }).click();
    return ["Customer search empty/reset; segment selector remains local"];
  }
  if (route === "/dashboard/crm") {
    const search = page.getByRole("textbox", { name: "Search deals" });
    await search.fill("no-matching-deal");
    await page.getByText("No results.", { exact: true }).waitFor();
    await capture("opportunities-empty");
    await search.fill("");
    await page.getByRole("button", { name: "Stage", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Proposal Sent", exact: true }).click();
    await capture("opportunities-proposal");
    return ["Opportunity search empty/reset; Proposal stage filter"];
  }
  throw new Error(`Unknown core route ${route}`);
}

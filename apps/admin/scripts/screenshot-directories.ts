import type { Page } from "playwright";

export async function captureDirectories(
  page: Page,
  route: string,
  capture: (name: string) => Promise<void>,
): Promise<string[]> {
  const users = route === "/dashboard/users";
  const domain = users ? "users" : "roles";
  const table = page.getByRole("table", { name: users ? "Users" : "Roles", exact: true });
  const search = page.getByRole("textbox", { name: users ? "Search users" : "Search roles", exact: true });
  const filter = async (field: string, value: string) => {
    await page.getByRole("combobox", { name: `Filter ${domain} by ${field}`, exact: true }).press("Enter");
    await page.getByRole("option", { name: value, exact: true }).press("Enter");
    await page.getByRole("listbox").waitFor({ state: "hidden" });
  };
  if (users) {
    await search.fill("Olivia");
    await filter("role", "Workspace Owner");
    await filter("team", "Platform");
    await filter("status", "Active");
    await filter("workspace", "Weblabs Studio");
    if ((await table.locator("tbody tr").count()) !== 1) throw new Error("Users combined filter count");
    await page.getByRole("checkbox", { name: "Select Olivia Rhye", exact: true }).check();
    await page.getByText("1 selected", { exact: true }).waitFor();
    await capture("selected");
    await page.getByRole("button", { name: "Open actions for Olivia Rhye", exact: true }).press("Enter");
    await page.getByRole("menuitem", { name: "View profile", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("aria-label") === "Open actions for Olivia Rhye",
    );
    await search.fill("no-such-person");
    await page.getByText("No users found. Try another search or adjust your filters.", { exact: true }).waitFor();
    await capture("empty");
    await search.fill("");
    for (const field of ["role", "team", "status", "workspace"]) await filter(field, "All");
    await page.getByRole("button", { name: "Go to next page", exact: true }).press("Enter");
    await page.getByText(/Page 2 of/).waitFor();
    await page.getByRole("combobox", { name: "Rows per page", exact: true }).press("Enter");
    await page.getByRole("option", { name: "50", exact: true }).press("Enter");
    await page.getByText("Page 1 of 1", { exact: true }).waitFor();
  } else {
    await filter("type", "System");
    await filter("owner", "System");
    await filter("status", "Active");
    await page.getByText("Showing 1 to 4 of 4 roles", { exact: true }).waitFor();
    await search.fill("Support");
    await page.getByText("Showing 1 to 1 of 1 roles", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Actions for Support", exact: true }).press("Enter");
    const edit = page.getByRole("menuitem", { name: "Edit role", exact: true });
    if ((await edit.getAttribute("aria-disabled")) !== "true")
      throw new Error("System role edit should remain disabled");
    await capture("system-actions");
    await page.keyboard.press("Escape");
    await search.fill("no-such-role");
    await page.getByText("No roles found. Try another search or adjust your filters.", { exact: true }).waitFor();
    await capture("empty");
    await search.fill("");
    await filter("type", "All");
    await filter("owner", "Jane Doe");
    await filter("status", "Needs review");
    await page.getByText("Showing 1 to 2 of 2 roles", { exact: true }).waitFor();
    await capture("filtered");
    for (const [tab, text] of [
      ["Permission sets", "Permission Sets Coming Soon"],
      ["Access reviews", "Access Reviews Coming Soon"],
    ]) {
      await page.getByRole("tab", { name: tab, exact: true }).press("Enter");
      await page.getByText(text, { exact: true }).waitFor();
      await capture(tab.toLowerCase().replaceAll(" ", "-"));
    }
    await page.getByRole("tab", { name: "Roles", exact: true }).press("Enter");
  }
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error(`${domain} document overflow`);
  await page.locator('[data-slot="table-container"]').evaluate((node) => {
    node.scrollLeft = node.scrollWidth;
  });
  await capture("table-end");
  return [
    users
      ? "Combined role/team/status/workspace/search exact result; selection, page size and pagination"
      : "System/owner/status/search exact counts; system actions remain disabled; all three tabs",
    "Empty recovery, named keyboard menus and local table scroll; no document overflow",
    "Existing admin actions remain placeholders; no permission/auth mutations",
  ];
}

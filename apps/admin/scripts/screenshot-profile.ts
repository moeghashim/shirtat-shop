import type { Page } from "playwright";

export async function captureProfile(page: Page, capture: (name: string) => Promise<void>): Promise<string[]> {
  await page.getByRole("heading", { level: 1, name: "Jordan Lee", exact: true }).waitFor();
  if ((await page.locator('a[href="mailto:jordan.lee@workspace.example.com"]').count()) !== 1)
    throw new Error("Profile email identity");
  await page.getByRole("button", { name: "More profile actions", exact: true }).press("Enter");
  await page.getByRole("menuitem", { name: "View as employee", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "More profile actions");
  for (const [tab, heading] of [
    ["Overview", "About"],
    ["Personal", "Personal information"],
    ["Employment", "Role and organization"],
    ["Compensation", "Restricted information"],
    ["Time off", "Leave balance"],
    ["Documents", "Documents"],
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).press("Enter");
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    if (tab === "Personal") {
      await page.getByText("jordan.lee@example.com", { exact: true }).waitFor();
      await page.getByText("Casey Lee · Sibling", { exact: true }).waitFor();
    }
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error(`Profile ${tab} overflow`);
    await capture(tab.toLowerCase().replaceAll(" ", "-"));
  }
  await page.getByRole("button", { name: "Download Contractor agreement", exact: true }).press("Enter");
  await page.getByText("Restricted", { exact: true }).waitFor();
  await page.locator('[data-slot="table-container"]').evaluate((node) => {
    node.scrollLeft = node.scrollWidth;
  });
  await capture("document-actions");
  await page.getByRole("tab", { name: "Overview", exact: true }).press("Enter");
  if (/arham|arhamkhnz/i.test((await page.locator("body").textContent()) ?? ""))
    throw new Error("Profile upstream identity");
  return [
    "All six tabs keyboard reachable and captured; no page overflow",
    "Neutral name, emails, initials and updater; coherent emergency contact",
    "Header menu Escape restores focus; mail link matches demo identity",
    "Document metadata/actions scroll locally; restricted state is explicitly demo-only",
  ];
}

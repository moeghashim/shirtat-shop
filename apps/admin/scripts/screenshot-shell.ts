import type { Page } from "playwright";

// Capture both desktop navigation states, or the open/closed mobile sheet.
// Keep this usable before a shell change as well as after it.
export async function captureSidebarStates(page: Page, capture: (state: string) => Promise<void>): Promise<string[]> {
  const mobile = (page.viewportSize()?.width ?? 1440) < 768;
  const headerToggle = page.locator("header").getByRole("button", { name: "Toggle Sidebar", exact: true });
  if (mobile) await headerToggle.press("Enter");
  const sidebar = page.locator(mobile ? '[data-mobile="true"]' : '[data-slot="sidebar-inner"]');
  await sidebar.waitFor();
  await capture("expanded");
  await sidebar.getByRole("button", { name: "Toggle Sidebar", exact: true }).press("Enter");
  if (mobile) await sidebar.waitFor({ state: "hidden" });
  else await page.locator('[data-slot="sidebar"][data-state="collapsed"]').waitFor();
  await capture("collapsed");
  if (!mobile) await sidebar.getByRole("button", { name: "Toggle Sidebar", exact: true }).press("Enter");
  return ["Captured expanded/collapsed desktop navigation or open/closed mobile sheet"];
}

export async function captureShell(page: Page, capture: (name: string) => Promise<void>): Promise<string[]> {
  const mobile = (page.viewportSize()?.width ?? 1440) < 768;
  const theme = await page.locator("html").getAttribute("class");
  if (mobile) await page.locator("header").getByRole("button", { name: "Toggle Sidebar", exact: true }).press("Enter");
  const sidebar = page.locator(mobile ? '[data-mobile="true"]' : '[data-slot="sidebar-inner"]');
  await sidebar.waitFor();
  const home = sidebar.getByRole("link", { name: "Home", exact: true });
  await home.focus();
  const focus = await home.evaluate((el) => {
    const s = getComputedStyle(el);
    return el.matches(":focus-visible") && s.outlineStyle !== "none" && Number.parseFloat(s.outlineWidth) >= 2;
  });
  if (!focus) throw new Error("Shell visible focus missing");
  const section = sidebar.getByRole("button", { name: "Pages", exact: true });
  await section.press("Enter");
  if ((await section.getAttribute("aria-expanded")) !== "true") throw new Error("Sidebar expansion failed");
  await section.press("Enter");
  const unlabeled = await sidebar
    .locator("button,a")
    .evaluateAll(
      (nodes) =>
        nodes.filter(
          (el) =>
            el.getClientRects().length &&
            !(el.textContent?.trim() || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")),
        ).length,
    );
  if (unlabeled) throw new Error("Unlabeled sidebar controls");
  await sidebar.getByRole("link", { name: "Products", exact: true }).waitFor({ state: "hidden" });
  await sidebar.locator('[data-slot="sidebar-content"]').evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await capture("shell-sidebar");
  const search = sidebar.getByRole("button", { name: "Search pages (Command or Control K)" });
  await search.press("Enter");
  const palette = page.getByRole("dialog", { name: "Go to a page" });
  await palette.waitFor();
  const input = page.getByRole("combobox", { name: "Search pages" });
  await input.fill("finance");
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(
    () => {
      const input = document.querySelector('[role="combobox"][aria-label="Search pages"]');
      const id = input?.getAttribute("aria-activedescendant");
      return !!id && document.getElementById(id)?.getAttribute("aria-selected") === "true";
    },
    undefined,
    { timeout: 3000 },
  );
  await capture("shell-palette");
  await page.keyboard.press("Escape");
  await palette.waitFor({ state: "hidden" });
  await page.waitForFunction((el) => el === document.activeElement, await search.elementHandle(), { timeout: 3000 });
  const settings = sidebar.getByRole("button", { name: "Layout settings" });
  await settings.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Make it your workspace" });
  await dialog.waitFor();
  const radio = dialog.getByRole("radio", { name: theme?.includes("dark") ? "Dark" : "Light", exact: true });
  await radio.focus();
  await page.keyboard.press("ArrowRight");
  const active = await page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement;
    const label = el.closest("label");
    return (
      el.tagName === "INPUT" &&
      el.checked &&
      el.matches(":focus-visible") &&
      !!label &&
      Number.parseFloat(getComputedStyle(label).outlineWidth) >= 2
    );
  });
  if (!active) throw new Error("Settings radio focus/selection");
  await page.keyboard.press("Tab");
  if (!(await dialog.getByLabel("Color preset", { exact: true }).evaluate((el) => el === document.activeElement)))
    throw new Error("Settings preset keyboard access");
  await page.keyboard.press("Tab");
  if (!(await dialog.getByLabel("Font", { exact: true }).evaluate((el) => el === document.activeElement)))
    throw new Error("Settings font keyboard access");
  for (let n = 0; n < 14; n++) {
    await page.keyboard.press("Tab");
    await page.waitForFunction((el) => el?.contains(document.activeElement), await dialog.elementHandle(), {
      timeout: 3000,
    });
  }
  const motion = await dialog.evaluate((el) =>
    Math.max(
      ...[el, ...el.querySelectorAll("*")].flatMap((node) =>
        getComputedStyle(node).transitionDuration.split(",").map(Number.parseFloat),
      ),
    ),
  );
  if (motion > 0.001) throw new Error(`Reduced motion duration ${motion}`);
  await capture("shell-settings");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction((el) => el === document.activeElement, await settings.elementHandle(), { timeout: 3000 });
  if (mobile) await page.keyboard.press("Escape");
  const preferences = await page.evaluate(() => ({
    theme: document.documentElement.classList.contains("dark"),
    preset: document.documentElement.dataset.themePreset,
    font: document.documentElement.dataset.font,
  }));
  await page.reload({ waitUntil: "networkidle" });
  const restored = await page.evaluate(() => ({
    theme: document.documentElement.classList.contains("dark"),
    preset: document.documentElement.dataset.themePreset,
    font: document.documentElement.dataset.font,
  }));
  if (JSON.stringify(preferences) !== JSON.stringify(restored))
    throw new Error("Preferences did not persist after refresh");
  return [
    "Sidebar expansion/names/visible 2px focus; palette arrows/Escape/focus return",
    "Settings native radio/select keyboard access, focus trap/return; reduced motion <=1ms",
    "Theme/preset/font state persists after refresh",
  ];
}

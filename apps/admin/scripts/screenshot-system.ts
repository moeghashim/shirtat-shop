import type { Page } from "playwright";

// This module is imported only by the QA CLI. No fault switch is bundled into the app.
export async function captureSystem(
  page: Page,
  route: string,
  capture: (name: string) => Promise<void>,
): Promise<string[]> {
  if (route === "/") {
    const response = await page.request.get(new URL("/", page.url()).href, { maxRedirects: 0 });
    if (response.status() !== 200 || !(await response.text()).includes("An agent-ready foundation"))
      throw new Error("Homepage must return HTTP 200 with server-rendered content");
    await page.getByRole("heading", { name: "An agent-ready foundation for your next dashboard." }).waitFor();
    if (new URL(page.url()).pathname !== "/") throw new Error("Homepage unexpectedly redirected");
    await page.getByRole("link", { name: "Open live demo", exact: true }).first().press("Enter");
    await page.waitForURL("**/dashboard/default");
    await page.getByText("Total Revenue", { exact: true }).first().waitFor();
    return ["Homepage returns HTTP 200 with SSR content", "Keyboard demo link opens Default"];
  }
  if (["/dashboard", "/dashboard/"].includes(route)) {
    let target = new URL(route, page.url());
    const hops = route === "/dashboard/" ? ["/dashboard", "/dashboard/default"] : ["/dashboard/default"];
    for (const expected of hops) {
      const response = await page.request.get(target.href, { maxRedirects: 0 });
      const location = response.headers().location;
      if (response.status() !== 307 || !location || new URL(location, target).pathname !== expected)
        throw new Error(`Unexpected redirect for ${target.pathname}: ${response.status()} ${location}`);
      target = new URL(location, target);
    }
    await page.waitForURL("**/dashboard/default");
    await page.getByText("Total Revenue", { exact: true }).first().waitFor();
    return [
      "HTTP 307 preserves the Default destination",
      "Redirect target hydrates and displays loaded dashboard data",
    ];
  }
  if (route === "qa:root-error") {
    await page.evaluate(() => {
      const win = window as unknown as {
        __TSR_ROUTER__: { routesById: Record<string, { options: { component: unknown } }>; invalidate: () => void };
        __QA_ROOT__?: { route: { options: { component: unknown } }; component: unknown };
      };
      const router = win.__TSR_ROUTER__;
      const target = router.routesById["/(main)/dashboard/default"];
      win.__QA_ROOT__ = { route: target, component: target.options.component };
      target.options.component = () => {
        throw new Error("QA_ONLY_ROOT_ERROR");
      };
      router.invalidate();
    });
    await page.getByRole("heading", { name: "Something went wrong.", exact: true }).waitFor();
    // Base UI renders this anchor with role=button; keep its existing semantics.
    const recoveryLink = page.getByRole("button", { name: "Go to dashboard", exact: true });
    if ((await recoveryLink.getAttribute("href")) !== "/dashboard/default")
      throw new Error("Root error recovery must open Default");
    if (
      !["localhost", "127.0.0.1", "[::1]"].includes(new URL(page.url()).hostname) &&
      (await page.locator("main").textContent())?.includes("QA_ONLY_ROOT_ERROR")
    )
      throw new Error("Production leaked error detail");
    await capture("boundary");
    await recoveryLink.focus();
    if (!(await recoveryLink.evaluate((link) => link === document.activeElement)))
      throw new Error("Root error recovery link did not receive keyboard focus");
    await page.evaluate(() => {
      const win = window as unknown as {
        __QA_ROOT__?: { route: { options: { component: unknown } }; component: unknown };
      };
      const saved = win.__QA_ROOT__;
      if (!saved) throw new Error("QA fault state missing");
      saved.route.options.component = saved.component;
      delete win.__QA_ROOT__;
    });
    const retry = page.getByRole("button", { name: "Try again", exact: true });
    await retry.focus();
    if (!(await retry.evaluate((button) => button === document.activeElement)))
      throw new Error("Root recovery button did not receive keyboard focus");
    // Reset synchronously unmounts this button. Send the key through the page so
    // locator retries cannot mistake successful recovery for a detached target.
    await page.keyboard.press("Enter");
    await page.getByText("Total Revenue", { exact: true }).first().waitFor();
    await capture("recovered");
    return [
      "Actual root boundary caught an ephemeral QA component fault; keyboard Try again restored dashboard",
      "Expected QA exception isolated; production error text is generic; no app error trigger",
    ];
  }
  const heading = page.getByRole("heading", { level: 1 }).first();
  await heading.waitFor();
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error("System page overflow");
  await capture("state");
  const recovery = page
    .locator("a")
    .filter({ hasText: /^(Go to dashboard|Return to dashboard)$/ })
    .first();
  if (["qa:root-not-found", "/unauthorized", "/dashboard/$"].includes(route) && (await recovery.count()) !== 1)
    throw new Error("Expected a dashboard recovery link");
  if (await recovery.count()) {
    await recovery.press("Enter");
    await page.waitForURL("**/dashboard/default");
    await page.getByText("Total Revenue", { exact: true }).first().waitFor();
  }
  return ["Distinct system heading and no page overflow", "Existing recovery link navigates by keyboard when provided"];
}

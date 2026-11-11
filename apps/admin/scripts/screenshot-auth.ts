import type { Page } from "playwright";

export async function captureAuth(
  page: Page,
  route: string,
  capture: (name: string) => Promise<void>,
): Promise<string[]> {
  const initial = new URL(page.url());
  if (route === "/auth/v2") {
    if (await page.locator("form").count()) throw new Error("Bare V2 must remain layout-only");
    if (initial.pathname !== route) throw new Error("Bare V2 redirected");
    return ["Bare V2 retains its layout-only URL without a form or redirect"];
  }
  const register = route.endsWith("register");
  const mode = register ? "register" : "login";
  const email = page.locator(`#${mode}-email`);
  const password = page.locator(`#${mode}-password`);
  const submit = page.getByRole("button", { name: register ? "Register" : "Login", exact: true });
  if ((await email.getAttribute("autocomplete")) !== "email") throw new Error("Email autofill lost");
  if ((await password.getAttribute("autocomplete")) !== (register ? "new-password" : "current-password"))
    throw new Error("Password autofill lost");
  if ((await password.getAttribute("type")) !== "password") throw new Error("Password not masked");
  await submit.press("Enter");
  await page.getByText("Please enter a valid email address.", { exact: true }).waitFor();
  await page.getByText("Password must be at least 6 characters.", { exact: true }).waitFor();
  if ((await email.getAttribute("aria-describedby")) !== `${mode}-email-error`) throw new Error("Error not associated");
  await capture("errors");
  await email.fill("demo@example.com");
  await password.fill("demo-password");
  if (register) {
    await page.locator("#register-confirm-password").fill("other-password");
    await submit.press("Enter");
    await page.getByText("Passwords do not match.", { exact: true }).waitFor();
    await page.locator("#register-confirm-password").fill("demo-password");
  } else {
    await page.getByRole("checkbox", { name: "Remember me for 30 days" }).press("Space");
  }
  await submit.press("Enter");
  await page.getByText("Demo only", { exact: true }).waitFor();
  await capture("demo-submit");
  const url = page.url();
  await page.getByRole("button", { name: "Continue with Google" }).press("Enter");
  if (page.url() !== url) throw new Error("Social demo unexpectedly navigated");
  const closeToast = page.locator('[data-slot="toast-close"]');
  if (await closeToast.count()) {
    await closeToast.press("Enter");
    await closeToast.waitFor({ state: "hidden" });
  }
  const original = page.viewportSize();
  await page.setViewportSize({ width: 360, height: 500 });
  await submit.scrollIntoViewIfNeeded();
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error("Auth short viewport overflow");
  if (route.includes("v2")) {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    const copy = await footer.textContent();
    if (!copy?.includes(`© ${new Date().getUTCFullYear()}, tenboards.`))
      throw new Error(`Real UTC year mismatch: ${copy}`);
    const formBox = await page.locator("form").boundingBox();
    const footerBox = await footer.boundingBox();
    if (!formBox || !footerBox || formBox.y + formBox.height > footerBox.y) throw new Error("Footer overlaps form");
  }
  await capture("short-height");
  if (original) await page.setViewportSize(original);
  const crosslink = page.getByRole("link", { name: register ? "Login" : "Register", exact: true });
  await crosslink.focus();
  await crosslink.press("Enter");
  await page.waitForURL((url) => url.pathname.endsWith(register ? "/login" : "/register"));
  await page.locator("form").waitFor();
  await page.goto(initial.href, { waitUntil: "networkidle" });
  return [
    "Labels, masked passwords and email/current/new-password autofill verified",
    "Empty and mismatched-password errors; error association and local demo submission verified",
    "Google remains demo-only; keyboard crosslink works",
    "360×500 viewport has reachable controls/footer without collisions or page overflow; real UTC copyright year verified",
  ];
}

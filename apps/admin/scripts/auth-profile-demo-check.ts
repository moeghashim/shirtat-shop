import { chromium } from "playwright";

import { startTestServer, testHeaders } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import assert from "node:assert/strict";

const server = await startTestServer();
const browser = await chromium.launch();
let cases = 0;
try {
  const context = await browser.newContext({ extraHTTPHeaders: testHeaders });
  await cacheCaptureFonts(context);
  const page = await context.newPage();
  let authRequests = 0;
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/auth/")) authRequests++;
    if (url.pathname.startsWith("/_serverFn/")) {
      const name = JSON.parse(Buffer.from(url.pathname.split("/").at(-1) ?? "", "base64url").toString()).export;
      if (/getAccountDetails|revokeAccountSession/.test(name)) authRequests++;
    }
  });
  for (const tab of [
    "account",
    "unknown",
    "overview",
    "personal",
    "employment",
    "compensation",
    "time-off",
    "documents",
  ]) {
    await page.goto(`${server.baseURL}/dashboard/profile?tab=${tab}`, { waitUntil: "domcontentloaded" });
    let selected = tab[0].toUpperCase() + tab.slice(1);
    if (tab === "time-off") selected = "Time off";
    if (["account", "unknown"].includes(tab)) selected = "Overview";
    await page.getByRole("tab", { name: selected, exact: true }).waitFor();
    assert.equal(await page.getByRole("tab", { name: selected, exact: true }).getAttribute("aria-selected"), "true");
    assert.equal(await page.getByRole("tab").count(), 6);
    assert.equal(await page.getByRole("heading", { name: "Your sign-in account", exact: true }).count(), 0);
    assert.equal(authRequests, 0);
    cases++;
    console.log(`PASS Demo tab=${tab}: original six tabs, safe selection, no auth endpoint/account RPC`);
  }
  await context.close();
  console.log(`Profile demo: ${cases}/${cases} passing.`);
} finally {
  await browser.close();
  await server.stop();
}

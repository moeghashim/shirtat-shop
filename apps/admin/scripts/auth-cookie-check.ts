import { chromium } from "playwright";

import { callRpc, startTestServer } from "./auth-test-support.ts";
import assert from "node:assert/strict";

const server = await startTestServer();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${server.baseURL}/api/auth/get-session`);
  let cases = 0;
  for (const key of ["better-auth.session_token", "__Secure-better-auth.session_token", "unknown", "__proto__"]) {
    for (const name of ["getValueFromCookieServer", "getPreferenceServer"])
      assert.equal((await callRpc(page, "/src/server/server-actions.ts", name, "GET", key)).ok, false);
    assert.equal(
      (await callRpc(page, "/src/server/server-actions.ts", "setValueToCookieServer", "POST", { key, value: "forged" }))
        .ok,
      false,
    );
    cases += 3;
  }
  for (const data of [
    { key: "theme_mode", value: "invalid" },
    { key: "theme_mode", value: "dark", options: { path: "/api", httpOnly: false } },
  ]) {
    assert.equal(
      (await callRpc(page, "/src/server/server-actions.ts", "setValueToCookieServer", "POST", data)).ok,
      false,
    );
    cases++;
  }
  for (const [key, value] of Object.entries({
    theme_mode: "dark",
    theme_preset: "pine",
    font: "geist",
    sidebar_variant: "sidebar",
    sidebar_collapsible: "icon",
    navbar_style: "sticky",
    content_layout: "centered",
  })) {
    const result = await callRpc(page, "/src/server/server-actions.ts", "setValueToCookieServer", "POST", {
      key,
      value,
    });
    assert.equal(result.ok, true, `${key}: ${result.message}`);
    cases++;
  }
  await page.context().addCookies([{ name: "mail_panel_layout", value: "[40,60]", url: server.baseURL }]);
  assert.equal(
    (await callRpc(page, "/src/server/server-actions.ts", "getValueFromCookieServer", "GET", "mail_panel_layout"))
      .result,
    "[40,60]",
  );
  cases++;
  await page.context().addCookies([{ name: "mail_panel_layout", value: "invalid-json", url: server.baseURL }]);
  assert.equal(
    (await callRpc(page, "/src/server/server-actions.ts", "getValueFromCookieServer", "GET", "mail_panel_layout"))
      .result,
    undefined,
  );
  cases++;
  console.log(`Cookie HTTP boundary: ${cases}/${cases} passing.`);
} finally {
  await browser.close();
  await server.stop();
}

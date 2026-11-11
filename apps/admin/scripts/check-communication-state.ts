import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:3000/chat");
  await page.waitForLoadState("networkidle");
  console.log(
    await page.evaluate(async () => {
      const path = "/scripts/communication-state-probe.tsx";
      const { runCommunicationStateProbe } = await import(path);
      return runCommunicationStateProbe();
    }),
  );
} finally {
  await browser.close();
}

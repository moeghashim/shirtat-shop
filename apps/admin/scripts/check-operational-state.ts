import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:3000/dashboard/logistics");
  await page.waitForLoadState("networkidle");
  console.log(
    await page.evaluate(async () => {
      const path = "/scripts/operational-state-probe.tsx";
      const { runOperationalStateProbe } = await import(path);
      return runOperationalStateProbe();
    }),
  );
} finally {
  await browser.close();
}

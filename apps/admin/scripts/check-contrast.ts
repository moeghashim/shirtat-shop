import { chromium } from "playwright";

import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "base-url": { type: "string", default: "http://127.0.0.1:3000" },
    presets: { type: "string", default: "default" },
  },
});
const browser = await chromium.launch();
let failed = false;
const reports: unknown[] = [];
try {
  const page = await browser.newPage();
  await page.goto(new URL("/dashboard/default", values["base-url"]).href);
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.waitForLoadState("networkidle");
  for (const preset of values.presets.split(",")) {
    for (const mode of ["light", "dark"]) {
      const checks = await page.evaluate(
        ({ preset, mode }) => {
          const root = document.documentElement;
          root.dataset.themePreset = preset;
          root.classList.toggle("dark", mode === "dark");
          const style = getComputedStyle(root);
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Missing color conversion canvas");
          const probe = document.createElement("span");
          document.body.append(probe);
          function color(token: string): number[] {
            probe.style.color = `var(--${token})`;
            if (!style.getPropertyValue(`--${token}`).trim()) throw new Error(`Missing token ${token}`);
            context?.clearRect(0, 0, 1, 1);
            if (context) context.fillStyle = getComputedStyle(probe).color;
            context?.fillRect(0, 0, 1, 1);
            return Array.from(context?.getImageData(0, 0, 1, 1).data ?? []).slice(0, 3);
          }
          function luminance(rgb: number[]): number {
            return rgb
              .map((c) => c / 255)
              .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
              .reduce((sum, c, index) => sum + c * [0.2126, 0.7152, 0.0722][index], 0);
          }
          const checks: Array<{ pair: string; ratio: number; minimum: number; pass: boolean }> = [];
          function compare(fg: string, bg: string, minimum = 4.5, alpha = 1) {
            const foreground = color(fg);
            const background = color(bg);
            const a = luminance(foreground.map((c, index) => c * alpha + background[index] * (1 - alpha)));
            const b = luminance(background);
            const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            checks.push({
              pair: `${fg}/${bg}${alpha !== 1 ? ` at ${alpha}` : ""}`,
              ratio,
              minimum,
              pass: ratio >= minimum,
            });
          }
          for (const surface of ["bg", "surface", "surface-raised"]) {
            for (const text of ["text", "text-muted", "primary", "success", "warning", "danger", "info"]) {
              compare(text, surface);
            }
            compare("ring", surface, 3);
            compare("border-strong", surface, 3);
          }
          compare("primary-foreground", "primary");
          for (const semantic of ["success", "warning", "danger", "info"]) compare(semantic, `${semantic}-surface`);
          // Existing primary buttons use primary/80 on hover; verify the composited fill too.
          for (const surface of ["bg", "surface", "surface-raised"]) {
            const fill = color("primary").map((c, index) => c * 0.8 + color(surface)[index] * 0.2);
            const a = luminance(color("primary-foreground"));
            const b = luminance(fill);
            const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            checks.push({
              pair: `primary-foreground/primary hover on ${surface}`,
              ratio,
              minimum: 4.5,
              pass: ratio >= 4.5,
            });
          }
          probe.remove();
          return checks;
        },
        { preset, mode },
      );
      const failures = checks.filter((check) => !check.pass);
      failed ||= failures.length > 0;
      reports.push({ preset, mode, minimumRatio: Math.min(...checks.map((c) => c.ratio)), checks });
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(reports, null, 2));
if (failed) process.exitCode = 1;

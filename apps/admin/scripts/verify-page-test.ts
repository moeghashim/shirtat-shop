import { chromium } from "playwright";

import { verifyPage } from "./verify-page-core.ts";
import { ensureVerifyServer } from "./verify-page-server.ts";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";

const output = "verify/seeded-inaccessible";
if (process.argv[2] === "--fixture") {
  const browser = await chromium.launch();
  try {
    const report = await verifyPage(browser, new URL(process.argv[3]), { route: "/fixture", path: "/" }, output, {
      requireHydration: false,
    });
    await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } finally {
    await browser.close();
  }
} else {
  await mkdir(output, { recursive: true });
  const html = await readFile("scripts/fixtures/inaccessible.html", "utf8");
  const server = createServer((_request, response) => {
    response.setHeader("content-type", "text/html");
    response.end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`;
    const reused = await ensureVerifyServer(new URL(url));
    assert(reused.reused);
    await reused.stop();
    assert((await fetch(url)).ok, "a reused server must remain running");
    const child = spawn(
      process.execPath,
      ["--experimental-strip-types", "scripts/verify-page-test.ts", "--fixture", url],
      { stdio: "inherit" },
    );
    const code = await new Promise((resolve) => child.once("exit", resolve));
    assert.equal(code, 1, "inaccessible fixture must exit nonzero");
    const report = JSON.parse(await readFile(`${output}/report.json`, "utf8")) as Awaited<
      ReturnType<typeof verifyPage>
    >;
    assert.equal(report.results.length, 4);
    for (const result of report.results) {
      assert(result.violations.some((violation) => violation.id === "button-name"));
      assert(result.violations.some((violation) => violation.id === "label"));
      assert(result.errors.some((error) => error.includes("Seeded hydration failure")));
      assert((await readFile(`${output}/${result.screenshot}`)).length > 0);
    }
    assert(report.tags.includes("wcag22aa"));
    console.log(
      "PASS seeded inaccessible fixture: four screenshots, axe failures, hydration diagnostic, JSON report, exit 1; reused server preserved",
    );
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

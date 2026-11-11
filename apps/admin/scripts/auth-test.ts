import { spawn } from "node:child_process";

const suites = [
  "config",
  "cookie",
  "service",
  "redirect",
  "return",
  "flows",
  "provider",
  "errors",
  "protection",
  "account",
  "profile-demo",
  "security",
];
let scenarios = 0;
for (const suite of suites) {
  console.log(`\n=== Auth suite: ${suite} ===`);
  const child = spawn(process.execPath, ["--experimental-strip-types", `scripts/auth-${suite}-check.ts`], {
    stdio: ["ignore", "pipe", "inherit"],
    env: { ...process.env, AUTH_EVIDENCE_ROOT: process.env.AUTH_EVIDENCE_ROOT ?? "screenshots/v05-005/auth" },
  });
  let output = "";
  child.stdout.on("data", (chunk: Buffer) => {
    output += chunk.toString();
    process.stdout.write(chunk);
  });
  const status = await new Promise<number | null>((resolve) => child.once("exit", resolve));
  if (status !== 0) {
    console.error(`FAIL auth suite ${suite}: exit ${status}`);
    process.exitCode = 1;
    break;
  }
  const summary = output.match(/(\d+)\/\d+ passing\./);
  scenarios += summary ? Number(summary[1]) : output.split("\n").filter((line) => line.startsWith("PASS ")).length;
}
if (!process.exitCode) console.log(JSON.stringify({ suites: suites.length, scenarios, passing: true }));

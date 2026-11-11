import { applyExceptions, type DesignException, fixes, inspectDesign } from "./design-rules.ts";
import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const file = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) return files(file);
      return /\.(?:[cm]?[jt]sx?|css)$/.test(file) && !/\.(?:gen|generated)\./.test(file) ? [file] : [];
    }),
  );
  return nested.flat().sort();
}
// Exceptions are for inherited code only; new pages and generator output must use tokens or blocks.
const designExceptions: DesignException[] = JSON.parse(
  await readFile(new URL("./design-exceptions.json", import.meta.url), "utf8"),
);
const roots = ["src/routes", "src/components/blocks"];
const inventory = (await Promise.all(roots.map(files))).flat();
const findings = (
  await Promise.all(inventory.map(async (file) => inspectDesign(file, await readFile(file, "utf8"))))
).flat();
const { remaining, stale } = applyExceptions(findings, designExceptions);
for (const finding of remaining)
  console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.value}\n  ${fixes[finding.rule]}`);
for (const message of stale) console.error(message);
// Biome owns import restrictions, including dynamic imports and re-exports.
const biome = spawnSync(
  process.execPath,
  ["node_modules/@biomejs/biome/bin/biome", "lint", "--only=style/noRestrictedImports", ...roots],
  { stdio: "inherit" },
);
if (remaining.length || stale.length || biome.status !== 0) process.exitCode = 1;
else
  console.log(
    `Design guardrails passed (${inventory.length} files; ${findings.length} documented existing exceptions).`,
  );

import { registryTheme } from "./registry-theme.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const theme = registryTheme(await readFile("src/styles/styles.css", "utf8"));
assert.equal(theme.cssVars.light.primary, "#1e40af");
assert.equal(theme.cssVars.dark.primary, "#a9c2ff");
assert.equal(theme.cssVars.dark.card, "var(--surface)");
assert.equal(theme.cssVars.dark["chart-1"], "var(--primary)");
assert.equal(theme.cssVars.theme["text-sm"], "0.8125rem");
assert.ok(theme.css["@layer base"]);
const parsed = registryTheme(`
:root { --surface: white; --quote: "a;{b}"; }
.dark { --surface: black; }
@theme inline { --color-surface: var(--surface); }
@layer base { body { color: var(--surface); } }
@layer base { button { min-height: 24px; } }
@media (min-width: 48rem) { :root { --spacing: 0.21875rem; } }
:where(a, [data-name="a;b"]) { outline: 2px solid var(--surface); }
`);
assert.equal(parsed.cssVars.light.quote, '"a;{b}"');
assert.deepEqual(parsed.css["@layer base"], { body: { color: "var(--surface)" }, button: { "min-height": "24px" } });
assert.deepEqual(parsed.css["@media (min-width: 48rem)"], { ":root": { "--spacing": "0.21875rem" } });
assert.throws(() => registryTheme(":root { --color: white;"), /Unclosed/);
console.log(
  "PASS theme conversion: aliases, modes, type scale, repeated layers, quoted punctuation, nested rules and malformed input",
);

// Prove checks detect both output tampering and source drift, restoring bytes even on failure.
for (const [file, script] of [
  ["public/llms.txt", "scripts/llms.ts"],
  ["public/r/stat-card.json", "scripts/registry-build.ts"],
  [".agents/skills/tenboards-build-ui/SKILL.md", "scripts/llms.ts"],
] as const) {
  const original = await readFile(file, "utf8");
  try {
    await writeFile(file, `${original}\nDrift probe\n`);
    const result = spawnSync(process.execPath, ["--experimental-strip-types", script, "--check"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Stale /);
    console.log(`PASS freshness rejects drift in ${file}`);
  } finally {
    await writeFile(file, original);
  }
}

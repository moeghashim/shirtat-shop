import { applyExceptions, fixes, inspectDesign } from "./design-rules.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

const file = `src/routes/-guardrail-fixture-${process.pid}.tsx`;
const biome = (source: string, filename = file) => {
  writeFileSync(filename, source, { flag: "wx" });
  try {
    return spawnSync(
      process.execPath,
      ["node_modules/@biomejs/biome/bin/biome", "lint", "--only=style/noRestrictedImports", filename],
      { encoding: "utf8" },
    );
  } finally {
    unlinkSync(filename);
  }
};
const fixtures = JSON.parse(await readFile("scripts/fixtures/design/violations.json", "utf8")) as Array<{
  name: string;
  source: string;
  rule?: keyof typeof fixes;
  fix?: string;
}>;
for (const fixture of fixtures) {
  if (fixture.rule) {
    const findings = inspectDesign(file, fixture.source);
    assert(
      findings.some((finding) => finding.rule === fixture.rule),
      fixture.name,
    );
    assert.match(fixes[fixture.rule], /Use /);
  } else {
    const result = biome(fixture.source);
    assert.notEqual(result.status, 0, fixture.name);
    assert(
      (result.stdout + result.stderr).includes(fixture.fix ?? ""),
      `${fixture.name}: actionable diagnostic missing`,
    );
  }
  if (fixture.name.startsWith("recharts")) {
    const result = biome(fixture.source, `src/components/blocks/guardrail-fixture-${process.pid}.tsx`);
    assert.notEqual(result.status, 0, `${fixture.name}: non-chart blocks must fail too`);
    assert((result.stdout + result.stderr).includes(fixture.fix ?? ""));
  }
  console.log(`PASS seeded violation: ${fixture.name}`);
}
const allowed: string[] = JSON.parse(await readFile("scripts/fixtures/design/allowed.json", "utf8"));
for (const value of allowed) {
  assert.deepEqual(inspectDesign(file, `const cls = ${JSON.stringify(value)};`), [], value);
  console.log(`PASS allowed token/layout: ${value}`);
}
assert.equal(
  inspectDesign(
    file,
    '// #fff text-[13px]\nconst cls = "[&>p]:text-sm data-[state=open]:bg-card p-4"; <DashboardCard><PageHeader title="Reports" /></DashboardCard>',
  ).length,
  0,
);
assert.equal(inspectDesign("src/routes/test.css", "/* #fff */ .x {color: oklch(.5 .2 100)}").length, 1);
assert.equal(
  biome('import { Line } from "recharts";', `src/components/blocks/charts-guardrail-fixture-${process.pid}.tsx`).status,
  0,
);
assert.equal(biome('import { CardContent } from "@/components/ui/card";').status, 0);
assert.equal(biome('import { DashboardCard } from "@/components/blocks";').status, 0);
const findings = inspectDesign(file, 'const a = "text-[13px] text-[13px]";');
const exception = {
  file,
  rule: "arbitrary-value" as const,
  value: "text-[13px]",
  count: 1,
  reason: "Seeded occurrence-count regression.",
};
assert.equal(applyExceptions(findings, [exception]).remaining.length, 1, "extra copies must fail");
assert.equal(applyExceptions([], [exception]).stale.length, 1, "removed occurrences must fail stale exceptions");
assert.equal(
  applyExceptions(findings, [{ ...exception, file: "src/routes/another.tsx" }]).remaining.length,
  2,
  "exceptions cannot escape their file",
);
console.log(
  "PASS permitted tokens/variants/blocks/chart boundary, CSS comments, exact counted exceptions, and stale exception detection",
);

writeFileSync(
  file,
  `import { Line } from "recharts";
const color = "#123abc";
const el = <section className="rounded-xl border bg-card p-[13px]"><h1>Reports</h1></section>;`,
  { flag: "wx" },
);
try {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/check-design.ts"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 1, "check:design must exit 1 for seeded violations");
  for (const rule of Object.keys(fixes)) assert(result.stderr.includes(`[${rule}]`), rule);
  assert((result.stdout + result.stderr).includes("@/components/blocks/charts"));
} finally {
  unlinkSync(file);
}
console.log("PASS check:design CLI exits 1 with actionable diagnostics for all seeded rules");

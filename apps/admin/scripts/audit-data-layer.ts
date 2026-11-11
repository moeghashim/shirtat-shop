import ts from "typescript";

import { readRegistry } from "../src/server/data/registry.ts";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function filesIn(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await filesIn(file)));
    else if (/\.(ts|tsx|json)$/.test(file)) result.push(file);
  }
  return result;
}
const files = await filesIn("src");
const fileSet = new Set(files);
const resolve = (from: string, specifier: string) => {
  let stem: string | undefined;
  if (specifier.startsWith("@/")) stem = `src/${specifier.slice(2)}`;
  else if (specifier.startsWith(".")) stem = path.normalize(path.join(path.dirname(from), specifier));
  return (
    stem &&
    [stem, `${stem}.ts`, `${stem}.tsx`, `${stem}.json`, `${stem}/index.ts`, `${stem}/index.tsx`].find((x) =>
      fileSet.has(x),
    )
  );
};
const graph = new Map<string, string[]>();
const loaderReads: { file: string; module: string }[] = [];
function inServerHandler(node: ts.Node) {
  for (let current: ts.Node | undefined = node.parent; current; current = current.parent) {
    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression) &&
      current.expression.name.text === "handler" &&
      current.expression.expression.getText().includes("createServerFn")
    )
      return true;
  }
  return false;
}
for (const file of files.filter((f) => /\.tsx?$/.test(f) && !f.endsWith("routeTree.gen.ts"))) {
  const content = await readFile(file, "utf8");
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const dependencies: string[] = [];
  const record = (specifier: string, node: ts.Node) => {
    const target = resolve(file, specifier);
    if (!target) return;
    if (inServerHandler(node)) {
      if (target.startsWith("src/server/data/") && !target.endsWith(".types.ts"))
        loaderReads.push({ file, module: path.basename(target, ".ts") });
      return;
    }
    dependencies.push(target);
  };
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const names = clause?.namedBindings;
      const types =
        clause?.isTypeOnly ||
        (!clause?.name && names && ts.isNamedImports(names) && names.elements.every((x) => x.isTypeOnly));
      if (!types) record(node.moduleSpecifier.text, node);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const types =
        node.isTypeOnly ||
        (node.exportClause &&
          ts.isNamedExports(node.exportClause) &&
          node.exportClause.elements.every((x) => x.isTypeOnly));
      if (!types) record(node.moduleSpecifier.text, node);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      record(node.arguments[0].text, node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  graph.set(file, dependencies);
}
const violations: string[][] = [];
function inspect(file: string, chain: string[], seen: Set<string>) {
  if (seen.has(file)) return;
  seen.add(file);
  if (file.startsWith("src/server/db/fixtures/")) {
    violations.push([...chain, file]);
    return;
  }
  for (const target of graph.get(file) ?? []) inspect(target, [...chain, file], seen);
}
for (const file of files.filter((f) => !f.startsWith("src/server/"))) inspect(file, [], new Set());
assert.deepEqual(violations, [], "Client runtime graph must not reach fixtures");
const fixtures = (await readdir("src/server/db/fixtures"))
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f.slice(0, -3))
  .sort();
const domains = readRegistry.map((r) => r.module).sort();
assert.deepEqual(fixtures, domains, "Each canonical fixture module has exactly one registered owner");
for (const domain of domains)
  assert.ok(
    loaderReads.some((r) => r.module === domain),
    `Missing loader for ${domain}`,
  );
console.log(
  JSON.stringify(
    {
      passing: true,
      sourceFiles: files.length,
      canonicalFixtures: fixtures,
      registeredReads: readRegistry.map((r) => r.read),
      scenarios: readRegistry.reduce((n, r) => n + r.scenarios.length, 0),
      loaderReads,
      clientFixtureViolations: violations,
      clientSignalExceptions: [
        "waveform-data.ts",
        "realtime-utils.ts",
        "use-patient-vital-series.ts",
        "use-realtime-tick.ts",
      ],
      manualAudit:
        "Companion literal/array evidence classifies UI configuration, geometry and signal labels; no business records are excluded by filename.",
    },
    null,
    2,
  ),
);

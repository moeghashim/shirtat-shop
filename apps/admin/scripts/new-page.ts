import ts from "typescript";

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const root = process.cwd();
const routeRoot = "src/routes/(main)/dashboard";
const sidebarPath = "src/navigation/sidebar/sidebar-items.ts";
const catalogPath = "src/navigation/route-catalog.ts";
const registryPath = "src/server/data/registry.ts";
const reserved = new Set([
  "index",
  "route",
  "api",
  "auth",
  "dashboard",
  "undefined",
  "null",
  "constructor",
  "prototype",
]);

function sourceFile(file: string, text: string) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
}
function arrayDeclaration(file: ts.SourceFile, name: string) {
  let result: ts.ArrayLiteralExpression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      let expression = node.initializer;
      while (expression && (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)))
        expression = expression.expression;
      if (expression && ts.isArrayLiteralExpression(expression)) result = expression;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!result) throw new Error(`Cannot locate ${name} array in ${file.fileName}; no files changed.`);
  return result;
}
function property(node: ts.ObjectLiteralExpression, name: string) {
  return node.properties.find(
    (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText().replaceAll('"', "") === name,
  )?.initializer;
}
function append(text: string, array: ts.ArrayLiteralExpression, entry: string) {
  const last = array.elements.at(-1);
  const comma = last && !array.elements.hasTrailingComma ? "," : "";
  return `${text.slice(0, array.end - 1)}${comma}\n${entry},\n${text.slice(array.end - 1)}`;
}
function format(file: string, text: string) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/@biomejs/biome/bin/biome", "check", "--write", `--stdin-file-path=${file}`],
    { cwd: root, input: text, encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(`Cannot format ${file}:\n${result.stderr}`);
  return result.stdout;
}

async function generate() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { title: { type: "string" }, group: { type: "string" } },
  });
  const [kind, slug] = positionals;
  if (!["dashboard", "page"].includes(kind) || positionals.length !== 2)
    throw new Error(
      'Usage: npm run new:dashboard <slug> [-- --title "…" --group Dashboards] or npm run new:page <slug> [-- --title "…"]',
    );
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 64)
    throw new Error("Invalid slug: use kebab-case starting with a letter (maximum 64 characters).");
  if (kind === "page" && values.group !== undefined) throw new Error("--group is supported only by new:dashboard.");
  const name = slug
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  const title =
    values.title ??
    slug
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" ");
  if (!title.trim() || [...title].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127))
    throw new Error("Title must be nonempty, single-line text.");
  const group = values.group ?? (kind === "dashboard" ? "Dashboards" : "Pages");
  const originals = new Map<string, string>();
  for (const file of [sidebarPath, catalogPath, registryPath]) originals.set(file, await readFile(file, "utf8"));
  const sidebar = originals.get(sidebarPath) as string;
  const catalog = originals.get(catalogPath) as string;
  const registry = originals.get(registryPath) as string;
  const occupied = (await readdir(routeRoot)).some((entry) => entry === slug || entry.startsWith(`${slug}.`));
  const catalogFile = sourceFile(catalogPath, catalog);
  const routeSegments = new Set<string>();
  function collectStrings(node: ts.Node) {
    if (ts.isStringLiteral(node) && node.text.startsWith("/"))
      for (const segment of node.text.split("/")) routeSegments.add(segment);
    ts.forEachChild(node, collectStrings);
  }
  collectStrings(catalogFile);
  if (reserved.has(slug) || occupied || routeSegments.has(slug) || new RegExp(`\\bread${name}\\b`).test(registry))
    throw new Error(`Slug "${slug}" is reserved or already exists; refusing to overwrite.`);

  const sidebarFile = sourceFile(sidebarPath, sidebar);
  const groups = arrayDeclaration(sidebarFile, "sidebarItems");
  const matches = groups.elements.filter((node): node is ts.ObjectLiteralExpression => {
    if (!ts.isObjectLiteralExpression(node)) return false;
    const label = property(node, "label");
    return !!label && ts.isStringLiteral(label) && label.text === group;
  });
  if (matches.length !== 1)
    throw new Error(`Unknown or ambiguous sidebar group "${group}"; use an existing group label.`);
  const items = property(matches[0], "items");
  if (!items || !ts.isArrayLiteralExpression(items)) throw new Error("Sidebar group items must be an array literal.");
  const url = `/dashboard/${slug}`;
  if (sidebar.includes(`id: "${slug}"`)) throw new Error(`Sidebar ID "${slug}" already exists.`);
  const updated = new Map<string, string>();
  updated.set(
    sidebarPath,
    append(
      sidebar,
      items,
      `{ id: ${JSON.stringify(slug)}, title: ${JSON.stringify(title)}, url: ${JSON.stringify(url)}, icon: LayoutDashboard }`,
    ),
  );
  updated.set(
    catalogPath,
    append(
      catalog,
      arrayDeclaration(catalogFile, "captureRoutes"),
      `{ route: ${JSON.stringify(`${url}/`)}, path: ${JSON.stringify(url)}, ready: ${JSON.stringify(title)} }`,
    ),
  );
  updated.set(
    registryPath,
    `import { db${name}, demo${name} } from "./${slug}.ts";\n${append(registry, arrayDeclaration(sourceFile(registryPath, registry), "readRegistry"), `defineRead({ module: "${slug}", read: "read${name}", demo: demo${name}, db: db${name}, scenarios: [{ name: "all", input: {} }] })`)}`,
  );

  const tokens: Record<string, string> = { SLUG: slug, NAME: name, TITLE: JSON.stringify(title) };
  const files = new Map<string, string>();
  async function template(input: string, output: string) {
    const text = await readFile(path.join(root, "scripts/templates", `${input}.template`), "utf8");
    files.set(
      output,
      text.replace(/__([A-Z]+)__/g, (match, key: string) => tokens[key] ?? match),
    );
  }
  const route = `${routeRoot}/${slug}`;
  await template("route.tsx", `${route}/index.tsx`);
  await template(`${kind}.tsx`, `${route}/-components/page.tsx`);
  await template("records-table.tsx", `${route}/-components/records-table.tsx`);
  await template("load.ts", `${route}/-components/load.ts`);
  await template(`${kind}.types.ts`, `src/server/data/${slug}.types.ts`);
  await template(`${kind}.fixture.ts`, `src/server/db/fixtures/${slug}.ts`);
  await template("read.ts", `src/server/data/${slug}.ts`);
  if (kind === "dashboard") await template("activity-chart.tsx", `${route}/-components/activity-chart.tsx`);
  for (const [file, text] of files) {
    if (existsSync(file)) throw new Error(`Refusing to overwrite ${file}.`);
    files.set(file, format(file, text));
  }
  for (const [file, text] of updated) updated.set(file, format(file, text));
  // Finish validation and formatting before any write. Detect edits made during preparation.
  for (const [file, text] of originals)
    if ((await readFile(file, "utf8")) !== text) throw new Error(`${file} changed while generating; retry.`);
  const created: string[] = [];
  const changed: string[] = [];
  let ownsRoute = false;
  try {
    await mkdir(route);
    ownsRoute = true;
    await mkdir(`${route}/-components`);
    for (const [file, text] of files) {
      await writeFile(file, text, { flag: "wx" });
      created.push(file);
    }
    for (const [file, text] of updated) {
      changed.push(file);
      await writeFile(file, text);
    }
  } catch (error) {
    for (const file of changed) await writeFile(file, originals.get(file) as string);
    for (const file of created) await rm(file);
    if (ownsRoute) await rm(route, { recursive: true, force: true });
    throw error;
  }
  console.log(
    `Created:\n${created.map((file) => `  ${file}`).join("\n")}\nUpdated:\n${changed.map((file) => `  ${file}`).join("\n")}`,
  );
  console.log(
    `\nNext steps:\n  npm run dev  # visit ${url}; the router generates its metadata\n  npm run build && npm run check && npm run typecheck\n  npm run data:parity  # requires a migrated/seeded local DATABASE_URL\n  npm run verify:page -- ${url}\nReplace illustrative fixtures and implement the DB TODO before using live data.`,
  );
}

const lock = path.join(root, ".page-generator.lock");
let locked = false;
try {
  await mkdir(lock);
  locked = true;
  await generate();
} catch (error) {
  console.error(
    locked && error instanceof Error
      ? error.message
      : "Another generator is running (.page-generator.lock). Retry after it finishes; remove a stale lock only after confirming no generator is running.",
  );
  process.exitCode = 1;
} finally {
  if (locked) await rm(lock, { recursive: true, force: true });
}

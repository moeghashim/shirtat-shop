import { registryItemSchema, registrySchema } from "shadcn/schema";

import { registryTheme } from "./registry-theme.ts";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const check = process.argv.includes("--check");
const registry = registrySchema.parse(JSON.parse(await readFile("registry.json", "utf8")));
const packages = JSON.parse(await readFile("package.json", "utf8")).dependencies as Record<string, string>;
const theme = registryTheme(await readFile("src/styles/styles.css", "utf8"));
const output = await mkdtemp(path.join(tmpdir(), "tenboards-registry-"));
try {
  const build = spawnSync(
    process.execPath,
    ["node_modules/shadcn/dist/index.js", "build", "registry.json", "--output", output],
    { encoding: "utf8" },
  );
  if (build.status !== 0) throw new Error(build.stderr || build.stdout);
  const expected = new Set(registry.items.map((item) => `${item.name}.json`));
  for (const item of registry.items) {
    const built = JSON.parse(await readFile(path.join(output, `${item.name}.json`), "utf8"));
    built.dependencies = [
      ...(item.dependencies ?? []),
      "@fontsource-variable/geist",
      "@fontsource-variable/geist-mono",
    ].map((name) => {
      if (!packages[name]) throw new Error(`Undeclared dependency ${name}`);
      return `${name}@${packages[name]}`;
    });
    Object.assign(built, theme);
    built.docs =
      "Requires React 19 and an initialized Tailwind v4 + shadcn project. Installs the tenboards default theme globally (light/dark, typography, density, focus and motion); review CSS changes. Components and exact UI dependencies live under components/tenboards, helpers under lib/tenboards. No server/data/auth dependencies.";
    for (const file of built.files) {
      file.content = file.content
        .replaceAll("@/components/ui/", "@/components/tenboards/ui/")
        .replaceAll("@/lib/data-table-features", "@/lib/tenboards/data-table-features");
    }
    const formatted = spawnSync(
      process.execPath,
      ["node_modules/@biomejs/biome/bin/biome", "format", "--stdin-file-path=public/r/item.json"],
      {
        input: JSON.stringify(registryItemSchema.parse(built)),
        encoding: "utf8",
      },
    );
    if (formatted.status !== 0) throw new Error(formatted.stderr);
    const content = formatted.stdout;
    const target = `public/r/${item.name}.json`;
    if (check) {
      if ((await readFile(target, "utf8").catch(() => "")) !== content)
        throw new Error(`Stale ${target}; run npm run registry:build`);
    } else {
      await mkdir("public/r", { recursive: true });
      await writeFile(target, content);
    }
  }
  for (const name of await readdir("public/r")) {
    if (!expected.has(name)) {
      if (check) throw new Error(`Unexpected registry output public/r/${name}`);
      await rm(`public/r/${name}`);
    }
  }
  console.log(`PASS registry ${check ? "freshness" : "build"}: ${expected.size} self-contained items`);
} finally {
  await rm(output, { recursive: true, force: true });
}

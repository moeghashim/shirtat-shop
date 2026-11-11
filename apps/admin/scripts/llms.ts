import { registrySchema } from "shadcn/schema";

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const check = process.argv.includes("--check");
const registry = registrySchema.parse(JSON.parse(await readFile("registry.json", "utf8")));
const docs = ["AGENTS.md", "DESIGN.md", "docs/data-layer.md", "docs/deploy.md", "docs/assistant.md"];
const skills = [];
for (const name of (await readdir(".agents/skills")).sort()) {
  const file = `.agents/skills/${name}/SKILL.md`;
  const content = await readFile(file, "utf8");
  const description = content.match(/^description: (.+)$/m)?.[1];
  if (!description) throw new Error(`Missing skill description: ${file}`);
  skills.push({ name, file, description });
  docs.push(file);
  for (const reference of (
    await readdir(`.agents/skills/${name}/references`).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    })
  ).sort()) {
    if (reference.endsWith(".md")) docs.push(`.agents/skills/${name}/references/${reference}`);
  }
}
const commands = JSON.parse(await readFile("package.json", "utf8")).scripts as Record<string, string>;
const generators = Object.keys(commands)
  .filter((name) => name.startsWith("new:"))
  .sort();
const docUrl = (file: string) => `/agent-docs/${file.replace(/^\.agents\//, "agents/")}`;
const intro = `# Shirtat admin\n\n> Shirtat's admin app, built on the MIT tenboards template: React 19, TanStack Start, Tailwind v4, shadcn/Base UI blocks and Better Auth. It deploys to Vercel. Demo mode stays available when BETTER_AUTH_SECRET is unset.\n\nGenerated from registry.json, source blocks, package scripts, adopter guidance and Agent Skills. Do not edit generated assets.\n\n## Install and build\n\nUse Node 22+ and npm from apps/admin. Import from @/components/blocks and use the generators. External React 19 + Tailwind v4 projects must initialize shadcn first, then run npx shadcn add <absolute-registry-url>. Items include their exact primitive/chart dependencies and the global default light/dark theme, typography, density, focus and motion rules. Review the CSS changes before installing a block into another app: the theme is global to that install. Installed modules live in components/tenboards; table helpers live in lib/tenboards.\n\nURLs beginning with / are relative to the origin serving this file. Resolve them with new URL(path, llmsUrl).href before passing them to shadcn; for example, resolve /r/stat-card.json against the URL from which you fetched /llms.txt. The kit computes absolute commands from its current browser origin after hydration. No production hostname is baked into installs.\n\n## Generative dashboards\n\nThe blocks kit still documents the assistant composition path. Shirtat's signed-in home is the SEO plan. See /agent-docs/docs/assistant.md for the inherited assistant notes.\n\n## Blocks\n\n${registry.items.map((item) => `- [${item.title}](/r/${item.name}.json): ${item.description}`).join("\n")}\n\n## Generators\n\n${generators.map((name) => `- npm run ${name} <slug>: ${name === "new:dashboard" ? "Metrics and charts" : "Listing page"}; creates /dashboard/<slug>, navigation, guarded loader and typed illustrative demo/database reads.`).join("\n")}\n\n## Agent Skills\n\n${skills.map((skill) => `- [${skill.name}](${docUrl(skill.file)}): ${skill.description}`).join("\n")}\n\n## Documentation\n\n- [SEO plan](/dashboard/seo): owner dashboard for the Shirtat search plan.\n- [Designers](/dashboard/designers): placeholder for the designer role.\n- [Live block kit](/dashboard/kit): examples, source and installation commands.\n${docs
  .filter((file) => !file.endsWith("SKILL.md"))
  .map((file) => `- [${file}](${docUrl(file)})`)
  .join(
    "\n",
  )}\n- [Expanded source and guidance](/llms-full.txt)\n\n## Verification\n\nRun npm run build, npm run check, npm run typecheck and npm run verify:page -- /dashboard/<slug>. Keep fixtures server-side and requireSession() inside each app-data server function. A configured failing database must show an error. Use seriesConfig and useChartMotion for charts and preserve accessible data alternatives.\n`;
const outputs = new Map<string, string>([["public/llms.txt", intro]]);
let full = intro;
for (const file of docs) {
  const content = await readFile(file, "utf8");
  outputs.set(`public${docUrl(file)}`, content);
  full += `\n## Source: ${file}\n\n${content}\n`;
}
for (const file of [...new Set(registry.items.flatMap((item) => item.files?.map((file) => file.path) ?? []))].sort()) {
  full += `\n## Source: ${file}\n\n\`\`\`tsx\n${await readFile(file, "utf8")}\n\`\`\`\n`;
}
outputs.set("public/llms-full.txt", full);
for (const [target, content] of outputs) {
  if (check) {
    if ((await readFile(target, "utf8").catch(() => "")) !== content)
      throw new Error(`Stale ${target}; run npm run llms:build`);
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}
for (const entry of await readdir("public/agent-docs", { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const target = path.join(entry.parentPath, entry.name);
  if (!outputs.has(target)) {
    if (check) throw new Error(`Stale ${target}; run npm run llms:build`);
    await rm(target);
  }
}
console.log(`PASS llms ${check ? "freshness" : "build"}: ${outputs.size} source-derived assets`);

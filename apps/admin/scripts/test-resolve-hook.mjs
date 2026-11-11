import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const zod = new URL("../node_modules/zod/v4/index.js", import.meta.url);

function withExtension(base) {
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "zod/v4") return { format: "module", shortCircuit: true, url: zod.href };
  const bare = specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier);
  const fileUrl = specifier.startsWith("file:") && !/\.[a-z]+$/i.test(new URL(specifier).pathname);
  if ((bare || fileUrl) && context.parentURL) {
    const base = specifier.startsWith("file:")
      ? fileURLToPath(specifier)
      : join(dirname(fileURLToPath(context.parentURL)), specifier);
    const file = withExtension(base);
    if (file) return nextResolve(file, context);
  }
  return nextResolve(specifier, context);
}

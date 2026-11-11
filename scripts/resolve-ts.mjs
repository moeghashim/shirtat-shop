import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

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
  if (specifier.startsWith("@/")) {
    const file = withExtension(join(root, specifier.slice(2)));
    if (file) return nextResolve(file, context);
  }
  const bare =
    !specifier.includes("://") && specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier);
  const fileUrl = specifier.startsWith("file:") && !/\.[a-z]+$/i.test(new URL(specifier).pathname);
  if (bare || fileUrl) {
    const base = specifier.startsWith("file:")
      ? fileURLToPath(specifier)
      : join(dirname(fileURLToPath(context.parentURL)), specifier);
    const file = withExtension(base);
    if (file) return nextResolve(file, context);
  }
  // Next's package root has no "exports" map, so Node ESM will not add the .js extension.
  if (specifier.startsWith("next/") && !specifier.endsWith(".js")) {
    return nextResolve(`${specifier}.js`, context);
  }
  return nextResolve(specifier, context);
}

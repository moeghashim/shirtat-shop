import { readdir } from "node:fs/promises";

// Keep build credentials and caller-controlled Vite/Nitro/Node overrides out of bundles.
export function cleanBuildEnvironment(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of ["PATH", "HOME", "TMPDIR", "TMP", "TEMP", "SystemRoot"]) if (source[key]) env[key] = source[key];
  return {
    ...env,
    WRANGLER_SEND_METRICS: "false",
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
  };
}

// Nitro also reads dotenv independently of Vite's envDir.
export async function assertNoLocalEnvironmentFiles(directories: string[]) {
  for (const directory of directories) {
    const files = await readdir(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    if (files.some((file) => (/^\.env(?:\.|$)/.test(file) && file !== ".env.example") || file.startsWith(".dev.vars")))
      throw new Error("Clean build rejected: move local dotenv/dev-vars files outside the repository first.");
  }
}

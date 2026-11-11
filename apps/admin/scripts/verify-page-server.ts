import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

export async function ensureVerifyServer(baseURL: URL) {
  const reachable = async () => {
    try {
      await fetch(new URL("/favicon.svg", baseURL), { signal: AbortSignal.timeout(1500) });
      return true;
    } catch {
      return false;
    }
  };
  if (await reachable())
    return {
      reused: true,
      stop: async () => {
        /* Reused servers belong to the caller. */
      },
    };
  if (baseURL.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(baseURL.hostname))
    throw new Error(`Base URL is unavailable: ${baseURL.origin}. Start the remote server first.`);
  const child = spawn(
    process.execPath,
    [
      "--env-file-if-exists=.env",
      "node_modules/vite/bin/vite.js",
      "dev",
      "--host",
      baseURL.hostname.replace(/^\[|\]$/g, ""),
      "--port",
      baseURL.port || "80",
      "--strictPort",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let tail = "";
  child.stdout.on("data", (chunk: Buffer) => {
    tail = (tail + chunk.toString()).slice(-4000);
  });
  child.stderr.on("data", (chunk: Buffer) => {
    tail = (tail + chunk.toString()).slice(-4000);
  });
  let spawnError: Error | undefined;
  child.on("error", (error) => {
    spawnError = error;
  });
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    child.kill("SIGTERM");
    for (let i = 0; i < 20 && child.exitCode === null && child.signalCode === null; i++) await delay(100);
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  };
  try {
    for (let i = 0; i < 120; i++) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error(`Dev server exited ${child.exitCode}: ${tail}`);
      if (await reachable()) return { reused: false, stop };
      await delay(250);
    }
    throw new Error(`Dev server did not become ready: ${tail}`);
  } catch (error) {
    await stop();
    throw error;
  }
}

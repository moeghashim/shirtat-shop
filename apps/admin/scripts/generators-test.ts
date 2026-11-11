import { databaseUrl } from "../src/server/data/source-config.ts";
import { cleanBuildEnvironment } from "./build-environment.ts";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { constants } from "node:fs";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

const root = process.cwd();
const output = path.resolve(process.env.GENERATORS_TEST_OUTPUT ?? "screenshots/generators-test");
const temporary = await mkdtemp(path.join(tmpdir(), "tenboards-generators-"));
const demoEnv: NodeJS.ProcessEnv = { ...cleanBuildEnvironment(), DATA_SOURCE: "demo" };
let server: ReturnType<typeof spawn> | undefined;
let serverLog = "";
function run(command: string, args: string[], env = demoEnv) {
  const result = spawnSync(command, args, { cwd: temporary, env, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed`);
  return result.stdout;
}
async function digest() {
  const hash = createHash("sha256");
  async function visit(directory: string) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else {
        hash.update(file);
        hash.update(await readFile(file));
      }
    }
  }
  await visit(path.join(temporary, "src"));
  return hash.digest("hex");
}
async function rejects(args: string[], message: RegExp) {
  const before = await digest();
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/new-page.ts", ...args], {
    cwd: temporary,
    env: demoEnv,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0, `Expected rejection: ${args.join(" ")}`);
  assert.match(result.stderr, message);
  assert.equal(await digest(), before, "Rejected generation must leave source files byte-identical");
  console.log(`PASS safe rejection: ${JSON.stringify(args)}`);
}
try {
  // Parity remains real: require a migrated/seeded local DB, never silently skip it.
  const url = databaseUrl(process.env, true);
  const tracked = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(tracked.status, 0);
  for (const file of new Set(tracked.stdout.split("\0").filter(Boolean))) {
    // Never copy local secrets, build output or evidence into the disposable app.
    if (
      /^(?:screenshots|node_modules|\.git|\.output|\.wrangler|\.tanstack|\.nitro)(?:\/|$)/.test(file) ||
      /(?:^|\/)\.env(?:\.|$)/.test(file) ||
      /(?:^|\/)\.dev\.vars/.test(file)
    )
      continue;
    await mkdir(path.dirname(path.join(temporary, file)), { recursive: true });
    await cp(path.join(root, file), path.join(temporary, file));
  }
  // A dependency symlink breaks Vite's dev-entry resolution outside its root.
  // Copy-on-write where supported, with independent caches and relative bin links.
  await cp(path.join(root, "node_modules"), path.join(temporary, "node_modules"), {
    recursive: true,
    mode: constants.COPYFILE_FICLONE,
    verbatimSymlinks: true,
    filter: (source) => ![".vite", ".vite-temp", ".cache"].includes(path.basename(source)),
  });
  run("git", ["init", "--quiet"]);
  for (const slug of ["Bad-Slug", "../escape", "two_words", "two--words", "-start", "end-", "9lives", "a".repeat(65)])
    await rejects(["page", slug], /Invalid slug|Unknown option/);
  for (const slug of ["index", "route", "api", "dashboard", "home", "kit", "tasks", "projects"])
    await rejects(["dashboard", slug], /reserved or already exists/);
  await rejects(["dashboard", "unknown-group", "--group", "Missing"], /Unknown or ambiguous/);
  await rejects(["page", "bad-option", "--group", "Pages"], /only by new:dashboard/);
  await rejects(["page", "empty-title", "--title", " "], /Title must/);
  await rejects(["page"], /Usage/);
  // Collisions outside routes are rejected before registration writes too.
  await writeFile(path.join(temporary, "src/server/data/collision.ts"), "// Adopter-owned file\n");
  await rejects(["page", "collision"], /Refusing to overwrite/);
  await rm(path.join(temporary, "src/server/data/collision.ts"));
  const dashboardTitle = 'Operations "weekly" & <review>';
  run("npm", ["run", "new:dashboard", "generator-dashboard", "--", "--title", dashboardTitle, "--group", "Developer"]);
  run("npm", ["run", "new:page", "generator-page"]);
  await rejects(["page", "generator-page"], /reserved or already exists/);
  await rejects(["dashboard", "generator-dashboard"], /reserved or already exists/);
  const listener = createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const address = listener.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  await new Promise<void>((resolve, reject) => listener.close((error) => (error ? reject(error) : resolve())));
  const baseURL = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "dev", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { cwd: temporary, env: demoEnv, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout?.on("data", (data) => {
    serverLog += String(data);
  });
  server.stderr?.on("data", (data) => {
    serverLog += String(data);
  });
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      if ((await fetch(`${baseURL}/dashboard/generator-page`, { signal: AbortSignal.timeout(2000) })).ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the dedicated dev server. */
    }
    await setTimeout(250);
  }
  assert.ok(ready, `Generated app dev server did not become ready:\n${serverLog}`);
  run(process.execPath, ["--experimental-strip-types", "scripts/generators-browser.ts", baseURL, output]);
  run("npm", [
    "run",
    "screenshots",
    "--",
    "--base-url",
    baseURL,
    "--routes",
    "/dashboard/generator-dashboard/,/dashboard/generator-page/,/dashboard/kit/",
    "--output",
    path.join(output, "after"),
  ]);
  if (server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    await stopped;
  }
  // Render fresh output, without a formatting/fix step in the test.
  run("npm", ["run", "build"]);
  run("npm", ["run", "check"]);
  run("npm", ["run", "typecheck"]);
  run("npm", ["run", "data:parity"], { ...demoEnv, DATABASE_URL: url });
  const packageJson = JSON.parse(await readFile(path.join(temporary, "package.json"), "utf8"));
  if (packageJson.scripts["check:design"]) run("npm", ["run", "check:design"]);
  console.log(
    "PASS generators: safe failures, fresh build/check/typecheck, registered data parity, homepage → demo → Home smoke and light/dark × desktop/mobile renders.",
  );
} finally {
  if (server && server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    await stopped;
  }
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "dev-server.log"), serverLog);
  await rm(temporary, { recursive: true, force: true });
  console.log(`Cleaned temporary copy: ${temporary}`);
}

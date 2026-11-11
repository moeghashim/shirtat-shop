import { testSecret } from "./auth-test-support.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const output = process.env.AUTH_EVIDENCE_ROOT ?? "screenshots/v05-005";
await mkdir(output, { recursive: true });
const privateValues = [testSecret(), testSecret(), testSecret(), testSecret()];
const databaseURL = `postgresql://bundle_probe:${privateValues[3]}@127.0.0.1:54329/tenboards`;
const clean = {
  ...process.env,
  DATA_SOURCE: undefined,
  DATABASE_URL: undefined,
  BETTER_AUTH_SECRET: undefined,
  BETTER_AUTH_URL: undefined,
  GOOGLE_CLIENT_ID: undefined,
  GOOGLE_CLIENT_SECRET: undefined,
  GITHUB_CLIENT_ID: undefined,
  GITHUB_CLIENT_SECRET: undefined,
};
function build(env: NodeJS.ProcessEnv, log: string) {
  const fd = openSync(path.join(output, log), "w");
  try {
    return spawnSync("npm", ["run", "build"], { env, stdio: ["ignore", fd, fd] }).status;
  } finally {
    closeSync(fd);
  }
}
try {
  assert.equal(
    build(
      {
        ...clean,
        DATABASE_URL: databaseURL,
        BETTER_AUTH_SECRET: privateValues[0],
        BETTER_AUTH_URL: "http://localhost:3000",
        GOOGLE_CLIENT_ID: "dummy-google",
        GOOGLE_CLIENT_SECRET: privateValues[1],
        GITHUB_CLIENT_ID: "dummy-github",
        GITHUB_CLIENT_SECRET: privateValues[2],
      },
      "bundle-sentinel-build.log",
    ),
    0,
    "Sentinel build failed; inspect redacted logs locally.",
  );
  let checked = 0;
  for (const file of await readdir(".output", { recursive: true })) {
    if (!/\.(?:js|mjs|json|html|css|map)$/.test(file)) continue;
    const content = await readFile(path.join(".output", file), "utf8");
    for (const value of [...privateValues, databaseURL])
      assert.ok(!content.includes(value), `Private sentinel in built artifact ${file}`);
    if (file.startsWith("public/"))
      assert.ok(
        !/drizzleAdapter|auth_account|postgres(?:ql)?:\/\//.test(content),
        `Server database code in browser asset ${file}`,
      );
    checked++;
  }
  console.log(
    `PASS ${checked} built artifacts: no private sentinels; browser assets exclude server DB/auth implementation`,
  );
} finally {
  assert.equal(build(clean, "build-final.log"), 0, "Zero-env build restoration failed.");
  console.log("PASS final build restored to zero auth/DB/provider environment");
}

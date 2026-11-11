import { spawnSync } from "node:child_process";

for (const suite of ["protection", "account", "security"]) {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", `scripts/auth-${suite}-check.ts`], {
    env: { ...process.env, AUTH_TEST_RUNTIME: "workerd" },
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exitCode = 1;
    break;
  }
}

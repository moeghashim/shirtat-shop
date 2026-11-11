import { checkDeployment } from "./deploy-check-core.ts";
import { parseArgs } from "node:util";

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      demo: { type: "boolean", default: false },
      "auth-roundtrip": { type: "boolean", default: false },
    },
  });
  if (positionals.length !== 1) throw new Error("Usage: npm run deploy:check -- <origin> [--demo | --auth-roundtrip]");
  await checkDeployment(positionals[0], { demo: values.demo, authRoundtrip: values["auth-roundtrip"] });
} catch (error) {
  console.error(error instanceof Error ? error.message : "Deployment check failed (details redacted).");
  process.exitCode = 1;
}

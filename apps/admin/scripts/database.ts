import { migrate } from "drizzle-orm/postgres-js/migrator";

import { closeDatabase, getDatabase } from "../src/server/db/client.server.ts";
import { seed } from "../src/server/db/seed.ts";
import { databaseCommandTarget } from "./database-target.ts";
import { parseArgs } from "node:util";

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { "allow-remote": { type: "boolean", default: false } },
  });
  if (positionals.length !== 1) throw new Error("Provide migrate or seed.");
  const command = positionals[0];
  databaseCommandTarget(process.env, values["allow-remote"]);
  if (command === "migrate") await migrate(getDatabase(), { migrationsFolder: "src/server/db/migrations" });
  else if (command === "seed") await seed();
  else throw new Error("Unknown database command.");
  console.log(`Database ${command} completed.`);
} catch {
  console.error(
    "Database command failed. Check the direct DATABASE_URL, local-only default, explicit --allow-remote/TLS requirement, availability and migrations.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

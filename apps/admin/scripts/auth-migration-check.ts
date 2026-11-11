import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { localDatabase } from "./auth-test-support.ts";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, symlink } from "node:fs/promises";
import path from "node:path";

// The approved v0.6.1 base contains all shipped migrations and the original V1 seed.
const baselineRevision = "f45e813";
const archive = await mkdtemp(path.resolve(".wrangler/legacy-migrations-"));
const baseline = path.join(archive, "src/server/db/migrations");
const current = path.resolve("src/server/db/migrations");
const admin = postgres(localDatabase, { connect_timeout: 3 });
const journal = JSON.parse(await readFile(`${current}/meta/_journal.json`, "utf8"));
const removed = [
  "analytics_coverage_assignments",
  "analytics_v1_next_interventions",
  "analytics_v1_ledger_rows",
  "analytics_v1_date_range",
  "crm_v1_action_items",
  "crm_v1_project_revenue_chart_data",
  "crm_v1_recent_leads_data",
  "crm_v1_region_sales_data",
  "default_proposal_reviewers",
  "default_v1_reference",
  "default_v1_proposals",
  "finance_v1_summary",
  "finance_v1_upcoming_payments",
];
try {
  const archiveFile = path.join(archive, "baseline.tar");
  execFileSync("git", ["archive", "--output", archiveFile, baselineRevision, "src", "scripts", "package.json"]);
  execFileSync("tar", ["-xf", archiveFile, "-C", archive]);
  await symlink(path.resolve("node_modules"), path.join(archive, "node_modules"), "dir");
  for (const file of await readdir(baseline))
    if (file.endsWith(".sql"))
      assert.equal(
        await readFile(path.join(baseline, file), "utf8"),
        await readFile(path.join(current, file), "utf8"),
        "A shipped migration changed",
      );
  const baselineJournal = JSON.parse(await readFile(`${baseline}/meta/_journal.json`, "utf8"));
  assert.deepEqual(journal.entries.slice(0, baselineJournal.entries.length), baselineJournal.entries);
  for (const mode of ["fresh", "upgrade"]) {
    const name = `tenboards_legacy_${mode}_${Date.now()}`;
    await admin`create database ${admin(name)}`;
    const url = new URL(localDatabase);
    url.pathname = `/${name}`;
    const sql = postgres(url.href, { max: 1 });
    const run = (command: string, cwd = process.cwd()) =>
      execFileSync("npm", ["run", command], {
        cwd,
        env: { ...process.env, DATABASE_URL: url.href, DATA_SOURCE: undefined, BETTER_AUTH_SECRET: undefined },
        stdio: "pipe",
      });
    const retainedRows = async () => {
      const tables = await sql`select tablename from pg_tables where schemaname='public' order by tablename`;
      const result: Record<string, unknown[]> = {};
      for (const { tablename } of tables) {
        if (removed.includes(tablename)) continue;
        const rows = await sql`select * from ${sql(tablename)}`;
        result[tablename] = rows
          .filter(
            (row) =>
              !(
                tablename.startsWith("metric_") &&
                /^core-(default|crm|finance|analytics)$/.test(row.domain) &&
                row.series.startsWith("v1.")
              ),
          )
          .map((row) => JSON.stringify(row))
          .sort();
      }
      return result;
    };
    try {
      let before: Awaited<ReturnType<typeof retainedRows>> | undefined;
      if (mode === "upgrade") {
        await migrate(drizzle(sql), { migrationsFolder: baseline });
        run("db:seed", archive);
        for (const table of removed) assert.ok(Number((await sql`select count(*) as n from ${sql(table)}`)[0].n) > 0);
        before = await retainedRows();
      }
      await migrate(drizzle(sql), { migrationsFolder: current });
      if (before) {
        const after = await retainedRows();
        for (const [table, rows] of Object.entries(before))
          assert.deepEqual(after[table], rows, `Retained data changed during upgrade: ${table}`);
      }
      await migrate(drizzle(sql), { migrationsFolder: current });
      assert.equal(
        (await sql`select count(*)::int as count from drizzle.__drizzle_migrations`)[0].count,
        journal.entries.length,
      );
      for (const table of removed) assert.equal((await sql`select to_regclass(${table}) as name`)[0].name, null);
      for (const table of ["metric_points", "metric_dimensions"])
        assert.equal(
          Number(
            (
              await sql`select count(*) as n from ${sql(table)} where domain in ('core-default', 'core-crm', 'core-finance', 'core-analytics') and series like 'v1.%'`
            )[0].n,
          ),
          0,
        );
      run("db:seed");
      const seeded = await retainedRows();
      run("db:seed");
      assert.deepEqual(await retainedRows(), seeded);
      const parity = run("data:parity").toString();
      assert.match(parity, /"reads":\d+,"scenarios":\d+,"passing":true/);
      console.log(
        `PASS ${mode}: ${journal.entries.length} migrations, repeat migrate/seed, 13 removed tables, retained rows unchanged, full registered read parity; test database removed`,
      );
    } finally {
      await sql.end();
      await admin`drop database ${admin(name)} with (force)`;
    }
  }
} finally {
  await admin.end();
  await rm(archive, { recursive: true, force: true });
}

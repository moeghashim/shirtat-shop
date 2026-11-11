import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import {
  dbProject,
  dbProjectFiles,
  dbProjectTasks,
  demoProject,
  demoProjectFiles,
  demoProjectTasks,
  demoProjectTimeline,
  demoWorkspaceHome,
  readProject,
} from "../src/server/data/projects.ts";
import { addCivilDays, inclusiveDuration, taskMetrics } from "../src/server/data/projects.types.ts";
import { databaseUrl } from "../src/server/data/source.ts";
import { closeDatabase, getDatabase } from "../src/server/db/client.server.ts";
import { templates } from "../src/server/db/fixtures/calendar.ts";
import { files, folders } from "../src/server/db/fixtures/files.ts";
import { initialBoard } from "../src/server/db/fixtures/kanban.ts";
import { projectMapping } from "../src/server/db/fixtures/project-mapping.ts";
import { tasks } from "../src/server/db/fixtures/tasks.ts";
import { projectTasks } from "../src/server/db/project-schema.ts";
import { seed } from "../src/server/db/seed.ts";
import { seedProjects } from "../src/server/db/seed-projects.ts";
import { seedWorkspace } from "../src/server/db/seed-workspace.ts";
import assert from "node:assert/strict";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const pass = (name: string) => console.log(`PASS ${name}`);
const url = databaseUrl(process.env, true);
assert.match(new URL(url).pathname, /_v08_/);
const client = postgres(url, { max: 1, onnotice: () => undefined });
try {
  assert.deepEqual(
    projectMapping.board.map((t) => t.sourceId).sort(),
    Object.values(initialBoard)
      .flat()
      .map((t) => t.id)
      .sort(),
  );
  assert.deepEqual(projectMapping.ledger.map((t) => t.sourceId).sort(), tasks.map((t) => t.id).sort());
  for (const [mapped, rows] of [
    [projectMapping.files, files],
    [projectMapping.folders, folders],
    [projectMapping.events, templates],
  ] as const)
    assert.deepEqual([...mapped].sort(), rows.map((t) => t.id).sort());
  pass("manifest covers every legacy fixture exactly once");
  for (const load of [demoProjectTasks, dbProjectTasks]) {
    const first = await load({ projectId: "sample-operations", limit: 100 });
    const last = await load({ projectId: "sample-operations", limit: 100, offset: 100 });
    assert.ok(first && last);
    assert.equal(first.total, Object.values(initialBoard).flat().length + tasks.length);
    assert.equal(first.items.length + last.items.length, first.total);
    assert.equal(new Set([...first.items, ...last.items].map((t) => t.id)).size, first.total);
    const ledgerTitles = [...first.items, ...last.items].filter((t) => t.sourceKind === "ledger");
    assert.equal(ledgerTitles.length, tasks.length);
    for (const task of ledgerTitles)
      assert.equal(task.title, tasks.find((fixture) => fixture.id === task.sourceId)?.title);
    assert.ok(ledgerTitles.every((t) => !/pixel|SCSI|1080p|capacitor|bandwidth/i.test(t.title)));
    assert.equal((await load({ projectId: "sample-docs", id: first.items[0].id }))?.total, 0);
    assert.equal((await load({ projectId: "sample-empty" }))?.total, 0);
    assert.equal(await load({ projectId: "missing" }), null);
    assert.ok((await load({ projectId: "sample-operations", status: "canceled" }))?.total);
    const docs = await load({ projectId: "sample-docs" });
    assert.ok(docs);
    assert.deepEqual(docs.items.find((t) => t.id === "sample:setup-guide")?.labels, ["documentation", "verification"]);
    assert.equal(docs.items.find((t) => t.id === "sample:setup-guide")?.subtasks.filter((t) => t.done).length, 1);
    for (const input of [
      { projectId: "" },
      { projectId: "a".repeat(121) },
      { projectId: "../other" },
      { projectId: "sample-docs", status: "unknown" },
      { projectId: "sample-docs", limit: 101 },
      { projectId: "sample-docs", offset: -1 },
    ])
      await assert.rejects(() => load(input as Parameters<typeof load>[0]));
  }
  assert.equal((await demoProjectFiles({ projectId: "sample-docs", id: "product-roadmap" }))?.files.length, 0);
  assert.deepEqual(
    await demoProjectFiles({ projectId: "sample-docs" }),
    await dbProjectFiles({ projectId: "sample-docs" }),
  );
  const home = await demoWorkspaceHome({ renderedAt: "2026-06-20T12:00:00Z" });
  assert.equal(
    home.metrics.total,
    home.projects.reduce((n, p) => n + p.metrics.total, 0),
  );
  assert.ok(home.myTaskTotal >= home.myTasks.length);
  assert.ok(home.upcomingTotal >= home.upcoming.length);
  assert.ok(home.myTasks.every((t) => t.assigneeId === "board:jordan"));
  assert.equal(taskMetrics([{ status: "canceled", dueDate: null }]).progress, 0);
  assert.equal(
    taskMetrics([
      { status: "done", dueDate: null },
      { status: "canceled", dueDate: null },
    ]).progress,
    100,
  );
  assert.equal(addCivilDays("2028-02-29", 1), "2028-03-01");
  assert.equal(addCivilDays("2026-12-31", 1), "2027-01-01");
  assert.equal(inclusiveDuration("2026-03-07", "2026-03-09"), 3);
  assert.throws(() => inclusiveDuration("2026-06-20", "2026-06-19"));
  assert.throws(() => addCivilDays("2026-02-30", 1));
  for (const reader of [demoProjectTasks, dbProjectTasks]) {
    const result = await reader({ projectId: "sample-operations", dueFrom: "2026-06-20", sort: "dueDate", limit: 10 });
    assert.ok(result?.items.every((t) => t.dueDate !== null && t.dueDate >= "2026-06-20"));
  }
  const timeline = await demoProjectTimeline({ projectId: "sample-docs", renderedAt: "2026-06-20T12:00:00Z" });
  assert.equal(timeline?.taskEvents.find((t) => t.id === "task:sample:review-checklist")?.end, "2026-06-21");
  for (const renderedAt of ["2026-10-24T12:00:00Z", "2028-02-29T23:59:59Z", "2027-01-01T00:00:00Z"]) {
    const today = renderedAt.slice(0, 10);
    for (const projectId of ["sample-operations", "sample-docs"]) {
      const demo = await demoProjectTasks({ projectId, renderedAt });
      const db = await dbProjectTasks({ projectId, renderedAt });
      assert.deepEqual(demo, db);
      assert.ok(demo);
      const open = demo.items.filter((t) => !["done", "canceled"].includes(t.status));
      assert.ok(
        open.some((t) => t.dueDate === today),
        "work due today",
      );
      assert.ok(
        open.some((t) => t.dueDate && t.dueDate < today),
        "overdue work",
      );
      assert.ok(
        open.some((t) => t.dueDate && t.dueDate > today && t.dueDate <= addCivilDays(today, 7)),
        "work this week",
      );
      assert.ok(demo.items.filter((t) => t.startDate).length >= demo.items.length * 0.8, "mostly scheduled");
    }
  }
  pass("scope, missing/empty, filters, pagination, canceled metrics, dates and calendar exclusive ends");
  await getDatabase().insert(projectTasks).values({
    id: "sentinel:v08",
    projectId: "sample-empty",
    sourceKind: "sample",
    sourceId: "sentinel:v08",
    title: "Database-only sentinel",
    description: "",
    status: "todo",
    priority: "low",
    position: 0,
  });
  try {
    assert.equal((await dbProjectTasks({ projectId: "sample-empty" }))?.items[0].title, "Database-only sentinel");
    assert.equal((await demoProjectTasks({ projectId: "sample-empty" }))?.total, 0);
    assert.equal((await dbProject({ projectId: "sample-empty" }))?.metrics.open, 1);
    await assert.rejects(() => client`update project_tasks set "assigneeId"='board:jordan' where id='sentinel:v08'`);
    await assert.rejects(() => client`update project_tasks set status='invalid' where id='sentinel:v08'`);
    await assert.rejects(() => client`update project_tasks set "commentCount"=-1 where id='sentinel:v08'`);
    await assert.rejects(
      () => client`update project_tasks set "startDate"='2026-06-20',"endDate"='2026-06-19' where id='sentinel:v08'`,
    );
    await seed();
    await seed();
    assert.equal((await dbProjectTasks({ projectId: "sample-empty" }))?.total, 1);
  } finally {
    await getDatabase().delete(projectTasks).where(eq(projectTasks.id, "sentinel:v08"));
  }
  pass("DB-only sentinel, same-project and enum/date/count constraints, repeat seed preservation");
  // Upgrade a separate disposable database populated by the pre-project workspace seeder.
  const upgradeName = `tenboards_v08_upgrade_${Date.now()}`;
  await client`create database ${client(upgradeName)}`;
  const upgradeURL = new URL(url);
  upgradeURL.pathname = `/${upgradeName}`;
  const upgrade = postgres(upgradeURL.href, { max: 1, onnotice: () => undefined });
  try {
    const directory = "screenshots/v08-001/old-migrations";
    await mkdir(`${directory}/meta`, { recursive: true });
    const journal = JSON.parse(await readFile("src/server/db/migrations/meta/_journal.json", "utf8"));
    journal.entries = journal.entries.filter((e: { idx: number }) => e.idx < 15);
    await writeFile(`${directory}/meta/_journal.json`, JSON.stringify(journal));
    for (const entry of journal.entries)
      await copyFile(`src/server/db/migrations/${entry.tag}.sql`, `${directory}/${entry.tag}.sql`);
    const db = drizzle(upgrade);
    await migrate(db, { migrationsFolder: directory });
    await db.transaction(seedWorkspace);
    await upgrade`insert into ledger_tasks(id,position,title,status,label,priority) values('adopter-v08',999,'Adopter retained','canceled','custom','low')`;
    await upgrade`insert into auth_user(id,name,email,email_verified,created_at,updated_at) values('adopter-v08','Adopter','v08@example.test',false,now(),now())`;
    await upgrade`insert into board_tasks select 'adopter-board-v08',"columnId",position,title,description,priority,'Unknown date',progress,"ownerId",team from board_tasks limit 1`;
    await upgrade`insert into workspace_files select 'adopter-file-v08',position,name,kind,size,"ownerId","modifiedAt",starred from workspace_files limit 1`;
    await upgrade`insert into file_shares values('adopter-file-v08',false)`;
    await migrate(db, { migrationsFolder: "src/server/db/migrations" });
    assert.equal(
      (await upgrade`select count(*)::int n from project_tasks`)[0].n,
      tasks.length + Object.values(initialBoard).flat().length + 2,
    );
    assert.equal((await upgrade`select status from project_tasks where id='ledger:adopter-v08'`)[0].status, "canceled");
    assert.equal(
      (await upgrade`select "dueDate" from project_tasks where id='board:adopter-board-v08'`)[0].dueDate,
      null,
    );
    assert.equal((await upgrade`select count(*)::int n from project_files where "fileId"='adopter-file-v08'`)[0].n, 1);
    await db.transaction(seedProjects);
    await migrate(db, { migrationsFolder: "src/server/db/migrations" });
    await db.transaction(seedProjects);
    assert.equal((await upgrade`select count(*)::int n from auth_user where id='adopter-v08'`)[0].n, 1);
    assert.equal((await upgrade`select count(*)::int n from ledger_tasks where id='adopter-v08'`)[0].n, 1);
    assert.equal((await upgrade`select count(*)::int n from project_tasks where id='ledger:adopter-v08'`)[0].n, 1);
  } finally {
    await upgrade.end();
    await client`drop database ${client(upgradeName)}`;
  }
  pass("populated additive upgrade, repeated migration/seed, adopter and auth preservation");
  await client`alter table projects rename to projects_v08_missing`;
  try {
    await assert.rejects(() => readProject({ projectId: "sample-operations" }), /Unable to load database data/);
  } finally {
    await client`alter table projects_v08_missing rename to projects`;
  }
  assert.equal((await demoProject({ projectId: "sample-empty" }))?.metrics.total, 0);
  pass("configured schema failure never substitutes fixtures; recovery retains empty project");
} finally {
  await client.end();
  await closeDatabase();
}

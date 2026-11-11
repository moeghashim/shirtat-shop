import { dbAcademy, demoAcademy } from "../src/server/data/academy.ts";
import { dbInfrastructure, demoInfrastructure } from "../src/server/data/infrastructure.ts";
import { dbLogistics, demoLogistics } from "../src/server/data/logistics.ts";
import { dbPatients, demoPatients } from "../src/server/data/patients.ts";
import { dbProductivity, demoProductivity } from "../src/server/data/productivity.ts";
import { closeDatabase } from "../src/server/db/client.server.ts";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Independent snapshot extracted from the previous layer, stored with PR evidence.
if (!process.argv[2]) throw new Error("Provide the incumbent-data.json evidence path");
const original = JSON.parse(await readFile(process.argv[2], "utf8"));
try {
  for (const [source, reads] of [
    ["demo", [demoProductivity, demoAcademy, demoLogistics, demoInfrastructure, demoPatients]],
    ["db", [dbProductivity, dbAcademy, dbLogistics, dbInfrastructure, dbPatients]],
  ] as const) {
    const [productivity, academy, logistics, infrastructure, patients] = reads;
    const p = await productivity();
    assert.deepEqual(
      p.tasks.map(({ id, ...row }) => row),
      original.productivity.tasks,
    );
    assert.deepEqual(
      p.projects.map(({ id, dueDate, ...row }) => row),
      original.productivity.projects,
    );
    assert.deepEqual(
      p.notes.map(({ title, dateLabel, icon }) => ({ title, date: dateLabel, icon })),
      original.productivity.recentNotes,
    );
    assert.deepEqual(p.summaryCards, original.productivity.summaryCards);
    assert.equal(p.day.label, "October 23, 2026");
    assert.equal(p.focus.duration, "90:00");
    assert.equal(p.goals.completed, 4);
    const a = await academy();
    assert.deepEqual(a.kpis, original.academy.metrics);
    assert.deepEqual(a.assignments, original.academy.chartData);
    assert.deepEqual(
      a.events.map(({ id, ...row }) => row),
      original.academy.upcomingEvents,
    );
    assert.deepEqual(a.performance, original.academy.performanceHighlights);
    assert.equal(a.day.scheduleLabel, "Friday, 23 October");
    assert.equal(a.schedule.length, 5);
    assert.deepEqual((await logistics()).shipments, original.logistics.shipments);
    assert.deepEqual((await infrastructure()).groups, original.infrastructure.infrastructureGroups);
    const monitor = await patients();
    assert.deepEqual(
      monitor.patients.map(({ alarmShortLabel, ...row }) => row),
      original.patients.patients,
    );
    assert.equal(monitor.patients.find((p) => p.id === "cardiac-04")?.alarmShortLabel, "HR HIGH");
    assert.equal((await productivity({ taskId: "missing", projectId: "missing" })).tasks.length, 0);
    assert.equal((await academy({ classId: "G11E" })).performance.length, 0);
    assert.equal((await logistics({ id: "missing" })).shipments.length, 0);
    assert.equal((await infrastructure({ groupId: "missing" })).groups.length, 0);
    assert.equal((await patients({ id: "missing" })).patients.length, 0);
    console.log(
      `PASS ${source}: independent incumbent content/order/coordinates/baselines, inline schedule/date/goals, missing/empty relations`,
    );
  }
} finally {
  await closeDatabase();
}

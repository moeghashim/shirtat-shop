import { asc } from "drizzle-orm";
import { z } from "zod";

import { metrics, tables } from "../db/fixtures/academy.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { assembleAcademy } from "./operational-projectors.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ classId: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoAcademy(input: Input = {}) {
  return assembleAcademy(structuredClone(tables), structuredClone(metrics), inputSchema.parse(input));
}
export async function dbAcademy(input: Input = {}) {
  const parsed = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/operational-schema.ts");
  const db = getDatabase();
  const days = (await db.select().from(s.academyDays).orderBy(asc(s.academyDays.position), asc(s.academyDays.id))).map(
    (row) => ({ id: row.id, position: row.position, date: row.date }),
  );
  const classes = (
    await db.select().from(s.academyClasses).orderBy(asc(s.academyClasses.position), asc(s.academyClasses.id))
  ).map((row) => ({ id: row.id, position: row.position, grade: row.grade }));
  const rooms = (
    await db.select().from(s.academyRooms).orderBy(asc(s.academyRooms.position), asc(s.academyRooms.id))
  ).map((row) => ({ id: row.id, position: row.position, name: row.name }));
  const schedule = (
    await db.select().from(s.academySchedule).orderBy(asc(s.academySchedule.position), asc(s.academySchedule.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    classId: row.classId,
    roomId: row.roomId,
    date: row.date,
    starts: row.starts,
    ends: row.ends,
    subject: row.subject,
    status: row.status,
  }));
  const assignments = (
    await db
      .select()
      .from(s.academyAssignments)
      .orderBy(asc(s.academyAssignments.position), asc(s.academyAssignments.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    classId: row.classId,
    submitted: Number(row.submitted),
    pending: Number(row.pending),
    overdue: Number(row.overdue),
  }));
  const events = (
    await db.select().from(s.academyEvents).orderBy(asc(s.academyEvents.position), asc(s.academyEvents.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    dayOffset: Number(row.dayOffset),
    title: row.title,
    time: row.time,
    type: row.type,
  }));
  const performance = (
    await db
      .select()
      .from(s.academyPerformance)
      .orderBy(asc(s.academyPerformance.position), asc(s.academyPerformance.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    classId: row.classId,
    start: Number(row.start),
    duration: Number(row.duration),
    subject: row.subject,
    score: Number(row.score),
  }));
  const students = (
    await db.select().from(s.academyStudents).orderBy(asc(s.academyStudents.position), asc(s.academyStudents.id))
  ).map((row) => ({ id: row.id, position: row.position, name: row.name, initials: row.initials }));
  const achievements = (
    await db
      .select()
      .from(s.academyAchievements)
      .orderBy(asc(s.academyAchievements.position), asc(s.academyAchievements.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    studentId: row.studentId,
    performanceId: row.performanceId,
    achievement: row.achievement,
    score: Number(row.score),
  }));
  const loaded = await loadMetricCollections("operational-academy");
  const measures = { kpis: (loaded.kpis ?? []) as typeof metrics.kpis };
  return assembleAcademy(
    { days, classes, rooms, schedule, assignments, events, performance, students, achievements },
    measures,
    parsed,
  );
}
export async function readAcademy(input: Input = {}) {
  return readSource(
    () => demoAcademy(input),
    () => dbAcademy(input),
  );
}

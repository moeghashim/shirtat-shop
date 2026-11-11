import { asc } from "drizzle-orm";
import { z } from "zod";

import { metrics, tables } from "../db/fixtures/productivity.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { assembleProductivity } from "./operational-projectors.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ taskId: z.string().optional(), projectId: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoProductivity(input: Input = {}) {
  return assembleProductivity(structuredClone(tables), structuredClone(metrics), inputSchema.parse(input));
}
export async function dbProductivity(input: Input = {}) {
  const parsed = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/operational-schema.ts");
  const db = getDatabase();
  const days = (
    await db.select().from(s.productivityDays).orderBy(asc(s.productivityDays.position), asc(s.productivityDays.id))
  ).map((row) => ({ id: row.id, position: row.position, date: row.date, greeting: row.greeting }));
  const tasks = (
    await db.select().from(s.productivityTasks).orderBy(asc(s.productivityTasks.position), asc(s.productivityTasks.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    title: row.title,
    tag: row.tag,
    time: row.time,
    checked: row.checked,
  }));
  const projects = (
    await db
      .select()
      .from(s.productivityProjects)
      .orderBy(asc(s.productivityProjects.position), asc(s.productivityProjects.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    title: row.title,
    status: row.status,
    description: row.description,
    progress: Number(row.progress),
    icon: row.icon,
    dueDate: row.dueDate,
  }));
  const notes = (
    await db.select().from(s.productivityNotes).orderBy(asc(s.productivityNotes.position), asc(s.productivityNotes.id))
  ).map((row) => ({ id: row.id, position: row.position, title: row.title, date: row.date, icon: row.icon }));
  const goals = (
    await db.select().from(s.productivityGoals).orderBy(asc(s.productivityGoals.position), asc(s.productivityGoals.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    completed: Number(row.completed),
    total: Number(row.total),
    progress: Number(row.progress),
    encouragement: row.encouragement,
  }));
  const focus = (
    await db.select().from(s.productivityFocus).orderBy(asc(s.productivityFocus.position), asc(s.productivityFocus.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    minutes: Number(row.minutes),
    seconds: Number(row.seconds),
    state: row.state,
  }));
  const quotes = (
    await db
      .select()
      .from(s.productivityQuotes)
      .orderBy(asc(s.productivityQuotes.position), asc(s.productivityQuotes.id))
  ).map((row) => ({ id: row.id, position: row.position, quote: row.quote, encouragement: row.encouragement }));
  const loaded = await loadMetricCollections("operational-productivity");
  const measures = { summaryCards: (loaded.summaryCards ?? []) as typeof metrics.summaryCards };
  return assembleProductivity({ days, tasks, projects, notes, goals, focus, quotes }, measures, parsed);
}
export async function readProductivity(input: Input = {}) {
  return readSource(
    () => demoProductivity(input),
    () => dbProductivity(input),
  );
}

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { calendars, templates } from "../db/fixtures/calendar.ts";
import { type CalendarData, projectEvents } from "./calendar.types.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({
  renderedAt: z.iso.datetime(),
  id: z.string().optional(),
  timeZone: z.string().default("UTC"),
});
type Input = z.input<typeof inputSchema>;
export async function demoCalendar(input: Input) {
  const { renderedAt, id, timeZone } = inputSchema.parse(input);
  const data: CalendarData = structuredClone({
    renderedAt,
    calendars,
    templates: templates.filter((t) => id === undefined || t.id === id),
  });
  return { ...data, events: projectEvents(data.templates, renderedAt, timeZone) };
}
export async function dbCalendar(input: Input) {
  const { renderedAt, id, timeZone } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/workspace-schema.ts");
  const db = getDatabase();
  const rows = await db
    .select()
    .from(s.calendarTemplates)
    .where(id === undefined ? undefined : eq(s.calendarTemplates.id, id))
    .orderBy(asc(s.calendarTemplates.position), asc(s.calendarTemplates.id));
  const cs = await db
    .select()
    .from(s.calendarDefinitions)
    .orderBy(asc(s.calendarDefinitions.position), asc(s.calendarDefinitions.value));
  const data: CalendarData = {
    renderedAt,
    templates: rows.map(({ position: _, ...t }) => t),
    calendars: cs.map(({ position: _, ...c }) => c),
  };
  return { ...data, events: projectEvents(data.templates, renderedAt, timeZone) };
}
export async function readCalendar(input: Input) {
  return readSource(
    () => demoCalendar(input),
    () => dbCalendar(input),
  );
}

import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { tasks } from "../db/fixtures/tasks.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ id: z.string().optional(), status: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoTasks(input: Input = {}) {
  const { id, status } = inputSchema.parse(input);
  return structuredClone(
    tasks.filter((t) => (id === undefined || t.id === id) && (status === undefined || t.status === status)),
  );
}
export async function dbTasks(input: Input = {}) {
  const { id, status } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const { ledgerTasks: t } = await import("../db/workspace-schema.ts");
  const rows = await getDatabase()
    .select()
    .from(t)
    .where(and(id === undefined ? undefined : eq(t.id, id), status === undefined ? undefined : eq(t.status, status)))
    .orderBy(asc(t.position), asc(t.id));
  return rows.map(({ position: _, ...row }) => row);
}
export async function readTasks(input: Input = {}) {
  return readSource(
    () => demoTasks(input),
    () => dbTasks(input),
  );
}

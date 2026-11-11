import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import type { BoardState, Column } from "../../routes/(main)/dashboard/projects/-components/kanban/types.ts";
import { columns, initialBoard } from "../db/fixtures/kanban.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ id: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
type Result = { columns: Column[]; board: BoardState };
export async function demoKanban(input: Input = {}): Promise<Result> {
  const { id } = inputSchema.parse(input);
  return structuredClone({
    columns: [...columns],
    board: Object.fromEntries(
      columns.map((c) => [c.id, initialBoard[c.id].filter((t) => id === undefined || t.id === id)]),
    ) as BoardState,
  });
}
export async function dbKanban(input: Input = {}): Promise<Result> {
  const { id } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/workspace-schema.ts");
  const db = getDatabase();
  const cols = await db.select().from(s.boardColumns).orderBy(asc(s.boardColumns.position), asc(s.boardColumns.id));
  const tasks = await db
    .select({ task: s.boardTasks, owner: s.boardOwners })
    .from(s.boardTasks)
    .innerJoin(s.boardOwners, eq(s.boardTasks.ownerId, s.boardOwners.id))
    .where(id === undefined ? undefined : eq(s.boardTasks.id, id))
    .orderBy(asc(s.boardTasks.position), asc(s.boardTasks.id));
  const insights = await db.select().from(s.boardInsights).orderBy(asc(s.boardInsights.position));
  return {
    columns: cols.map(({ position: _, ...c }) => c),
    board: Object.fromEntries(
      cols.map((c) => [
        c.id,
        tasks
          .filter((t) => t.task.columnId === c.id)
          .map(({ task, owner }) => {
            const { position: _, columnId: __, ownerId: ___, ...rest } = task;
            return {
              ...rest,
              owner: { name: owner.name },
              insights: insights.filter((i) => i.taskId === task.id).map(({ label, count }) => ({ label, count })),
            };
          }),
      ]),
    ) as BoardState,
  };
}
export async function readKanban(input: Input = {}) {
  return readSource(
    () => demoKanban(input),
    () => dbKanban(input),
  );
}

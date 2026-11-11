import { eq } from "drizzle-orm";

import type { getDatabase } from "./client.server.ts";
import { calendars, templates } from "./fixtures/calendar.ts";
import { files, folders } from "./fixtures/files.ts";
import { columns, initialBoard, taskOwners } from "./fixtures/kanban.ts";
import { tasks } from "./fixtures/tasks.ts";
import * as s from "./workspace-schema.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];
export async function seedWorkspace(tx: Transaction) {
  for (const [position, c] of columns.entries()) {
    const row = { ...c, position };
    await tx.insert(s.boardColumns).values(row).onConflictDoUpdate({ target: s.boardColumns.id, set: row });
  }
  for (const [id, owner] of Object.entries(taskOwners)) {
    const row = { id, ...owner };
    await tx.insert(s.boardOwners).values(row).onConflictDoUpdate({ target: s.boardOwners.id, set: row });
  }
  for (const column of columns)
    for (const [position, t] of initialBoard[column.id].entries()) {
      await tx.insert(s.boardTeams).values({ name: t.team }).onConflictDoNothing();
      const { owner, insights, ...rest } = t;
      const ownerId = Object.entries(taskOwners).find(([, value]) => value.name === owner.name)?.[0];
      if (!ownerId) throw new Error("Missing board owner");
      const row = {
        ...rest,
        position,
        columnId: column.id,
        ownerId,
      };
      await tx.insert(s.boardTasks).values(row).onConflictDoUpdate({ target: s.boardTasks.id, set: row });
      await tx.delete(s.boardInsights).where(eq(s.boardInsights.taskId, t.id));
      for (const [position, insight] of insights.entries())
        await tx.insert(s.boardInsights).values({ ...insight, position, taskId: t.id });
    }
  for (const [position, t] of tasks.entries()) {
    const row = { ...t, position };
    await tx.insert(s.ledgerTasks).values(row).onConflictDoUpdate({ target: s.ledgerTasks.id, set: row });
  }
  for (const [position, f] of folders.entries()) {
    const row = { ...f, position };
    await tx.insert(s.workspaceFolders).values(row).onConflictDoUpdate({ target: s.workspaceFolders.id, set: row });
  }
  for (const [position, f] of files.entries()) {
    const { owner, ownerInitials, shared, ...rest } = f;
    const ownerId = owner.toLowerCase().replaceAll(" ", "-");
    const person = { id: ownerId, name: owner, initials: ownerInitials };
    await tx.insert(s.fileOwners).values(person).onConflictDoUpdate({ target: s.fileOwners.id, set: person });
    const row = { ...rest, position, ownerId };
    await tx.insert(s.workspaceFiles).values(row).onConflictDoUpdate({ target: s.workspaceFiles.id, set: row });
    const share = { fileId: f.id, shared };
    await tx.insert(s.fileShares).values(share).onConflictDoUpdate({ target: s.fileShares.fileId, set: share });
  }
  for (const [position, c] of calendars.entries()) {
    const row = { ...c, position };
    await tx
      .insert(s.calendarDefinitions)
      .values(row)
      .onConflictDoUpdate({ target: s.calendarDefinitions.value, set: row });
  }
  for (const [position, t] of templates.entries()) {
    const row = { ...t, position };
    await tx.insert(s.calendarTemplates).values(row).onConflictDoUpdate({ target: s.calendarTemplates.id, set: row });
  }
}

import type { getDatabase } from "./client.server.ts";
import * as f from "./fixtures/projects.ts";
import * as s from "./project-schema.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];
export async function seedProjects(tx: Transaction) {
  for (const row of f.people)
    await tx.insert(s.projectPeople).values(row).onConflictDoUpdate({ target: s.projectPeople.id, set: row });
  for (const row of f.projects)
    await tx.insert(s.projects).values(row).onConflictDoUpdate({ target: s.projects.id, set: row });
  for (const row of f.members)
    await tx
      .insert(s.projectMembers)
      .values(row)
      .onConflictDoUpdate({ target: [s.projectMembers.projectId, s.projectMembers.personId], set: row });
  // Canonical titles come from the same authored fixtures as legacy workspace seeds.
  // Upsert them on repeat seeds so existing sample installations receive copy fixes.
  for (const row of f.projectTasks)
    await tx.insert(s.projectTasks).values(row).onConflictDoUpdate({ target: s.projectTasks.id, set: row });
  for (const row of f.labels) await tx.insert(s.projectLabels).values(row).onConflictDoNothing();
  for (const row of f.taskLabels) await tx.insert(s.projectTaskLabels).values(row).onConflictDoNothing();
  for (const row of f.subtasks)
    await tx.insert(s.projectSubtasks).values(row).onConflictDoUpdate({ target: s.projectSubtasks.id, set: row });
  for (const row of f.folderLinks) await tx.insert(s.projectFolders).values(row).onConflictDoNothing();
  for (const row of f.fileLinks) await tx.insert(s.projectFiles).values(row).onConflictDoNothing();
  for (const row of f.eventLinks) await tx.insert(s.projectEvents).values(row).onConflictDoNothing();
  for (const row of f.activity)
    await tx.insert(s.projectActivity).values(row).onConflictDoUpdate({ target: s.projectActivity.id, set: row });
}

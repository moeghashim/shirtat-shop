import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { files, folders } from "../db/fixtures/files.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ id: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoFiles(input: Input = {}) {
  const { id } = inputSchema.parse(input);
  return structuredClone({
    files: files.filter((f) => id === undefined || f.id === id),
    folders: folders.filter((f) => id === undefined || f.id === id),
  });
}
export async function dbFiles(input: Input = {}) {
  const { id } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/workspace-schema.ts");
  const db = getDatabase();
  const rows = await db
    .select({ file: s.workspaceFiles, owner: s.fileOwners, shared: s.fileShares.shared })
    .from(s.workspaceFiles)
    .innerJoin(s.fileOwners, eq(s.workspaceFiles.ownerId, s.fileOwners.id))
    .innerJoin(s.fileShares, eq(s.workspaceFiles.id, s.fileShares.fileId))
    .where(id === undefined ? undefined : eq(s.workspaceFiles.id, id))
    .orderBy(asc(s.workspaceFiles.position), asc(s.workspaceFiles.id));
  const folderRows = await db
    .select()
    .from(s.workspaceFolders)
    .where(id === undefined ? undefined : eq(s.workspaceFolders.id, id))
    .orderBy(asc(s.workspaceFolders.position), asc(s.workspaceFolders.id));
  return {
    files: rows.map(({ file, owner, shared }) => {
      const { position: _, ownerId: __, ...rest } = file;
      return { ...rest, owner: owner.name, ownerInitials: owner.initials, shared };
    }),
    folders: folderRows.map(({ position: _, ...f }) => f),
  };
}
export async function readFiles(input: Input = {}) {
  return readSource(
    () => demoFiles(input),
    () => dbFiles(input),
  );
}

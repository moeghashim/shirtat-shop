import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { users } from "../db/fixtures/users.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ email: z.string().optional() });
export type UsersInput = z.infer<typeof inputSchema>;
export async function demoUsers(input: UsersInput = {}) {
  const { email } = inputSchema.parse(input);
  return structuredClone(users.filter((row) => email === undefined || row.email === email));
}
export async function dbUsers(input: UsersInput = {}) {
  const { email } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const { directoryUsers, workspaceMemberships } = await import("../db/schema.ts");
  const db = getDatabase();
  const rows = await db
    .select()
    .from(directoryUsers)
    .where(email === undefined ? undefined : eq(directoryUsers.email, email))
    .orderBy(asc(directoryUsers.position), asc(directoryUsers.email));
  const memberships = await db.select().from(workspaceMemberships).orderBy(asc(workspaceMemberships.position));
  return rows.map(({ position: _position, ...row }) => ({
    ...row,
    workspace: memberships.filter((m) => m.userEmail === row.email).map((m) => m.workspaceName),
  }));
}
export async function readUsers(input: UsersInput = {}) {
  return readSource(
    () => demoUsers(input),
    () => dbUsers(input),
  );
}

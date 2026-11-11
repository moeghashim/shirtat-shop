import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { roles } from "../db/fixtures/roles.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ role: z.string().optional() });
export type RolesInput = z.infer<typeof inputSchema>;
export async function demoRoles(input: RolesInput = {}) {
  const { role } = inputSchema.parse(input);
  return structuredClone(roles.filter((row) => role === undefined || row.role === role));
}
export async function dbRoles(input: RolesInput = {}) {
  const { role } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const { displayRoles, rolePermissions } = await import("../db/schema.ts");
  const db = getDatabase();
  const rows = await db
    .select()
    .from(displayRoles)
    .where(role === undefined ? undefined : eq(displayRoles.role, role))
    .orderBy(asc(displayRoles.position), asc(displayRoles.role));
  const permissions = await db.select().from(rolePermissions).orderBy(asc(rolePermissions.position));
  return rows.map(({ position: _position, ...row }) => ({
    ...row,
    permissionSets: permissions.filter((p) => p.role === row.role).map((p) => p.permission),
  }));
}
export async function readRoles(input: RolesInput = {}) {
  return readSource(
    () => demoRoles(input),
    () => dbRoles(input),
  );
}

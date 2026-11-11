import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import type { DemoAccount } from "../../data/users.ts";
import { accounts } from "../db/fixtures/accounts.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ id: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoAccounts(input: Input = {}): Promise<DemoAccount[]> {
  const { id } = inputSchema.parse(input);
  return structuredClone(accounts.filter((a) => id === undefined || a.id === id));
}
export async function dbAccounts(input: Input = {}): Promise<DemoAccount[]> {
  const { id } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const { demoAccounts: table } = await import("../db/people-schema.ts");
  return (
    await getDatabase()
      .select()
      .from(table)
      .where(id === undefined ? undefined : eq(table.id, id))
      .orderBy(asc(table.position), asc(table.id))
  ).map(({ position: _position, ...row }) => row);
}
export async function readAccounts(input: Input = {}) {
  return readSource(
    () => demoAccounts(input),
    () => dbAccounts(input),
  );
}

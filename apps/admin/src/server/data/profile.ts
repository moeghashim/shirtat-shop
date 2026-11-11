import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import type { ProfileRecord } from "../../routes/(main)/dashboard/profile/-components/profile-data.ts";
import { profile } from "../db/fixtures/profile.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ id: z.string().default("WS-2301") });
type Input = z.input<typeof inputSchema>;
export async function demoProfile(input: Input = {}): Promise<ProfileRecord | null> {
  const { id } = inputSchema.parse(input);
  return id === profile.contractorId ? structuredClone(profile) : null;
}
export async function dbProfile(input: Input = {}): Promise<ProfileRecord | null> {
  const { id } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const { profiles, profilePeople, profileContacts, profileEmployment, profileLeave, profileDocuments } = await import(
    "../db/people-schema.ts"
  );
  const db = getDatabase();
  const [row] = await db
    .select()
    .from(profiles)
    .innerJoin(profilePeople, eq(profiles.managerId, profilePeople.id))
    .innerJoin(profileContacts, eq(profiles.contractorId, profileContacts.contractorId))
    .innerJoin(profileEmployment, eq(profiles.contractorId, profileEmployment.contractorId))
    .innerJoin(profileLeave, eq(profiles.contractorId, profileLeave.contractorId))
    .where(eq(profiles.contractorId, id));
  if (!row) return null;
  const { managerId: _managerId, ...identity } = row.profiles;
  const { id: _personId, ...manager } = row.profile_people;
  const documents = (
    await db
      .select()
      .from(profileDocuments)
      .where(eq(profileDocuments.contractorId, id))
      .orderBy(asc(profileDocuments.position), asc(profileDocuments.id))
  ).map(({ contractorId: _id, position: _position, ...document }) => document);
  return { ...identity, ...row.profile_contacts, ...row.profile_employment, ...row.profile_leave, manager, documents };
}
export async function readProfile(input: Input = {}) {
  return readSource(
    () => demoProfile(input),
    () => dbProfile(input),
  );
}

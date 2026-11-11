import { asc } from "drizzle-orm";
import { z } from "zod";

import { metrics, tables } from "../db/fixtures/infrastructure.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { assembleInfrastructure } from "./operational-projectors.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ groupId: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoInfrastructure(input: Input = {}) {
  return assembleInfrastructure(structuredClone(tables), structuredClone(metrics), inputSchema.parse(input));
}
export async function dbInfrastructure(input: Input = {}) {
  const parsed = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/operational-schema.ts");
  const db = getDatabase();
  const organizations = (
    await db
      .select()
      .from(s.infrastructureOrganizations)
      .orderBy(asc(s.infrastructureOrganizations.position), asc(s.infrastructureOrganizations.id))
  ).map((row) => ({ id: row.id, position: row.position, name: row.name }));
  const projects = (
    await db
      .select()
      .from(s.infrastructureProjects)
      .orderBy(asc(s.infrastructureProjects.position), asc(s.infrastructureProjects.id))
  ).map((row) => ({ id: row.id, position: row.position, organizationId: row.organizationId, name: row.name }));
  const environments = (
    await db
      .select()
      .from(s.infrastructureEnvironments)
      .orderBy(asc(s.infrastructureEnvironments.position), asc(s.infrastructureEnvironments.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    projectId: row.projectId,
    domain: row.domain,
    environment: row.environment,
    status: row.status,
    server: row.server,
    countryCode: row.countryCode,
    plan: row.plan,
    platformName: row.platformName,
    platformIcon: row.platformIcon,
    latencyMs: Number(row.latencyMs),
    uptimeHours: Number(row.uptimeHours),
  }));
  const resources = (
    await db
      .select()
      .from(s.infrastructureResources)
      .orderBy(asc(s.infrastructureResources.position), asc(s.infrastructureResources.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    environmentId: row.environmentId,
    cpu: Number(row.cpu),
    ram: Number(row.ram),
    disk: Number(row.disk),
  }));
  const loaded = await loadMetricCollections("operational-infrastructure");
  const measures = { header: (loaded.header ?? []) as typeof metrics.header };
  return assembleInfrastructure({ organizations, projects, environments, resources }, measures, parsed);
}
export async function readInfrastructure(input: Input = {}) {
  return readSource(
    () => demoInfrastructure(input),
    () => dbInfrastructure(input),
  );
}

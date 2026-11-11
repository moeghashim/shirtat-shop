import { asc } from "drizzle-orm";
import { z } from "zod";

import { metrics, tables } from "../db/fixtures/logistics.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { assembleLogistics } from "./operational-projectors.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ id: z.string().optional(), customerId: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoLogistics(input: Input = {}) {
  return assembleLogistics(structuredClone(tables), structuredClone(metrics), inputSchema.parse(input));
}
export async function dbLogistics(input: Input = {}) {
  const parsed = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/operational-schema.ts");
  const db = getDatabase();
  const customers = (
    await db
      .select()
      .from(s.logisticsCustomers)
      .orderBy(asc(s.logisticsCustomers.position), asc(s.logisticsCustomers.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    name: row.name,
    initials: row.initials,
    tier: row.tier,
    tierLabel: row.tierLabel,
  }));
  const shipments = (
    await db
      .select()
      .from(s.logisticsShipments)
      .orderBy(asc(s.logisticsShipments.position), asc(s.logisticsShipments.id))
  ).map((row) => ({ id: row.id, position: row.position, customerId: row.customerId }));
  const locations = (
    await db
      .select()
      .from(s.logisticsLocations)
      .orderBy(asc(s.logisticsLocations.position), asc(s.logisticsLocations.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    shipmentId: row.shipmentId,
    role: row.role,
    display: row.display,
    country: row.country,
    countryCode: row.countryCode,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
  }));
  const cargo = (
    await db.select().from(s.logisticsCargo).orderBy(asc(s.logisticsCargo.position), asc(s.logisticsCargo.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    shipmentId: row.shipmentId,
    description: row.description,
    weightKg: Number(row.weightKg),
  }));
  const tracking = (
    await db.select().from(s.logisticsTracking).orderBy(asc(s.logisticsTracking.position), asc(s.logisticsTracking.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    shipmentId: row.shipmentId,
    eta: row.eta,
    etaMeta: row.etaMeta,
    status: row.status,
    progress: Number(row.progress),
    mode: row.mode,
    routeType: row.routeType,
    transportNumber: row.transportNumber,
  }));
  const handling = (
    await db.select().from(s.logisticsHandling).orderBy(asc(s.logisticsHandling.position), asc(s.logisticsHandling.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    shipmentId: row.shipmentId,
    label: row.label,
    note: row.note,
  }));
  const tags = (
    await db.select().from(s.logisticsTags).orderBy(asc(s.logisticsTags.position), asc(s.logisticsTags.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    shipmentId: row.shipmentId,
    label: row.label,
    icon: row.icon,
  }));
  const loaded = await loadMetricCollections("operational-logistics");
  const measures = { counts: (loaded.counts ?? []) as typeof metrics.counts };
  return assembleLogistics({ customers, shipments, locations, cargo, tracking, handling, tags }, measures, parsed);
}
export async function readLogistics(input: Input = {}) {
  return readSource(
    () => demoLogistics(input),
    () => dbLogistics(input),
  );
}

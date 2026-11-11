import { asc } from "drizzle-orm";
import { z } from "zod";

import { tables } from "../db/fixtures/patients.ts";
import { assemblePatients } from "./operational-projectors.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ id: z.string().optional(), status: z.enum(["alarm", "stable"]).optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoPatients(input: Input = {}) {
  return assemblePatients(structuredClone(tables), inputSchema.parse(input));
}
export async function dbPatients(input: Input = {}) {
  const parsed = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/operational-schema.ts");
  const db = getDatabase();
  const beds = (
    await db.select().from(s.patientsBeds).orderBy(asc(s.patientsBeds.position), asc(s.patientsBeds.id))
  ).map((row) => ({ id: row.id, position: row.position, label: row.label }));
  const identities = (
    await db
      .select()
      .from(s.patientsIdentities)
      .orderBy(asc(s.patientsIdentities.position), asc(s.patientsIdentities.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    bedId: row.bedId,
    name: row.name,
    age: Number(row.age),
    sex: row.sex,
    diagnosis: row.diagnosis,
    status: row.status,
  }));
  const vitals = (
    await db.select().from(s.patientsVitals).orderBy(asc(s.patientsVitals.position), asc(s.patientsVitals.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    patientId: row.patientId,
    heartRate: Number(row.heartRate),
    arterialMap: Number(row.arterialMap),
    map: Number(row.map),
    respirationRate: Number(row.respirationRate),
    spo2: Number(row.spo2),
    temperature: Number(row.temperature),
    nibpSystolic: Number(row.nibpSystolic),
    nibpDiastolic: Number(row.nibpDiastolic),
    arterialSystolic: Number(row.arterialSystolic),
    arterialDiastolic: Number(row.arterialDiastolic),
  }));
  const signals = (
    await db.select().from(s.patientsSignals).orderBy(asc(s.patientsSignals.position), asc(s.patientsSignals.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    patientId: row.patientId,
    amplitude: Number(row.amplitude),
    phase: Number(row.phase),
    rhythm: row.rhythm,
  }));
  const alarms = (
    await db.select().from(s.patientsAlarms).orderBy(asc(s.patientsAlarms.position), asc(s.patientsAlarms.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    patientId: row.patientId,
    label: row.label,
    shortLabel: row.shortLabel,
    durationSeconds: Number(row.durationSeconds),
  }));
  const events = (
    await db.select().from(s.patientsEvents).orderBy(asc(s.patientsEvents.position), asc(s.patientsEvents.id))
  ).map((row) => ({ id: row.id, position: row.position, patientId: row.patientId, label: row.label, time: row.time }));
  const settings = (
    await db.select().from(s.patientsSettings).orderBy(asc(s.patientsSettings.position), asc(s.patientsSettings.id))
  ).map((row) => ({
    id: row.id,
    position: row.position,
    initialPatientId: row.initialPatientId,
    deviceId: row.deviceId,
    connected: row.connected,
    audioEnabled: row.audioEnabled,
    networkConnected: row.networkConnected,
    recordingActive: row.recordingActive,
    historyHours: Number(row.historyHours),
    hrMin: Number(row.hrMin),
    hrMax: Number(row.hrMax),
    spo2Min: Number(row.spo2Min),
    spo2Max: Number(row.spo2Max),
    rrMin: Number(row.rrMin),
    rrMax: Number(row.rrMax),
    nibpMin: Number(row.nibpMin),
    nibpMax: Number(row.nibpMax),
    arterialMin: Number(row.arterialMin),
    arterialMax: Number(row.arterialMax),
    temperatureMin: Number(row.temperatureMin),
    temperatureMax: Number(row.temperatureMax),
  }));
  return assemblePatients({ beds, identities, vitals, signals, alarms, events, settings }, parsed);
}
export async function readPatients(input: Input = {}) {
  return readSource(
    () => demoPatients(input),
    () => dbPatients(input),
  );
}

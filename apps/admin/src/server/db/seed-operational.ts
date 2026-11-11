import type { getDatabase } from "./client.server.ts";
import * as s from "./operational-schema.ts";
import { seedMetricCollection } from "./seed-metrics.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];

import { metrics as academyMetrics, tables as academyTables } from "./fixtures/academy.ts";
import { metrics as infrastructureMetrics, tables as infrastructureTables } from "./fixtures/infrastructure.ts";
import { metrics as logisticsMetrics, tables as logisticsTables } from "./fixtures/logistics.ts";
import { tables as patientsTables } from "./fixtures/patients.ts";
import { metrics as productivityMetrics, tables as productivityTables } from "./fixtures/productivity.ts";
export async function seedOperational(tx: Transaction) {
  for (const item of productivityTables.days) {
    const row = { id: item.id, position: item.position, date: item.date, greeting: item.greeting };
    await tx.insert(s.productivityDays).values(row).onConflictDoUpdate({ target: s.productivityDays.id, set: row });
  }
  for (const item of productivityTables.tasks) {
    const row = {
      id: item.id,
      position: item.position,
      title: item.title,
      tag: item.tag,
      time: item.time,
      checked: item.checked,
    };
    await tx.insert(s.productivityTasks).values(row).onConflictDoUpdate({ target: s.productivityTasks.id, set: row });
  }
  for (const item of productivityTables.projects) {
    const row = {
      id: item.id,
      position: item.position,
      title: item.title,
      status: item.status,
      description: item.description,
      progress: String(item.progress),
      icon: item.icon,
      dueDate: item.dueDate,
    };
    await tx
      .insert(s.productivityProjects)
      .values(row)
      .onConflictDoUpdate({ target: s.productivityProjects.id, set: row });
  }
  for (const item of productivityTables.notes) {
    const row = { id: item.id, position: item.position, title: item.title, date: item.date, icon: item.icon };
    await tx.insert(s.productivityNotes).values(row).onConflictDoUpdate({ target: s.productivityNotes.id, set: row });
  }
  for (const item of productivityTables.goals) {
    const row = {
      id: item.id,
      position: item.position,
      completed: String(item.completed),
      total: String(item.total),
      progress: String(item.progress),
      encouragement: item.encouragement,
    };
    await tx.insert(s.productivityGoals).values(row).onConflictDoUpdate({ target: s.productivityGoals.id, set: row });
  }
  for (const item of productivityTables.focus) {
    const row = {
      id: item.id,
      position: item.position,
      minutes: String(item.minutes),
      seconds: String(item.seconds),
      state: item.state,
    };
    await tx.insert(s.productivityFocus).values(row).onConflictDoUpdate({ target: s.productivityFocus.id, set: row });
  }
  for (const item of productivityTables.quotes) {
    const row = { id: item.id, position: item.position, quote: item.quote, encouragement: item.encouragement };
    await tx.insert(s.productivityQuotes).values(row).onConflictDoUpdate({ target: s.productivityQuotes.id, set: row });
  }
  for (const item of academyTables.days) {
    const row = { id: item.id, position: item.position, date: item.date };
    await tx.insert(s.academyDays).values(row).onConflictDoUpdate({ target: s.academyDays.id, set: row });
  }
  for (const item of academyTables.classes) {
    const row = { id: item.id, position: item.position, grade: item.grade };
    await tx.insert(s.academyClasses).values(row).onConflictDoUpdate({ target: s.academyClasses.id, set: row });
  }
  for (const item of academyTables.rooms) {
    const row = { id: item.id, position: item.position, name: item.name };
    await tx.insert(s.academyRooms).values(row).onConflictDoUpdate({ target: s.academyRooms.id, set: row });
  }
  for (const item of academyTables.schedule) {
    const row = {
      id: item.id,
      position: item.position,
      classId: item.classId,
      roomId: item.roomId,
      date: item.date,
      starts: item.starts,
      ends: item.ends,
      subject: item.subject,
      status: item.status,
    };
    await tx.insert(s.academySchedule).values(row).onConflictDoUpdate({ target: s.academySchedule.id, set: row });
  }
  for (const item of academyTables.assignments) {
    const row = {
      id: item.id,
      position: item.position,
      classId: item.classId,
      submitted: String(item.submitted),
      pending: String(item.pending),
      overdue: String(item.overdue),
    };
    await tx.insert(s.academyAssignments).values(row).onConflictDoUpdate({ target: s.academyAssignments.id, set: row });
  }
  for (const item of academyTables.events) {
    const row = {
      id: item.id,
      position: item.position,
      dayOffset: String(item.dayOffset),
      title: item.title,
      time: item.time,
      type: item.type,
    };
    await tx.insert(s.academyEvents).values(row).onConflictDoUpdate({ target: s.academyEvents.id, set: row });
  }
  for (const item of academyTables.performance) {
    const row = {
      id: item.id,
      position: item.position,
      classId: item.classId,
      start: String(item.start),
      duration: String(item.duration),
      subject: item.subject,
      score: String(item.score),
    };
    await tx.insert(s.academyPerformance).values(row).onConflictDoUpdate({ target: s.academyPerformance.id, set: row });
  }
  for (const item of academyTables.students) {
    const row = { id: item.id, position: item.position, name: item.name, initials: item.initials };
    await tx.insert(s.academyStudents).values(row).onConflictDoUpdate({ target: s.academyStudents.id, set: row });
  }
  for (const item of academyTables.achievements) {
    const row = {
      id: item.id,
      position: item.position,
      studentId: item.studentId,
      performanceId: item.performanceId,
      achievement: item.achievement,
      score: String(item.score),
    };
    await tx
      .insert(s.academyAchievements)
      .values(row)
      .onConflictDoUpdate({ target: s.academyAchievements.id, set: row });
  }
  for (const item of logisticsTables.customers) {
    const row = {
      id: item.id,
      position: item.position,
      name: item.name,
      initials: item.initials,
      tier: item.tier,
      tierLabel: item.tierLabel,
    };
    await tx.insert(s.logisticsCustomers).values(row).onConflictDoUpdate({ target: s.logisticsCustomers.id, set: row });
  }
  for (const item of logisticsTables.shipments) {
    const row = { id: item.id, position: item.position, customerId: item.customerId };
    await tx.insert(s.logisticsShipments).values(row).onConflictDoUpdate({ target: s.logisticsShipments.id, set: row });
  }
  for (const item of logisticsTables.locations) {
    const row = {
      id: item.id,
      position: item.position,
      shipmentId: item.shipmentId,
      role: item.role,
      display: item.display,
      country: item.country,
      countryCode: item.countryCode,
      longitude: String(item.longitude),
      latitude: String(item.latitude),
    };
    await tx.insert(s.logisticsLocations).values(row).onConflictDoUpdate({ target: s.logisticsLocations.id, set: row });
  }
  for (const item of logisticsTables.cargo) {
    const row = {
      id: item.id,
      position: item.position,
      shipmentId: item.shipmentId,
      description: item.description,
      weightKg: String(item.weightKg),
    };
    await tx.insert(s.logisticsCargo).values(row).onConflictDoUpdate({ target: s.logisticsCargo.id, set: row });
  }
  for (const item of logisticsTables.tracking) {
    const row = {
      id: item.id,
      position: item.position,
      shipmentId: item.shipmentId,
      eta: item.eta,
      etaMeta: item.etaMeta,
      status: item.status,
      progress: String(item.progress),
      mode: item.mode,
      routeType: item.routeType,
      transportNumber: item.transportNumber,
    };
    await tx.insert(s.logisticsTracking).values(row).onConflictDoUpdate({ target: s.logisticsTracking.id, set: row });
  }
  for (const item of logisticsTables.handling) {
    const row = {
      id: item.id,
      position: item.position,
      shipmentId: item.shipmentId,
      label: item.label,
      note: item.note,
    };
    await tx.insert(s.logisticsHandling).values(row).onConflictDoUpdate({ target: s.logisticsHandling.id, set: row });
  }
  for (const item of logisticsTables.tags) {
    const row = {
      id: item.id,
      position: item.position,
      shipmentId: item.shipmentId,
      label: item.label,
      icon: item.icon,
    };
    await tx.insert(s.logisticsTags).values(row).onConflictDoUpdate({ target: s.logisticsTags.id, set: row });
  }
  for (const item of infrastructureTables.organizations) {
    const row = { id: item.id, position: item.position, name: item.name };
    await tx
      .insert(s.infrastructureOrganizations)
      .values(row)
      .onConflictDoUpdate({ target: s.infrastructureOrganizations.id, set: row });
  }
  for (const item of infrastructureTables.projects) {
    const row = { id: item.id, position: item.position, organizationId: item.organizationId, name: item.name };
    await tx
      .insert(s.infrastructureProjects)
      .values(row)
      .onConflictDoUpdate({ target: s.infrastructureProjects.id, set: row });
  }
  for (const item of infrastructureTables.environments) {
    const row = {
      id: item.id,
      position: item.position,
      projectId: item.projectId,
      domain: item.domain,
      environment: item.environment,
      status: item.status,
      server: item.server,
      countryCode: item.countryCode,
      plan: item.plan,
      platformName: item.platformName,
      platformIcon: item.platformIcon,
      latencyMs: String(item.latencyMs),
      uptimeHours: String(item.uptimeHours),
    };
    await tx
      .insert(s.infrastructureEnvironments)
      .values(row)
      .onConflictDoUpdate({ target: s.infrastructureEnvironments.id, set: row });
  }
  for (const item of infrastructureTables.resources) {
    const row = {
      id: item.id,
      position: item.position,
      environmentId: item.environmentId,
      cpu: String(item.cpu),
      ram: String(item.ram),
      disk: String(item.disk),
    };
    await tx
      .insert(s.infrastructureResources)
      .values(row)
      .onConflictDoUpdate({ target: s.infrastructureResources.id, set: row });
  }
  for (const item of patientsTables.beds) {
    const row = { id: item.id, position: item.position, label: item.label };
    await tx.insert(s.patientsBeds).values(row).onConflictDoUpdate({ target: s.patientsBeds.id, set: row });
  }
  for (const item of patientsTables.identities) {
    const row = {
      id: item.id,
      position: item.position,
      bedId: item.bedId,
      name: item.name,
      age: String(item.age),
      sex: item.sex,
      diagnosis: item.diagnosis,
      status: item.status,
    };
    await tx.insert(s.patientsIdentities).values(row).onConflictDoUpdate({ target: s.patientsIdentities.id, set: row });
  }
  for (const item of patientsTables.vitals) {
    const row = {
      id: item.id,
      position: item.position,
      patientId: item.patientId,
      heartRate: String(item.heartRate),
      arterialMap: String(item.arterialMap),
      map: String(item.map),
      respirationRate: String(item.respirationRate),
      spo2: String(item.spo2),
      temperature: String(item.temperature),
      nibpSystolic: String(item.nibpSystolic),
      nibpDiastolic: String(item.nibpDiastolic),
      arterialSystolic: String(item.arterialSystolic),
      arterialDiastolic: String(item.arterialDiastolic),
    };
    await tx.insert(s.patientsVitals).values(row).onConflictDoUpdate({ target: s.patientsVitals.id, set: row });
  }
  for (const item of patientsTables.signals) {
    const row = {
      id: item.id,
      position: item.position,
      patientId: item.patientId,
      amplitude: String(item.amplitude),
      phase: String(item.phase),
      rhythm: item.rhythm,
    };
    await tx.insert(s.patientsSignals).values(row).onConflictDoUpdate({ target: s.patientsSignals.id, set: row });
  }
  for (const item of patientsTables.alarms) {
    const row = {
      id: item.id,
      position: item.position,
      patientId: item.patientId,
      label: item.label,
      shortLabel: item.shortLabel,
      durationSeconds: String(item.durationSeconds),
    };
    await tx.insert(s.patientsAlarms).values(row).onConflictDoUpdate({ target: s.patientsAlarms.id, set: row });
  }
  for (const item of patientsTables.events) {
    const row = { id: item.id, position: item.position, patientId: item.patientId, label: item.label, time: item.time };
    await tx.insert(s.patientsEvents).values(row).onConflictDoUpdate({ target: s.patientsEvents.id, set: row });
  }
  for (const item of patientsTables.settings) {
    const row = {
      id: item.id,
      position: item.position,
      initialPatientId: item.initialPatientId,
      deviceId: item.deviceId,
      connected: item.connected,
      audioEnabled: item.audioEnabled,
      networkConnected: item.networkConnected,
      recordingActive: item.recordingActive,
      historyHours: String(item.historyHours),
      hrMin: String(item.hrMin),
      hrMax: String(item.hrMax),
      spo2Min: String(item.spo2Min),
      spo2Max: String(item.spo2Max),
      rrMin: String(item.rrMin),
      rrMax: String(item.rrMax),
      nibpMin: String(item.nibpMin),
      nibpMax: String(item.nibpMax),
      arterialMin: String(item.arterialMin),
      arterialMax: String(item.arterialMax),
      temperatureMin: String(item.temperatureMin),
      temperatureMax: String(item.temperatureMax),
    };
    await tx.insert(s.patientsSettings).values(row).onConflictDoUpdate({ target: s.patientsSettings.id, set: row });
  }
  await seedMetricCollection(tx, "operational-productivity", "summaryCards", productivityMetrics.summaryCards);
  await seedMetricCollection(tx, "operational-academy", "kpis", academyMetrics.kpis);
  await seedMetricCollection(tx, "operational-logistics", "counts", logisticsMetrics.counts);
  await seedMetricCollection(tx, "operational-infrastructure", "header", infrastructureMetrics.header);
}

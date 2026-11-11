import type { metrics as AcademyMetrics, tables as AcademyTables } from "../db/fixtures/academy.ts";
import type {
  metrics as InfrastructureMetrics,
  tables as InfrastructureTables,
} from "../db/fixtures/infrastructure.ts";
import type { metrics as LogisticsMetrics, tables as LogisticsTables } from "../db/fixtures/logistics.ts";
import type { tables as PatientsTables } from "../db/fixtures/patients.ts";
import type { metrics as ProductivityMetrics, tables as ProductivityTables } from "../db/fixtures/productivity.ts";
import type { CardiacRhythm, PatientRecord } from "./patients.types.ts";

function required<T>(value: T | undefined, relation: string): T {
  if (value === undefined) throw new Error(`Missing ${relation}`);
  return value;
}
export function civilLabel(value: string, style: "long" | "short" | "schedule" = "long") {
  if (style === "schedule") {
    const date = new Date(`${value}T12:00:00Z`);
    const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
    const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
    return `${weekday}, ${dayMonth}`;
  }
  const options: Intl.DateTimeFormatOptions = {
    month: style === "short" ? "short" : "long",
    day: "numeric",
    ...(style === "long" ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  };
  return new Intl.DateTimeFormat("en-US", options).format(new Date(`${value}T12:00:00Z`));
}
export function assembleProductivity(
  records: typeof ProductivityTables,
  metrics: typeof ProductivityMetrics,
  input: { taskId?: string; projectId?: string },
) {
  const day = required(records.days[0], "productivity day");
  const focus = required(records.focus[0], "focus record");
  return {
    day: { date: day.date, label: civilLabel(day.date), greeting: day.greeting },
    tasks: records.tasks
      .filter((row) => input.taskId === undefined || row.id === input.taskId)
      .map(({ id, title, tag, time, checked }) => ({ id, title, tag, time, checked })),
    projects: records.projects
      .filter((row) => input.projectId === undefined || row.id === input.projectId)
      .map(({ id, title, status, description, progress, dueDate, icon }) => ({
        id,
        title,
        status,
        description,
        progress,
        dueDate,
        due: `Due ${civilLabel(dueDate, "short")}`,
        icon,
      })),
    notes: records.notes.map(({ id, title, date, icon }) => ({
      id,
      title,
      date,
      dateLabel: civilLabel(date, "short"),
      icon,
    })),
    goals: required(records.goals[0], "weekly goals"),
    focus: { ...focus, duration: `${focus.minutes}:${String(focus.seconds).padStart(2, "0")}` },
    quote: required(records.quotes[0], "quote"),
    summaryCards: metrics.summaryCards,
  };
}
export function assembleAcademy(
  records: typeof AcademyTables,
  metrics: typeof AcademyMetrics,
  input: { classId?: string },
) {
  const day = required(records.days[0], "academy day");
  const selected = (id: string) => input.classId === undefined || id === input.classId;
  return {
    day: { date: day.date, label: civilLabel(day.date), scheduleLabel: civilLabel(day.date, "schedule") },
    kpis: metrics.kpis,
    assignments: records.assignments
      .filter((row) => selected(row.classId))
      .map(({ classId, submitted, pending, overdue }) => ({ className: classId, submitted, pending, overdue })),
    schedule: records.schedule
      .filter((row) => selected(row.classId))
      .map((row) => ({
        id: row.id,
        subject: row.subject,
        date: row.date,
        dateLabel: civilLabel(row.date, "schedule"),
        time: `${row.starts} - ${row.ends}`,
        status: row.status,
        classLabel: required(
          records.classes.find((c) => c.id === row.classId),
          "schedule class",
        ).grade,
        room: required(
          records.rooms.find((r) => r.id === row.roomId),
          "schedule room",
        ).name,
      })),
    events: records.events.map(({ id, dayOffset, title, time, type }) => ({ id, dayOffset, title, time, type })),
    performance: records.performance
      .filter((row) => selected(row.classId))
      .map((row) => ({
        className: row.classId,
        start: row.start,
        duration: row.duration,
        subject: row.subject,
        score: row.score,
        students: records.achievements
          .filter((a) => a.performanceId === row.id)
          .map((achievement) => {
            const student = required(
              records.students.find((s) => s.id === achievement.studentId),
              "performance student",
            );
            return {
              initials: student.initials,
              name: student.name,
              achievement: achievement.achievement,
              score: achievement.score,
            };
          }),
      })),
  };
}
export function assembleLogistics(
  records: typeof LogisticsTables,
  metrics: typeof LogisticsMetrics,
  input: { id?: string; customerId?: string },
) {
  return {
    counts: required(metrics.counts[0], "shipment counts"),
    shipments: records.shipments
      .filter(
        (row) =>
          (input.id === undefined || row.id === input.id) &&
          (input.customerId === undefined || row.customerId === input.customerId),
      )
      .map((row) => {
        const customer = required(
          records.customers.find((c) => c.id === row.customerId),
          "shipment customer",
        );
        const cargo = required(
          records.cargo.find((c) => c.shipmentId === row.id),
          "shipment cargo",
        );
        const tracking = required(
          records.tracking.find((t) => t.shipmentId === row.id),
          "shipment tracking",
        );
        const handling = required(
          records.handling.find((h) => h.shipmentId === row.id),
          "shipment handling",
        );
        const location = (role: string) => {
          const point = required(
            records.locations.find((p) => p.shipmentId === row.id && p.role === role),
            "shipment location",
          );
          return {
            display: point.display,
            country: point.country,
            countryCode: point.countryCode,
            coordinates: [point.longitude, point.latitude] as [number, number],
          };
        };
        return {
          id: row.id,
          customer: {
            id: customer.id,
            name: customer.name,
            initials: customer.initials,
            tier: customer.tier,
            tierLabel: customer.tierLabel,
          },
          origin: location("origin"),
          destination: location("destination"),
          cargo: cargo.description,
          weight: `${cargo.weightKg.toLocaleString("en-US")} kg`,
          eta: tracking.eta,
          etaMeta: tracking.etaMeta,
          status: tracking.status,
          progress: tracking.progress,
          mode: tracking.mode,
          routeType: tracking.routeType,
          transportNumber: tracking.transportNumber,
          handling: {
            label: handling.label,
            note: handling.note,
            tags: records.tags.filter((t) => t.shipmentId === row.id).map(({ label, icon }) => ({ label, icon })),
          },
        };
      }),
  };
}
export function assembleInfrastructure(
  records: typeof InfrastructureTables,
  metrics: typeof InfrastructureMetrics,
  input: { groupId?: string },
) {
  return {
    header: required(metrics.header[0], "infrastructure totals"),
    groups: records.projects
      .filter((p) => input.groupId === undefined || p.id === input.groupId)
      .map((project) => ({
        name: project.name,
        organization: required(
          records.organizations.find((o) => o.id === project.organizationId),
          "project organization",
        ).name,
        rows: records.environments
          .filter((e) => e.projectId === project.id)
          .map((e) => {
            const resource = required(
              records.resources.find((r) => r.environmentId === e.id),
              "environment resources",
            );
            return {
              domain: e.domain,
              platform: { name: e.platformName, icon: e.platformIcon },
              environment: e.environment,
              status: e.status,
              latency: `${e.latencyMs}ms`,
              uptime: `${Math.floor(e.uptimeHours / 24)}d ${e.uptimeHours % 24}h`,
              server: e.server,
              countryCode: e.countryCode,
              plan: e.plan,
              resources: { cpu: resource.cpu, ram: resource.ram, disk: resource.disk },
            };
          }),
      })),
  };
}
export function assemblePatients(records: typeof PatientsTables, input: { id?: string; status?: "alarm" | "stable" }) {
  const patients: PatientRecord[] = records.identities
    .filter(
      (p) => (input.id === undefined || p.id === input.id) && (input.status === undefined || p.status === input.status),
    )
    .map((p) => {
      const bed = required(
        records.beds.find((b) => b.id === p.bedId),
        "patient bed",
      );
      const v = required(
        records.vitals.find((v) => v.patientId === p.id),
        "patient vitals",
      );
      const signal = required(
        records.signals.find((s) => s.patientId === p.id),
        "patient signal baseline",
      );
      const alarm = records.alarms.find((a) => a.patientId === p.id);
      return {
        id: p.id,
        name: p.name,
        age: p.age,
        sex: p.sex as PatientRecord["sex"],
        diagnosis: p.diagnosis,
        status: p.status as PatientRecord["status"],
        bed: bed.label,
        heartRate: v.heartRate,
        arterialMap: v.arterialMap,
        map: v.map,
        respirationRate: v.respirationRate,
        spo2: v.spo2,
        temperature: v.temperature.toFixed(1),
        nibp: `${v.nibpSystolic}/${v.nibpDiastolic}`,
        arterialPressure: `${v.arterialSystolic}/${v.arterialDiastolic}`,
        signalProfile: { amplitude: signal.amplitude, phase: signal.phase, rhythm: signal.rhythm as CardiacRhythm },
        recentEvents: records.events.filter((e) => e.patientId === p.id).map(({ label, time }) => ({ label, time })),
        ...(alarm
          ? {
              alarm: alarm.label,
              alarmShortLabel: alarm.shortLabel,
              alarmDuration: `${String(Math.floor(alarm.durationSeconds / 60)).padStart(2, "0")}:${String(alarm.durationSeconds % 60).padStart(2, "0")}`,
            }
          : {}),
      };
    });
  return { patients, settings: required(records.settings[0], "monitor settings") };
}

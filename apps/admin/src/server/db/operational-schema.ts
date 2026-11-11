import { boolean, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
export const productivityDays = pgTable("productivity_days", {
  id: text().primaryKey(),
  position: integer().notNull(),
  date: text().notNull(),
  greeting: text().notNull(),
});
export const productivityTasks = pgTable("productivity_tasks", {
  id: text().primaryKey(),
  position: integer().notNull(),
  title: text().notNull(),
  tag: text().notNull(),
  time: text().notNull(),
  checked: boolean().notNull(),
});
export const productivityProjects = pgTable("productivity_projects", {
  id: text().primaryKey(),
  position: integer().notNull(),
  title: text().notNull(),
  status: text().notNull(),
  description: text().notNull(),
  progress: numeric({ precision: 24, scale: 10 }).notNull(),
  icon: text().notNull(),
  dueDate: text().notNull(),
});
export const productivityNotes = pgTable("productivity_notes", {
  id: text().primaryKey(),
  position: integer().notNull(),
  title: text().notNull(),
  date: text().notNull(),
  icon: text().notNull(),
});
export const productivityGoals = pgTable("productivity_goals", {
  id: text().primaryKey(),
  position: integer().notNull(),
  completed: numeric({ precision: 24, scale: 10 }).notNull(),
  total: numeric({ precision: 24, scale: 10 }).notNull(),
  progress: numeric({ precision: 24, scale: 10 }).notNull(),
  encouragement: text().notNull(),
});
export const productivityFocus = pgTable("productivity_focus", {
  id: text().primaryKey(),
  position: integer().notNull(),
  minutes: numeric({ precision: 24, scale: 10 }).notNull(),
  seconds: numeric({ precision: 24, scale: 10 }).notNull(),
  state: text().notNull(),
});
export const productivityQuotes = pgTable("productivity_quotes", {
  id: text().primaryKey(),
  position: integer().notNull(),
  quote: text().notNull(),
  encouragement: text().notNull(),
});
export const academyDays = pgTable("academy_days", {
  id: text().primaryKey(),
  position: integer().notNull(),
  date: text().notNull(),
});
export const academyClasses = pgTable("academy_classes", {
  id: text().primaryKey(),
  position: integer().notNull(),
  grade: text().notNull(),
});
export const academyRooms = pgTable("academy_rooms", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
});
export const academySchedule = pgTable("academy_schedule", {
  id: text().primaryKey(),
  position: integer().notNull(),
  classId: text()
    .notNull()
    .references(() => academyClasses.id),
  roomId: text()
    .notNull()
    .references(() => academyRooms.id),
  date: text().notNull(),
  starts: text().notNull(),
  ends: text().notNull(),
  subject: text().notNull(),
  status: text().notNull(),
});
export const academyAssignments = pgTable("academy_assignments", {
  id: text().primaryKey(),
  position: integer().notNull(),
  classId: text()
    .notNull()
    .references(() => academyClasses.id),
  submitted: numeric({ precision: 24, scale: 10 }).notNull(),
  pending: numeric({ precision: 24, scale: 10 }).notNull(),
  overdue: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const academyEvents = pgTable("academy_events", {
  id: text().primaryKey(),
  position: integer().notNull(),
  dayOffset: numeric({ precision: 24, scale: 10 }).notNull(),
  title: text().notNull(),
  time: text().notNull(),
  type: text().notNull(),
});
export const academyPerformance = pgTable("academy_performance", {
  id: text().primaryKey(),
  position: integer().notNull(),
  classId: text()
    .notNull()
    .references(() => academyClasses.id),
  start: numeric({ precision: 24, scale: 10 }).notNull(),
  duration: numeric({ precision: 24, scale: 10 }).notNull(),
  subject: text().notNull(),
  score: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const academyStudents = pgTable("academy_students", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  initials: text().notNull(),
});
export const academyAchievements = pgTable("academy_achievements", {
  id: text().primaryKey(),
  position: integer().notNull(),
  studentId: text()
    .notNull()
    .references(() => academyStudents.id),
  performanceId: text()
    .notNull()
    .references(() => academyPerformance.id),
  achievement: text().notNull(),
  score: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const logisticsCustomers = pgTable("logistics_customers", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  initials: text().notNull(),
  tier: text().notNull(),
  tierLabel: text().notNull(),
});
export const logisticsShipments = pgTable("logistics_shipments", {
  id: text().primaryKey(),
  position: integer().notNull(),
  customerId: text()
    .notNull()
    .references(() => logisticsCustomers.id),
});
export const logisticsLocations = pgTable("logistics_locations", {
  id: text().primaryKey(),
  position: integer().notNull(),
  shipmentId: text()
    .notNull()
    .references(() => logisticsShipments.id),
  role: text().notNull(),
  display: text().notNull(),
  country: text().notNull(),
  countryCode: text().notNull(),
  longitude: numeric({ precision: 24, scale: 10 }).notNull(),
  latitude: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const logisticsCargo = pgTable("logistics_cargo", {
  id: text().primaryKey(),
  position: integer().notNull(),
  shipmentId: text()
    .notNull()
    .references(() => logisticsShipments.id),
  description: text().notNull(),
  weightKg: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const logisticsTracking = pgTable("logistics_tracking", {
  id: text().primaryKey(),
  position: integer().notNull(),
  shipmentId: text()
    .notNull()
    .references(() => logisticsShipments.id),
  eta: text().notNull(),
  etaMeta: text().notNull(),
  status: text().notNull(),
  progress: numeric({ precision: 24, scale: 10 }).notNull(),
  mode: text().notNull(),
  routeType: text().notNull(),
  transportNumber: text().notNull(),
});
export const logisticsHandling = pgTable("logistics_handling", {
  id: text().primaryKey(),
  position: integer().notNull(),
  shipmentId: text()
    .notNull()
    .references(() => logisticsShipments.id),
  label: text().notNull(),
  note: text().notNull(),
});
export const logisticsTags = pgTable("logistics_tags", {
  id: text().primaryKey(),
  position: integer().notNull(),
  shipmentId: text()
    .notNull()
    .references(() => logisticsShipments.id),
  label: text().notNull(),
  icon: text().notNull(),
});
export const infrastructureOrganizations = pgTable("infrastructure_organizations", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
});
export const infrastructureProjects = pgTable("infrastructure_projects", {
  id: text().primaryKey(),
  position: integer().notNull(),
  organizationId: text()
    .notNull()
    .references(() => infrastructureOrganizations.id),
  name: text().notNull(),
});
export const infrastructureEnvironments = pgTable("infrastructure_environments", {
  id: text().primaryKey(),
  position: integer().notNull(),
  projectId: text()
    .notNull()
    .references(() => infrastructureProjects.id),
  domain: text().notNull(),
  environment: text().notNull(),
  status: text().notNull(),
  server: text().notNull(),
  countryCode: text().notNull(),
  plan: text().notNull(),
  platformName: text().notNull(),
  platformIcon: text().notNull(),
  latencyMs: numeric({ precision: 24, scale: 10 }).notNull(),
  uptimeHours: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const infrastructureResources = pgTable("infrastructure_resources", {
  id: text().primaryKey(),
  position: integer().notNull(),
  environmentId: text()
    .notNull()
    .references(() => infrastructureEnvironments.id),
  cpu: numeric({ precision: 24, scale: 10 }).notNull(),
  ram: numeric({ precision: 24, scale: 10 }).notNull(),
  disk: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const patientsBeds = pgTable("patients_beds", {
  id: text().primaryKey(),
  position: integer().notNull(),
  label: text().notNull(),
});
export const patientsIdentities = pgTable("patients_identities", {
  id: text().primaryKey(),
  position: integer().notNull(),
  bedId: text()
    .notNull()
    .references(() => patientsBeds.id),
  name: text().notNull(),
  age: numeric({ precision: 24, scale: 10 }).notNull(),
  sex: text().notNull(),
  diagnosis: text().notNull(),
  status: text().notNull(),
});
export const patientsVitals = pgTable("patients_vitals", {
  id: text().primaryKey(),
  position: integer().notNull(),
  patientId: text()
    .notNull()
    .references(() => patientsIdentities.id),
  heartRate: numeric({ precision: 24, scale: 10 }).notNull(),
  arterialMap: numeric({ precision: 24, scale: 10 }).notNull(),
  map: numeric({ precision: 24, scale: 10 }).notNull(),
  respirationRate: numeric({ precision: 24, scale: 10 }).notNull(),
  spo2: numeric({ precision: 24, scale: 10 }).notNull(),
  temperature: numeric({ precision: 24, scale: 10 }).notNull(),
  nibpSystolic: numeric({ precision: 24, scale: 10 }).notNull(),
  nibpDiastolic: numeric({ precision: 24, scale: 10 }).notNull(),
  arterialSystolic: numeric({ precision: 24, scale: 10 }).notNull(),
  arterialDiastolic: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const patientsSignals = pgTable("patients_signals", {
  id: text().primaryKey(),
  position: integer().notNull(),
  patientId: text()
    .notNull()
    .references(() => patientsIdentities.id),
  amplitude: numeric({ precision: 24, scale: 10 }).notNull(),
  phase: numeric({ precision: 24, scale: 10 }).notNull(),
  rhythm: text().notNull(),
});
export const patientsAlarms = pgTable("patients_alarms", {
  id: text().primaryKey(),
  position: integer().notNull(),
  patientId: text()
    .notNull()
    .references(() => patientsIdentities.id),
  label: text().notNull(),
  shortLabel: text().notNull(),
  durationSeconds: numeric({ precision: 24, scale: 10 }).notNull(),
});
export const patientsEvents = pgTable("patients_events", {
  id: text().primaryKey(),
  position: integer().notNull(),
  patientId: text()
    .notNull()
    .references(() => patientsIdentities.id),
  label: text().notNull(),
  time: text().notNull(),
});
export const patientsSettings = pgTable("patients_settings", {
  id: text().primaryKey(),
  position: integer().notNull(),
  initialPatientId: text()
    .notNull()
    .references(() => patientsIdentities.id),
  deviceId: text().notNull(),
  connected: boolean().notNull(),
  audioEnabled: boolean().notNull(),
  networkConnected: boolean().notNull(),
  recordingActive: boolean().notNull(),
  historyHours: numeric({ precision: 24, scale: 10 }).notNull(),
  hrMin: numeric({ precision: 24, scale: 10 }).notNull(),
  hrMax: numeric({ precision: 24, scale: 10 }).notNull(),
  spo2Min: numeric({ precision: 24, scale: 10 }).notNull(),
  spo2Max: numeric({ precision: 24, scale: 10 }).notNull(),
  rrMin: numeric({ precision: 24, scale: 10 }).notNull(),
  rrMax: numeric({ precision: 24, scale: 10 }).notNull(),
  nibpMin: numeric({ precision: 24, scale: 10 }).notNull(),
  nibpMax: numeric({ precision: 24, scale: 10 }).notNull(),
  arterialMin: numeric({ precision: 24, scale: 10 }).notNull(),
  arterialMax: numeric({ precision: 24, scale: 10 }).notNull(),
  temperatureMin: numeric({ precision: 24, scale: 10 }).notNull(),
  temperatureMax: numeric({ precision: 24, scale: 10 }).notNull(),
});

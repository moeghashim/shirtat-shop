import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";

export const demoAccounts = pgTable("demo_accounts", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  username: text().notNull(),
  email: text().notNull(),
  avatar: text().notNull(),
  role: text().notNull(),
});
export const profilePeople = pgTable("profile_people", {
  id: text().primaryKey(),
  name: text().notNull(),
  role: text().notNull(),
  initials: text().notNull(),
});
export const profiles = pgTable("profiles", {
  completionPercent: integer().notNull().default(0),
  verified: boolean().notNull().default(false),
  recordStatus: text().notNull().default("Unknown"),
  recordDescription: text().notNull().default(""),
  contractorId: text().primaryKey(),
  managerId: text()
    .notNull()
    .references(() => profilePeople.id),
  name: text().notNull(),
  preferredName: text().notNull(),
  legalName: text().notNull(),
  pronouns: text().notNull(),
  initials: text().notNull(),
  avatar: text().notNull(),
  engagementStatus: text({ enum: ["Active"] }).notNull(),
  dateOfBirth: text().notNull(),
  bio: text().notNull(),
  updatedBy: text().notNull(),
  updatedAt: text().notNull(),
});
export const profileContacts = pgTable("profile_contacts", {
  contractorId: text()
    .primaryKey()
    .references(() => profiles.contractorId),
  workEmail: text().notNull(),
  personalEmail: text().notNull(),
  workPhone: text().notNull(),
  address: text().notNull(),
  emergencyContact: text().notNull(),
  emergencyPhone: text().notNull(),
});
export const profileEmployment = pgTable("profile_employment", {
  contractorId: text()
    .primaryKey()
    .references(() => profiles.contractorId),
  jobTitle: text().notNull(),
  jobLevel: text().notNull(),
  department: text().notNull(),
  team: text().notNull(),
  currentProject: text().notNull(),
  workplace: text().notNull(),
  timeZone: text().notNull(),
  startDate: text().notNull(),
  engagementLength: text().notNull(),
  employmentType: text().notNull(),
  weeklyHours: text().notNull(),
  schedule: text().notNull(),
  contractingEntity: text().notNull(),
  noticePeriod: text().notNull(),
});
export const profileLeave = pgTable("profile_leave", {
  contractorId: text()
    .primaryKey()
    .references(() => profiles.contractorId),
  leavePolicy: text().notNull(),
  annualLeaveAllowance: text().notNull(),
  remainingLeave: text().notNull(),
  carriedOverLeave: text().notNull(),
  usedLeave: text().notNull(),
  scheduledLeave: text().notNull(),
  pendingLeaveRequests: text().notNull(),
  leaveYear: text().notNull(),
  nextLeave: text().notNull(),
  lastWorkingDay: text().notNull(),
});
export const profileDocuments = pgTable("profile_documents", {
  id: text().primaryKey(),
  contractorId: text()
    .notNull()
    .references(() => profiles.contractorId),
  position: integer().notNull(),
  name: text().notNull(),
  category: text().notNull(),
  updatedAt: text().notNull(),
  status: text({ enum: ["Signed", "Current"] }).notNull(),
  isRestricted: boolean().notNull(),
});

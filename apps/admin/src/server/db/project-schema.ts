import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  unique,
} from "drizzle-orm/pg-core";

import { priorities, projectStatuses, taskStatuses } from "../data/projects.types.ts";
import { calendarTemplates, workspaceFiles, workspaceFolders } from "./workspace-schema.ts";

export const projects = pgTable(
  "projects",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    description: text().notNull(),
    status: text({ enum: projectStatuses }).notNull(),
    startDate: date(),
    dueDate: date(),
    favorite: boolean().notNull().default(false),
    position: integer().notNull(),
  },
  (t) => [
    check("project_status", sql`${t.status} in ('planning','active','at-risk','complete')`),
    check("project_dates", sql`${t.dueDate} is null or ${t.startDate} is null or ${t.dueDate} >= ${t.startDate}`),
    index("project_order").on(t.position, t.id),
  ],
);
export const projectPeople = pgTable("project_people", {
  id: text().primaryKey(),
  name: text().notNull(),
  initials: text().notNull(),
});
export const projectMembers = pgTable(
  "project_members",
  {
    projectId: text()
      .notNull()
      .references(() => projects.id),
    personId: text()
      .notNull()
      .references(() => projectPeople.id),
    role: text().notNull(),
    position: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.personId] })],
);
export const projectTasks = pgTable(
  "project_tasks",
  {
    id: text().primaryKey(),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    sourceKind: text({ enum: ["board", "ledger", "sample"] }).notNull(),
    sourceId: text().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    status: text({ enum: taskStatuses }).notNull(),
    priority: text({ enum: priorities }).notNull(),
    assigneeId: text(),
    dueDate: date(),
    startDate: date(),
    endDate: date(),
    position: integer().notNull(),
    commentCount: integer().notNull().default(0),
    attachmentCount: integer().notNull().default(0),
    documentCount: integer().notNull().default(0),
    legacyProgress: integer(),
  },
  (t) => [
    unique().on(t.sourceKind, t.sourceId),
    unique().on(t.projectId, t.id),
    foreignKey({
      columns: [t.projectId, t.assigneeId],
      foreignColumns: [projectMembers.projectId, projectMembers.personId],
    }),
    check("task_source", sql`${t.sourceKind} in ('board','ledger','sample')`),
    check("task_status", sql`${t.status} in ('backlog','todo','in-progress','review','done','canceled')`),
    check("task_priority", sql`${t.priority} in ('low','medium','high')`),
    check("task_counts", sql`${t.commentCount} >= 0 and ${t.attachmentCount} >= 0 and ${t.documentCount} >= 0`),
    check("task_dates", sql`${t.endDate} is null or (${t.startDate} is not null and ${t.endDate} >= ${t.startDate})`),
    check("task_progress", sql`${t.legacyProgress} is null or ${t.legacyProgress} between 0 and 100`),
    index("project_task_order").on(t.projectId, t.position, t.id),
    index("project_task_filter").on(t.projectId, t.status, t.assigneeId, t.dueDate),
  ],
);
export const projectLabels = pgTable(
  "project_labels",
  {
    projectId: text()
      .notNull()
      .references(() => projects.id),
    name: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.name] })],
);
export const projectTaskLabels = pgTable(
  "project_task_labels",
  {
    projectId: text().notNull(),
    taskId: text().notNull(),
    label: text().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.taskId, t.label] }),
    foreignKey({ columns: [t.projectId, t.taskId], foreignColumns: [projectTasks.projectId, projectTasks.id] }),
    foreignKey({ columns: [t.projectId, t.label], foreignColumns: [projectLabels.projectId, projectLabels.name] }),
  ],
);
export const projectSubtasks = pgTable(
  "project_subtasks",
  {
    id: text().primaryKey(),
    projectId: text().notNull(),
    taskId: text().notNull(),
    title: text().notNull(),
    done: boolean().notNull(),
    position: integer().notNull(),
  },
  (t) => [
    foreignKey({ columns: [t.projectId, t.taskId], foreignColumns: [projectTasks.projectId, projectTasks.id] }),
    index("project_subtask_order").on(t.projectId, t.taskId, t.position),
  ],
);
export const projectFolders = pgTable(
  "project_folders",
  {
    projectId: text()
      .notNull()
      .references(() => projects.id),
    folderId: text()
      .notNull()
      .references(() => workspaceFolders.id),
    position: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.folderId] })],
);
export const projectFiles = pgTable(
  "project_files",
  {
    projectId: text()
      .notNull()
      .references(() => projects.id),
    fileId: text()
      .notNull()
      .references(() => workspaceFiles.id),
    folderId: text(),
    position: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.fileId] }),
    foreignKey({
      columns: [t.projectId, t.folderId],
      foreignColumns: [projectFolders.projectId, projectFolders.folderId],
    }),
  ],
);
export const projectEvents = pgTable(
  "project_events",
  {
    projectId: text()
      .notNull()
      .references(() => projects.id),
    templateId: text()
      .notNull()
      .references(() => calendarTemplates.id),
    taskId: text(),
    position: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.templateId] }),
    foreignKey({ columns: [t.projectId, t.taskId], foreignColumns: [projectTasks.projectId, projectTasks.id] }),
  ],
);
export const projectActivity = pgTable(
  "project_activity",
  {
    id: text().primaryKey(),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    actorId: text(),
    taskId: text(),
    fileId: text(),
    kind: text({ enum: ["milestone", "task", "file", "note"] }).notNull(),
    occurredAt: text().notNull(),
    detail: text().notNull(),
    position: integer().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.projectId, t.actorId],
      foreignColumns: [projectMembers.projectId, projectMembers.personId],
    }),
    foreignKey({ columns: [t.projectId, t.taskId], foreignColumns: [projectTasks.projectId, projectTasks.id] }),
    foreignKey({ columns: [t.projectId, t.fileId], foreignColumns: [projectFiles.projectId, projectFiles.fileId] }),
    check("activity_kind", sql`${t.kind} in ('milestone','task','file','note')`),
    check("activity_time", sql`${t.occurredAt} ~ '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$'`),
    index("project_activity_order").on(t.projectId, t.occurredAt, t.id),
  ],
);

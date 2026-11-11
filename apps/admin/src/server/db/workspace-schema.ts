import { boolean, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import type { FileKind } from "../../routes/(main)/dashboard/projects/-components/file-manager/data.ts";
import type {
  ColumnId,
  TaskInsightLabel,
  TaskPriority,
  TaskTeam,
} from "../../routes/(main)/dashboard/projects/-components/kanban/types.ts";
export const boardColumns = pgTable("board_columns", {
  id: text().$type<ColumnId>().primaryKey(),
  title: text().notNull(),
  position: integer().notNull(),
});
export const boardOwners = pgTable("board_owners", { id: text().primaryKey(), name: text().notNull() });
export const boardTeams = pgTable("board_teams", { name: text().$type<TaskTeam>().primaryKey() });
export const boardTasks = pgTable("board_tasks", {
  id: text().primaryKey(),
  columnId: text()
    .$type<ColumnId>()
    .notNull()
    .references(() => boardColumns.id),
  position: integer().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  priority: text().$type<TaskPriority>().notNull(),
  dueDate: text().notNull(),
  progress: integer().notNull(),
  ownerId: text()
    .notNull()
    .references(() => boardOwners.id),
  team: text()
    .$type<TaskTeam>()
    .notNull()
    .references(() => boardTeams.name),
});
export const boardInsights = pgTable(
  "board_insights",
  {
    taskId: text()
      .notNull()
      .references(() => boardTasks.id),
    position: integer().notNull(),
    label: text().$type<TaskInsightLabel>().notNull(),
    count: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.position] })],
);
export const ledgerTasks = pgTable("ledger_tasks", {
  id: text().primaryKey(),
  position: integer().notNull(),
  title: text().notNull(),
  status: text().notNull(),
  label: text().notNull(),
  priority: text().notNull(),
});
export const fileOwners = pgTable("file_owners", {
  id: text().primaryKey(),
  name: text().notNull(),
  initials: text().notNull(),
});
export const workspaceFiles = pgTable("workspace_files", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  kind: text().$type<FileKind>().notNull(),
  size: text().notNull(),
  ownerId: text()
    .notNull()
    .references(() => fileOwners.id),
  modifiedAt: text().notNull(),
  starred: boolean().notNull(),
});
export const fileShares = pgTable("file_shares", {
  fileId: text()
    .primaryKey()
    .references(() => workspaceFiles.id),
  shared: boolean().notNull(),
});
export const workspaceFolders = pgTable("workspace_folders", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  fileCount: integer().notNull(),
  size: text().notNull(),
  updatedAt: text().notNull(),
});
export const calendarDefinitions = pgTable("calendar_definitions", {
  value: text().primaryKey(),
  label: text().notNull(),
  position: integer().notNull(),
});
export const calendarTemplates = pgTable("calendar_templates", {
  id: text().primaryKey(),
  position: integer().notNull(),
  title: text().notNull(),
  startDay: integer().notNull(),
  startHour: integer(),
  startMinute: integer(),
  endDay: integer(),
  endHour: integer(),
  endMinute: integer(),
  fixedMonth: integer(),
  allDay: boolean(),
  groupId: text(),
  display: text(),
});

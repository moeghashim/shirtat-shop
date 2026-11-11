import { and, asc, count, desc, eq, exists, gte, ilike, inArray, isNull, notInArray, or, sql } from "drizzle-orm";

import { calendars, templates } from "../db/fixtures/calendar.ts";
import { files, folders } from "../db/fixtures/files.ts";
import * as f from "../db/fixtures/projects.ts";
import * as s from "../db/project-schema.ts";
import * as w from "../db/workspace-schema.ts";
import { sampleDayOffset, sampleTask, sampleTaskIds } from "./project-sample.ts";
import {
  isOpen,
  type Member,
  type Metrics,
  type Project,
  requestDate,
  type Task,
  type TaskInput,
  taskInput,
  taskMetrics,
  upcoming,
} from "./projects.types.ts";

const order = (a: { position: number; id: string }, b: { position: number; id: string }) =>
  a.position - b.position || a.id.localeCompare(b.id);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing project fixture relation");
  return value;
}
async function database() {
  return (await import("../db/client.server.ts")).getDatabase();
}
// Apply the same sample-only date projection before DB filtering, ordering and aggregation.
function dueDate(today: string) {
  const t = s.projectTasks;
  return sql<string>`case when ${inArray(t.id, sampleTaskIds)} then (${t.dueDate}::date + ${sampleDayOffset(today)}::int) else ${t.dueDate} end`;
}
export const demoRepository = {
  async projects() {
    return structuredClone(f.projects).sort(order);
  },
  async project(id: string) {
    return structuredClone(f.projects.find((p) => p.id === id) ?? null);
  },
  async members(projectId: string): Promise<Member[]> {
    return f.members
      .filter((m) => m.projectId === projectId)
      .map((m) => ({ ...required(f.people.find((p) => p.id === m.personId)), role: m.role, position: m.position }))
      .sort(order);
  },
  async metrics(projectId?: string, today = requestDate()) {
    return taskMetrics(
      f.projectTasks
        .filter((t) => projectId === undefined || t.projectId === projectId)
        .map((t) => sampleTask(t, today)),
      today,
    );
  },
  async tasks(input: TaskInput) {
    const q = taskInput.parse(input);
    const today = requestDate(q.renderedAt);
    const rows = f.projectTasks
      .map((t) => sampleTask(t, today))
      .filter(
        (t) =>
          t.projectId === q.projectId &&
          (q.id === undefined || t.id === q.id) &&
          (q.status === undefined || t.status === q.status) &&
          (q.dueFrom === undefined || (t.dueDate !== null && t.dueDate >= q.dueFrom)) &&
          (q.priority === undefined || t.priority === q.priority) &&
          (q.assigneeId === undefined || t.assigneeId === q.assigneeId) &&
          (q.label === undefined ||
            f.taskLabels.some((l) => l.projectId === q.projectId && l.taskId === t.id && l.label === q.label)) &&
          (!q.query || `${t.title} ${t.description}`.toLowerCase().includes(q.query.toLowerCase())),
      )
      .sort((a, b) => {
        if (q.sort === "dueDate")
          return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.id.localeCompare(b.id);
        if (q.sort === "title")
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase(), "en") || a.id.localeCompare(b.id);
        return order(a, b);
      });
    return {
      total: rows.length,
      items: structuredClone(
        rows.slice(q.offset, q.offset + q.limit).map((t) => ({
          ...t,
          assignee: f.people.find((p) => p.id === t.assigneeId) ?? null,
          labels: f.taskLabels
            .filter((l) => l.projectId === q.projectId && l.taskId === t.id)
            .map((l) => l.label)
            .sort(),
          subtasks: f.subtasks
            .filter((st) => st.projectId === q.projectId && st.taskId === t.id)
            .sort(order)
            .map(({ projectId: _, taskId: __, ...st }) => st),
        })),
      ),
    };
  },
  async files(projectId: string, id?: string) {
    return structuredClone({
      files: f.fileLinks
        .filter((l) => l.projectId === projectId && (!id || l.fileId === id))
        .map((l) => ({ ...required(files.find((file) => file.id === l.fileId)), folderId: l.folderId })),
      folders: f.folderLinks
        .filter((l) => l.projectId === projectId && (!id || l.folderId === id))
        .map((l) => required(folders.find((folder) => folder.id === l.folderId))),
      total: f.fileLinks.filter((l) => l.projectId === projectId && (!id || l.fileId === id)).length,
    });
  },
  async calendar(projectId: string) {
    const links = f.eventLinks.filter((l) => l.projectId === projectId);
    return structuredClone({
      templates: links.map((l) => required(templates.find((t) => t.id === l.templateId))),
      calendars: links.length ? calendars : [],
    });
  },
  async homeTaskCount(memberId: string, kind: "mine" | "upcoming", today = requestDate()) {
    const rows = f.projectTasks.map((t) => sampleTask(t, today));
    return kind === "mine"
      ? rows.filter((t) => t.assigneeId === memberId && isOpen(t)).length
      : upcoming(rows, today).length;
  },
  async homeTasks(memberId: string, kind: "mine" | "upcoming", today = requestDate()) {
    const rows =
      kind === "mine"
        ? f.projectTasks.filter((t) => t.assigneeId === memberId && isOpen(t)).sort(order)
        : upcoming(
            f.projectTasks.map((t) => sampleTask(t, today)),
            today,
          );
    return rows.slice(0, 10).map((t) => ({ projectId: t.projectId, id: t.id }));
  },
  async activity(projectId: string, limit: number) {
    return structuredClone(
      f.activity
        .filter((a) => a.projectId === projectId)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id))
        .slice(0, limit),
    );
  },
};
export const dbRepository = {
  async projects(): Promise<Project[]> {
    return (await database())
      .select()
      .from(s.projects)
      .orderBy(asc(s.projects.position), asc(s.projects.id))
      .limit(100);
  },
  async project(id: string): Promise<Project | null> {
    const [row] = await (await database()).select().from(s.projects).where(eq(s.projects.id, id));
    return row ?? null;
  },
  async members(projectId: string): Promise<Member[]> {
    return (await database())
      .select({
        id: s.projectPeople.id,
        name: s.projectPeople.name,
        initials: s.projectPeople.initials,
        role: s.projectMembers.role,
        position: s.projectMembers.position,
      })
      .from(s.projectMembers)
      .innerJoin(s.projectPeople, eq(s.projectPeople.id, s.projectMembers.personId))
      .where(eq(s.projectMembers.projectId, projectId))
      .orderBy(asc(s.projectMembers.position), asc(s.projectPeople.id))
      .limit(100);
  },
  async metrics(projectId?: string, today = requestDate()): Promise<Metrics> {
    const t = s.projectTasks;
    const [row] = await (await database())
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${t.status} = 'done')`.mapWith(Number),
        canceled: sql<number>`count(*) filter (where ${t.status} = 'canceled')`.mapWith(Number),
        overdue:
          sql<number>`count(*) filter (where ${t.status} not in ('done','canceled') and ${dueDate(today)} < ${today})`.mapWith(
            Number,
          ),
      })
      .from(t)
      .where(projectId === undefined ? undefined : eq(t.projectId, projectId));
    return {
      ...row,
      open: row.total - row.completed - row.canceled,
      progress: row.total === row.canceled ? 0 : Math.round((100 * row.completed) / (row.total - row.canceled)),
    };
  },
  async tasks(input: TaskInput): Promise<{ total: number; items: Task[] }> {
    const q = taskInput.parse(input),
      today = requestDate(q.renderedAt),
      db = await database(),
      t = s.projectTasks;
    const escaped = q.query?.replace(/[\\%_]/g, "\\$&");
    const assigneeFilter = q.assigneeId === null ? isNull(t.assigneeId) : eq(t.assigneeId, q.assigneeId ?? "");
    const where = and(
      eq(t.projectId, q.projectId),
      q.id === undefined ? undefined : eq(t.id, q.id),
      q.status === undefined ? undefined : eq(t.status, q.status),
      q.dueFrom === undefined ? undefined : sql`${dueDate(today)} >= ${q.dueFrom}`,
      q.priority === undefined ? undefined : eq(t.priority, q.priority),
      q.assigneeId === undefined ? undefined : assigneeFilter,
      !q.query ? undefined : or(ilike(t.title, `%${escaped}%`), ilike(t.description, `%${escaped}%`)),
      q.label === undefined
        ? undefined
        : exists(
            db
              .select({ id: s.projectTaskLabels.taskId })
              .from(s.projectTaskLabels)
              .where(
                and(
                  eq(s.projectTaskLabels.projectId, q.projectId),
                  eq(s.projectTaskLabels.taskId, t.id),
                  eq(s.projectTaskLabels.label, q.label),
                ),
              ),
          ),
    );
    const [total] = await db.select({ value: count() }).from(t).where(where);
    const sortColumn = {
      position: asc(t.position),
      dueDate: asc(dueDate(today)),
      title: asc(sql`lower(${t.title})`),
    }[q.sort];
    const rows = await db
      .select({ task: t, assignee: s.projectPeople })
      .from(t)
      .leftJoin(s.projectPeople, eq(t.assigneeId, s.projectPeople.id))
      .where(where)
      .orderBy(sortColumn, asc(t.id))
      .limit(q.limit)
      .offset(q.offset);
    if (!rows.length) return { total: total.value, items: [] };
    const ids = rows.map((r) => r.task.id);
    const labels = await db
      .select()
      .from(s.projectTaskLabels)
      .where(and(eq(s.projectTaskLabels.projectId, q.projectId), inArray(s.projectTaskLabels.taskId, ids)))
      .orderBy(asc(s.projectTaskLabels.label));
    const subtasks = await db
      .select()
      .from(s.projectSubtasks)
      .where(and(eq(s.projectSubtasks.projectId, q.projectId), inArray(s.projectSubtasks.taskId, ids)))
      .orderBy(asc(s.projectSubtasks.position), asc(s.projectSubtasks.id));
    return {
      total: total.value,
      items: rows.map(({ task, assignee }) => ({
        ...sampleTask(task, today),
        assignee,
        labels: labels
          .filter((l) => l.taskId === task.id)
          .map((l) => l.label)
          .sort(),
        subtasks: subtasks.filter((st) => st.taskId === task.id).map(({ projectId: _, taskId: __, ...st }) => st),
      })),
    };
  },
  async files(projectId: string, id?: string) {
    const db = await database();
    const where = and(
      eq(s.projectFiles.projectId, projectId),
      id === undefined ? undefined : eq(s.projectFiles.fileId, id),
    );
    const rows = await db
      .select({
        file: w.workspaceFiles,
        owner: w.fileOwners,
        shared: w.fileShares.shared,
        folderId: s.projectFiles.folderId,
      })
      .from(s.projectFiles)
      .innerJoin(w.workspaceFiles, eq(s.projectFiles.fileId, w.workspaceFiles.id))
      .innerJoin(w.fileOwners, eq(w.workspaceFiles.ownerId, w.fileOwners.id))
      .innerJoin(w.fileShares, eq(w.workspaceFiles.id, w.fileShares.fileId))
      .where(where)
      .orderBy(asc(s.projectFiles.position), asc(w.workspaceFiles.id))
      .limit(100);
    const [total] = await db.select({ value: count() }).from(s.projectFiles).where(where);
    const folderRows = await db
      .select({ folder: w.workspaceFolders })
      .from(s.projectFolders)
      .innerJoin(w.workspaceFolders, eq(s.projectFolders.folderId, w.workspaceFolders.id))
      .where(
        and(
          eq(s.projectFolders.projectId, projectId),
          id === undefined ? undefined : eq(s.projectFolders.folderId, id),
        ),
      )
      .orderBy(asc(s.projectFolders.position), asc(w.workspaceFolders.id))
      .limit(100);
    return {
      files: rows.map(({ file, owner, shared, folderId }) => {
        const { position: _, ownerId: __, ...rest } = file;
        return { ...rest, owner: owner.name, ownerInitials: owner.initials, shared, folderId };
      }),
      folders: folderRows.map(({ folder: { position: _, ...folder } }) => folder),
      total: total.value,
    };
  },
  async calendar(projectId: string) {
    const db = await database();
    const rows = await db
      .select({ template: w.calendarTemplates })
      .from(s.projectEvents)
      .innerJoin(w.calendarTemplates, eq(s.projectEvents.templateId, w.calendarTemplates.id))
      .where(eq(s.projectEvents.projectId, projectId))
      .orderBy(asc(s.projectEvents.position), asc(w.calendarTemplates.id))
      .limit(100);
    const calendars = rows.length
      ? await db
          .select({ value: w.calendarDefinitions.value, label: w.calendarDefinitions.label })
          .from(w.calendarDefinitions)
          .orderBy(asc(w.calendarDefinitions.position), asc(w.calendarDefinitions.value))
      : [];
    return { templates: rows.map(({ template: { position: _, ...t } }) => t), calendars };
  },
  async homeTaskCount(memberId: string, kind: "mine" | "upcoming", today = requestDate()) {
    const t = s.projectTasks;
    const [row] = await (await database())
      .select({ total: count() })
      .from(t)
      .where(
        and(
          notInArray(t.status, ["done", "canceled"]),
          kind === "mine" ? eq(t.assigneeId, memberId) : gte(dueDate(today), today),
        ),
      );
    return row.total;
  },
  async homeTasks(memberId: string, kind: "mine" | "upcoming", today = requestDate()) {
    const t = s.projectTasks;
    return (await database())
      .select({ projectId: t.projectId, id: t.id })
      .from(t)
      .where(
        and(
          notInArray(t.status, ["done", "canceled"]),
          kind === "mine" ? eq(t.assigneeId, memberId) : gte(dueDate(today), today),
        ),
      )
      .orderBy(kind === "mine" ? asc(t.position) : asc(dueDate(today)), asc(t.id))
      .limit(10);
  },
  async activity(projectId: string, limit: number) {
    return (await database())
      .select()
      .from(s.projectActivity)
      .where(eq(s.projectActivity.projectId, projectId))
      .orderBy(desc(s.projectActivity.occurredAt), desc(s.projectActivity.id))
      .limit(limit);
  },
};
export type ProjectRepository = typeof dbRepository;

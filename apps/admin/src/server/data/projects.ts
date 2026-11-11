import { z } from "zod";

import { projectEvents } from "./calendar.types.ts";
import { sampleActivity, sampleProject } from "./project-sample.ts";
import { dbRepository, demoRepository, type ProjectRepository } from "./projects.repository.ts";
import {
  boundedId,
  projectInput,
  projectStatuses,
  requestDate,
  SAMPLE_MEMBER,
  type TaskInput,
  taskCalendarEvents,
  taskInput,
} from "./projects.types.ts";
import { readSource } from "./source.ts";

const projectsInput = z
  .object({
    status: z.enum(projectStatuses).optional(),
    query: z.string().max(200).optional(),
    renderedAt: z.iso.datetime().optional(),
  })
  .strict();
const filesInput = projectInput.extend({ id: boundedId.optional() });
const activityInput = projectInput.extend({ limit: z.number().int().min(1).max(50).default(20) });
const timelineInput = taskInput.extend({ renderedAt: z.iso.datetime(), timeZone: z.string().max(80).default("UTC") });
const homeInput = z.object({ memberId: boundedId.default(SAMPLE_MEMBER), renderedAt: z.iso.datetime() }).strict();
async function project(repository: ProjectRepository, input: z.input<typeof projectInput>) {
  const { projectId, renderedAt } = projectInput.parse(input),
    today = requestDate(renderedAt),
    row = await repository.project(projectId);
  if (!row) return null;
  return {
    ...sampleProject(row, today),
    members: await repository.members(projectId),
    metrics: await repository.metrics(projectId, today),
    sampleDate: today,
  };
}
async function projects(repository: ProjectRepository, input: z.input<typeof projectsInput> = {}) {
  const q = projectsInput.parse(input),
    today = requestDate(q.renderedAt),
    rows = await repository.projects();
  return Promise.all(
    rows
      .filter(
        (p) =>
          (!q.status || p.status === q.status) &&
          (!q.query || `${p.name} ${p.description}`.toLowerCase().includes(q.query.toLowerCase())),
      )
      .map(async (p) => ({
        ...sampleProject(p, today),
        members: await repository.members(p.id),
        metrics: await repository.metrics(p.id, today),
        sampleDate: today,
      })),
  );
}
async function tasks(repository: ProjectRepository, input: TaskInput) {
  const q = taskInput.parse(input);
  if (!(await repository.project(q.projectId))) return null;
  const result = await repository.tasks(q);
  return { ...result, offset: q.offset, limit: q.limit, hasMore: q.offset + result.items.length < result.total };
}
async function files(repository: ProjectRepository, input: z.input<typeof filesInput>) {
  const q = filesInput.parse(input);
  if (!(await repository.project(q.projectId))) return null;
  return repository.files(q.projectId, q.id);
}
async function activity(repository: ProjectRepository, input: z.input<typeof activityInput>) {
  const q = activityInput.parse(input);
  if (!(await repository.project(q.projectId))) return null;
  const today = requestDate(q.renderedAt);
  return (await repository.activity(q.projectId, q.limit)).map((row) => sampleActivity(row, today));
}
async function timeline(repository: ProjectRepository, input: z.input<typeof timelineInput>) {
  const { renderedAt, timeZone, ...q } = timelineInput.parse(input);
  new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date(renderedAt));
  const result = await tasks(repository, { ...q, renderedAt });
  if (!result) return null;
  const calendar = await repository.calendar(q.projectId);
  return {
    ...result,
    ...calendar,
    renderedAt,
    timeZone,
    events: projectEvents(calendar.templates, renderedAt, timeZone),
    taskEvents: taskCalendarEvents(result.items),
  };
}
async function home(repository: ProjectRepository, input: z.input<typeof homeInput>) {
  const q = homeInput.parse(input),
    today = requestDate(q.renderedAt),
    summaries = await projects(repository, { renderedAt: q.renderedAt });
  async function section(kind: "mine" | "upcoming") {
    const refs = await repository.homeTasks(q.memberId, kind, today);
    return (
      await Promise.all(refs.map((ref) => repository.tasks({ ...ref, limit: 10, renderedAt: q.renderedAt })))
    ).flatMap((b) => b.items);
  }
  return {
    renderedAt: q.renderedAt,
    sampleDate: today,
    sampleMember: q.memberId,
    projects: summaries,
    metrics: await repository.metrics(undefined, today),
    activeProjects: summaries.filter((p) => p.status === "active" || p.status === "at-risk").length,
    myTasks: await section("mine"),
    myTaskTotal: await repository.homeTaskCount(q.memberId, "mine", today),
    upcoming: await section("upcoming"),
    upcomingTotal: await repository.homeTaskCount(q.memberId, "upcoming", today),
    activity: (await Promise.all(summaries.map((p) => repository.activity(p.id, 10))))
      .flat()
      .map((row) => sampleActivity(row, today))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id))
      .slice(0, 10),
  };
}
export const demoProjects = (input: z.input<typeof projectsInput> = {}) => projects(demoRepository, input);
export const dbProjects = (input: z.input<typeof projectsInput> = {}) => projects(dbRepository, input);
export const demoProject = (input: z.input<typeof projectInput>) => project(demoRepository, input);
export const dbProject = (input: z.input<typeof projectInput>) => project(dbRepository, input);
export const demoProjectTasks = (input: TaskInput) => tasks(demoRepository, input);
export const dbProjectTasks = (input: TaskInput) => tasks(dbRepository, input);
export const demoProjectFiles = (input: z.input<typeof filesInput>) => files(demoRepository, input);
export const dbProjectFiles = (input: z.input<typeof filesInput>) => files(dbRepository, input);
export const demoProjectActivity = (input: z.input<typeof activityInput>) => activity(demoRepository, input);
export const dbProjectActivity = (input: z.input<typeof activityInput>) => activity(dbRepository, input);
export const demoProjectTimeline = (input: z.input<typeof timelineInput>) => timeline(demoRepository, input);
export const dbProjectTimeline = (input: z.input<typeof timelineInput>) => timeline(dbRepository, input);
export const demoWorkspaceHome = (input: z.input<typeof homeInput>) => home(demoRepository, input);
export const dbWorkspaceHome = (input: z.input<typeof homeInput>) => home(dbRepository, input);
export async function readProjects(input: z.input<typeof projectsInput> = {}) {
  return readSource(
    () => demoProjects(input),
    () => dbProjects(input),
  );
}
export async function readProject(input: z.input<typeof projectInput>) {
  return readSource(
    () => demoProject(input),
    () => dbProject(input),
  );
}
export async function readProjectTasks(input: TaskInput) {
  return readSource(
    () => demoProjectTasks(input),
    () => dbProjectTasks(input),
  );
}
export async function readProjectFiles(input: z.input<typeof filesInput>) {
  return readSource(
    () => demoProjectFiles(input),
    () => dbProjectFiles(input),
  );
}
export async function readProjectActivity(input: z.input<typeof activityInput>) {
  return readSource(
    () => demoProjectActivity(input),
    () => dbProjectActivity(input),
  );
}
export async function readProjectTimeline(input: z.input<typeof timelineInput>) {
  return readSource(
    () => demoProjectTimeline(input),
    () => dbProjectTimeline(input),
  );
}
export async function readWorkspaceHome(input: z.input<typeof homeInput>) {
  return readSource(
    () => demoWorkspaceHome(input),
    () => dbWorkspaceHome(input),
  );
}

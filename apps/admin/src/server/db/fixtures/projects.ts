import {
  addCivilDays,
  DEFAULT_PROJECT,
  type Person,
  type Project,
  type ProjectTask,
  priorities,
  SAMPLE_DATE,
  type TaskStatus,
} from "../../data/projects.types.ts";
import { files } from "./files.ts";
import { initialBoard, taskOwners } from "./kanban.ts";
import { projectMapping } from "./project-mapping.ts";
import { tasks as ledger } from "./tasks.ts";

export const projects: Project[] = [
  {
    id: DEFAULT_PROJECT,
    name: "Operations rollout",
    description: "Coordinate operational tooling, review milestones and prepare the rollout.",
    status: "active",
    startDate: "2026-06-01",
    dueDate: "2026-07-06",
    favorite: true,
    position: 0,
  },
  {
    id: "sample-docs",
    name: "Documentation refresh",
    description: "Make the starter easier to understand with tested setup notes and focused examples.",
    status: "at-risk",
    startDate: "2026-06-15",
    dueDate: "2026-07-10",
    favorite: false,
    position: 1,
  },
  {
    id: "sample-empty",
    name: "Research queue",
    description: "A quiet place for the next investigation. No work has been scheduled yet.",
    status: "planning",
    startDate: null,
    dueDate: null,
    favorite: false,
    position: 2,
  },
];
const boardPeople = Object.entries(taskOwners).map(([id, p]) => ({
  id: `board:${id}`,
  name: p.name,
  initials: p.name
    .split(" ")
    .map((v) => v[0])
    .join(""),
}));
export const people: Person[] = [
  ...boardPeople,
  ...Object.entries(projectMapping.fileOwners)
    .filter(([, id]) => !boardPeople.some((p) => p.id === id))
    .map(([name, id]) => ({ id, name, initials: files.find((f) => f.owner === name)?.ownerInitials ?? "" })),
];
export const members = [
  ...people.map((p, position) => ({ projectId: DEFAULT_PROJECT, personId: p.id, role: "Contributor", position })),
  { projectId: "sample-docs", personId: "board:jordan", role: "Coordinator", position: 0 },
  { projectId: "sample-docs", personId: "board:maya", role: "Writer", position: 1 },
];
const board = Object.values(initialBoard).flat();
export const projectTasks: ProjectTask[] = [
  ...projectMapping.board.map((mapping, position) => {
    const task = board.find((t) => t.id === mapping.sourceId);
    if (!task) throw new Error("Unmapped board task");
    const priority = priorities.find((p) => p === task.priority.toLowerCase());
    if (!priority) throw new Error("Unknown priority");
    return {
      ...mapping,
      id: `board:${task.id}`,
      projectId: DEFAULT_PROJECT,
      sourceKind: "board" as const,
      title: task.title,
      description: task.description,
      priority,
      position,
      startDate: addCivilDays(mapping.dueDate, -3 - (position % 5)),
      endDate: mapping.dueDate,
      commentCount: task.insights.find((i) => i.label === "Comments")?.count ?? 0,
      attachmentCount: task.insights.find((i) => i.label === "Attachments")?.count ?? 0,
      documentCount: task.insights.find((i) => i.label === "Documents")?.count ?? 0,
      legacyProgress: task.progress,
    };
  }),
  ...projectMapping.ledger.map((mapping, position) => {
    const task = ledger.find((t) => t.id === mapping.sourceId);
    if (!task) throw new Error("Unmapped ledger task");
    return {
      ...mapping,
      id: `ledger:${task.id}`,
      projectId: DEFAULT_PROJECT,
      sourceKind: "ledger" as const,
      title: task.title,
      description: "",
      priority: priorities.find((p) => p === task.priority) ?? "medium",
      assigneeId: null,
      dueDate: position % 23 === 22 ? null : addCivilDays(SAMPLE_DATE, (position % 21) - 6),
      startDate: position % 23 === 22 ? null : addCivilDays(SAMPLE_DATE, (position % 21) - 10),
      endDate: position % 23 === 22 ? null : addCivilDays(SAMPLE_DATE, (position % 21) - 6),
      position: board.length + position,
      commentCount: 0,
      attachmentCount: 0,
      documentCount: 0,
      legacyProgress: null,
    };
  }),
  ...(
    [
      ["setup-guide", "Verify the clean install guide", "in-progress", "2026-06-15", "2026-06-19", "board:maya"],
      ["route-map", "Map the starter routes", "done", "2026-06-15", "2026-06-18", "board:jordan"],
      ["review-checklist", "Review the publishing checklist", "todo", "2026-06-20", "2026-06-20", "board:jordan"],
      ["glossary", "Draft a short glossary", "backlog", null, null, null],
      ["examples", "Refresh the usage examples", "todo", "2026-06-20", "2026-06-23", "board:maya"],
    ] as const
  ).map(([sourceId, title, status, startDate, endDate, assigneeId], position) => ({
    id: `sample:${sourceId}`,
    projectId: "sample-docs",
    sourceKind: "sample" as const,
    sourceId,
    title,
    description: "Original tenboards documentation sample.",
    status: status as TaskStatus,
    priority: "medium" as const,
    assigneeId,
    startDate,
    endDate,
    dueDate: endDate,
    position,
    commentCount: position === 0 ? 2 : 0,
    attachmentCount: 0,
    documentCount: 0,
    legacyProgress: null,
  })),
];
// Authored schedule metadata is explicit; it is not inferred from legacy progress.
const spans: Record<string, [string, string]> = {
  "board:tender-workflow-map": ["2026-06-10", "2026-06-14"],
  "board:sqlite-drizzle-schema": ["2026-06-18", "2026-06-26"],
  "board:salary-excel-import": ["2026-06-20", "2026-06-28"],
  "board:architecture-rule": ["2026-06-08", "2026-06-08"],
};
for (const task of projectTasks) {
  const span = spans[task.id];
  if (span) [task.startDate, task.endDate] = span;
}
export const taskLabels = projectTasks.flatMap((t) => {
  let label: string | undefined = "documentation";
  if (t.sourceKind === "board") label = board.find((b) => b.id === t.sourceId)?.team;
  if (t.sourceKind === "ledger") label = ledger.find((l) => l.id === t.sourceId)?.label;
  return label ? [{ projectId: t.projectId, taskId: t.id, label }] : [];
});
taskLabels.push({ projectId: "sample-docs", taskId: "sample:setup-guide", label: "verification" });
export const labels = [
  ...new Map(taskLabels.map((l) => [`${l.projectId}:${l.label}`, { projectId: l.projectId, name: l.label }])).values(),
];
export const subtasks = [
  {
    id: "sample:install",
    projectId: "sample-docs",
    taskId: "sample:setup-guide",
    title: "Check the install command",
    done: true,
    position: 0,
  },
  {
    id: "sample:start",
    projectId: "sample-docs",
    taskId: "sample:setup-guide",
    title: "Check the first start",
    done: false,
    position: 1,
  },
  {
    id: "sample:links",
    projectId: "sample-docs",
    taskId: "sample:route-map",
    title: "Verify route links",
    done: true,
    position: 0,
  },
];
export const fileLinks = projectMapping.files.map((fileId, position) => ({
  projectId: DEFAULT_PROJECT,
  fileId,
  folderId: null,
  position,
}));
export const folderLinks = projectMapping.folders.map((folderId, position) => ({
  projectId: DEFAULT_PROJECT,
  folderId,
  position,
}));
export const eventLinks = projectMapping.events.map((templateId, position) => ({
  projectId: DEFAULT_PROJECT,
  templateId,
  taskId: null,
  position,
}));
export const activity = [
  {
    id: "sample:operations-kickoff",
    projectId: DEFAULT_PROJECT,
    actorId: "board:jordan",
    taskId: null,
    fileId: null,
    kind: "milestone" as const,
    occurredAt: "2026-06-20T09:00:00Z",
    detail: "Reviewed the rollout sequence with the team.",
    position: 0,
  },
  {
    id: "sample:docs-review",
    projectId: "sample-docs",
    actorId: "board:maya",
    taskId: "sample:setup-guide",
    fileId: null,
    kind: "task" as const,
    occurredAt: "2026-06-20T09:00:00Z",
    detail: "Verified installation; first-start review remains open.",
    position: 0,
  },
  {
    id: "sample:docs-route-map",
    projectId: "sample-docs",
    actorId: "board:jordan",
    taskId: "sample:route-map",
    fileId: null,
    kind: "task" as const,
    occurredAt: "2026-06-18T15:00:00Z",
    detail: "Completed the route map review.",
    position: 1,
  },
];

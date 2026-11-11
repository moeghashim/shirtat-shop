import { dbAcademy, demoAcademy } from "./academy.ts";
import { dbAccounts, demoAccounts } from "./accounts.ts";
import { dbAnalytics, demoAnalytics } from "./analytics.ts";
import { dbCalendar, demoCalendar } from "./calendar.ts";
import { dbChat, demoChat } from "./chat.ts";
import { dbCrm, demoCrm } from "./crm.ts";
import { dbDefault, demoDefault } from "./default.ts";
import { dbEcommerce, demoEcommerce } from "./ecommerce.ts";
import { dbFiles, demoFiles } from "./files.ts";
import { dbFinance, demoFinance } from "./finance.ts";
import { dbInfrastructure, demoInfrastructure } from "./infrastructure.ts";
import { dbInvoices, demoInvoices } from "./invoices.ts";
import { dbKanban, demoKanban } from "./kanban.ts";
import { dbLogistics, demoLogistics } from "./logistics.ts";
import { dbMail, demoMail } from "./mail.ts";
import { dbPatients, demoPatients } from "./patients.ts";
import { dbProductivity, demoProductivity } from "./productivity.ts";
import { dbProducts, demoProducts } from "./products.ts";
import { dbProfile, demoProfile } from "./profile.ts";
import {
  dbProject,
  dbProjectActivity,
  dbProjectFiles,
  dbProjects,
  dbProjectTasks,
  dbProjectTimeline,
  dbWorkspaceHome,
  demoProject,
  demoProjectActivity,
  demoProjectFiles,
  demoProjects,
  demoProjectTasks,
  demoProjectTimeline,
  demoWorkspaceHome,
} from "./projects.ts";
import { dbRoles, demoRoles } from "./roles.ts";
import { dbTasks, demoTasks } from "./tasks.ts";
import { dbUsers, demoUsers } from "./users.ts";

// Each exported domain read owns all of its supported input/variant scenarios here.
function defineRead<Input, Output>(entry: {
  module: string;
  read: string;
  demo: (input: Input) => Promise<Output>;
  db: (input: Input) => Promise<Output>;
  scenarios: { name: string; input: Input }[];
}) {
  return {
    module: entry.module,
    read: entry.read,
    demo: entry.demo,
    db: entry.db,
    scenarios: entry.scenarios.map(({ name, input }) => ({
      name,
      input,
      demo: (): Promise<unknown> => entry.demo(input),
      db: (): Promise<unknown> => entry.db(input),
    })),
  };
}

export const readRegistry = [
  defineRead({
    module: "projects",
    read: "readProjects",
    demo: demoProjects,
    db: dbProjects,
    scenarios: [
      { name: "all", input: {} },
      { name: "status", input: { status: "active" } },
      { name: "search", input: { query: "Documentation" } },
    ],
  }),
  defineRead({
    module: "projects",
    read: "readProject",
    demo: demoProject,
    db: dbProject,
    scenarios: [
      ...["sample-operations", "sample-docs", "sample-empty", "missing"].map((projectId) => ({
        name: projectId,
        input: { projectId },
      })),
    ],
  }),
  defineRead({
    module: "projects",
    read: "readProjectTasks",
    demo: demoProjectTasks,
    db: dbProjectTasks,
    scenarios: [
      {
        name: "authored-operations-title",
        input: { projectId: "sample-operations", query: "rollout support process" },
      },
      ...["sample-operations", "sample-docs", "sample-empty", "missing"].map((projectId) => ({
        name: projectId,
        input: { projectId },
      })),
      ...(["backlog", "todo", "in-progress", "review", "done", "canceled"] as const).map((status) => ({
        name: status,
        input: { projectId: "sample-operations", status },
      })),
      { name: "priority", input: { projectId: "sample-operations", priority: "high" } },
      ...["2026-10-24T12:00:00Z", "2028-02-29T23:59:59Z", "2027-01-01T00:00:00Z"].flatMap((renderedAt) =>
        ["sample-operations", "sample-docs"].map((projectId) => ({
          name: `request-date/${projectId}/${renderedAt}`,
          input: { projectId, renderedAt },
        })),
      ),
      {
        name: "upcoming-bound",
        input: {
          projectId: "sample-operations",
          dueFrom: "2026-10-24",
          renderedAt: "2026-10-24T12:00:00Z",
          sort: "dueDate",
          limit: 10,
        },
      },
      {
        name: "upcoming-empty",
        input: { projectId: "sample-docs", dueFrom: "2027-01-01", renderedAt: "2026-10-24T12:00:00Z" },
      },
      { name: "due-sort", input: { projectId: "sample-operations", sort: "dueDate" } },
      { name: "title-sort", input: { projectId: "sample-docs", sort: "title" } },
      { name: "paged", input: { projectId: "sample-operations", offset: 10, limit: 10 } },
      { name: "unassigned", input: { projectId: "sample-operations", assigneeId: null } },
      { name: "label", input: { projectId: "sample-docs", label: "verification" } },
      { name: "wrong-project", input: { projectId: "sample-docs", id: "board:tender-workflow-map" } },
      {
        name: "combined",
        input: { projectId: "sample-docs", query: "guide", assigneeId: "board:maya", status: "in-progress" },
      },
    ],
  }),
  defineRead({
    module: "projects",
    read: "readProjectTimeline",
    demo: demoProjectTimeline,
    db: dbProjectTimeline,
    scenarios: [
      ...["sample-operations", "sample-docs", "sample-empty", "missing"].flatMap((projectId) =>
        [
          "2026-06-20T12:00:00Z",
          "2026-12-31T23:59:59Z",
          "2028-02-29T23:59:59Z",
          "2026-03-08T08:01:00Z",
          "2026-11-01T07:01:00Z",
        ].flatMap((renderedAt) =>
          ["UTC", "America/Chicago", "Pacific/Kiritimati"].map((timeZone) => ({
            name: `${projectId}/${renderedAt}/${timeZone}`,
            input: { projectId, renderedAt, timeZone },
          })),
        ),
      ),
    ],
  }),
  defineRead({
    module: "projects",
    read: "readProjectFiles",
    demo: demoProjectFiles,
    db: dbProjectFiles,
    scenarios: [
      ...["sample-operations", "sample-docs", "sample-empty", "missing"].map((projectId) => ({
        name: projectId,
        input: { projectId },
      })),
      { name: "wrong-project", input: { projectId: "sample-docs", id: "product-roadmap" } },
      { name: "existing", input: { projectId: "sample-operations", id: "product-roadmap" } },
    ],
  }),
  defineRead({
    module: "projects",
    read: "readProjectActivity",
    demo: demoProjectActivity,
    db: dbProjectActivity,
    scenarios: [
      ...["sample-operations", "sample-docs", "sample-empty", "missing"].map((projectId) => ({
        name: projectId,
        input: { projectId },
      })),
    ],
  }),
  defineRead({
    module: "projects",
    read: "readWorkspaceHome",
    demo: demoWorkspaceHome,
    db: dbWorkspaceHome,
    scenarios: [
      ...["board:jordan", "board:maya", "missing"].map((memberId) => ({
        name: memberId,
        input: { memberId, renderedAt: "2026-06-20T12:00:00Z" },
      })),
    ],
  }),
  defineRead({
    module: "productivity",
    read: "readProductivity",
    demo: demoProductivity,
    db: dbProductivity,
    scenarios: [
      { name: "all", input: {} },
      { name: "task", input: { taskId: "0" } },
      { name: "missing-task", input: { taskId: "missing" } },
      { name: "project", input: { projectId: "0" } },
      { name: "missing-project", input: { projectId: "missing" } },
    ],
  }),
  defineRead({
    module: "academy",
    read: "readAcademy",
    demo: demoAcademy,
    db: dbAcademy,
    scenarios: [
      { name: "all", input: {} },
      { name: "class", input: { classId: "G11A" } },
      { name: "empty-class-relations", input: { classId: "G11E" } },
      { name: "missing-class", input: { classId: "missing" } },
    ],
  }),
  defineRead({
    module: "logistics",
    read: "readLogistics",
    demo: demoLogistics,
    db: dbLogistics,
    scenarios: [
      { name: "all", input: {} },
      { name: "shipment", input: { id: "SDA-01-2401" } },
      { name: "missing-shipment", input: { id: "missing" } },
      { name: "customer", input: { customerId: "SDA-1001-2401-01" } },
      { name: "missing-customer", input: { customerId: "missing" } },
    ],
  }),
  defineRead({
    module: "infrastructure",
    read: "readInfrastructure",
    demo: demoInfrastructure,
    db: dbInfrastructure,
    scenarios: [
      { name: "all", input: {} },
      { name: "group", input: { groupId: "0" } },
      { name: "empty-group", input: { groupId: "3" } },
      { name: "missing-group", input: { groupId: "missing" } },
    ],
  }),
  defineRead({
    module: "patients",
    read: "readPatients",
    demo: demoPatients,
    db: dbPatients,
    scenarios: [
      { name: "all", input: {} },
      { name: "patient", input: { id: "cardiac-04" } },
      { name: "missing-patient", input: { id: "missing" } },
      { name: "alarm", input: { status: "alarm" } },
      { name: "stable", input: { status: "stable" } },
    ],
  }),
  defineRead({
    module: "default",
    read: "readDefault",
    demo: demoDefault,
    db: dbDefault,
    scenarios: [
      { name: "current/all", input: { renderedAt: "2026-10-23T12:00:00Z" } },
      { name: "current/existing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "18425" } },
      { name: "current/missing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "missing" } },
      { name: "current/2026-12-31T23:59:59Z", input: { renderedAt: "2026-12-31T23:59:59Z" } },
      { name: "current/2028-02-29T23:59:59Z", input: { renderedAt: "2028-02-29T23:59:59Z" } },
      { name: "current/2028-03-01T00:00:01Z", input: { renderedAt: "2028-03-01T00:00:01Z" } },
    ],
  }),
  defineRead({
    module: "crm",
    read: "readCrm",
    demo: demoCrm,
    db: dbCrm,
    scenarios: [
      { name: "current/all", input: { renderedAt: "2026-10-23T12:00:00Z" } },
      { name: "current/existing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "OP-1842" } },
      { name: "current/missing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "missing" } },
      { name: "current/2026-12-31T23:59:59Z", input: { renderedAt: "2026-12-31T23:59:59Z" } },
      { name: "current/2028-02-29T23:59:59Z", input: { renderedAt: "2028-02-29T23:59:59Z" } },
      { name: "current/2028-03-01T00:00:01Z", input: { renderedAt: "2028-03-01T00:00:01Z" } },
    ],
  }),
  defineRead({
    module: "finance",
    read: "readFinance",
    demo: demoFinance,
    db: dbFinance,
    scenarios: [
      { name: "current/all", input: { renderedAt: "2026-10-23T12:00:00Z" } },
      { name: "current/existing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "1" } },
      { name: "current/missing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "missing" } },
      { name: "current/2026-12-31T23:59:59Z", input: { renderedAt: "2026-12-31T23:59:59Z" } },
      { name: "current/2028-02-29T23:59:59Z", input: { renderedAt: "2028-02-29T23:59:59Z" } },
      { name: "current/2028-03-01T00:00:01Z", input: { renderedAt: "2028-03-01T00:00:01Z" } },
    ],
  }),
  defineRead({
    module: "analytics",
    read: "readAnalytics",
    demo: demoAnalytics,
    db: dbAnalytics,
    scenarios: [
      { name: "current/all", input: { renderedAt: "2026-10-23T12:00:00Z" } },
      { name: "current/existing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "/dashboard" } },
      { name: "current/missing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "missing" } },
    ],
  }),
  defineRead({
    module: "mail",
    read: "readMail",
    demo: demoMail,
    db: dbMail,
    scenarios: [
      ...["2026-10-23T12:00:00Z", "2028-01-01T00:01:00Z", "2028-02-29T23:59:59Z"].map((renderedAt) => ({
        name: renderedAt,
        input: { renderedAt },
      })),
      { name: "existing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "6c84fb90-12c4-11e1-840d-7b25c5ee775a" } },
      { name: "missing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "missing" } },
    ],
  }),
  defineRead({
    module: "chat",
    read: "readChat",
    demo: demoChat,
    db: dbChat,
    scenarios: [
      { name: "all", input: {} },
      { name: "existing", input: { id: 1 } },
      { name: "missing", input: { id: -1 } },
    ],
  }),
  defineRead({
    module: "kanban",
    read: "readKanban",
    demo: demoKanban,
    db: dbKanban,
    scenarios: [
      { name: "all", input: {} },
      { name: "existing", input: { id: "tender-workflow-map" } },
      { name: "missing", input: { id: "missing" } },
    ],
  }),
  defineRead({
    module: "tasks",
    read: "readTasks",
    demo: demoTasks,
    db: dbTasks,
    scenarios: [
      { name: "all", input: {} },
      { name: "existing", input: { id: "TASK-8782" } },
      { name: "missing", input: { id: "missing" } },
    ],
  }),
  defineRead({
    module: "files",
    read: "readFiles",
    demo: demoFiles,
    db: dbFiles,
    scenarios: [
      { name: "all", input: {} },
      { name: "existing", input: { id: "product-roadmap" } },
      { name: "missing", input: { id: "missing" } },
    ],
  }),
  defineRead({
    module: "calendar",
    read: "readCalendar",
    demo: demoCalendar,
    db: dbCalendar,
    scenarios: [
      ...[
        "2026-10-23T12:00:00Z",
        "2026-12-31T23:59:59Z",
        "2027-01-01T00:00:01Z",
        "2028-02-29T23:59:59Z",
        "2028-03-01T00:00:01Z",
      ].flatMap((renderedAt) =>
        ["UTC", "America/Chicago", "Pacific/Kiritimati"].map((timeZone) => ({
          name: `${renderedAt}/${timeZone}`,
          input: { renderedAt, timeZone },
        })),
      ),
      { name: "existing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "event-1" } },
      { name: "missing", input: { renderedAt: "2026-10-23T12:00:00Z", id: "missing" } },
    ],
  }),
  defineRead({
    module: "users",
    read: "readUsers",
    scenarios: [
      { name: "all", input: {} },
      { name: "existing", input: { email: "olivia.rhye@weblabs.studio" } },
      { name: "missing", input: { email: "missing@example.invalid" } },
    ],
    demo: demoUsers,
    db: dbUsers,
  }),
  defineRead({
    module: "roles",
    read: "readRoles",
    scenarios: [
      { name: "all", input: {} },
      { name: "existing", input: { role: "Owner" } },
      { name: "missing", input: { role: "Missing role" } },
    ],
    demo: demoRoles,
    db: dbRoles,
  }),
  defineRead({
    module: "accounts",
    read: "readAccounts",
    demo: demoAccounts,
    db: dbAccounts,
    scenarios: [
      { name: "all", input: {} },
      { name: "existing", input: { id: "1" } },
      { name: "missing", input: { id: "absent" } },
    ],
  }),
  defineRead({
    module: "profile",
    read: "readProfile",
    demo: demoProfile,
    db: dbProfile,
    scenarios: [
      { name: "default", input: {} },
      { name: "existing", input: { id: "WS-2301" } },
      { name: "missing", input: { id: "absent" } },
    ],
  }),
  defineRead({
    module: "products",
    read: "readProducts",
    demo: demoProducts,
    db: dbProducts,
    scenarios: [
      { name: "all", input: {} },
      { name: "existing", input: { id: "p01" } },
      { name: "missing", input: { id: "missing" } },
      { name: "category", input: { category: "Clothing" } },
      { name: "empty-category", input: { category: "missing" } },
    ],
  }),
  defineRead({
    module: "invoices",
    read: "readInvoices",
    demo: demoInvoices,
    db: dbInvoices,
    scenarios: [
      ...[
        "2026-10-23T12:00:00Z",
        "2026-12-31T23:59:59Z",
        "2028-02-28T23:59:59Z",
        "2028-02-29T00:00:00Z",
        "2029-01-01T00:00:00Z",
      ].map((renderedAt) => ({ name: renderedAt, input: { renderedAt } })),
      { name: "missing", input: { renderedAt: "2026-10-23T12:00:00Z", draftId: "missing" } },
    ],
  }),
  defineRead({
    module: "ecommerce",
    read: "readEcommerce",
    demo: demoEcommerce,
    db: dbEcommerce,
    scenarios: [
      { name: "all", input: {} },
      { name: "existing-order", input: { orderId: "#14550" } },
      { name: "missing-order", input: { orderId: "missing" } },
    ],
  }),
];

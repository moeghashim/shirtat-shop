import { createLibrary, createParser, defineComponent, reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

const stub = () => null;

export const filtersProps = z.object({
  area: reactive(z.string()),
  owner: reactive(z.string()),
  phase: reactive(z.string()),
  status: reactive(z.string()),
  tick: reactive(z.string()),
  window: reactive(z.string()),
});

// payload stays first: OpenUI maps positional args by key order, and identical prop schemas collapse into one component.
function boardProps(board: "approvals" | "kpis" | "progress" | "reference" | "tasks" | "timeline") {
  return z.object({
    payload: z.any(),
    board: z.literal(board).optional(),
  });
}

export const approvalsProps = boardProps("approvals");
export const kpisProps = boardProps("kpis");
export const progressProps = boardProps("progress");
export const referenceProps = boardProps("reference");
export const tasksProps = boardProps("tasks");
export const timelineProps = boardProps("timeline");

export const SEO_DASHBOARD_PROGRAM = `$phase = "all"
$area = "all"
$status = "all"
$owner = "all"
$window = "28"
$tick = "0"
filters = Filters($area, $owner, $phase, $status, $tick, $window)
tasks = Query("seo_tasks", {phase: $phase, area: $area, status: $status, owner: $owner, tick: $tick}, {ready: false, tasks: []})
kpis = Query("seo_kpis", {window: $window, tick: $tick}, {ready: false})
progress = Query("seo_progress", {tick: $tick}, {ready: false})
approvals = Query("seo_approvals", {tick: $tick}, {ready: false})
timeline = Query("seo_timeline", {tick: $tick}, {ready: false})
reference = Query("seo_reference", {tick: $tick}, {ready: false})
progressBoard = Progress(progress)
kpiBoard = Kpis(kpis)
taskBoard = Tasks(tasks)
approvalBoard = Approvals(approvals)
timelineBoard = Timeline(timeline)
referenceBoard = Reference(reference)
root = Stack([filters, progressBoard, kpiBoard, taskBoard, approvalBoard, timelineBoard, referenceBoard])`;

export function seoDashboardStubLibrary() {
  const Filters = defineComponent({
    component: stub,
    description: "Phase, area, status, owner and date filters bound to reactive variables.",
    name: "Filters",
    props: filtersProps,
  });
  const Progress = defineComponent({
    component: stub,
    description: "Overall, phase and area progress from seo_progress.",
    name: "Progress",
    props: progressProps,
  });
  const Kpis = defineComponent({
    component: stub,
    description: "Live Search Console, catalog and sitemap figures from seo_kpis.",
    name: "Kpis",
    props: kpisProps,
  });
  const Tasks = defineComponent({
    component: stub,
    description: "Filtered plan tasks from seo_tasks.",
    name: "Tasks",
    props: tasksProps,
  });
  const Approvals = defineComponent({
    component: stub,
    description: "Owner approvals from seo_approvals.",
    name: "Approvals",
    props: approvalsProps,
  });
  const Timeline = defineComponent({
    component: stub,
    description: "Weekly plan windows from seo_timeline.",
    name: "Timeline",
    props: timelineProps,
  });
  const Reference = defineComponent({
    component: stub,
    description: "Keyword targets and sample titles from seo_reference.",
    name: "Reference",
    props: referenceProps,
  });
  const Stack = defineComponent({
    component: stub,
    description: "Dashboard column. This is the root.",
    name: "Stack",
    props: z.object({
      children: z.array(
        z.union([
          Approvals.ref,
          Filters.ref,
          Kpis.ref,
          Progress.ref,
          Reference.ref,
          Tasks.ref,
          Timeline.ref,
        ]),
      ),
    }),
  });
  return createLibrary({
    components: [Approvals, Filters, Kpis, Progress, Reference, Stack, Tasks, Timeline],
    root: "Stack",
  });
}

export function seoDashboardProgramErrors(): string[] {
  const library = seoDashboardStubLibrary();
  const result = createParser(library.toJSONSchema(), library.root).parse(SEO_DASHBOARD_PROGRAM);
  return result.meta.errors.map((error) => error.message);
}

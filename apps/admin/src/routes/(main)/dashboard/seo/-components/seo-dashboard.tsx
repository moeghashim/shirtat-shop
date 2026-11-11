import { type ReactNode, useState } from "react";

import { useNavigate, useRouter } from "@tanstack/react-router";
import { type ColumnDef, useTable } from "@tanstack/react-table";

import {
  Bar,
  BarChart,
  CartesianGrid,
  chartAxis,
  chartCursor,
  chartGrid,
  DashboardCard,
  DashboardChart,
  DashboardLegend,
  DashboardTooltip,
  DataTable,
  type DataTableFeatures,
  dataTableFeatures,
  Legend,
  PageHeader,
  SectionHeader,
  StatCard,
  seriesConfig,
  Tooltip,
  useChartMotion,
  XAxis,
  YAxis,
} from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { SeoDashboardData, SeoQuery } from "@/server/seo/read.server";

import type {
  CountReading,
  ProgressSlice,
  SearchRow,
  SearchSlice,
  TaskRow,
} from "../../../../../../../../lib/seo-plan/types.ts";

const PHASES = [
  ["all", "All phases"],
  ["foundation", "Already in the storefront"],
  ["now", "Quick wins, Nov 10–30"],
  ["dec", "December"],
  ["q1", "Q1 2027"],
] as const;

const AREAS = [
  ["all", "All areas"],
  ["Backlinks", "Backlinks"],
  ["Content", "Content"],
  ["International", "International"],
  ["Keywords", "Keywords"],
  ["Linking", "Linking"],
  ["Measurement", "Measurement"],
  ["On-page", "On-page"],
  ["Shopping", "Shopping"],
  ["Technical", "Technical"],
] as const;

const STATUSES = [
  ["all", "All statuses"],
  ["not-started", "Not started"],
  ["in-progress", "In progress"],
  ["blocked-on-approval", "Blocked on approval"],
  ["done", "Done"],
] as const;

const OWNERS = [
  ["all", "All owners"],
  ["moe", "Moe"],
  ["bot", "Bot"],
] as const;

const STATUS_LABEL = {
  "blocked-on-approval": "Blocked on approval",
  done: "Done",
  "in-progress": "In progress",
  "not-started": "Not started",
} as const;

const phaseChart = seriesConfig({ done: "Done", remaining: "Remaining" });

function Table({ "aria-label": label, children }: { "aria-label": string; children: ReactNode }) {
  return (
    <table aria-label={label} className="w-full text-sm">
      {children}
    </table>
  );
}
function TableHeader({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}
function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}
function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b">{children}</tr>;
}
function TableHead({ children, scope = "col" }: { children: ReactNode; scope?: "col" }) {
  return (
    <th className="p-2 text-left align-top font-medium" scope={scope}>
      {children}
    </th>
  );
}
function TableCell({ children, colSpan }: { children: ReactNode; colSpan?: number }) {
  return (
    <td className="p-2 align-top" colSpan={colSpan}>
      {children}
    </td>
  );
}

function readingValue(reading: CountReading): string {
  if (reading.state === "ok" && typeof reading.count === "number") return reading.count.toLocaleString("en");
  if (reading.state === "not-connected") return "Not connected";
  if (reading.state === "no-data") return "No data";
  return "Unavailable";
}

function formatCtr(value: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1, style: "percent" }).format(value);
}

function formatPosition(value: number): string {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
}

function Bilingual({ children }: { children: string }) {
  return <span dir="auto">{children}</span>;
}

function RowsTable({ label, rows }: { label: string; rows: SearchRow[] }) {
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Key</TableHead>
          <TableHead scope="col">Clicks</TableHead>
          <TableHead scope="col">Impressions</TableHead>
          <TableHead scope="col">CTR</TableHead>
          <TableHead scope="col">Position</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>No rows</TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell>
                <Bilingual>{row.key}</Bilingual>
              </TableCell>
              <TableCell>{row.clicks.toLocaleString("en")}</TableCell>
              <TableCell>{row.impressions.toLocaleString("en")}</TableCell>
              <TableCell>{formatCtr(row.ctr)}</TableCell>
              <TableCell>{formatPosition(row.position)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function SearchSliceView({ slice, title }: { slice: SearchSlice; title: string }) {
  return (
    <DashboardCard>
      <SectionHeader title={title} description={slice.state === "ok" ? "Search Console" : slice.state} />
      <CardContent className="grid gap-4">
        {slice.totals ? (
          <p className="text-sm">
            {slice.totals.clicks.toLocaleString("en")} clicks · {slice.totals.impressions.toLocaleString("en")}{" "}
            impressions · {formatCtr(slice.totals.ctr)} CTR · position {formatPosition(slice.totals.position)}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">No totals for this window.</p>
        )}
        <RowsTable label={`${title} by page`} rows={slice.byPage} />
        <RowsTable label={`${title} by country`} rows={slice.byCountry} />
      </CardContent>
    </DashboardCard>
  );
}

const taskColumns: ColumnDef<DataTableFeatures, TaskRow>[] = [
  { accessorKey: "id", header: "Task", sortFn: "alphanumeric" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => STATUS_LABEL[getValue() as TaskRow["status"]] ?? String(getValue()),
  },
  { accessorKey: "phase", header: "Phase" },
  { accessorKey: "area", header: "Area" },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ getValue }) => <Bilingual>{String(getValue() ?? "")}</Bilingual>,
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ getValue }) => (getValue() === "moe" ? "Moe" : "Bot"),
  },
  { accessorKey: "updated", header: "Updated" },
  {
    accessorKey: "approval",
    header: "Approval",
    cell: ({ getValue }) => <Bilingual>{String(getValue() ?? "")}</Bilingual>,
  },
  {
    accessorKey: "measure",
    header: "Measure",
    cell: ({ getValue }) => <Bilingual>{String(getValue() ?? "")}</Bilingual>,
  },
  {
    accessorKey: "evidence",
    header: "Evidence",
    cell: ({ getValue }) => <Bilingual>{getValue() ? String(getValue()) : "—"}</Bilingual>,
  },
  {
    accessorKey: "link",
    header: "Link",
    cell: ({ getValue }) => {
      const link = getValue();
      return typeof link === "string" && link ? (
        <a className="underline underline-offset-4" href={link} rel="noreferrer">
          Open
        </a>
      ) : (
        "—"
      );
    },
  },
];

function TaskTable({ tasks }: { tasks: TaskRow[] }) {
  const table = useTable({
    columns: taskColumns,
    data: tasks,
    features: dataTableFeatures,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  return <DataTable label="SEO tasks" table={table} />;
}

function PhaseChart({ phases }: { phases: ProgressSlice[] }) {
  const motion = useChartMotion();
  const data = phases.map((phase) => ({
    done: phase.done,
    phase: phase.label,
    remaining: phase.total - phase.done,
  }));
  return (
    <div className="grid gap-4">
      <DashboardChart
        aria-label="Tasks done and remaining by phase. The table lists the same counts."
        config={phaseChart}
      >
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="phase" {...chartAxis} />
          <YAxis {...chartAxis} allowDecimals={false} width={32} />
          <Tooltip {...motion} content={<DashboardTooltip />} cursor={chartCursor} />
          <Legend content={<DashboardLegend config={phaseChart} />} />
          <Bar dataKey="done" fill={phaseChart.done.color} {...motion} />
          <Bar dataKey="remaining" fill={phaseChart.remaining.color} {...motion} />
        </BarChart>
      </DashboardChart>
      <Table aria-label="Tasks done and remaining by phase">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Phase</TableHead>
            <TableHead scope="col">Done</TableHead>
            <TableHead scope="col">Remaining</TableHead>
            <TableHead scope="col">Total</TableHead>
            <TableHead scope="col">Percent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {phases.map((phase) => (
            <TableRow key={phase.id}>
              <TableCell>{phase.label}</TableCell>
              <TableCell>{phase.done}</TableCell>
              <TableCell>{phase.total - phase.done}</TableCell>
              <TableCell>{phase.total}</TableCell>
              <TableCell>{phase.percent}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SeoDashboard({ data, search }: { data: SeoDashboardData; search: SeoQuery }) {
  const navigate = useNavigate();
  const router = useRouter();
  const custom = search.window?.includes(":") ? search.window.split(":") : ["", ""];
  const [start, setStart] = useState(custom[0] ?? "");
  const [end, setEnd] = useState(custom[1] ?? "");
  const gsc = data.kpis.gsc;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="SEO plan"
        description="Owner only. Search Console, the published catalog and the sitemap load from this server. Task statuses are edited in the plan file."
        actions={
          <Button type="button" variant="ghost" onClick={() => void router.invalidate()}>
            Refresh
          </Button>
        }
      />
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const value = (key: string) => {
            const next = form.get(key);
            return typeof next === "string" && next !== "all" && next !== "" ? next : undefined;
          };
          const window = start && end ? `${start}:${end}` : value("window");
          void navigate({
            to: "/dashboard/seo",
            search: {
              area: value("area"),
              owner: value("owner"),
              phase: value("phase"),
              status: value("status"),
              window,
            },
          });
        }}
      >
        <Filter name="phase" label="Phase" value={search.phase ?? "all"} options={PHASES} />
        <Filter name="area" label="Area" value={search.area ?? "all"} options={AREAS} />
        <Filter name="status" label="Status" value={search.status ?? "all"} options={STATUSES} />
        <Filter name="owner" label="Owner" value={search.owner ?? "all"} options={OWNERS} />
        <Filter
          name="window"
          label="Date window"
          value={search.window === "90" ? "90" : "28"}
          options={[
            ["28", "Last 28 days"],
            ["90", "Last 90 days"],
          ]}
        />
        <label className="flex flex-col gap-1 text-sm" htmlFor="seo-start">
          Start date
          <Input id="seo-start" onChange={(event) => setStart(event.target.value)} type="date" value={start} />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="seo-end">
          End date
          <Input id="seo-end" onChange={(event) => setEnd(event.target.value)} type="date" value={end} />
        </label>
        <Button type="submit">Apply</Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Done"
          value={`${data.progress.percent}%`}
          help={`${data.progress.done} of ${data.progress.total}`}
        />
        <StatCard label="In progress" value={String(data.progress.inProgress)} />
        <StatCard label="Blocked on approval" value={String(data.progress.blocked)} />
        <StatCard label="Not started" value={String(data.progress.notStarted)} />
      </div>
      <DashboardCard>
        <SectionHeader title="Progress" description="Unfiltered. Phase and area counts ignore the task filters." />
        <CardContent className="grid gap-6">
          <PhaseChart phases={data.progress.phases} />
          <Table aria-label="Progress by area">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Area</TableHead>
                <TableHead scope="col">Done</TableHead>
                <TableHead scope="col">Total</TableHead>
                <TableHead scope="col">Percent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.progress.areas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell>{area.label}</TableCell>
                  <TableCell>{area.done}</TableCell>
                  <TableCell>{area.total}</TableCell>
                  <TableCell>{area.percent}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </DashboardCard>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Published products" value={readingValue(data.kpis.catalog.products)} />
        <StatCard label="Collections" value={readingValue(data.kpis.catalog.collections)} />
        <StatCard label="Sitemap URLs" value={readingValue(data.kpis.sitemapUrls)} help="English and Arabic" />
      </div>
      <DashboardCard>
        <SectionHeader title="Search Console" description={data.site} />
        <CardContent className="grid gap-4">
          <GscState reading={gsc} />
          {gsc.web ? <SearchSliceView slice={gsc.web} title="Web" /> : null}
          {gsc.image ? <SearchSliceView slice={gsc.image} title="Image" /> : null}
          {gsc.sitemaps ? (
            <p className="text-sm">
              Sitemap index: {gsc.sitemaps.state}
              {typeof gsc.sitemaps.indexed === "number" && typeof gsc.sitemaps.submitted === "number"
                ? ` · ${gsc.sitemaps.indexed.toLocaleString("en")} indexed of ${gsc.sitemaps.submitted.toLocaleString("en")} submitted`
                : ""}
              {typeof gsc.sitemaps.errors === "number" ? ` · ${gsc.sitemaps.errors.toLocaleString("en")} errors` : ""}
              {typeof gsc.sitemaps.warnings === "number"
                ? ` · ${gsc.sitemaps.warnings.toLocaleString("en")} warnings`
                : ""}
              {gsc.sitemaps.path ? ` · ${gsc.sitemaps.path}` : ""}
            </p>
          ) : null}
        </CardContent>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader title="KPI definitions" />
        <CardContent>
          <Table aria-label="KPI definitions">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">KPI</TableHead>
                <TableHead scope="col">Baseline</TableHead>
                <TableHead scope="col">Source</TableHead>
                <TableHead scope="col">Cadence</TableHead>
                <TableHead scope="col">Checkpoint</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.kpis.definitions.map((kpi) => (
                <TableRow key={kpi.id}>
                  <TableCell>{kpi.name}</TableCell>
                  <TableCell>
                    <Bilingual>{kpi.baseline}</Bilingual>
                  </TableCell>
                  <TableCell>
                    <Bilingual>{kpi.source}</Bilingual>
                  </TableCell>
                  <TableCell>{kpi.cadence}</TableCell>
                  <TableCell>{kpi.checkpoint}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader
          title="Tasks"
          description="Filtered by phase, area, status and owner. The date window does not change this list."
        />
        <CardContent>
          <TaskTable tasks={data.tasks.tasks} />
        </CardContent>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader
          title="Approvals"
          description={`${data.approvals.granted} granted · ${data.approvals.pending} pending`}
        />
        <CardContent>
          <Table aria-label="Approvals">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">State</TableHead>
                <TableHead scope="col">Approval</TableHead>
                <TableHead scope="col">Detail</TableHead>
                <TableHead scope="col">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.approvals.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.state === "granted" ? "Granted" : "Pending"}</TableCell>
                  <TableCell>
                    <Bilingual>{item.text}</Bilingual>
                  </TableCell>
                  <TableCell>{item.meta ? <Bilingual>{item.meta}</Bilingual> : "—"}</TableCell>
                  <TableCell>{item.updated ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader title="Timeline" />
        <CardContent>
          <Table aria-label="Timeline">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Window</TableHead>
                <TableHead scope="col">Focus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.timeline.rows.map((row) => (
                <TableRow key={row.window}>
                  <TableCell>{row.window}</TableCell>
                  <TableCell>
                    <Bilingual>{row.focus}</Bilingual>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader title="Keyword targets" />
        <CardContent>
          <Table aria-label="Keyword targets">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Cluster</TableHead>
                <TableHead scope="col">Examples</TableHead>
                <TableHead scope="col">Intent</TableHead>
                <TableHead scope="col">Language</TableHead>
                <TableHead scope="col">Priority</TableHead>
                <TableHead scope="col">Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reference.keywords.map((row) => (
                <TableRow key={row.cluster}>
                  <TableCell>
                    <Bilingual>{row.cluster}</Bilingual>
                  </TableCell>
                  <TableCell>
                    <Bilingual>{row.examples}</Bilingual>
                  </TableCell>
                  <TableCell>{row.intent}</TableCell>
                  <TableCell>{row.lang}</TableCell>
                  <TableCell>{row.priority}</TableCell>
                  <TableCell>
                    <Bilingual>{row.target}</Bilingual>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </DashboardCard>
      <DashboardCard>
        <SectionHeader title="Sample titles" />
        <CardContent>
          <Table aria-label="Sample titles">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Page</TableHead>
                <TableHead scope="col">Current</TableHead>
                <TableHead scope="col">Proposed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reference.titles.map((row) => (
                <TableRow key={row.page}>
                  <TableCell>{row.page}</TableCell>
                  <TableCell>
                    <Bilingual>{row.current}</Bilingual>
                  </TableCell>
                  <TableCell>
                    <Bilingual>{row.proposed}</Bilingual>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </DashboardCard>
    </div>
  );
}

function GscState({ reading }: { reading: SeoDashboardData["kpis"]["gsc"] }) {
  if (reading.state === "not-connected") {
    return (
      <p className="text-sm">
        Search Console is not connected. Set GSC_CLIENT_ID, GSC_CLIENT_SECRET and GSC_REFRESH_TOKEN.
      </p>
    );
  }
  if (reading.code === "invalid-window") {
    return <p className="text-sm">That date window is invalid. Use 28, 90, or YYYY-MM-DD:YYYY-MM-DD.</p>;
  }
  if (reading.state === "error") return <p className="text-sm">Search Console is unavailable.</p>;
  return (
    <p className="text-muted-foreground text-sm">
      {reading.start && reading.end ? `${reading.start} to ${reading.end}` : "Connected"}
    </p>
  );
}

function Filter({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: readonly (readonly [string, string])[];
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={`seo-${name}`}>
      {label}
      <NativeSelect defaultValue={value} id={`seo-${name}`} name={name}>
        {options.map(([id, text]) => (
          <NativeSelectOption key={id} value={id}>
            {text}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}

import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { z } from "zod";

import { blockDataSchema, seriesDataSchema, statDataSchema, tableDataSchema } from "./data-contract.ts";

export const limits = {
  panels: 8,
  refs: 4,
  outputBytes: 65536,
  nodes: 200,
  depth: 12,
  rows: 50,
  columns: 8,
  points: 50,
  series: 4,
} as const;
export const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
const text = z.string().max(4096);
const label = z.string().min(1).max(120);
const children = z.array(z.unknown()).max(limits.nodes);
export const schemas = {
  Stack: z.strictObject({ children }),
  DashboardGrid: z.strictObject({ children }),
  Panel: z.strictObject({ id: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/), children }),
  DashboardCard: z.strictObject({ title: label, children }),
  PageHeader: z.strictObject({ title: label, description: text }),
  StatCard: z.strictObject({ data: blockDataSchema(statDataSchema) }),
  DashboardChart: z.strictObject({
    title: label,
    kind: z.enum(["line", "bar", "area"]),
    data: blockDataSchema(seriesDataSchema),
  }),
  DataTable: z.strictObject({ title: label, data: blockDataSchema(tableDataSchema) }),
  Text: z.strictObject({ text }),
  Card: z.strictObject({ title: label, children }),
  Stat: z.strictObject({ label, value: z.string().max(80), detail: text }),
  Badge: z.strictObject({ label, tone: z.enum(["neutral", "success", "warning", "info"]) }),
  List: z.strictObject({ items: z.array(text).max(50) }),
  Table: z
    .strictObject({
      columns: z.array(label).min(1).max(limits.columns),
      rows: z.array(z.array(z.union([text, z.number().finite()])).max(limits.columns)).max(limits.rows),
    })
    .refine((p) => p.rows.every((row) => row.length === p.columns.length)),
  Chart: z
    .strictObject({
      title: label,
      kind: z.enum(["bar", "line"]),
      labels: z.array(label).min(1).max(limits.points),
      series: z
        .array(z.strictObject({ label, values: z.array(z.number().finite()).max(limits.points) }))
        .min(1)
        .max(limits.series),
    })
    .refine((p) => p.series.every((series) => series.values.length === p.labels.length)),
};
export type ComponentName = keyof typeof schemas;
export type SafeNode = { name: ComponentName; props: Record<string, unknown> };
export const descriptions: Record<ComponentName, string> = {
  DashboardGrid: "Responsive dashboard grid. Children must be Panels; at most eight panels per response.",
  Panel: "Stable unique ASCII document ID and exactly one block child. Only inside DashboardGrid.",
  DashboardCard: "Titled read-only group of registered components.",
  PageHeader: "Section heading within the Assistant; never emits a second h1.",
  StatCard: "Metric data: literal value or inert version-1 data reference.",
  DashboardChart: "Line, bar or area with labeled series and accessible data table. Literal or inert reference data.",
  DataTable: "Read-only public table. Literal or inert reference data; no actions or generated columns.",
  Stack: "Vertical read-only layout. Children are registered components.",
  Text: "Plain escaped text. No markup.",
  Card: "Titled group of registered read-only components.",
  Stat: "One labeled illustrative metric and explanation.",
  Badge: "Small semantic status label.",
  List: "Plain text bullet list.",
  Table: "At most 50 rows and 8 columns, matching widths.",
  Chart: "Bar or line chart with a data table. At most 4 finite series and 50 matching points.",
};
// The same schemas/key ordering feed the server spec and React bindings. No React import here.
export function getSpecLibrary() {
  return createLibrary({
    id: "tenboards-assistant-v1",
    root: "Stack",
    components: Object.entries(schemas).map(([name, props]) =>
      defineComponent({ name, props, description: descriptions[name as ComponentName], component: null }),
    ),
  });
}
export const getLibrarySpec = () => getSpecLibrary().toSpec();
export const promptOptions = {
  toolCalls: false,
  bindings: false,
  builtinFunctions: false,
  editMode: false,
  inlineMode: false,
} as const;

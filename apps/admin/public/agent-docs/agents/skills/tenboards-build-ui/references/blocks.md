# Public block contracts

Import from `@/components/blocks`; inspect the TSDoc/source for the exact installed API.
Chart primitives also export from `@/components/blocks/charts`, never import `recharts`
directly in routes. The executable kit is `src/routes/(main)/dashboard/kit/-components/`.

| Block | Contract |
| --- | --- |
| PageHeader | `title: string`, optional `description: string`, `actions`, `className`; one h1 per page |
| DashboardCard | Native Card props plus `density: "compact" | "standard"`; default standard already follows compact responsive tokens |
| SectionHeader | `title`, optional `description`, `actions`, `level: 2 | 3`, `id`; compose inside DashboardCard |
| StatCard | `label: string`, `value: ReactNode`; optional `help`, `trend`, `actions`, `icon`, `density`, `level`, `className` |
| CardContent | Public re-export of the existing card content slot |
| DataTable | Caller-owned `table`, required accessible `label`; optional `empty`, `pagination`, `mobile: "reflow" | "scroll"`, `columnLabels`, `className` |
| DashboardChart | ChartContainer props, including `config` and `children`; default responsive height |
| DashboardTooltip | ChartTooltipContent props; custom formatter replaces the entire row |
| DashboardLegend | Required named-series `config`, optional payload and className |

For tables copy the generator's `./scripts/templates/records-table.tsx.template`:
`ColumnDef<DataTableFeatures, Row>[]`, `useTable({ features: dataTableFeatures, data,
columns, getRowId, initialState })`. Headers are plain labels: DataTable supplies
sorting buttons. `mobile="reflow"` is the default. Use an informative empty state.

Charts use `seriesConfig({ revenue: "Revenue" })`, `chartAxis`, `chartGrid`,
`chartCursor` and `useChartMotion()`. Spread motion onto each mark and Tooltip;
use `config.revenue.color` for marks and preserve labels in custom tooltips.
Copy the generated activity chart's accessible table alternative when changing series.
Use `formatCurrency(value, currency?)`, `formatNumber(value)` and `formatPercent(value)`
for explicit en-US formatting. For chart ticks use `(value) => formatCurrency(value)`;
a chart callback may pass an index as its second argument. Numeric Table columns
use `(a, b, id) => a.getValue<number>(id) - b.getValue<number>(id)`, not a v8 sort name.

Use named layout classes such as `min-w-0 space-y-5`, `grid gap-4 sm:grid-cols-3`.
Do not copy raw primitive Card/Table markup to imitate blocks or add raw colors,
arbitrary sizing, new density overrides or exceptions to pass a new page.

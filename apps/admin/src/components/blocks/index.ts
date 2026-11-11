/** Public presentation blocks. Data, routing and domain behavior stay with the caller. */

export { CardContent } from "@/components/ui/card";
export type { DataTableFeatures } from "@/lib/data-table-features";
export { dataTableFeatures } from "@/lib/data-table-features";

export type { DashboardCardProps, SectionHeaderProps, StatCardProps } from "./cards";
export { DashboardCard, SectionHeader, StatCard } from "./cards";
// Chart block: presentation helpers plus Recharts primitives (the only module allowed to import recharts).
export type {
  BarShapeProps,
  DashboardChartProps,
  DashboardLegendProps,
  DashboardTooltipProps,
  LabelProps,
  SeriesStyle,
} from "./charts";
export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  chartAxis,
  chartCursor,
  chartGrid,
  chartSeries,
  DashboardChart,
  DashboardLegend,
  DashboardTooltip,
  formatCurrency,
  formatNumber,
  formatPercent,
  Label,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  seriesConfig,
  Tooltip,
  useChartMotion,
  XAxis,
  YAxis,
} from "./charts";
export type { DataTableProps } from "./data-table";
export { DataTable } from "./data-table";
export type { PageHeaderProps } from "./page-header";
export { PageHeader } from "./page-header";

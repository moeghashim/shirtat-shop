import { type ComponentProps, useSyncExternalStore } from "react";

import { cn } from "cn";

import { ChartContainer, type ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";

/** Opaque chart colors and distinct line patterns. Skips duplicate Default chart-3. */
export const chartSeries = [
  { color: "var(--chart-1)", strokeDasharray: undefined },
  { color: "var(--chart-2)", strokeDasharray: "6 3" },
  { color: "var(--chart-4)", strokeDasharray: "2 3" },
  { color: "var(--chart-5)", strokeDasharray: "8 3 2 3" },
] as const;

/** Accessible series identity shared by marks, tooltip and legend. */
export interface SeriesStyle {
  /** Human-readable series name. */
  label: string;
  /** CSS token color for marks and legend samples. */
  color: string;
  /** Supplementary line pattern so color is not the only distinction. */
  strokeDasharray?: string;
}

/** Assign shared colors/patterns to named series in insertion order; styles repeat after four series. */
export function seriesConfig<T extends string>(labels: Record<T, string>): Record<T, SeriesStyle> {
  return Object.fromEntries(
    Object.entries<string>(labels).map(([key, label], index) => [
      key,
      { label, ...chartSeries[index % chartSeries.length] },
    ]),
  ) as Record<T, SeriesStyle>;
}

/** Recharts axis props: muted 12px ticks without decorative axis lines. */
export const chartAxis = {
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
  tick: { fill: "var(--text-muted)", fontSize: 12 },
} as const;
/** Recharts CartesianGrid props for decorative dashed horizontal separators. */
export const chartGrid = { vertical: false, stroke: "var(--border)", strokeDasharray: "3 3" } as const;
/** Recharts tooltip cursor props using a dashed muted stroke. */
export const chartCursor = { stroke: "var(--text-muted)", strokeDasharray: "3 3" } as const;

/** Format a number using the explicit en-US locale. */
export const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
/** Format an amount using en-US and the supplied ISO currency (USD by default). */
export const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
/** Format a ratio as an en-US percentage with at most one decimal place. */
export const formatPercent = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value);

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
// Static SSR and first client paint; enable short animations only after hydration.
/** SSR-safe reduced-motion subscription. Spread onto every animated series and tooltip. */
export function useChartMotion() {
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  return { isAnimationActive: !reduced, animationDuration: 200 } as const;
}

/** ChartContainer props, including required config/children and optional height/layout className. */
export type DashboardChartProps = ComponentProps<typeof ChartContainer>;
/** ChartTooltipContent props; Recharts supplies payload/active and callers own value/label formatters. */
export type DashboardTooltipProps = ComponentProps<typeof ChartTooltipContent>;
/** Legend content props with the same named series config used by the marks. */
export type DashboardLegendProps = ComponentProps<typeof ChartLegendContent> & {
  /** Series labels, token colors and line patterns, keyed by dataKey. */
  config: Record<string, SeriesStyle>;
};

/** Bounded responsive chart container with keyboard focus treatment; provide an accessible data alternative. */
export function DashboardChart({ className, ...props }: DashboardChartProps) {
  return (
    <ChartContainer
      className={cn(
        "[&_.recharts-surface:focus-visible]:outline-ring aspect-auto h-64 w-full min-w-0 tabular-nums sm:h-80 [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-2 [&_.recharts-surface:focus-visible]:outline-solid",
        className,
      )}
      {...props}
    />
  );
}

/** Token-colored tooltip content for a Recharts Tooltip. */
export function DashboardTooltip(props: DashboardTooltipProps) {
  return (
    <ChartTooltipContent
      {...props}
      className={cn("border-border bg-popover text-popover-foreground tabular-nums", props.className)}
    />
  );
}

/** Wrapping legend with bar or distinct line samples matched to the marks. */
export function DashboardLegend({ config, payload, className }: DashboardLegendProps) {
  return (
    <div className={cn("text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-xs", className)}>
      {payload
        ?.filter((entry) => entry.type !== "none")
        .map((entry) => {
          const key = String(entry.dataKey ?? entry.value);
          const series = config[key];
          if (!series) return null;
          return (
            <span key={key} className="flex items-center gap-1.5">
              <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true" className="shrink-0">
                {entry.type === "rect" ? (
                  <rect x="6" y="0" width="12" height="12" fill={series.color} />
                ) : (
                  <line
                    x1="0"
                    y1="6"
                    x2="24"
                    y2="6"
                    stroke={series.color}
                    strokeWidth="2"
                    strokeDasharray={series.strokeDasharray}
                  />
                )}
              </svg>
              {series.label}
            </span>
          );
        })}
    </div>
  );
}

/** Recharts primitives share this public boundary; callers retain data and composition. */
export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  ComposedChart,
  Label,
  LabelList,
  type LabelProps,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

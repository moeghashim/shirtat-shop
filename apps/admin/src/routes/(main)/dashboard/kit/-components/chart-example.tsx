import { useState } from "react";

import {
  CartesianGrid,
  chartAxis,
  chartCursor,
  chartGrid,
  DashboardChart,
  DashboardLegend,
  DashboardTooltip,
  formatNumber,
  Legend,
  Line,
  LineChart,
  seriesConfig,
  Tooltip,
  useChartMotion,
  XAxis,
  YAxis,
} from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const data = [
  { day: "Mon", opened: 12, completed: 8 },
  { day: "Tue", opened: 18, completed: 14 },
  { day: "Wed", opened: 15, completed: 16 },
  { day: "Thu", opened: 22, completed: 18 },
  { day: "Fri", opened: 19, completed: 24 },
];
const config = seriesConfig({ opened: "Opened", completed: "Completed" });

export function ChartExample() {
  const [compare, setCompare] = useState(true);
  const motion = useChartMotion();
  return (
    <div className="min-w-0 space-y-4">
      <Button variant="outline" aria-pressed={compare} onClick={() => setCompare(!compare)}>
        Compare series
      </Button>
      <DashboardChart config={config} aria-label="Illustrative requests by weekday; exact values in the table below">
        <LineChart data={data} accessibilityLayer>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="day" {...chartAxis} />
          <YAxis {...chartAxis} tickFormatter={formatNumber} width={36} />
          <Tooltip {...motion} cursor={chartCursor} content={<DashboardTooltip />} />
          <Legend content={<DashboardLegend config={config} />} />
          <Line
            dataKey="opened"
            stroke={config.opened.color}
            strokeDasharray={config.opened.strokeDasharray}
            strokeWidth={2}
            dot
            {...motion}
          />
          {compare && (
            <Line
              dataKey="completed"
              stroke={config.completed.color}
              strokeDasharray={config.completed.strokeDasharray}
              strokeWidth={2}
              dot
              {...motion}
            />
          )}
        </LineChart>
      </DashboardChart>
      <details>
        <summary className="w-fit cursor-pointer rounded-sm text-sm underline underline-offset-4">
          View chart data
        </summary>
        <Table aria-label="Illustrative requests by weekday">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Day</TableHead>
              <TableHead scope="col">Opened</TableHead>
              <TableHead scope="col">Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.day}>
                <TableCell>{row.day}</TableCell>
                <TableCell>{row.opened}</TableCell>
                <TableCell>{row.completed}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
    </div>
  );
}

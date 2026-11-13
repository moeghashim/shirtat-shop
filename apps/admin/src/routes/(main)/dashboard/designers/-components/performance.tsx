import { useMemo, useState } from "react";

import { DashboardCard, SectionHeader, StatCard } from "@/components/blocks";
import { CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { DesignersView, PerformanceRow } from "../../../../../../../../lib/admin-api/types.ts";

const COLUMNS: { key: keyof PerformanceRow; label: string; money?: boolean }[] = [
  { key: "name", label: "Designer" },
  { key: "status", label: "Status" },
  { key: "rate", label: "Tier / rate" },
  { key: "units60", label: "Units 60d" },
  { key: "net60", label: "Net 60d", money: true },
  { key: "unitsQtd", label: "Units QTD" },
  { key: "netQtd", label: "Net QTD", money: true },
  { key: "refunds", label: "Refunds", money: true },
  { key: "earnings", label: "Owed", money: true },
  { key: "pending", label: "Pending", money: true },
  { key: "payable", label: "Payable", money: true },
  { key: "designsSubmitted", label: "Designs" },
  { key: "designsLive", label: "Live" },
  { key: "designsRejected", label: "Rejected" },
  { key: "lastSignIn", label: "Last sign-in" },
  { key: "lastUpload", label: "Last upload" },
];

const usd = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" });

type Sort = { dir: 1 | -1; key: keyof PerformanceRow };

function ariaSort(sort: Sort, key: keyof PerformanceRow) {
  if (sort.key !== key) return "none" as const;
  return sort.dir === 1 ? ("ascending" as const) : ("descending" as const);
}

function arrow(sort: Sort, key: keyof PerformanceRow): string {
  if (sort.key !== key) return "";
  return sort.dir === 1 ? " ▲" : " ▼";
}

function cellText(row: PerformanceRow, column: (typeof COLUMNS)[number]): string {
  if (column.key === "name") return `${row.name}${row.handle ? ` (@${row.handle})` : ""}`;
  if (column.key === "rate") return row.status === "approved" ? `${row.tier} ${Math.round(row.rate * 100)}%` : "—";
  const value = row[column.key];
  if (column.money) return usd.format(Number(value));
  return String(value || "—");
}

export function Performance({ view }: { view: DesignersView }) {
  const { rows, salesUnavailable } = view.performance;
  const sum = (key: keyof PerformanceRow) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
  const totals: [string, string][] = [
    ["Approved designers", String(view.counts.approved)],
    ["Pending applications", String(view.counts.pending)],
    ["Units (60 days)", String(sum("units60"))],
    ["Net sales (60 days)", usd.format(sum("net60"))],
    ["Net sales (QTD)", usd.format(sum("netQtd"))],
    ["Refunds", usd.format(sum("refunds"))],
    ["Owed to designers", usd.format(sum("earnings"))],
    ["Payable now", usd.format(sum("payable"))],
    ["Designs live", `${sum("designsLive")} of ${sum("designsSubmitted")}`],
  ];
  return (
    <section aria-labelledby="performance-heading" className="grid gap-4">
      <h2 className="text-lg font-medium" id="performance-heading">
        Performance
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {totals.map(([label, value]) => (
          <StatCard density="compact" key={label} label={label} level={3} value={value} />
        ))}
      </div>
      {salesUnavailable ? (
        <p className="text-destructive text-sm">Sales data is unavailable right now; figures show 0.</p>
      ) : null}
      {rows.length ? <PerformanceTable rows={rows} /> : null}
      <p className="text-muted-foreground text-xs">
        USD. Orders from the last 60 days (Shopify window); QTD is quarter-to-date within that window. Non-USD orders
        are converted at the order-date rate. Refunds are deducted. Pending = within the 30-day hold; payable = past it.
      </p>
    </section>
  );
}

function PerformanceTable({ rows }: { rows: PerformanceRow[] }) {
  const [sort, setSort] = useState<Sort>({ dir: -1, key: "net60" });
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
      }),
    [rows, sort],
  );
  return (
    <DashboardCard density="compact">
      <SectionHeader level={3} title="Designers by sales" description="Select a column to sort." />
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHead aria-sort={ariaSort(sort, column.key)} key={column.key}>
                  <button
                    className="min-h-6 cursor-pointer whitespace-nowrap"
                    onClick={() =>
                      setSort((s) => ({ dir: s.key === column.key && s.dir === -1 ? 1 : -1, key: column.key }))
                    }
                    type="button"
                  >
                    {column.label}
                    {arrow(sort, column.key)}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.id}>
                {COLUMNS.map((column) => (
                  <TableCell className="whitespace-nowrap tabular-nums" key={column.key}>
                    {cellText(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </DashboardCard>
  );
}

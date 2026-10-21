"use client";

import { useMemo, useState } from "react";

export interface PerformanceRow {
  designsLive: number;
  designsRejected: number;
  designsSubmitted: number;
  earnings: number;
  handle: string;
  id: string;
  lastSignIn: string;
  lastUpload: string;
  name: string;
  net60: number;
  netQtd: number;
  payable: number;
  pending: number;
  rate: number;
  refunds: number;
  status: string;
  tier: string;
  units60: number;
  unitsQtd: number;
}

const COLUMNS: { key: keyof PerformanceRow; label: string; money?: boolean; pct?: boolean }[] = [
  { key: "name", label: "Creator" },
  { key: "status", label: "Status" },
  { key: "rate", label: "Tier / rate", pct: true },
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

export function PerformanceTable({ rows }: { rows: PerformanceRow[] }) {
  const [sort, setSort] = useState<{ dir: 1 | -1; key: keyof PerformanceRow }>({
    dir: -1,
    key: "net60",
  });
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const x = a[sort.key];
        const y = b[sort.key];
        return (
          (typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y))) * sort.dir
        );
      }),
    [rows, sort],
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} className="whitespace-nowrap px-3 py-2 font-medium">
                <button
                  className="cursor-pointer"
                  type="button"
                  onClick={() =>
                    setSort((s) => ({ dir: s.key === c.key ? (-s.dir as 1 | -1) : -1, key: c.key }))
                  }
                >
                  {c.label}
                  {sort.key === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-t border-border">
              {COLUMNS.map((c) => {
                const v = r[c.key];
                let text: string;
                if (c.key === "name") text = `${r.name}${r.handle ? ` (@${r.handle})` : ""}`;
                else if (c.key === "rate")
                  text = r.status === "approved" ? `${r.tier} ${Math.round(r.rate * 100)}%` : "—";
                else if (c.money) text = usd.format(Number(v));
                else text = String(v || "—");
                return (
                  <td key={c.key} className="whitespace-nowrap px-3 py-2 tabular-nums">
                    {text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

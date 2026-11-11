import { projectionCatalog } from "../../lib/assistant/capabilities.ts";
import {
  type DataRef,
  type DataResult,
  type DataResultMap,
  dashboardReadArgsSchema,
  dataRefKey,
  dataRefSchema,
  dataResultMapSchema,
  dataResultSchema,
} from "../../lib/assistant/data-contract.ts";
import { formatReportingDate, formatReportingMonth, formatSnapshotTime } from "../../lib/assistant/date-format.ts";
import { readAnalytics } from "../data/analytics.ts";
import { readCrm } from "../data/crm.ts";
import { readDefault } from "../data/default.ts";
import { readEcommerce } from "../data/ecommerce.ts";
import { readFinance } from "../data/finance.ts";
import { selectSource } from "../data/source.ts";
import { runtimeEnvironment } from "../runtime.server.ts";
import { executeToolRead } from "./tool-read.server.ts";

export { projectionCatalog } from "../../lib/assistant/capabilities.ts";

function series<T>(
  rows: T[],
  limit: number,
  label: (row: T) => string,
  fields: { label: string; value: (row: T) => number }[],
) {
  const selected = rows.slice(0, limit);
  return {
    truncated: rows.length > limit,
    data: {
      labels: selected.map(label),
      series: fields.map((field) => ({ label: field.label, values: selected.map(field.value) })),
    },
  };
}
export async function dashboardRead(
  request: Request,
  deadline: number,
  input: unknown,
  asOf: string,
): Promise<DataResult> {
  const args = dashboardReadArgsSchema.parse(input);
  return executeToolRead(request, deadline, async () => {
    const ref: DataRef = { kind: "data-ref", version: 1, tool: "dashboard_read", args };
    const clock = { renderedAt: asOf };
    const projection = await (async () => {
      switch (args.domain) {
        case "default":
          return series(
            (await readDefault(clock)).projection.performance,
            args.limit,
            (r) => formatReportingDate(r.date),
            [
              { label: "New customers", value: (r) => r.newCustomers },
              { label: "Active accounts", value: (r) => r.activeAccounts },
              { label: "Returning users", value: (r) => r.returningUsers },
            ],
          );
        case "analytics":
          return series(
            (await readAnalytics(clock)).current.trafficQualityQualitySeries,
            args.limit,
            (r) => formatSnapshotTime(r.date),
            [
              { label: "Actual quality index", value: (r) => r.actualQuality },
              { label: "Baseline quality index", value: (r) => r.baselineQuality },
            ],
          );
        case "finance":
          return series(
            (await readFinance(clock)).current.transactionsOverviewCardChartData.filter(
              (r) => typeof r.expense === "number",
            ),
            args.limit,
            (r) => formatSnapshotTime(r.date),
            [{ label: "Expense", value: (r) => r.expense }],
          );
        case "crm":
          return series((await readCrm(clock)).projection.pipeline, args.limit, (r) => formatReportingMonth(r.date), [
            { label: "Qualified opportunities", value: (r) => r.qualified },
          ]);
        case "ecommerce":
          return series((await readEcommerce()).revenueOverviewData, args.limit, (r) => r.period, [
            { label: "Revenue (USD)", value: (r) => r.revenue },
            { label: "Profit (USD)", value: (r) => r.profit },
          ]);
      }
    })();
    return dataResultSchema.parse({
      ref,
      kind: "series",
      ...projection,
      source: selectSource(runtimeEnvironment()),
      asOf,
      periodLabel: projectionCatalog.find((p) => p.domain === args.domain)!.periodLabel,
    });
  });
}
export async function resolveReferences(
  request: Request,
  deadline: number,
  inputs: unknown[],
  asOf = new Date().toISOString(),
): Promise<DataResultMap> {
  if (inputs.length > 4) throw new Error("Too many data references.");
  const refs = inputs.map((input) => dataRefSchema.parse(input));
  const results: DataResultMap = {};
  for (const ref of refs) {
    const key = dataRefKey(ref);
    if (!results[key]) results[key] = await dashboardRead(request, deadline, ref.args, asOf);
    dataResultMapSchema.parse(results);
  }
  return results;
}

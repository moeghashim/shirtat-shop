import { and, eq } from "drizzle-orm";

import { type MetricUnit, splitMetric } from "../data/metric-projection.ts";
import type { getDatabase } from "./client.server.ts";
import { metricDimensions, metricPoints } from "./schema.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];
type Cell = string | number | boolean | null | undefined;
export async function seedMetricCollection(
  tx: Transaction,
  domain: string,
  collection: string,
  rows: Record<string, Cell>[],
  unit: MetricUnit = "count",
  units: Partial<Record<string, MetricUnit>> = {},
) {
  for (const [position, row] of rows.entries()) {
    const labels: Record<string, string> = {};
    const measures: [string, string | number][] = [];
    for (const [field, value] of Object.entries(row)) {
      if (value === undefined) continue;
      if (value === null) {
        labels[`null:${field}`] = "";
        continue;
      }
      if (typeof value === "boolean") {
        labels[`boolean:${field}`] = String(value);
        continue;
      }
      if (["date", "day", "month", "week", "id", "key", "label", "name", "source", "stage"].includes(field)) {
        labels[`${typeof value}:${field}`] = String(value);
        continue;
      }
      if (typeof value === "number" || /\d/.test(value)) measures.push([field, value]);
      else labels[`string:${field}`] = value;
    }
    if (!measures.length) throw new Error(`Metric collection ${collection} has no numeric field`);
    for (const [field, value] of measures) {
      const { template, numeric, parts } = splitMetric(value, units[field] ?? unit);
      if (parts.length >= 32) throw new Error("Too many metric parts");
      for (const [partIndex, part] of parts.entries()) {
        const key = { domain, series: `${collection}.${field}`, pointKey: `${position}:${partIndex}` };
        const point = {
          ...key,
          position: position * 32 + partIndex,
          value: part.value,
          unit: part.unit,
          currency: part.currency,
        };
        await tx
          .insert(metricPoints)
          .values(point)
          .onConflictDoUpdate({
            target: [metricPoints.domain, metricPoints.series, metricPoints.pointKey],
            set: point,
          });
        await tx
          .delete(metricDimensions)
          .where(
            and(
              eq(metricDimensions.domain, domain),
              eq(metricDimensions.series, key.series),
              eq(metricDimensions.pointKey, key.pointKey),
            ),
          );
        const dimensions = {
          collection,
          row: String(position),
          field,
          part: String(partIndex),
          template,
          numeric: String(numeric),
          prefix: part.prefix,
          decimals: String(part.decimals),
          grouped: String(part.grouped),
          scale: String(part.scale),
          leadingDecimal: String(part.leadingDecimal),
          ...(partIndex === 0 ? labels : {}),
        };
        for (const [name, value] of Object.entries(dimensions))
          await tx.insert(metricDimensions).values({ ...key, name, value });
      }
    }
  }
}

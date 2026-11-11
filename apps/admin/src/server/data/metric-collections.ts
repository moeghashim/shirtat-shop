import { asc, eq } from "drizzle-orm";

import { joinMetric, type MetricPart } from "./metric-projection.ts";
export async function loadMetricCollections(domain: string) {
  const { getDatabase } = await import("../db/client.server.ts");
  const { metricPoints, metricDimensions } = await import("../db/schema.ts");
  const db = getDatabase();
  const points = await db
    .select()
    .from(metricPoints)
    .where(eq(metricPoints.domain, domain))
    .orderBy(asc(metricPoints.series), asc(metricPoints.position));
  const dimensions = await db.select().from(metricDimensions).where(eq(metricDimensions.domain, domain));
  const result: Partial<Record<string, Record<string, string | number | boolean | null>[]>> = {};
  const groups = new Map<
    string,
    { collection: string; row: number; field: string; template: string; numeric: boolean; parts: MetricPart[] }
  >();
  const metadata = new Map<string, Record<string, string>>();
  for (const d of dimensions) {
    const key = `${d.series}/${d.pointKey}`;
    const row = metadata.get(key) ?? {};
    row[d.name] = d.value;
    metadata.set(key, row);
  }
  for (const point of points) {
    const d = metadata.get(`${point.series}/${point.pointKey}`);
    if (!d?.collection) continue;
    const rows = result[d.collection] ?? [];
    result[d.collection] = rows;
    const index = Number(d.row);
    const row = rows[index] ?? {};
    rows[index] = row;
    for (const [key, value] of Object.entries(d)) {
      const [type, field] = key.split(":");
      if (type === "string") row[field] = value;
      if (type === "number") row[field] = Number(value);
      if (type === "boolean") row[field] = value === "true";
      if (type === "null") row[field] = null;
    }
    const groupKey = `${d.collection}/${d.row}/${d.field}`;
    const group = groups.get(groupKey) ?? {
      collection: d.collection,
      row: index,
      field: d.field,
      template: d.template,
      numeric: d.numeric === "true",
      parts: [],
    };
    group.parts[Number(d.part)] = {
      value: point.value,
      unit: point.unit,
      currency: point.currency,
      prefix: d.prefix,
      decimals: Number(d.decimals),
      grouped: d.grouped === "true",
      scale: Number(d.scale),
      leadingDecimal: d.leadingDecimal === "true",
    };
    groups.set(groupKey, group);
  }
  for (const group of groups.values()) {
    const row = result[group.collection]?.[group.row];
    if (!row) throw new Error("Missing metric collection row");
    row[group.field] = joinMetric(group.template, group.numeric, group.parts);
  }
  return result;
}

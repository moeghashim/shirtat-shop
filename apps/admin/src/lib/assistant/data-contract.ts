import { z } from "zod";

const label = z.string().min(1).max(120);
const text = z.string().max(4096);
const options = {
  range: z.literal("available"),
  segment: z.literal("all"),
  limit: z.union([z.literal(10), z.literal(25), z.literal(50)]),
};
export const dashboardReadArgsSchema = z.discriminatedUnion("domain", [
  z.strictObject({ domain: z.literal("default"), metric: z.literal("performance"), ...options }),
  z.strictObject({ domain: z.literal("analytics"), metric: z.literal("traffic-quality"), ...options }),
  z.strictObject({ domain: z.literal("finance"), metric: z.literal("transaction-overview"), ...options }),
  z.strictObject({ domain: z.literal("crm"), metric: z.literal("pipeline"), ...options }),
  z.strictObject({ domain: z.literal("ecommerce"), metric: z.literal("revenue"), ...options }),
]);
export const dataRefSchema = z.strictObject({
  kind: z.literal("data-ref"),
  version: z.literal(1),
  tool: z.literal("dashboard_read"),
  args: dashboardReadArgsSchema,
});
export type DataRef = z.infer<typeof dataRefSchema>;
export const statDataSchema = z.strictObject({
  label,
  value: z.union([z.string().max(80), z.number().finite()]),
  detail: text,
});
export const seriesDataSchema = z
  .strictObject({
    labels: z.array(label).min(1).max(50),
    series: z
      .array(z.strictObject({ label, values: z.array(z.number().finite()).max(50) }))
      .min(1)
      .max(4),
  })
  .refine((p) => p.series.every((s) => s.values.length === p.labels.length));
export const tableDataSchema = z
  .strictObject({
    columns: z.array(label).min(1).max(8),
    rows: z.array(z.array(z.union([text, z.number().finite()])).max(8)).max(50),
  })
  .refine((p) => p.rows.every((row) => row.length === p.columns.length));
export const blockDataSchema = <T extends z.ZodType>(schema: T) =>
  z.discriminatedUnion("kind", [z.strictObject({ kind: z.literal("literal"), value: schema }), dataRefSchema]);
const metadata = {
  ref: dataRefSchema,
  source: z.enum(["demo", "db"]),
  asOf: z.iso.datetime(),
  periodLabel: label,
  truncated: z.boolean(),
};
const encodedBytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
export const dataResultSchema = z
  .discriminatedUnion("kind", [
    z.strictObject({ ...metadata, kind: z.literal("stat"), data: statDataSchema }),
    z.strictObject({ ...metadata, kind: z.literal("series"), data: seriesDataSchema }),
    z.strictObject({ ...metadata, kind: z.literal("table"), data: tableDataSchema }),
  ])
  .refine((result) => encodedBytes(result) <= 8192, "Result exceeds 8 KiB");
export type DataResult = z.infer<typeof dataResultSchema>;
/** Internal keys are derived exclusively from validated, fixed-order arguments. */
export function dataRefKey(input: DataRef): string {
  const {
    version,
    tool,
    args: { domain, metric, range, segment, limit },
  } = dataRefSchema.parse(input);
  return JSON.stringify({ version, tool, domain, metric, range, segment, limit });
}
export const dataResultMapSchema = z.record(z.string(), dataResultSchema).superRefine((map, ctx) => {
  if (Object.keys(map).length > 4 || encodedBytes(map) > 24576)
    ctx.addIssue({ code: "custom", message: "Result map exceeds limits" });
  for (const [key, result] of Object.entries(map))
    if (key !== dataRefKey(result.ref)) ctx.addIssue({ code: "custom", message: "Invalid reference key" });
});
export type DataResultMap = z.infer<typeof dataResultMapSchema>;

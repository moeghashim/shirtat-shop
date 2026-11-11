import { asc } from "drizzle-orm";
import { z } from "zod";

import { current } from "../db/fixtures/default.ts";
import { projectDefault } from "./core-projectors.ts";
import type { DefaultData } from "./default.types.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({
  renderedAt: z.iso.datetime(),
  id: z.string().optional(),
});
type Input = z.infer<typeof inputSchema>;
export async function demoDefault(input: Input): Promise<DefaultData> {
  const { renderedAt } = inputSchema.parse(input);
  return projectDefault(structuredClone({ current, renderedAt }), input);
}
export async function dbDefault(input: Input): Promise<DefaultData> {
  const { renderedAt } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/core-entity-schema.ts");
  const db = getDatabase();
  const metrics = await loadMetricCollections("core-default");
  const recordsCustomers = (
    await db
      .select()
      .from(s.defaultCurrentRecordsCustomers)
      .orderBy(asc(s.defaultCurrentRecordsCustomers.position), asc(s.defaultCurrentRecordsCustomers.recordKey))
  ).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    plan: row.plan,
    status: row.status,
    billing: row.billing,
    joined: row.joined,
  }));
  return projectDefault(
    {
      renderedAt,
      current: {
        performanceOverviewChartValues: (metrics["current.performanceOverviewChartValues"] ??
          []) as DefaultData["current"]["performanceOverviewChartValues"],
        recordsCustomers: recordsCustomers,
        metricCardsSummary: (metrics["current.metricCardsSummary"] ??
          []) as DefaultData["current"]["metricCardsSummary"],
        subscriberOverviewSummary: (metrics["current.subscriberOverviewSummary"] ??
          []) as DefaultData["current"]["subscriberOverviewSummary"],
        performanceOverviewTiming: (metrics["current.performanceOverviewTiming"] ??
          []) as DefaultData["current"]["performanceOverviewTiming"],
      },
    },
    input,
  );
}
export async function readDefault(input: Input) {
  return readSource(
    () => demoDefault(input),
    () => dbDefault(input),
  );
}

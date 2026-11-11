import { asc } from "drizzle-orm";
import { z } from "zod";

import { current } from "../db/fixtures/crm.ts";
import { projectCrm } from "./core-projectors.ts";
import type { CrmData } from "./crm.types.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { joinMetric, type MetricUnit } from "./metric-projection.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({
  renderedAt: z.iso.datetime(),
  id: z.string().optional(),
});
type Input = z.infer<typeof inputSchema>;
export async function demoCrm(input: Input): Promise<CrmData> {
  const { renderedAt } = inputSchema.parse(input);
  return projectCrm(structuredClone({ current, renderedAt }), input);
}
export async function dbCrm(input: Input): Promise<CrmData> {
  const { renderedAt } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/core-entity-schema.ts");
  const db = getDatabase();
  const metrics = await loadMetricCollections("core-crm");
  const recordsOpportunities = (
    await db
      .select()
      .from(s.crmCurrentRecordsOpportunities)
      .orderBy(asc(s.crmCurrentRecordsOpportunities.position), asc(s.crmCurrentRecordsOpportunities.recordKey))
  ).map((row) => ({
    id: row.id,
    account: row.account,
    stage: row.stage,
    priority: Number(row.priority),
    health: row.health,
    value: joinMetric(row.valueTemplate, false, [
      {
        value: row.value,
        unit: row.valueUnit as MetricUnit,
        currency: row.valueUnit === "currency" ? "USD" : null,
        prefix: row.valuePrefix,
        decimals: row.valueDecimals,
        grouped: row.valueGrouped,
        scale: row.valueScale,
        leadingDecimal: row.valueLeadingDecimal,
      },
    ]) as string,
  }));
  const taskRemindersSummary = (
    await db
      .select()
      .from(s.crmCurrentTaskRemindersSummary)
      .orderBy(asc(s.crmCurrentTaskRemindersSummary.position), asc(s.crmCurrentTaskRemindersSummary.recordKey))
  ).map((row) => ({
    value1: row.value1,
    value2: row.value2,
    value3: row.value3,
    value4: row.value4,
    value5: row.value5,
    value6: row.value6,
  }));
  return projectCrm(
    {
      renderedAt,
      current: {
        kpiCardsMetrics: (metrics["current.kpiCardsMetrics"] ?? []) as CrmData["current"]["kpiCardsMetrics"],
        pipelineActivityPipelineChartValues: (metrics["current.pipelineActivityPipelineChartValues"] ?? []).map((row) =>
          Number(row.value),
        ) as CrmData["current"]["pipelineActivityPipelineChartValues"],
        recordsOpportunities: recordsOpportunities,
        pipelineActivitySummary: (metrics["current.pipelineActivitySummary"] ??
          []) as CrmData["current"]["pipelineActivitySummary"],
        taskRemindersSummary: taskRemindersSummary,
        pipelineActivityTotals: (metrics["current.pipelineActivityTotals"] ??
          []) as CrmData["current"]["pipelineActivityTotals"],
        taskRemindersGoal: (metrics["current.taskRemindersGoal"] ?? []) as CrmData["current"]["taskRemindersGoal"],
      },
    },
    input,
  );
}
export async function readCrm(input: Input) {
  return readSource(
    () => demoCrm(input),
    () => dbCrm(input),
  );
}

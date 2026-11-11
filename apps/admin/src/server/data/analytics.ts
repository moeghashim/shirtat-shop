import { asc } from "drizzle-orm";
import { z } from "zod";

import { current } from "../db/fixtures/analytics.ts";
import type { AnalyticsData } from "./analytics.types.ts";
import { projectAnalytics } from "./core-projectors.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { joinMetric, type MetricUnit } from "./metric-projection.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({
  renderedAt: z.iso.datetime(),
  id: z.string().optional(),
});
type Input = z.infer<typeof inputSchema>;
export async function demoAnalytics(input: Input): Promise<AnalyticsData> {
  const { renderedAt } = inputSchema.parse(input);
  return projectAnalytics(structuredClone({ current, renderedAt }), input);
}
export async function dbAnalytics(input: Input): Promise<AnalyticsData> {
  const { renderedAt } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/core-entity-schema.ts");
  const db = getDatabase();
  const metrics = await loadMetricCollections("core-analytics");
  const topPagesPages = (
    await db
      .select()
      .from(s.analyticsCurrentTopPagesPages)
      .orderBy(asc(s.analyticsCurrentTopPagesPages.position), asc(s.analyticsCurrentTopPagesPages.recordKey))
  ).map((row) => ({
    bounce: joinMetric(row.bounceTemplate, false, [
      {
        value: row.bounce,
        unit: row.bounceUnit as MetricUnit,
        currency: row.bounceUnit === "currency" ? "USD" : null,
        prefix: row.bouncePrefix,
        decimals: row.bounceDecimals,
        grouped: row.bounceGrouped,
        scale: row.bounceScale,
        leadingDecimal: row.bounceLeadingDecimal,
      },
    ]) as string,
    path: row.path,
    time: row.time,
    views: joinMetric(row.viewsTemplate, false, [
      {
        value: row.views,
        unit: row.viewsUnit as MetricUnit,
        currency: row.viewsUnit === "currency" ? "USD" : null,
        prefix: row.viewsPrefix,
        decimals: row.viewsDecimals,
        grouped: row.viewsGrouped,
        scale: row.viewsScale,
        leadingDecimal: row.viewsLeadingDecimal,
      },
    ]) as string,
  }));
  const topTrafficSourcesSourcesData = (
    await db
      .select()
      .from(s.analyticsCurrentTopTrafficSourcesSourcesData)
      .orderBy(
        asc(s.analyticsCurrentTopTrafficSourcesSourcesData.position),
        asc(s.analyticsCurrentTopTrafficSourcesSourcesData.recordKey),
      )
  ).map((row) => ({
    label: joinMetric(row.labelTemplate, false, [
      {
        value: row.label,
        unit: row.labelUnit as MetricUnit,
        currency: row.labelUnit === "currency" ? "USD" : null,
        prefix: row.labelPrefix,
        decimals: row.labelDecimals,
        grouped: row.labelGrouped,
        scale: row.labelScale,
        leadingDecimal: row.labelLeadingDecimal,
      },
    ]) as string,
    source: row.source,
    visitors: Number(row.visitors),
  }));
  const topTrafficSourcesCampaignsData = (
    await db
      .select()
      .from(s.analyticsCurrentTopTrafficSourcesCampaignsData)
      .orderBy(
        asc(s.analyticsCurrentTopTrafficSourcesCampaignsData.position),
        asc(s.analyticsCurrentTopTrafficSourcesCampaignsData.recordKey),
      )
  ).map((row) => ({
    label: joinMetric(row.labelTemplate, false, [
      {
        value: row.label,
        unit: row.labelUnit as MetricUnit,
        currency: row.labelUnit === "currency" ? "USD" : null,
        prefix: row.labelPrefix,
        decimals: row.labelDecimals,
        grouped: row.labelGrouped,
        scale: row.labelScale,
        leadingDecimal: row.labelLeadingDecimal,
      },
    ]) as string,
    source: row.source,
    visitors: Number(row.visitors),
  }));
  const topTrafficSourcesReferrersData = (
    await db
      .select()
      .from(s.analyticsCurrentTopTrafficSourcesReferrersData)
      .orderBy(
        asc(s.analyticsCurrentTopTrafficSourcesReferrersData.position),
        asc(s.analyticsCurrentTopTrafficSourcesReferrersData.recordKey),
      )
  ).map((row) => ({
    label: joinMetric(row.labelTemplate, false, [
      {
        value: row.label,
        unit: row.labelUnit as MetricUnit,
        currency: row.labelUnit === "currency" ? "USD" : null,
        prefix: row.labelPrefix,
        decimals: row.labelDecimals,
        grouped: row.labelGrouped,
        scale: row.labelScale,
        leadingDecimal: row.labelLeadingDecimal,
      },
    ]) as string,
    source: row.source,
    visitors: Number(row.visitors),
  }));
  const pageSummary = (
    await db
      .select()
      .from(s.analyticsCurrentPageSummary)
      .orderBy(asc(s.analyticsCurrentPageSummary.position), asc(s.analyticsCurrentPageSummary.recordKey))
  ).map((row) => ({
    value1: row.value1,
  }));
  return projectAnalytics(
    {
      renderedAt,
      current: {
        analyticsKpiStripMetrics: (metrics["current.analyticsKpiStripMetrics"] ??
          []) as AnalyticsData["current"]["analyticsKpiStripMetrics"],
        realtimeVisitorsRealtimeData: (metrics["current.realtimeVisitorsRealtimeData"] ??
          []) as AnalyticsData["current"]["realtimeVisitorsRealtimeData"],
        topPagesPages: topPagesPages,
        topTrafficSourcesSourcesData: topTrafficSourcesSourcesData,
        topTrafficSourcesCampaignsData: topTrafficSourcesCampaignsData,
        topTrafficSourcesReferrersData: topTrafficSourcesReferrersData,
        trafficQualityQualitySeries: (metrics["current.trafficQualityQualitySeries"] ??
          []) as AnalyticsData["current"]["trafficQualityQualitySeries"],
        realtimeVisitorsSummary: (metrics["current.realtimeVisitorsSummary"] ??
          []) as AnalyticsData["current"]["realtimeVisitorsSummary"],
        pageSummary: pageSummary,
      },
    },
    input,
  );
}
export async function readAnalytics(input: Input) {
  return readSource(
    () => demoAnalytics(input),
    () => dbAnalytics(input),
  );
}

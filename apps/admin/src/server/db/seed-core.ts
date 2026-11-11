import { splitMetric } from "../data/metric-projection.ts";
import type { getDatabase } from "./client.server.ts";
import * as s from "./core-entity-schema.ts";
import { seedMetricCollection } from "./seed-metrics.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];

import { current as analyticsCurrent } from "./fixtures/analytics.ts";
import { current as crmCurrent } from "./fixtures/crm.ts";
import { current as defaultCurrent } from "./fixtures/default.ts";
import { current as financeCurrent } from "./fixtures/finance.ts";
export async function seedCore(tx: Transaction) {
  await seedMetricCollection(
    tx,
    "core-default",
    "current.performanceOverviewChartValues",
    defaultCurrent.performanceOverviewChartValues,
    "count",
  );
  await seedMetricCollection(tx, "core-crm", "current.kpiCardsMetrics", crmCurrent.kpiCardsMetrics, "count");
  await seedMetricCollection(
    tx,
    "core-crm",
    "current.pipelineActivityPipelineChartValues",
    crmCurrent.pipelineActivityPipelineChartValues.map((value) => ({ value })),
    "count",
  );
  await seedMetricCollection(
    tx,
    "core-finance",
    "current.overviewKpisMetrics",
    financeCurrent.overviewKpisMetrics,
    "count",
  );
  for (const [position, item] of financeCurrent.balanceDistributionCardBalanceData.entries()) {
    const row = {
      recordKey: String(position),
      position,
      account: item.account,
      amount: String(item.amount),
      key: item.key,
      percentage: String(item.percentage),
    };
    await tx
      .insert(s.financeCurrentBalanceDistributionCardBalanceData)
      .values(row)
      .onConflictDoUpdate({ target: s.financeCurrentBalanceDistributionCardBalanceData.recordKey, set: row });
  }
  await seedMetricCollection(
    tx,
    "core-finance",
    "current.incomeBreakdownSources",
    financeCurrent.incomeBreakdownSources,
    "count",
  );
  await seedMetricCollection(
    tx,
    "core-finance",
    "current.transactionsOverviewCardChartData",
    financeCurrent.transactionsOverviewCardChartData,
    "currency",
  );
  for (const [position, item] of financeCurrent.upcomingTransactionsTransactions.entries()) {
    const row = {
      recordKey: String(item.id),
      position,
      id: String(item.id),
      title: item.title,
      date: item.date,
      icon: item.icon,
    };
    await tx
      .insert(s.financeCurrentUpcomingTransactionsTransactions)
      .values(row)
      .onConflictDoUpdate({ target: s.financeCurrentUpcomingTransactionsTransactions.recordKey, set: row });
  }
  for (const [position, item] of financeCurrent.walletWalletCards.entries()) {
    const balanceFormat = splitMetric(item.balance);
    const balancePart = balanceFormat.parts[0];
    if (!balancePart || balanceFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const row = {
      recordKey: String(item.id),
      position,
      id: String(item.id),
      bank: item.bank,
      last4: item.last4,
      balance: balancePart.value,
      balanceTemplate: balanceFormat.template,
      balancePrefix: balancePart.prefix,
      balanceDecimals: balancePart.decimals,
      balanceGrouped: balancePart.grouped,
      balanceScale: balancePart.scale,
      balanceLeadingDecimal: balancePart.leadingDecimal,
      balanceUnit: balancePart.unit,
      icon: item.icon,
    };
    await tx
      .insert(s.financeCurrentWalletWalletCards)
      .values(row)
      .onConflictDoUpdate({ target: s.financeCurrentWalletWalletCards.recordKey, set: row });
  }
  for (const [position, item] of financeCurrent.walletCryptoAssets.entries()) {
    const balanceFormat = splitMetric(item.balance);
    const balancePart = balanceFormat.parts[0];
    if (!balancePart || balanceFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const usdValueFormat = splitMetric(item.usdValue);
    const usdValuePart = usdValueFormat.parts[0];
    if (!usdValuePart || usdValueFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const row = {
      recordKey: String(item.id),
      position,
      id: String(item.id),
      name: item.name,
      vault: item.vault,
      balance: balancePart.value,
      balanceTemplate: balanceFormat.template,
      balancePrefix: balancePart.prefix,
      balanceDecimals: balancePart.decimals,
      balanceGrouped: balancePart.grouped,
      balanceScale: balancePart.scale,
      balanceLeadingDecimal: balancePart.leadingDecimal,
      balanceUnit: balancePart.unit,
      usdValue: usdValuePart.value,
      usdValueTemplate: usdValueFormat.template,
      usdValuePrefix: usdValuePart.prefix,
      usdValueDecimals: usdValuePart.decimals,
      usdValueGrouped: usdValuePart.grouped,
      usdValueScale: usdValuePart.scale,
      usdValueLeadingDecimal: usdValuePart.leadingDecimal,
      usdValueUnit: usdValuePart.unit,
      icon: item.icon,
    };
    await tx
      .insert(s.financeCurrentWalletCryptoAssets)
      .values(row)
      .onConflictDoUpdate({ target: s.financeCurrentWalletCryptoAssets.recordKey, set: row });
  }
  for (const [position, item] of financeCurrent.quickActionsContacts.entries()) {
    const row = { recordKey: String(item.id), position, id: String(item.id), initials: item.initials };
    await tx
      .insert(s.financeCurrentQuickActionsContacts)
      .values(row)
      .onConflictDoUpdate({ target: s.financeCurrentQuickActionsContacts.recordKey, set: row });
  }
  await seedMetricCollection(
    tx,
    "core-analytics",
    "current.analyticsKpiStripMetrics",
    analyticsCurrent.analyticsKpiStripMetrics,
    "count",
  );
  await seedMetricCollection(
    tx,
    "core-analytics",
    "current.realtimeVisitorsRealtimeData",
    analyticsCurrent.realtimeVisitorsRealtimeData,
    "count",
  );
  for (const [position, item] of analyticsCurrent.topPagesPages.entries()) {
    const bounceFormat = splitMetric(item.bounce);
    const bouncePart = bounceFormat.parts[0];
    if (!bouncePart || bounceFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const viewsFormat = splitMetric(item.views);
    const viewsPart = viewsFormat.parts[0];
    if (!viewsPart || viewsFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const row = {
      recordKey: String(position),
      position,
      bounce: bouncePart.value,
      bounceTemplate: bounceFormat.template,
      bouncePrefix: bouncePart.prefix,
      bounceDecimals: bouncePart.decimals,
      bounceGrouped: bouncePart.grouped,
      bounceScale: bouncePart.scale,
      bounceLeadingDecimal: bouncePart.leadingDecimal,
      bounceUnit: bouncePart.unit,
      path: item.path,
      time: item.time,
      views: viewsPart.value,
      viewsTemplate: viewsFormat.template,
      viewsPrefix: viewsPart.prefix,
      viewsDecimals: viewsPart.decimals,
      viewsGrouped: viewsPart.grouped,
      viewsScale: viewsPart.scale,
      viewsLeadingDecimal: viewsPart.leadingDecimal,
      viewsUnit: viewsPart.unit,
    };
    await tx
      .insert(s.analyticsCurrentTopPagesPages)
      .values(row)
      .onConflictDoUpdate({ target: s.analyticsCurrentTopPagesPages.recordKey, set: row });
  }
  for (const [position, item] of analyticsCurrent.topTrafficSourcesSourcesData.entries()) {
    const labelFormat = splitMetric(item.label);
    const labelPart = labelFormat.parts[0];
    if (!labelPart || labelFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const row = {
      recordKey: String(position),
      position,
      label: labelPart.value,
      labelTemplate: labelFormat.template,
      labelPrefix: labelPart.prefix,
      labelDecimals: labelPart.decimals,
      labelGrouped: labelPart.grouped,
      labelScale: labelPart.scale,
      labelLeadingDecimal: labelPart.leadingDecimal,
      labelUnit: labelPart.unit,
      source: item.source,
      visitors: String(item.visitors),
    };
    await tx
      .insert(s.analyticsCurrentTopTrafficSourcesSourcesData)
      .values(row)
      .onConflictDoUpdate({ target: s.analyticsCurrentTopTrafficSourcesSourcesData.recordKey, set: row });
  }
  for (const [position, item] of analyticsCurrent.topTrafficSourcesCampaignsData.entries()) {
    const labelFormat = splitMetric(item.label);
    const labelPart = labelFormat.parts[0];
    if (!labelPart || labelFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const row = {
      recordKey: String(position),
      position,
      label: labelPart.value,
      labelTemplate: labelFormat.template,
      labelPrefix: labelPart.prefix,
      labelDecimals: labelPart.decimals,
      labelGrouped: labelPart.grouped,
      labelScale: labelPart.scale,
      labelLeadingDecimal: labelPart.leadingDecimal,
      labelUnit: labelPart.unit,
      source: item.source,
      visitors: String(item.visitors),
    };
    await tx
      .insert(s.analyticsCurrentTopTrafficSourcesCampaignsData)
      .values(row)
      .onConflictDoUpdate({ target: s.analyticsCurrentTopTrafficSourcesCampaignsData.recordKey, set: row });
  }
  for (const [position, item] of analyticsCurrent.topTrafficSourcesReferrersData.entries()) {
    const labelFormat = splitMetric(item.label);
    const labelPart = labelFormat.parts[0];
    if (!labelPart || labelFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const row = {
      recordKey: String(position),
      position,
      label: labelPart.value,
      labelTemplate: labelFormat.template,
      labelPrefix: labelPart.prefix,
      labelDecimals: labelPart.decimals,
      labelGrouped: labelPart.grouped,
      labelScale: labelPart.scale,
      labelLeadingDecimal: labelPart.leadingDecimal,
      labelUnit: labelPart.unit,
      source: item.source,
      visitors: String(item.visitors),
    };
    await tx
      .insert(s.analyticsCurrentTopTrafficSourcesReferrersData)
      .values(row)
      .onConflictDoUpdate({ target: s.analyticsCurrentTopTrafficSourcesReferrersData.recordKey, set: row });
  }
  await seedMetricCollection(
    tx,
    "core-analytics",
    "current.trafficQualityQualitySeries",
    analyticsCurrent.trafficQualityQualitySeries,
    "percent",
  );
  for (const [position, item] of defaultCurrent.recordsCustomers.entries()) {
    const row = {
      recordKey: String(item.id),
      position,
      id: item.id,
      name: item.name,
      email: item.email,
      plan: item.plan,
      status: item.status,
      billing: item.billing,
      joined: item.joined,
    };
    await tx
      .insert(s.defaultCurrentRecordsCustomers)
      .values(row)
      .onConflictDoUpdate({ target: s.defaultCurrentRecordsCustomers.recordKey, set: row });
  }
  for (const [position, item] of crmCurrent.recordsOpportunities.entries()) {
    const valueFormat = splitMetric(item.value);
    const valuePart = valueFormat.parts[0];
    if (!valuePart || valueFormat.parts.length !== 1) throw new Error("Expected a scalar measure");
    const row = {
      recordKey: String(item.id),
      position,
      id: item.id,
      account: item.account,
      stage: item.stage,
      priority: String(item.priority),
      health: item.health,
      value: valuePart.value,
      valueTemplate: valueFormat.template,
      valuePrefix: valuePart.prefix,
      valueDecimals: valuePart.decimals,
      valueGrouped: valuePart.grouped,
      valueScale: valuePart.scale,
      valueLeadingDecimal: valuePart.leadingDecimal,
      valueUnit: valuePart.unit,
    };
    await tx
      .insert(s.crmCurrentRecordsOpportunities)
      .values(row)
      .onConflictDoUpdate({ target: s.crmCurrentRecordsOpportunities.recordKey, set: row });
  }
  await seedMetricCollection(
    tx,
    "core-default",
    "current.metricCardsSummary",
    defaultCurrent.metricCardsSummary,
    "count",
  );
  await seedMetricCollection(
    tx,
    "core-default",
    "current.subscriberOverviewSummary",
    defaultCurrent.subscriberOverviewSummary,
    "count",
  );
  await seedMetricCollection(
    tx,
    "core-crm",
    "current.pipelineActivitySummary",
    crmCurrent.pipelineActivitySummary,
    "count",
  );
  for (const [position, item] of crmCurrent.taskRemindersSummary.entries()) {
    const row = {
      recordKey: String(position),
      position,
      value1: item.value1,
      value2: item.value2,
      value3: item.value3,
      value4: item.value4,
      value5: item.value5,
      value6: item.value6,
    };
    await tx
      .insert(s.crmCurrentTaskRemindersSummary)
      .values(row)
      .onConflictDoUpdate({ target: s.crmCurrentTaskRemindersSummary.recordKey, set: row });
  }
  await seedMetricCollection(
    tx,
    "core-finance",
    "current.financeNotificationSummary",
    financeCurrent.financeNotificationSummary,
    "count",
  );
  await seedMetricCollection(
    tx,
    "core-finance",
    "current.upcomingTransactionsSummary",
    financeCurrent.upcomingTransactionsSummary,
    "currency",
  );
  await seedMetricCollection(tx, "core-finance", "current.pageSummary", financeCurrent.pageSummary, "count");
  await seedMetricCollection(
    tx,
    "core-analytics",
    "current.realtimeVisitorsSummary",
    analyticsCurrent.realtimeVisitorsSummary,
    "count",
  );
  for (const [position, item] of analyticsCurrent.pageSummary.entries()) {
    const row = { recordKey: String(position), position, value1: item.value1 };
    await tx
      .insert(s.analyticsCurrentPageSummary)
      .values(row)
      .onConflictDoUpdate({ target: s.analyticsCurrentPageSummary.recordKey, set: row });
  }
  await seedMetricCollection(
    tx,
    "core-default",
    "current.performanceOverviewTiming",
    defaultCurrent.performanceOverviewTiming,
    "duration",
  );
  await seedMetricCollection(
    tx,
    "core-crm",
    "current.pipelineActivityTotals",
    crmCurrent.pipelineActivityTotals,
    "count",
  );
  await seedMetricCollection(tx, "core-crm", "current.taskRemindersGoal", crmCurrent.taskRemindersGoal, "count");
  for (const [position, item] of financeCurrent.statementReference.entries()) {
    const row = { recordKey: String(item.id), position, id: item.id, date: item.date };
    await tx
      .insert(s.financeCurrentStatementReference)
      .values(row)
      .onConflictDoUpdate({ target: s.financeCurrentStatementReference.recordKey, set: row });
  }
}

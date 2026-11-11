import { asc } from "drizzle-orm";
import { z } from "zod";

import { current } from "../db/fixtures/finance.ts";
import { projectFinance } from "./core-projectors.ts";
import type { FinanceData } from "./finance.types.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { joinMetric, type MetricUnit } from "./metric-projection.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({
  renderedAt: z.iso.datetime(),
  id: z.string().optional(),
});
type Input = z.infer<typeof inputSchema>;
export async function demoFinance(input: Input): Promise<FinanceData> {
  const { renderedAt } = inputSchema.parse(input);
  return projectFinance(structuredClone({ current, renderedAt }), input);
}
export async function dbFinance(input: Input): Promise<FinanceData> {
  const { renderedAt } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/core-entity-schema.ts");
  const db = getDatabase();
  const metrics = await loadMetricCollections("core-finance");
  const balanceDistributionCardBalanceData = (
    await db
      .select()
      .from(s.financeCurrentBalanceDistributionCardBalanceData)
      .orderBy(
        asc(s.financeCurrentBalanceDistributionCardBalanceData.position),
        asc(s.financeCurrentBalanceDistributionCardBalanceData.recordKey),
      )
  ).map((row) => ({
    account: row.account,
    amount: Number(row.amount),
    key: row.key,
    percentage: Number(row.percentage),
  }));
  const upcomingTransactionsTransactions = (
    await db
      .select()
      .from(s.financeCurrentUpcomingTransactionsTransactions)
      .orderBy(
        asc(s.financeCurrentUpcomingTransactionsTransactions.position),
        asc(s.financeCurrentUpcomingTransactionsTransactions.recordKey),
      )
  ).map((row) => ({
    id: Number(row.id),
    title: row.title,
    date: row.date,
    icon: row.icon,
  }));
  const walletWalletCards = (
    await db
      .select()
      .from(s.financeCurrentWalletWalletCards)
      .orderBy(asc(s.financeCurrentWalletWalletCards.position), asc(s.financeCurrentWalletWalletCards.recordKey))
  ).map((row) => ({
    id: Number(row.id),
    bank: row.bank,
    last4: row.last4,
    balance: joinMetric(row.balanceTemplate, false, [
      {
        value: row.balance,
        unit: row.balanceUnit as MetricUnit,
        currency: row.balanceUnit === "currency" ? "USD" : null,
        prefix: row.balancePrefix,
        decimals: row.balanceDecimals,
        grouped: row.balanceGrouped,
        scale: row.balanceScale,
        leadingDecimal: row.balanceLeadingDecimal,
      },
    ]) as string,
    icon: row.icon,
  }));
  const walletCryptoAssets = (
    await db
      .select()
      .from(s.financeCurrentWalletCryptoAssets)
      .orderBy(asc(s.financeCurrentWalletCryptoAssets.position), asc(s.financeCurrentWalletCryptoAssets.recordKey))
  ).map((row) => ({
    id: Number(row.id),
    name: row.name,
    vault: row.vault,
    balance: joinMetric(row.balanceTemplate, false, [
      {
        value: row.balance,
        unit: row.balanceUnit as MetricUnit,
        currency: row.balanceUnit === "currency" ? "USD" : null,
        prefix: row.balancePrefix,
        decimals: row.balanceDecimals,
        grouped: row.balanceGrouped,
        scale: row.balanceScale,
        leadingDecimal: row.balanceLeadingDecimal,
      },
    ]) as string,
    usdValue: joinMetric(row.usdValueTemplate, false, [
      {
        value: row.usdValue,
        unit: row.usdValueUnit as MetricUnit,
        currency: row.usdValueUnit === "currency" ? "USD" : null,
        prefix: row.usdValuePrefix,
        decimals: row.usdValueDecimals,
        grouped: row.usdValueGrouped,
        scale: row.usdValueScale,
        leadingDecimal: row.usdValueLeadingDecimal,
      },
    ]) as string,
    icon: row.icon,
  }));
  const quickActionsContacts = (
    await db
      .select()
      .from(s.financeCurrentQuickActionsContacts)
      .orderBy(asc(s.financeCurrentQuickActionsContacts.position), asc(s.financeCurrentQuickActionsContacts.recordKey))
  ).map((row) => ({
    id: Number(row.id),
    initials: row.initials,
  }));
  const statementReference = (
    await db
      .select()
      .from(s.financeCurrentStatementReference)
      .orderBy(asc(s.financeCurrentStatementReference.position), asc(s.financeCurrentStatementReference.recordKey))
  ).map((row) => ({
    id: row.id,
    date: row.date,
  }));
  return projectFinance(
    {
      renderedAt,
      current: {
        overviewKpisMetrics: (metrics["current.overviewKpisMetrics"] ??
          []) as FinanceData["current"]["overviewKpisMetrics"],
        balanceDistributionCardBalanceData: balanceDistributionCardBalanceData,
        incomeBreakdownSources: (metrics["current.incomeBreakdownSources"] ??
          []) as FinanceData["current"]["incomeBreakdownSources"],
        transactionsOverviewCardChartData: (metrics["current.transactionsOverviewCardChartData"] ??
          []) as FinanceData["current"]["transactionsOverviewCardChartData"],
        upcomingTransactionsTransactions: upcomingTransactionsTransactions,
        walletWalletCards: walletWalletCards,
        walletCryptoAssets: walletCryptoAssets,
        quickActionsContacts: quickActionsContacts,
        financeNotificationSummary: (metrics["current.financeNotificationSummary"] ??
          []) as FinanceData["current"]["financeNotificationSummary"],
        upcomingTransactionsSummary: (metrics["current.upcomingTransactionsSummary"] ??
          []) as FinanceData["current"]["upcomingTransactionsSummary"],
        pageSummary: (metrics["current.pageSummary"] ?? []) as FinanceData["current"]["pageSummary"],
        statementReference: statementReference,
      },
    },
    input,
  );
}
export async function readFinance(input: Input) {
  return readSource(
    () => demoFinance(input),
    () => dbFinance(input),
  );
}

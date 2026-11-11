import type { AnalyticsData } from "./analytics.types.ts";
import { performanceDates, previousMonth, rollingMonths } from "./core-dates.ts";
import type { CrmData } from "./crm.types.ts";
import type { DefaultData } from "./default.types.ts";
import type { FinanceData } from "./finance.types.ts";

type Request = { id?: string };
export function projectDefault(data: Omit<DefaultData, "projection">, input: Request): DefaultData {
  if (input.id !== undefined)
    data.current.recordsCustomers = data.current.recordsCustomers.filter((row) => row.id === input.id);
  const timing = data.current.performanceOverviewTiming[0];
  if (!timing) throw new Error("Missing chart reference");
  return {
    ...data,
    projection: {
      performance: performanceDates(data.current.performanceOverviewChartValues, data.renderedAt, timing.stepHours),
    },
  };
}
export function projectCrm(data: Omit<CrmData, "projection">, input: Request): CrmData {
  if (input.id !== undefined)
    data.current.recordsOpportunities = data.current.recordsOpportunities.filter((row) => row.id === input.id);
  return {
    ...data,
    projection: {
      pipeline: rollingMonths(data.current.pipelineActivityPipelineChartValues, data.renderedAt),
      previousMonth: previousMonth(data.renderedAt),
    },
  };
}
export function projectFinance(data: Omit<FinanceData, "projection">, input: Request): FinanceData {
  if (input.id !== undefined)
    data.current.walletWalletCards = data.current.walletWalletCards.filter((row) => String(row.id) === input.id);
  const statement = data.current.statementReference[0];
  if (!statement) throw new Error("Missing statement reference");
  return { ...data, projection: { statementDate: statement.date } };
}
export function projectAnalytics(data: AnalyticsData, input: Request): AnalyticsData {
  if (input.id !== undefined)
    data.current.topPagesPages = data.current.topPagesPages.filter((row) => row.path === input.id);
  return data;
}

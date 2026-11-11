import type { current } from "../db/fixtures/finance.ts";
export type FinanceData = {
  current: typeof current;
  projection: { statementDate: string };
  renderedAt: string;
};

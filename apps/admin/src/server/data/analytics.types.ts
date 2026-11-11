import type { current } from "../db/fixtures/analytics.ts";
export type AnalyticsData = {
  current: typeof current;
  renderedAt: string;
};

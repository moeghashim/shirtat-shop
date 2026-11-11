import type { current } from "../db/fixtures/default.ts";
export type DefaultData = {
  current: typeof current;
  projection: {
    performance: ({ date: string } & (typeof current.performanceOverviewChartValues)[number])[];
  };
  renderedAt: string;
};

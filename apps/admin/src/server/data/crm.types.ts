import type { current } from "../db/fixtures/crm.ts";
export type CrmData = {
  current: typeof current;
  projection: { pipeline: { date: string; qualified: number }[]; previousMonth: string };
  renderedAt: string;
};

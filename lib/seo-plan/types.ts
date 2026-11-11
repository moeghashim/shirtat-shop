import type { GscReading } from "../search-console/types";

export type { GscReading, SearchRow, SearchSlice, SearchTotals } from "../search-console/types";

export const SEO_AREAS = [
  "Backlinks",
  "Content",
  "International",
  "Keywords",
  "Linking",
  "Measurement",
  "On-page",
  "Shopping",
  "Technical",
] as const;

export const SEO_PHASES = ["dec", "foundation", "now", "q1"] as const;

export const SEO_STATUSES = ["blocked-on-approval", "done", "in-progress", "not-started"] as const;

export const SEO_OWNERS = ["bot", "moe"] as const;

export const SEO_TOOLS = [
  "seo_approvals",
  "seo_kpis",
  "seo_progress",
  "seo_reference",
  "seo_tasks",
  "seo_timeline",
] as const;

export type SeoArea = (typeof SEO_AREAS)[number];
export type SeoOwner = (typeof SEO_OWNERS)[number];
export type SeoPhase = (typeof SEO_PHASES)[number];
export type SeoStatus = (typeof SEO_STATUSES)[number];
export type SeoTool = (typeof SEO_TOOLS)[number];

export interface SeoCopy {
  ar: string;
  en: string;
}

export interface SeoTask {
  action: SeoCopy;
  approval: SeoCopy;
  approvalNeeded: boolean;
  area: SeoArea;
  evidence: SeoCopy | null;
  id: string;
  link: string | null;
  measure: SeoCopy;
  owner: SeoOwner;
  phase: SeoPhase;
  status: SeoStatus;
  updated: string;
}

export interface SeoApproval {
  id: string;
  meta: SeoCopy | null;
  state: "granted" | "pending";
  text: SeoCopy;
  updated: string | null;
}

export interface SeoKpi {
  baseline: SeoCopy;
  cadence: SeoCopy;
  checkpoint: SeoCopy;
  id: string;
  name: SeoCopy;
  source: SeoCopy;
}

export interface SeoTimelineRow {
  focus: SeoCopy;
  window: SeoCopy;
}

export interface SeoKeyword {
  cluster: SeoCopy;
  examples: SeoCopy;
  intent: SeoCopy;
  lang: string;
  priority: SeoCopy;
  target: SeoCopy;
}

export interface SeoTitle {
  current: SeoCopy;
  page: SeoCopy;
  proposed: SeoCopy;
}

export interface SeoPlan {
  approvals: SeoApproval[];
  keywords: SeoKeyword[];
  kpis: SeoKpi[];
  tasks: SeoTask[];
  timeline: SeoTimelineRow[];
  titles: SeoTitle[];
}

export interface TaskFilter {
  area: string;
  owner: string;
  phase: string;
  status: string;
}

export interface TaskRow {
  action: string;
  approval: string;
  approvalNeeded: boolean;
  area: string;
  evidence: string | null;
  id: string;
  link: string | null;
  measure: string;
  owner: SeoOwner;
  phase: string;
  status: SeoStatus;
  updated: string;
}

export interface ProgressSlice {
  done: number;
  id: string;
  label: string;
  percent: number;
  total: number;
}

export interface ProgressPayload {
  areas: ProgressSlice[];
  blocked: number;
  done: number;
  inProgress: number;
  notStarted: number;
  percent: number;
  phases: ProgressSlice[];
  ready: true;
  total: number;
}

export interface ApprovalRow {
  id: string;
  meta: string | null;
  state: "granted" | "pending";
  text: string;
  updated: string | null;
}

export interface ApprovalsPayload {
  granted: number;
  items: ApprovalRow[];
  pending: number;
  ready: true;
}

export interface TimelinePayload {
  ready: true;
  rows: { focus: string; window: string }[];
}

export interface ReferencePayload {
  keywords: {
    cluster: string;
    examples: string;
    intent: string;
    lang: string;
    priority: string;
    target: string;
  }[];
  ready: true;
  titles: { current: string; page: string; proposed: string }[];
}

export interface TasksPayload {
  ready: true;
  tasks: TaskRow[];
}

export type CountState = "not-connected" | "no-data" | "ok" | "unavailable";

export interface CountReading {
  count?: number;
  state: CountState;
}

export interface KpiDefinitionRow {
  baseline: string;
  cadence: string;
  checkpoint: string;
  id: string;
  name: string;
  source: string;
}

export interface KpisPayload {
  catalog: { collections: CountReading; products: CountReading };
  definitions: KpiDefinitionRow[];
  gsc: GscReading;
  ready: true;
  sitemapUrls: CountReading;
}

export type SeoToolPayload =
  | ApprovalsPayload
  | KpisPayload
  | ProgressPayload
  | ReferencePayload
  | TasksPayload
  | TimelinePayload;

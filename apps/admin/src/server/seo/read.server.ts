import { SEARCH_CONSOLE_SITE } from "../../../../../lib/search-console/index.ts";
import { fetchSearchConsole } from "../../../../../lib/search-console/server.ts";
import { getCatalogCounts } from "../../../../../lib/seo-plan/catalog.ts";
import {
  parseTaskFilter,
  presentApprovals,
  presentKpiDefinitions,
  presentReference,
  presentTasks,
  presentTimeline,
  progressOf,
  seoPlan,
} from "../../../../../lib/seo-plan/index.ts";
import type {
  ApprovalsPayload,
  KpisPayload,
  ProgressPayload,
  ReferencePayload,
  TasksPayload,
  TimelinePayload,
} from "../../../../../lib/seo-plan/types.ts";
import { countAdminSitemapUrls } from "./sitemap.server.ts";

export interface SeoQuery {
  area?: string;
  owner?: string;
  phase?: string;
  status?: string;
  window?: string;
}

export interface SeoDashboardData {
  approvals: ApprovalsPayload;
  kpis: KpisPayload;
  progress: ProgressPayload;
  reference: ReferencePayload;
  site: string;
  tasks: TasksPayload;
  timeline: TimelinePayload;
}

export async function readSeoDashboard(query: SeoQuery): Promise<SeoDashboardData> {
  const locale = "en";
  const [catalog, gsc, sitemapUrls] = await Promise.all([
    getCatalogCounts(),
    fetchSearchConsole(query.window ?? null),
    countAdminSitemapUrls(),
  ]);
  return {
    approvals: { ...presentApprovals(locale), ready: true },
    kpis: {
      catalog,
      definitions: presentKpiDefinitions(locale),
      gsc,
      ready: true,
      sitemapUrls,
    },
    progress: { ...progressOf(seoPlan.tasks, locale), ready: true },
    reference: { ...presentReference(locale), ready: true },
    site: SEARCH_CONSOLE_SITE,
    tasks: {
      ready: true,
      tasks: presentTasks(
        locale,
        parseTaskFilter({
          area: query.area,
          owner: query.owner,
          phase: query.phase,
          status: query.status,
        }),
      ),
    },
    timeline: { ready: true, rows: presentTimeline(locale) },
  };
}

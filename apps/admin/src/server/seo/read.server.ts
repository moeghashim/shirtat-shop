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
  SeoOwner,
  SeoStatus,
  TimelinePayload,
} from "../../../../../lib/seo-plan/types.ts";
import { readAuthState } from "../../lib/auth/session.server.ts";
import { readSeoTaskChecks, type SavedTaskCheck } from "./checks.server.ts";
import { formatCheckDate, type SeoChecklistLocale, seoText } from "./copy.ts";
import { countAdminSitemapUrls } from "./sitemap.server.ts";
import {
  applyTaskChecks,
  completionLine,
  effectiveTaskStatus,
  matchesCheckedFilter,
  parseCheckedFilter,
} from "./status.ts";
import { canToggleSeoTasks } from "./toggle.ts";

export interface SeoQuery {
  area?: string;
  checked?: string;
  owner?: string;
  phase?: string;
  status?: string;
  window?: string;
}

export interface SeoChecklistTask {
  action: string;
  approval: string;
  approvalNeeded: boolean;
  area: string;
  checked: boolean;
  completion: string | null;
  evidence: string | null;
  id: string;
  link: string | null;
  measure: string;
  owner: SeoOwner;
  phase: string;
  status: SeoStatus;
}

export interface SeoDashboardData {
  approvals: ApprovalsPayload;
  kpis: KpisPayload;
  progress: ProgressPayload;
  reference: ReferencePayload;
  site: string;
  tasks: {
    actorName: string | null;
    canToggle: boolean;
    checksState: "demo" | "missing-table" | "ready";
    locale: SeoChecklistLocale;
    notice: string | null;
    ready: true;
    tasks: SeoChecklistTask[];
    todayLabel: string;
  };
  timeline: TimelinePayload;
}

function checklistTask(
  row: {
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
  },
  check: SavedTaskCheck | undefined,
  locale: SeoChecklistLocale,
): SeoChecklistTask {
  const status = effectiveTaskStatus(row.status, check);
  return {
    action: row.action,
    approval: row.approval,
    approvalNeeded: row.approvalNeeded,
    area: row.area,
    checked: status === "done",
    completion: completionLine(locale, {
      check: check ?? null,
      planStatus: row.status,
      planUpdated: row.updated,
    }),
    evidence: row.evidence,
    id: row.id,
    link: row.link,
    measure: row.measure,
    owner: row.owner,
    phase: row.phase,
    status,
  };
}

export async function readSeoDashboard(query: SeoQuery): Promise<SeoDashboardData> {
  const locale: SeoChecklistLocale = "en";
  const [catalog, gsc, sitemapUrls, checks, auth] = await Promise.all([
    getCatalogCounts(),
    fetchSearchConsole(query.window ?? null),
    countAdminSitemapUrls(),
    readSeoTaskChecks(),
    readAuthState(),
  ]);
  const statusFilter = parseTaskFilter({ status: query.status }).status;
  const checkedFilter = parseCheckedFilter(query.checked);
  const byId = new Map(checks.checks.map((check) => [check.taskId, check]));
  const tasks = presentTasks(
    locale,
    parseTaskFilter({ area: query.area, owner: query.owner, phase: query.phase, status: "all" }),
  )
    .map((row) => checklistTask(row, byId.get(row.id), locale))
    .filter(
      (row) =>
        (statusFilter === "all" || row.status === statusFilter) && matchesCheckedFilter(row.status, checkedFilter),
    );
  const actorName = auth.mode === "auth" && auth.user ? auth.user.name : null;
  return {
    approvals: { ...presentApprovals(locale), ready: true },
    kpis: {
      catalog,
      definitions: presentKpiDefinitions(locale),
      gsc,
      ready: true,
      sitemapUrls,
    },
    progress: { ...progressOf(applyTaskChecks(seoPlan.tasks, checks.checks), locale), ready: true },
    reference: { ...presentReference(locale), ready: true },
    site: SEARCH_CONSOLE_SITE,
    tasks: {
      actorName,
      canToggle: canToggleSeoTasks(auth) && checks.state === "ready",
      checksState: checks.state,
      locale,
      notice: checks.state === "missing-table" ? seoText("noticeMissing", locale) : null,
      ready: true,
      tasks,
      todayLabel: formatCheckDate(new Date(), locale),
    },
    timeline: { ready: true, rows: presentTimeline(locale) },
  };
}

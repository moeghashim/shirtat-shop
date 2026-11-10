import { SEARCH_CONSOLE_SITE, resolveSearchWindow, type SearchWindow } from "@/lib/search-console";

import type {
  GscReading,
  SearchRow,
  SearchSlice,
  SearchTotals,
  SitemapIndexReading,
} from "./types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ROW_LIMIT = 250;

interface TokenCache {
  expiresAt: number;
  value: string;
}

// Memory only, for the access-token lifetime. Do not store this in the Next.js data cache.
let tokenCache: TokenCache | null = null;

export function searchConsoleConfigured(): boolean {
  return Boolean(
    process.env.GSC_CLIENT_ID && process.env.GSC_CLIENT_SECRET && process.env.GSC_REFRESH_TOKEN,
  );
}

function sitePath(): string {
  return `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SEARCH_CONSOLE_SITE)}`;
}

async function accessToken(signal: AbortSignal): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value;
  const body = new URLSearchParams({
    client_id: process.env.GSC_CLIENT_ID ?? "",
    client_secret: process.env.GSC_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
    refresh_token: process.env.GSC_REFRESH_TOKEN ?? "",
  });
  const response = await fetch(TOKEN_URL, {
    body,
    cache: "no-store",
    method: "POST",
    signal,
  });
  if (!response.ok) throw new Error("token");
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("token");
  const ttlMs = Math.max((json.expires_in ?? 3600) - 60, 30) * 1000;
  tokenCache = { expiresAt: Date.now() + ttlMs, value: json.access_token };
  return json.access_token;
}

interface AnalyticsRow {
  clicks?: number;
  ctr?: number;
  impressions?: number;
  keys?: string[];
  position?: number;
}

function totalsFrom(row: AnalyticsRow | undefined): SearchTotals | null {
  if (!row) return null;
  if (
    typeof row.clicks !== "number" ||
    typeof row.ctr !== "number" ||
    typeof row.impressions !== "number" ||
    typeof row.position !== "number"
  ) {
    return null;
  }
  return { clicks: row.clicks, ctr: row.ctr, impressions: row.impressions, position: row.position };
}

function rowsFrom(rows: AnalyticsRow[] | undefined): SearchRow[] {
  if (!rows?.length) return [];
  const parsed: SearchRow[] = [];
  for (const row of rows) {
    const totals = totalsFrom(row);
    const key = row.keys?.[0];
    if (!totals || !key) continue;
    parsed.push({ ...totals, key });
  }
  return parsed.sort((a, b) => b.impressions - a.impressions || a.key.localeCompare(b.key));
}

async function queryAnalytics(
  token: string,
  window: SearchWindow,
  searchType: "image" | "web",
  dimensions: string[] | undefined,
  signal: AbortSignal,
): Promise<AnalyticsRow[] | null> {
  const response = await fetch(`${sitePath()}/searchAnalytics/query`, {
    body: JSON.stringify({
      dataState: "all",
      dimensions,
      endDate: window.end,
      rowLimit: ROW_LIMIT,
      searchType,
      startDate: window.start,
      startRow: 0,
    }),
    cache: "no-store",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    method: "POST",
    signal,
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { rows?: AnalyticsRow[] };
  return json.rows ?? [];
}

async function sliceFor(
  token: string,
  window: SearchWindow,
  searchType: "image" | "web",
  signal: AbortSignal,
): Promise<SearchSlice> {
  const [totals, pages, countries] = await Promise.all([
    queryAnalytics(token, window, searchType, undefined, signal),
    queryAnalytics(token, window, searchType, ["page"], signal),
    queryAnalytics(token, window, searchType, ["country"], signal),
  ]);
  if (!totals || !pages || !countries) return { byCountry: [], byPage: [], state: "unavailable" };
  const summary = totalsFrom(totals[0]);
  if (!summary) return { byCountry: [], byPage: [], state: "no-data" };
  return {
    byCountry: rowsFrom(countries),
    byPage: rowsFrom(pages),
    state: "ok",
    totals: summary,
  };
}

function numberField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
    return Number(value);
  return null;
}

async function sitemapIndex(token: string, signal: AbortSignal): Promise<SitemapIndexReading> {
  const response = await fetch(`${sitePath()}/sitemaps`, {
    cache: "no-store",
    headers: { authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok) return { state: "unavailable" };
  const json = (await response.json()) as {
    sitemap?: {
      contents?: { indexed?: string; submitted?: string }[];
      errors?: string;
      path?: string;
      warnings?: string;
    }[];
  };
  const list = json.sitemap ?? [];
  const match =
    list.find((item) => item.path?.endsWith("/sitemap.xml")) ??
    list.find((item) => item.contents?.length) ??
    null;
  if (!match) return { state: "no-data" };
  const contents = match.contents ?? [];
  if (contents.length === 0) return { path: match.path, state: "no-data" };
  let indexed = 0;
  let submitted = 0;
  let sawIndexed = false;
  let sawSubmitted = false;
  for (const content of contents) {
    const indexedCount = numberField(content.indexed);
    const submittedCount = numberField(content.submitted);
    if (indexedCount !== null) {
      indexed += indexedCount;
      sawIndexed = true;
    }
    if (submittedCount !== null) {
      submitted += submittedCount;
      sawSubmitted = true;
    }
  }
  if (!sawIndexed && !sawSubmitted) return { path: match.path, state: "no-data" };
  return {
    errors: numberField(match.errors) ?? undefined,
    indexed: sawIndexed ? indexed : undefined,
    path: match.path,
    state: "ok",
    submitted: sawSubmitted ? submitted : undefined,
    warnings: numberField(match.warnings) ?? undefined,
  };
}

export async function fetchSearchConsole(windowArg: string | null): Promise<GscReading> {
  const window = resolveSearchWindow(windowArg);
  if (!window) return { code: "invalid-window", state: "error" };
  if (!searchConsoleConfigured()) return { ...window, state: "not-connected" };
  const signal = AbortSignal.timeout(20_000);
  try {
    const token = await accessToken(signal);
    const [web, image, sitemaps] = await Promise.all([
      sliceFor(token, window, "web", signal),
      sliceFor(token, window, "image", signal),
      sitemapIndex(token, signal),
    ]);
    return { ...window, image, sitemaps, state: "ok", web };
  } catch {
    return { ...window, state: "error" };
  }
}

"use client";

import { createLibrary, defineComponent, Renderer, useStateField } from "@openuidev/react-lang";
import { useMemo, useState, type ReactNode } from "react";
import { z } from "zod/v4";

import { formatLocale, type Locale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  approvalsProps,
  filtersProps,
  kpisProps,
  progressProps,
  referenceProps,
  SEO_DASHBOARD_PROGRAM,
  tasksProps,
  timelineProps,
} from "@/lib/seo-plan/openui";
import type {
  ApprovalRow,
  ApprovalsPayload,
  CountReading,
  GscReading,
  KpisPayload,
  ProgressPayload,
  ReferencePayload,
  SearchRow,
  SearchSlice,
  TasksPayload,
  TimelinePayload,
} from "@/lib/seo-plan/types";

const PHASES = [
  ["all", "All phases"],
  ["foundation", "Already in the storefront"],
  ["now", "Quick wins, Nov 10–30"],
  ["dec", "December"],
  ["q1", "Q1 2027"],
] as const;

const AREAS = [
  ["all", "All areas"],
  ["Backlinks", "Backlinks"],
  ["Content", "Content"],
  ["International", "International"],
  ["Keywords", "Keywords"],
  ["Linking", "Linking"],
  ["Measurement", "Measurement"],
  ["On-page", "On-page"],
  ["Shopping", "Shopping"],
  ["Technical", "Technical"],
] as const;

const STATUSES = [
  ["all", "All statuses"],
  ["not-started", "Not started"],
  ["in-progress", "In progress"],
  ["blocked-on-approval", "Blocked on approval"],
  ["done", "Done"],
] as const;

const OWNERS = [
  ["all", "All owners"],
  ["moe", "Moe"],
  ["bot", "Bot"],
] as const;

const STATUS_LABEL = {
  "blocked-on-approval": "Blocked on approval",
  done: "Done",
  "in-progress": "In progress",
  "not-started": "Not started",
} as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function gate(value: unknown): "denied" | "loading" | "unavailable" | null {
  const body = asRecord(value);
  if (!body || body.ready !== true) return "loading";
  if (body.state === "denied" || body.state === "unavailable") return body.state;
  return null;
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-[#f6f1e8] p-4 md:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      {label}
    </p>
  );
}

function ChoiceRow({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (next: string) => void;
  options: readonly (readonly [string, string])[];
  value: string;
}) {
  const t = useT();
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{t(label)}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, text]) => (
          <button
            aria-pressed={value === id}
            className="min-h-11 cursor-pointer rounded-full bg-[#efe6d2] px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground data-[pressed=true]:bg-foreground data-[pressed=true]:text-background"
            data-pressed={value === id}
            key={id}
            onClick={() => onChange(id)}
            type="button"
          >
            {t(text)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function fieldValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function FiltersView({
  area,
  owner,
  phase,
  status,
  tick,
  window,
}: {
  area: unknown;
  owner: unknown;
  phase: unknown;
  status: unknown;
  tick: unknown;
  window: unknown;
}) {
  const t = useT();
  const phaseField = useStateField("phase", phase);
  const areaField = useStateField("area", area);
  const statusField = useStateField("status", status);
  const ownerField = useStateField("owner", owner);
  const windowField = useStateField("window", window);
  const tickField = useStateField("tick", tick);
  const selectedWindow = fieldValue(windowField.value, "28");
  const custom = selectedWindow.includes(":");
  const [start, setStart] = useState(custom ? selectedWindow.split(":")[0] : "");
  const [end, setEnd] = useState(custom ? selectedWindow.split(":")[1] : "");
  return (
    <div className="grid gap-4">
      <ChoiceRow
        label="Phase"
        onChange={(next) => phaseField.setValue(next)}
        options={PHASES}
        value={fieldValue(phaseField.value, "all")}
      />
      <ChoiceRow
        label="Area"
        onChange={(next) => areaField.setValue(next)}
        options={AREAS}
        value={fieldValue(areaField.value, "all")}
      />
      <ChoiceRow
        label="Status"
        onChange={(next) => statusField.setValue(next)}
        options={STATUSES}
        value={fieldValue(statusField.value, "all")}
      />
      <ChoiceRow
        label="Owner"
        onChange={(next) => ownerField.setValue(next)}
        options={OWNERS}
        value={fieldValue(ownerField.value, "all")}
      />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t("Date range")}</legend>
        <div className="flex flex-wrap gap-2">
          {(["28", "90"] as const).map((id) => (
            <button
              aria-pressed={selectedWindow === id}
              className="min-h-11 cursor-pointer rounded-full bg-[#efe6d2] px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground data-[pressed=true]:bg-foreground data-[pressed=true]:text-background"
              data-pressed={selectedWindow === id}
              key={id}
              onClick={() => windowField.setValue(id)}
              type="button"
            >
              {id === "28" ? t("Last 28 days") : t("Last 90 days")}
            </button>
          ))}
          <button
            aria-pressed={custom}
            className="min-h-11 cursor-pointer rounded-full bg-[#efe6d2] px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground data-[pressed=true]:bg-foreground data-[pressed=true]:text-background"
            data-pressed={custom}
            onClick={() => {
              if (start && end) windowField.setValue(`${start}:${end}`);
            }}
            type="button"
          >
            {t("Custom range")}
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm" htmlFor="seo-start">
            {t("Start date")}
            <input
              className="min-h-11 rounded-xl border border-border bg-background px-3"
              id="seo-start"
              onChange={(event) => setStart(event.target.value)}
              type="date"
              value={start}
            />
          </label>
          <label className="grid gap-1 text-sm" htmlFor="seo-end">
            {t("End date")}
            <input
              className="min-h-11 rounded-xl border border-border bg-background px-3"
              id="seo-end"
              onChange={(event) => setEnd(event.target.value)}
              type="date"
              value={end}
            />
          </label>
          <button
            className="min-h-11 cursor-pointer rounded-full bg-foreground px-4 text-sm text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!start || !end}
            onClick={() => windowField.setValue(`${start}:${end}`)}
            type="button"
          >
            {t("Apply dates")}
          </button>
          <button
            className="min-h-11 cursor-pointer rounded-full border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            onClick={() => tickField.setValue(String(Date.now()))}
            type="button"
          >
            {t("Refresh")}
          </button>
        </div>
      </fieldset>
    </div>
  );
}

function Meter({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-background"
        role="meter"
      >
        <div className="h-full rounded-full bg-foreground" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ProgressView({ payload }: { payload: unknown }) {
  const t = useT();
  const blocked = gate(payload);
  if (blocked === "loading") return <Pending label={t("Loading the SEO plan…")} />;
  if (blocked)
    return (
      <Pending
        label={t(blocked === "denied" ? "Sign in again to load this data." : "Couldn't load")}
      />
    );
  const body = payload as ProgressPayload;
  return (
    <Panel title={t("Progress")}>
      <p className="text-3xl font-semibold tabular-nums">{body.percent}%</p>
      <p className="text-sm text-muted-foreground">
        {t("{done} of {total} done", { done: body.done, total: body.total })}
        {" · "}
        {t("{count} in progress", { count: body.inProgress })}
        {" · "}
        {t("{count} blocked on approval", { count: body.blocked })}
        {" · "}
        {t("{count} not started", { count: body.notStarted })}
      </p>
      <Meter label={t("Complete")} percent={body.percent} />
      <div className="grid gap-3 md:grid-cols-2">
        {body.phases.map((slice) => (
          <Meter key={slice.id} label={slice.label} percent={slice.percent} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {body.areas.map((slice) => (
          <Meter
            key={slice.id}
            label={`${slice.label} · ${slice.done}/${slice.total}`}
            percent={slice.percent}
          />
        ))}
      </div>
    </Panel>
  );
}

function countText(reading: CountReading, locale: Locale, t: (key: string) => string): string {
  if (reading.state === "ok" && typeof reading.count === "number") {
    return new Intl.NumberFormat(formatLocale(locale)).format(reading.count);
  }
  if (reading.state === "not-connected") return t("Not connected");
  if (reading.state === "no-data") return t("No data yet");
  return t("Couldn't load");
}

function formatCtr(value: number, locale: Locale): string {
  return new Intl.NumberFormat(formatLocale(locale), {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function formatPosition(value: number, locale: Locale): string {
  return new Intl.NumberFormat(formatLocale(locale), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function pageLabel(key: string): string {
  try {
    const url = new URL(key);
    return url.hostname === "shirtat.co" || url.hostname.endsWith(".shirtat.co")
      ? `${url.pathname}${url.search}`
      : key;
  } catch {
    return key;
  }
}

function SearchList({ rows, title }: { rows: SearchRow[]; title: string }) {
  const t = useT();
  const locale = useLocale();
  const shown = rows.slice(0, 12);
  return (
    <div className="grid gap-2">
      <h4 className="text-sm font-medium">{title}</h4>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("No data yet")}</p>
      ) : (
        <ul className="grid gap-2">
          {shown.map((row) => (
            <li className="grid gap-1 border-b border-border pb-2" key={row.key}>
              <span className="break-all text-sm">{pageLabel(row.key)}</span>
              <span className="text-xs text-muted-foreground">
                {t("{count} impressions", {
                  count: new Intl.NumberFormat(formatLocale(locale)).format(row.impressions),
                })}
                {" · "}
                {t("{count} clicks", {
                  count: new Intl.NumberFormat(formatLocale(locale)).format(row.clicks),
                })}
                {" · "}
                {formatCtr(row.ctr, locale)}
                {" · "}
                {formatPosition(row.position, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > shown.length ? (
        <p className="text-xs text-muted-foreground">
          {t("Showing {shown} of {total}", { shown: shown.length, total: rows.length })}
        </p>
      ) : null}
    </div>
  );
}

function sliceSummary(
  slice: SearchSlice | undefined,
  locale: Locale,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (!slice || slice.state === "unavailable") return t("Couldn't load");
  if (slice.state === "no-data" || !slice.totals) return t("No data yet");
  return [
    t("{count} impressions", {
      count: new Intl.NumberFormat(formatLocale(locale)).format(slice.totals.impressions),
    }),
    t("{count} clicks", {
      count: new Intl.NumberFormat(formatLocale(locale)).format(slice.totals.clicks),
    }),
    formatCtr(slice.totals.ctr, locale),
    t("position {position}", { position: formatPosition(slice.totals.position, locale) }),
  ].join(" · ");
}

function SearchCard({ slice, title }: { slice: SearchSlice | undefined; title: string }) {
  const t = useT();
  const locale = useLocale();
  return (
    <article className="grid gap-3 rounded-2xl bg-background p-4">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm">{sliceSummary(slice, locale, t)}</p>
      {slice?.state === "ok" ? (
        <div className="grid gap-4">
          <SearchList rows={slice.byPage} title={t("By page")} />
          <SearchList rows={slice.byCountry} title={t("By country")} />
        </div>
      ) : null}
    </article>
  );
}

function KpisView({ payload }: { payload: unknown }) {
  const t = useT();
  const locale = useLocale();
  const blocked = gate(payload);
  if (blocked === "loading") return <Pending label={t("Loading the SEO plan…")} />;
  if (blocked)
    return (
      <Pending
        label={t(blocked === "denied" ? "Sign in again to load this data." : "Couldn't load")}
      />
    );
  const body = payload as KpisPayload;
  const gsc = body.gsc;
  return (
    <Panel title={t("KPIs")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="grid gap-1 rounded-2xl bg-background p-4">
          <h3 className="text-sm font-medium">{t("Published products")}</h3>
          <p className="text-2xl font-semibold tabular-nums">
            {countText(body.catalog.products, locale, t)}
          </p>
        </article>
        <article className="grid gap-1 rounded-2xl bg-background p-4">
          <h3 className="text-sm font-medium">{t("Published collections")}</h3>
          <p className="text-2xl font-semibold tabular-nums">
            {countText(body.catalog.collections, locale, t)}
          </p>
        </article>
        <article className="grid gap-1 rounded-2xl bg-background p-4">
          <h3 className="text-sm font-medium">{t("Sitemap URLs")}</h3>
          <p className="text-2xl font-semibold tabular-nums">
            {countText(body.sitemapUrls, locale, t)}
          </p>
        </article>
      </div>
      <GscBlock gsc={gsc} />
      <ul className="grid gap-3">
        {body.definitions.map((item) => (
          <li className="grid gap-1 rounded-2xl bg-background p-4" key={item.id}>
            <h3 className="text-sm font-semibold">{item.name}</h3>
            <p className="text-sm">{liveLine(item.id, gsc, t, locale)}</p>
            <p className="text-xs text-muted-foreground">
              {t("Recorded baseline")}: {item.baseline}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.source}
              {" · "}
              {item.cadence}
              {" · "}
              {item.checkpoint}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function liveLine(
  id: string,
  gsc: GscReading,
  t: (key: string, vars?: Record<string, string | number>) => string,
  locale: Locale,
): string {
  if (id === "web-search" || id === "image-search") {
    if (gsc.state === "not-connected") return t("Not connected");
    if (gsc.state === "error") {
      return t(gsc.code === "invalid-window" ? "That date range is not valid." : "Couldn't load");
    }
    return sliceSummary(id === "web-search" ? gsc.web : gsc.image, locale, t);
  }
  if (id === "indexed-urls") {
    if (gsc.state === "not-connected") return t("Not connected");
    if (gsc.state === "error") {
      return t(gsc.code === "invalid-window" ? "That date range is not valid." : "Couldn't load");
    }
    const sitemaps = gsc.sitemaps;
    if (!sitemaps || sitemaps.state === "no-data") return t("No data yet");
    if (sitemaps.state === "unavailable") return t("Couldn't load");
    const indexed =
      typeof sitemaps.indexed === "number"
        ? new Intl.NumberFormat(formatLocale(locale)).format(sitemaps.indexed)
        : t("No data yet");
    const submitted =
      typeof sitemaps.submitted === "number"
        ? new Intl.NumberFormat(formatLocale(locale)).format(sitemaps.submitted)
        : t("No data yet");
    return t("{indexed} indexed of {submitted} submitted", { indexed, submitted });
  }
  return t("No data yet");
}

function GscBlock({ gsc }: { gsc: GscReading }) {
  const t = useT();
  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <h3 className="text-base font-semibold">{t("Search Console")}</h3>
        <p className="text-sm text-muted-foreground">sc-domain:shirtat.co</p>
        {gsc.state === "not-connected" ? (
          <p className="text-sm">
            {t("Not connected. Set GSC_CLIENT_ID, GSC_CLIENT_SECRET and GSC_REFRESH_TOKEN.")}
          </p>
        ) : null}
        {gsc.state === "error" ? (
          <p className="text-sm">
            {t(gsc.code === "invalid-window" ? "That date range is not valid." : "Couldn't load")}
          </p>
        ) : null}
        {gsc.start && gsc.end ? (
          <p className="text-sm text-muted-foreground">
            {gsc.start} – {gsc.end}
          </p>
        ) : null}
      </div>
      {gsc.state === "ok" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <SearchCard slice={gsc.web} title={t("Web search")} />
          <SearchCard slice={gsc.image} title={t("Image search")} />
        </div>
      ) : null}
    </div>
  );
}

function TasksView({ payload }: { payload: unknown }) {
  const t = useT();
  const blocked = gate(payload);
  if (blocked === "loading") return <Pending label={t("Loading the SEO plan…")} />;
  if (blocked)
    return (
      <Pending
        label={t(blocked === "denied" ? "Sign in again to load this data." : "Couldn't load")}
      />
    );
  const body = payload as TasksPayload;
  return (
    <Panel title={t("Tasks")}>
      <p className="text-sm text-muted-foreground">
        {t("Showing {count} tasks", { count: body.tasks.length })}
      </p>
      {body.tasks.length === 0 ? (
        <p className="text-sm">{t("No tasks match these filters.")}</p>
      ) : null}
      <ul className="grid gap-3">
        {body.tasks.map((task) => (
          <li className="grid gap-2 rounded-2xl bg-background p-4" key={task.id}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono">{task.id}</span>
              <span className="rounded-full bg-[#efe6d2] px-2 py-1">
                {t(STATUS_LABEL[task.status])}
              </span>
              <span>{task.phase}</span>
              <span>{task.area}</span>
            </div>
            <p className="text-sm leading-6">{task.action}</p>
            <p className="text-xs text-muted-foreground">
              {t("Owner")}: {t(task.owner === "moe" ? "Moe" : "Bot")}
              {" · "}
              {t("Updated")} {task.updated}
              {" · "}
              {t("Approval")}: {task.approval}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("How it is measured")}: {task.measure}
            </p>
            {task.evidence ? (
              <p className="text-xs leading-5">
                {t("Evidence")}: {task.evidence}
              </p>
            ) : null}
            {task.link ? (
              <a className="text-sm underline" href={task.link}>
                {t("Open link")}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ApprovalsView({ payload }: { payload: unknown }) {
  const t = useT();
  const blocked = gate(payload);
  if (blocked === "loading") return <Pending label={t("Loading the SEO plan…")} />;
  if (blocked)
    return (
      <Pending
        label={t(blocked === "denied" ? "Sign in again to load this data." : "Couldn't load")}
      />
    );
  const body = payload as ApprovalsPayload;
  return (
    <Panel title={t("Approvals")}>
      <p className="text-sm text-muted-foreground">
        {t("{count} granted", { count: body.granted })}
        {" · "}
        {t("{count} pending", { count: body.pending })}
      </p>
      <ul className="grid gap-2">
        {body.items.map((item: ApprovalRow) => (
          <li className="grid gap-1 rounded-2xl bg-background p-4" key={item.id}>
            <p className="text-sm">
              <span className="font-medium">
                {item.state === "granted" ? t("Granted") : t("Pending")}
              </span>
              {item.updated ? ` · ${item.updated}` : ""}
            </p>
            <p className="text-sm leading-6">{item.text}</p>
            {item.meta ? <p className="text-xs text-muted-foreground">{item.meta}</p> : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function TimelineView({ payload }: { payload: unknown }) {
  const t = useT();
  const blocked = gate(payload);
  if (blocked === "loading") return <Pending label={t("Loading the SEO plan…")} />;
  if (blocked)
    return (
      <Pending
        label={t(blocked === "denied" ? "Sign in again to load this data." : "Couldn't load")}
      />
    );
  const body = payload as TimelinePayload;
  return (
    <Panel title={t("Timeline")}>
      <ol className="grid gap-3">
        {body.rows.map((row) => (
          <li className="grid gap-1" key={row.window}>
            <h3 className="text-sm font-semibold">{row.window}</h3>
            <p className="text-sm leading-6">{row.focus}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function ReferenceView({ payload }: { payload: unknown }) {
  const t = useT();
  const blocked = gate(payload);
  if (blocked === "loading") return <Pending label={t("Loading the SEO plan…")} />;
  if (blocked)
    return (
      <Pending
        label={t(blocked === "denied" ? "Sign in again to load this data." : "Couldn't load")}
      />
    );
  const body = payload as ReferencePayload;
  return (
    <div className="grid gap-4">
      <Panel title={t("Keyword targets")}>
        <ul className="grid gap-3">
          {body.keywords.map((row) => (
            <li className="grid gap-1 rounded-2xl bg-background p-4" key={row.cluster}>
              <h3 className="text-sm font-semibold">
                {row.cluster}
                {" · "}
                {row.lang}
                {" · "}
                {row.priority}
              </h3>
              <p className="text-sm leading-6">{row.examples}</p>
              <p className="text-xs text-muted-foreground">
                {row.intent}
                {" · "}
                {row.target}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={t("Sample titles")}>
        <ul className="grid gap-3">
          {body.titles.map((row) => (
            <li className="grid gap-1 rounded-2xl bg-background p-4" key={row.page}>
              <h3 className="text-sm font-semibold">{row.page}</h3>
              <p className="text-sm">{row.current}</p>
              <p className="text-sm">{row.proposed}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

const Filters = defineComponent({
  component: ({ props }) => (
    <FiltersView
      area={props.area}
      owner={props.owner}
      phase={props.phase}
      status={props.status}
      tick={props.tick}
      window={props.window}
    />
  ),
  description:
    "Phase, area, status, owner and date filters. Changing one refetches the queries that read it.",
  name: "Filters",
  props: filtersProps,
});

const Progress = defineComponent({
  component: ({ props }) => <ProgressView payload={props.payload} />,
  description: "Overall, phase and area progress.",
  name: "Progress",
  props: progressProps,
});

const Kpis = defineComponent({
  component: ({ props }) => <KpisView payload={props.payload} />,
  description: "Live Search Console, Shopify catalog and sitemap figures.",
  name: "Kpis",
  props: kpisProps,
});

const Tasks = defineComponent({
  component: ({ props }) => <TasksView payload={props.payload} />,
  description: "The filtered SEO plan tasks.",
  name: "Tasks",
  props: tasksProps,
});

const Approvals = defineComponent({
  component: ({ props }) => <ApprovalsView payload={props.payload} />,
  description: "Approvals Moe has granted or still has pending.",
  name: "Approvals",
  props: approvalsProps,
});

const Timeline = defineComponent({
  component: ({ props }) => <TimelineView payload={props.payload} />,
  description: "The weekly plan windows.",
  name: "Timeline",
  props: timelineProps,
});

const Reference = defineComponent({
  component: ({ props }) => <ReferenceView payload={props.payload} />,
  description: "Keyword targets and proposed titles.",
  name: "Reference",
  props: referenceProps,
});

const Stack = defineComponent({
  component: ({ props, renderNode }) => (
    <div className="grid gap-6">
      {props.children.map((child, index) => (
        <div key={index}>{renderNode(child)}</div>
      ))}
    </div>
  ),
  description: "Dashboard column. This is the root.",
  name: "Stack",
  props: z.object({
    children: z.array(
      z.union([
        Approvals.ref,
        Filters.ref,
        Kpis.ref,
        Progress.ref,
        Reference.ref,
        Tasks.ref,
        Timeline.ref,
      ]),
    ),
  }),
});

const library = createLibrary({
  components: [Approvals, Filters, Kpis, Progress, Reference, Stack, Tasks, Timeline],
  root: "Stack",
});

async function callTool(locale: Locale, tool: string, args: Record<string, unknown>) {
  const params = new URLSearchParams({ locale, tool });
  for (const [key, value] of Object.entries(args ?? {})) {
    if (typeof value !== "string" || value === "") continue;
    params.set(key, value);
  }
  try {
    const response = await fetch(`/api/admin/seo?${params.toString()}`, {
      headers: { accept: "application/json" },
    });
    if (response.status === 404) return { ready: true, state: "denied" };
    if (!response.ok) return { ready: true, state: "unavailable" };
    const body: unknown = await response.json();
    const record = asRecord(body);
    return record ? { ...record, ready: true } : { ready: true, state: "unavailable" };
  } catch {
    return { ready: true, state: "unavailable" };
  }
}

export function SeoDashboard() {
  const locale = useLocale();
  const t = useT();
  const toolProvider = useMemo(
    () => ({
      seo_approvals: (args: Record<string, unknown>) => callTool(locale, "seo_approvals", args),
      seo_kpis: (args: Record<string, unknown>) => callTool(locale, "seo_kpis", args),
      seo_progress: (args: Record<string, unknown>) => callTool(locale, "seo_progress", args),
      seo_reference: (args: Record<string, unknown>) => callTool(locale, "seo_reference", args),
      seo_tasks: (args: Record<string, unknown>) => callTool(locale, "seo_tasks", args),
      seo_timeline: (args: Record<string, unknown>) => callTool(locale, "seo_timeline", args),
    }),
    [locale],
  );
  return (
    <Renderer
      isStreaming={false}
      library={library}
      publishObservability={false}
      queryLoader={<span className="sr-only">{t("Loading the SEO plan…")}</span>}
      response={SEO_DASHBOARD_PROGRAM}
      toolProvider={toolProvider}
    />
  );
}

import { z } from "zod";

import { addCivilDays, civilDate, inclusiveDuration } from "../../../../../server/data/projects.types.ts";

export const spanSchema = z
  .object({ startDate: civilDate.nullable(), endDate: civilDate.nullable() })
  .superRefine((v, c) => {
    if (v.endDate && (!v.startDate || v.endDate < v.startDate))
      c.addIssue({ code: "custom", message: "A span needs a start and cannot end before it starts." });
  });
export function scheduleSpan(value: { startDate: string | null; endDate: string | null }) {
  const v = spanSchema.parse(value);
  if (!v.startDate) return null;
  const end = v.endDate ?? v.startDate;
  return { start: v.startDate, end, duration: inclusiveDuration(v.startDate, end) };
}
export function shiftMonths(day: string, months: number) {
  civilDate.parse(day);
  const date = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return civilDate.parse(date.toISOString().slice(0, 10));
}
export function scheduleRange(start: string, scale: "weeks" | "months", periods: number) {
  civilDate.parse(start);
  z.number().int().min(1).max(12).parse(periods);
  const from = scale === "months" ? `${start.slice(0, 7)}-01` : start;
  const end = scale === "months" ? addCivilDays(shiftMonths(from, periods), -1) : addCivilDays(from, periods * 7 - 1);
  return { start: from, end, days: inclusiveDuration(from, end) };
}
export function spanPosition(
  span: NonNullable<ReturnType<typeof scheduleSpan>>,
  range: ReturnType<typeof scheduleRange>,
) {
  // biome-ignore lint/complexity/useMathMinMax: ISO civil dates compare lexically, not numerically.
  const from = span.start < range.start ? range.start : span.start;
  // biome-ignore lint/complexity/useMathMinMax: ISO civil dates compare lexically, not numerically.
  const to = span.end > range.end ? range.end : span.end;
  return {
    visible: from <= to,
    offset: from <= to ? inclusiveDuration(range.start, from) - 1 : 0,
    days: from <= to ? inclusiveDuration(from, to) : 0,
    continuesBefore: span.start < range.start,
    continuesAfter: span.end > range.end,
  };
}
export function localCivilDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function eventDuration(event: { start: string; end?: string; allDay?: boolean }) {
  if (!event.end) return "Not specified";
  const utc = (value: string) => Date.parse(`${value}${value.includes("T") ? "Z" : "T00:00:00Z"}`);
  const minutes = (utc(event.end) - utc(event.start)) / 60000;
  if (!Number.isFinite(minutes) || minutes < 0) return "Invalid span";
  return event.allDay ? `${minutes / 1440} days (exclusive end)` : `${minutes} minutes (civil time)`;
}

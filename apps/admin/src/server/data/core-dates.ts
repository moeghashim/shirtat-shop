import { z } from "zod";

const civil = z.iso.date();
export function civilDate(date: string) {
  civil.parse(date);
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}
export function performanceDates<T extends object>(points: T[], renderedAt: string, stepHours: number) {
  const ref = new Date(renderedAt);
  const end = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() + 1) - 1;
  return points.map((point, index) => ({
    ...point,
    date: new Date(end - (points.length - 1 - index) * stepHours * 3600000).toISOString().slice(0, 10),
  }));
}
export function rollingMonths(values: number[], renderedAt: string) {
  return values.map((qualified, index) => {
    const date = new Date(renderedAt);
    date.setUTCMonth(date.getUTCMonth() - (values.length - 1 - index));
    return { date: date.toISOString(), qualified };
  });
}
export function previousMonth(renderedAt: string) {
  const ref = new Date(renderedAt);
  // Only the month label is needed; day one preserves date-fns subMonths
  // semantics at month ends without overflowing into the current month.
  ref.setUTCDate(1);
  ref.setUTCMonth(ref.getUTCMonth() - 1);
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(ref);
}

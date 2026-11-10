export const SEARCH_CONSOLE_SITE = "sc-domain:shirtat.co";

const DAY_MS = 86_400_000;
const MAX_SPAN_DAYS = 480;

export interface SearchWindow {
  end: string;
  start: string;
}

function isoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Last 28 or 90 days end yesterday (UTC). A `YYYY-MM-DD:YYYY-MM-DD` window is used as written. */
export function resolveSearchWindow(
  window: string | null | undefined,
  now = new Date(),
): SearchWindow | null {
  const today = utcDay(now);
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const endDefault = utcDay(yesterday);

  if (window === "28" || window === "90" || window == null || window === "" || window === "all") {
    const days = window === "90" ? 90 : 28;
    const start = new Date(yesterday.getTime() - (days - 1) * DAY_MS);
    return { end: endDefault, start: utcDay(start) };
  }

  const match = /^(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(window);
  if (!match?.[1] || !match[2] || !isoDate(match[1]) || !isoDate(match[2])) return null;
  if (match[1] > match[2] || match[2] > today) return null;
  const span = (Date.parse(`${match[2]}T00:00:00Z`) - Date.parse(`${match[1]}T00:00:00Z`)) / DAY_MS;
  if (span > MAX_SPAN_DAYS) return null;
  return { end: match[2], start: match[1] };
}

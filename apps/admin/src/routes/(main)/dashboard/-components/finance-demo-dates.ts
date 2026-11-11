// This is a dated demo statement, not live financial data. Explicit UTC dates
// keep SSR, Workers module initialization, and browser hydration identical.

export function formatDemoDate(iso: string, withTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: true } : {}),
  }).format(new Date(iso));
}

/**
 * Display currency. The Shopify store stays in GBP; the site shows USD converted at a daily
 * ECB reference rate (frankfurter). The rate is fetched in the root layout and set on both
 * server and client before any price renders.
 */
export const DISPLAY_CURRENCY = "USD";
const FALLBACK_GBP_USD = 1.33;
let gbpUsd = FALLBACK_GBP_USD;

export function setGbpUsdRate(rate: number | null | undefined): void {
  if (rate && Number.isFinite(rate) && rate > 0.5 && rate < 3) gbpUsd = rate;
}

export function getGbpUsdRate(): number {
  return gbpUsd;
}

export function toUsdAmount(amount: string | number, currencyCode: string): number {
  const n = Number(amount) || 0;
  return currencyCode === "GBP" ? n * gbpUsd : n;
}

/** Latest GBP→USD rate, cached for 12 hours. */
export async function fetchGbpUsdRate(): Promise<number | null> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?from=GBP&to=USD", {
      next: { revalidate: 43200 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: { USD?: number } };
    return json.rates?.USD ?? null;
  } catch {
    return null;
  }
}

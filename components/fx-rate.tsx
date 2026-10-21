"use client";

import { setGbpUsdRate } from "@/lib/money/fx";

/** Sets the display rate on the client before sibling price components render. */
export function FxRate({ rate }: { rate: number | null }) {
  setGbpUsdRate(rate);
  return null;
}

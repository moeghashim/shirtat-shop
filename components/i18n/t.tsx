"use client";

import { useT } from "@/lib/i18n/client";

/** Renders a translated UI string for the current locale; usable from server and client components. */
export function T({ k, vars }: { k: string; vars?: Record<string, string | number> }) {
  const t = useT();
  return t(k, vars);
}

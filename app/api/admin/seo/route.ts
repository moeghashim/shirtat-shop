import { connection } from "next/server";

import { getSession } from "@/lib/creators/auth";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { parseSeoTool } from "@/lib/seo-plan";
import { seoDashboardHttpStatus } from "@/lib/seo-plan/access";
import { readSeoTool } from "@/lib/seo-plan/server";

const PRIVATE = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex",
};

export async function GET(request: Request): Promise<Response> {
  await connection();
  const session = await getSession();
  if (seoDashboardHttpStatus(session) === 404) {
    return new Response(null, { headers: PRIVATE, status: 404 });
  }
  const url = new URL(request.url);
  const tool = parseSeoTool(url.searchParams.get("tool"));
  if (!tool) {
    return Response.json({ error: "unknown tool" }, { headers: PRIVATE, status: 400 });
  }
  const requested = url.searchParams.get("locale");
  const locale = isLocale(requested) ? requested : defaultLocale;
  try {
    return Response.json(await readSeoTool(tool, locale, url.searchParams), { headers: PRIVATE });
  } catch {
    return Response.json({ ready: true, state: "unavailable" }, { headers: PRIVATE });
  }
}

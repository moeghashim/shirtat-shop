import { Client } from "eve/client";
import { headers } from "next/headers";

import { shopConfig } from "@/lib/config";

import { type ProjectedTurn, type ReviewStreamEvent, isSessionId, projectTurns } from "./index";

export async function reviewHost(): Promise<string> {
  const headerList = await headers();
  const host =
    (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "").split(",")[0]?.trim() ??
    "";
  const proto = (headerList.get("x-forwarded-proto") ?? "http").split(",")[0]?.trim() ?? "";
  // A forwarded host is accepted only for this deployment, so the snapshot read cannot be aimed elsewhere.
  if (!host || host.includes("/") || !/^https?$/.test(proto) || !allowedReviewHost(host)) {
    throw new Error("Missing review host");
  }
  return `${proto}://${host}`;
}

function allowedReviewHost(host: string): boolean {
  const name = host.split(":")[0]?.toLowerCase() ?? "";
  if (name === "localhost" || name === "127.0.0.1") return true;
  let siteHost = "";
  try {
    siteHost = new URL(shopConfig.site.url).host.toLowerCase();
  } catch {
    siteHost = "";
  }
  if (siteHost && host.toLowerCase() === siteHost) return true;
  return name.endsWith(".vercel.app") && name.includes("shirtat-shop");
}

/** Reads Eve's existing session stream. Returns null when the session cannot be read. */
export async function readLiveTurns(
  sessionId: string,
  host: string,
): Promise<ProjectedTurn[] | null> {
  if (!isSessionId(sessionId)) return null;
  try {
    const snapshot = await new Client({ host }).sessions.attach(sessionId).snapshot({
      signal: AbortSignal.timeout(8000),
    });
    return projectTurns(snapshot.events as readonly ReviewStreamEvent[]);
  } catch {
    return null;
  }
}

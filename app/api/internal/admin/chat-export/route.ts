import { connection } from "next/server";

import { authorizeAdminRequest, notFound } from "@/lib/admin-api/request";
import { reviewExportResponse } from "@/lib/chat-review";
import { readFeedback, readFrozenTurn } from "@/lib/chat-review/store";
import { ADMIN_EMAIL } from "@/lib/creators/terms";

/** Owner-only JSON export of one reviewed turn version. */
export async function GET(request: Request): Promise<Response> {
  await connection();
  const authorized = await authorizeAdminRequest(request);
  if (!authorized) return notFound();
  const owner = { email: ADMIN_EMAIL, isAdmin: true };
  const sessionId = authorized.url.searchParams.get("session") ?? "";
  const turnId = authorized.url.searchParams.get("turn") ?? "";
  const version = authorized.url.searchParams.get("version") ?? "";
  try {
    const [turn, feedback] = await Promise.all([
      readFrozenTurn(sessionId, turnId, version),
      readFeedback(sessionId, turnId, version),
    ]);
    return reviewExportResponse(owner, turn && feedback ? { feedback, turn } : null);
  } catch {
    return reviewExportResponse(owner, null);
  }
}

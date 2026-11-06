import { connection } from "next/server";

import { reviewAccess, reviewExportResponse } from "@/lib/chat-review";
import { readFeedback, readFrozenTurn } from "@/lib/chat-review/store";
import { getSession } from "@/lib/creators/auth";

export async function GET(request: Request): Promise<Response> {
  await connection();
  const session = await getSession();
  if (!reviewAccess(session)) return reviewExportResponse(null, null);
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session") ?? "";
  const turnId = url.searchParams.get("turn") ?? "";
  const version = url.searchParams.get("version") ?? "";
  try {
    const [turn, feedback] = await Promise.all([
      readFrozenTurn(sessionId, turnId, version),
      readFeedback(sessionId, turnId, version),
    ]);
    return reviewExportResponse(session, turn && feedback ? { feedback, turn } : null);
  } catch {
    return reviewExportResponse(session, null);
  }
}

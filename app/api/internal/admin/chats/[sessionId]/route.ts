import { connection } from "next/server";

import { readChatDetailView } from "@/lib/admin-api/chats";
import { authorizeAdminRequest, json, notFound } from "@/lib/admin-api/request";
import { reviewHost } from "@/lib/chat-review/live";

/** Owner-only transcript of one chat: live Eve turns merged with stored copies and feedback. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  await connection();
  const authorized = await authorizeAdminRequest(request);
  if (!authorized) return notFound();
  const { sessionId } = await params;
  const detail = await readChatDetailView(
    sessionId,
    await reviewHost(),
    authorized.url.searchParams.get("fixture"),
  );
  return detail ? json(detail) : json({ code: "invalid", ok: false }, 400);
}

import { connection } from "next/server";

import { deleteChatSession, readChatsView, saveChatFeedback } from "@/lib/admin-api/chats";
import { authorizeAdminRequest, formOf, json, notFound } from "@/lib/admin-api/request";
import { reviewHost } from "@/lib/chat-review/live";

/** Owner-only list of stored shopping chats. */
export async function GET(request: Request): Promise<Response> {
  await connection();
  if (!(await authorizeAdminRequest(request))) return notFound();
  return json(await readChatsView());
}

/** ?op=feedback saves owner feedback on one turn version; ?op=delete removes a stored session. */
export async function POST(request: Request): Promise<Response> {
  await connection();
  const authorized = await authorizeAdminRequest(request);
  if (!authorized) return notFound();
  const op = authorized.url.searchParams.get("op");
  const form = await formOf(request, authorized.body);
  if (!form) return json({ code: "invalid", ok: false }, 400);
  if (op === "delete") return json(await deleteChatSession(form));
  if (op === "feedback") return json(await saveChatFeedback(form, await reviewHost()));
  return json({ code: "invalid", ok: false }, 400);
}

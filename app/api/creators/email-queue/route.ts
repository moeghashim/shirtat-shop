import { timingSafeEqual } from "node:crypto";

import { getQueuedEmail, listQueuedEmails, queueEmail } from "@/lib/creators/store";

/**
 * Outbox for creator emails, polled by the Grok Bot inbox routine (moeg@mail.grokbot.com).
 * GET lists queued emails; POST {id, from} marks one as sent. Requires `Authorization: Bearer EMAIL_QUEUE_TOKEN`.
 */
function authorized(request: Request): boolean {
  const expected = process.env.EMAIL_QUEUE_TOKEN;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const queued = (await listQueuedEmails()).filter((e) => e.status === "queued");
  return Response.json({ emails: queued }, { headers: noStore });
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { from?: string; id?: string };
  const email = body.id ? await getQueuedEmail(body.id) : null;
  if (!email) return Response.json({ error: "not found" }, { status: 404, headers: noStore });
  if (email.status !== "queued")
    return Response.json({ error: `already ${email.status}` }, { status: 409, headers: noStore });
  const sentAt = new Date().toISOString();
  await queueEmail({ ...email, sentAt, sentFrom: body.from?.slice(0, 200), status: "sent" });
  return Response.json({ ok: true, sentAt }, { headers: noStore });
}

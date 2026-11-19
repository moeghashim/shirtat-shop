import { deliverMetaEvent, evaluateStorefrontEvent, metaConfigured } from "@/lib/meta/server";

export async function POST(request: Request) {
  if (!metaConfigured()) return new Response(null, { status: 204 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }

  const decision = evaluateStorefrontEvent({
    cookieHeader: request.headers.get("cookie"),
    country: request.headers.get("x-vercel-ip-country"),
    forwardedFor: request.headers.get("x-forwarded-for"),
    json,
    realIp: request.headers.get("x-real-ip"),
    requestHost: request.headers.get("host"),
    userAgent: request.headers.get("user-agent"),
  });
  if (!decision.ok) {
    return decision.status === 400
      ? Response.json({ error: "Invalid event" }, { status: 400 })
      : new Response(null, { status: 204 });
  }

  const result = await deliverMetaEvent(decision.event, decision.user);
  return new Response(null, { status: result === "failed" ? 502 : 204 });
}

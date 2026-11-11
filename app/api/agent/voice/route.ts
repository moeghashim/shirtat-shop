import { checkBotId } from "botid/server";
import { connection } from "next/server";
import { z } from "zod";

import { voiceModeEnabled } from "@/lib/agent/voice";
import {
  allowVoiceTool,
  mintVoiceSession,
  runVoiceTool,
  sameOrigin,
  settleVoiceSession,
  voiceConfigured,
} from "@/lib/agent/voice/server";
import { shopConfig } from "@/lib/config";

const PRIVATE = { "cache-control": "private, no-store" };

const bodySchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("mint"),
    locale: z.enum(["ar", "en"]),
  }),
  z.strictObject({
    arguments: z.unknown().optional(),
    callId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
    kind: z.literal("tool"),
    locale: z.enum(["ar", "en"]),
    name: z.string().max(64),
  }),
  z.strictObject({
    assistant: z.string().max(8000).default(""),
    kind: z.literal("settle"),
    seconds: z.number().min(0).max(3600),
    sessionId: z.string().regex(/^voice_[A-Za-z0-9_-]{8,180}$/),
    shopper: z.string().max(8000).default(""),
  }),
]);

export async function GET() {
  await connection();
  return Response.json({ enabled: voiceModeEnabled() }, { headers: PRIVATE });
}

export async function POST(request: Request) {
  await connection();
  if (!voiceModeEnabled() || !shopConfig.agent.isEnabled)
    return Response.json(
      { code: "disabled", error: "Voice is off." },
      { headers: PRIVATE, status: 404 },
    );
  if (!sameOrigin(request))
    return Response.json(
      { code: "forbidden", error: "Voice is off." },
      { headers: PRIVATE, status: 403 },
    );
  if (shopConfig.botid.isEnabled) {
    const bot = await checkBotId({
      advancedOptions: {
        checkLevel: shopConfig.botid.checkLevel,
        headers: Object.fromEntries(request.headers.entries()),
      },
    });
    if (bot.isBot)
      return Response.json(
        { code: "forbidden", error: "Voice is off." },
        { headers: PRIVATE, status: 403 },
      );
  }
  const raw = await request.text();
  if (raw.length > 20_000)
    return Response.json(
      { code: "invalid", error: "Voice is unavailable." },
      { headers: PRIVATE, status: 413 },
    );
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json(
      { code: "invalid", error: "Voice is unavailable." },
      { headers: PRIVATE, status: 400 },
    );
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success)
    return Response.json(
      { code: "invalid", error: "Voice is unavailable." },
      { headers: PRIVATE, status: 400 },
    );
  const body = parsed.data;
  if (body.kind === "mint") {
    if (!voiceConfigured())
      return Response.json(
        { code: "unavailable", error: "Voice is unavailable." },
        { headers: PRIVATE, status: 503 },
      );
    const minted = await mintVoiceSession(request, body.locale);
    if (!minted.ok)
      return Response.json(
        { code: minted.code, error: "Voice is unavailable." },
        { headers: { ...PRIVATE, "retry-after": "60" }, status: 429 },
      );
    return Response.json(
      {
        expiresAt: minted.expiresAt,
        maxSeconds: minted.maxSeconds,
        model: minted.model,
        sessionId: minted.sessionId,
        value: minted.value,
      },
      { headers: PRIVATE },
    );
  }
  if (body.kind === "settle") {
    await settleVoiceSession(body.sessionId, body.seconds, {
      assistant: body.assistant,
      shopper: body.shopper,
    });
    return new Response(null, { headers: PRIVATE, status: 204 });
  }
  if (!(await allowVoiceTool(request)))
    return Response.json(
      { code: "rate_limited", error: "Voice is unavailable." },
      { headers: { ...PRIVATE, "retry-after": "60" }, status: 429 },
    );
  const result = await runVoiceTool(
    body.name,
    body.arguments ?? {},
    request,
    body.locale,
    body.callId,
  );
  return Response.json(result, { headers: PRIVATE });
}

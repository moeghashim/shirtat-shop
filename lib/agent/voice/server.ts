import { createHash, randomBytes } from "node:crypto";

import { get, put } from "@vercel/blob";

import {
  chatReviewCaptureEnabled,
  freezeTurn,
  redactReviewText,
  sealTurn,
} from "@/lib/chat-review";
import { saveFrozenTurn } from "@/lib/chat-review/store";

import {
  admitMint,
  emptyLedger,
  settleReservation,
  utcDay,
  voiceInstructions,
  voiceLimits,
  voiceModeEnabled,
  VOICE_NAME,
  VOICE_REALTIME_MODEL,
  VOICE_TRANSCRIPTION_MODEL,
  type VoiceLedger,
} from "./index";
import { realtimeTools } from "./schema";
import { executeVoiceTool } from "./tools";

const LEDGER_PATH = "voice-usage/ledger.json";

let ledger: VoiceLedger = emptyLedger(utcDay(Date.now()));
const mintHits = new Map<string, number[]>();
const toolHits = new Map<string, number[]>();
let queue: Promise<void> = Promise.resolve();

export function voiceConfigured(): boolean {
  return voiceModeEnabled() && Boolean(process.env.OPENAI_API_KEY);
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function mintVoiceSession(request: Request, locale: "ar" | "en") {
  const limits = voiceLimits();
  const caller = callerKey(request);
  const sessionId = `voice_${randomBytes(16).toString("base64url")}`;
  const admitted = await serialized(async () => {
    ledger = (await readBlobLedger()) ?? ledger;
    const hits = mintHits.get(caller) ?? [];
    const next = admitMint(ledger, hits, Date.now(), limits, sessionId);
    ledger = next.ledger;
    mintHits.set(caller, next.hits);
    if (next.result.ok) await persistLedger(ledger);
    return next.result;
  });
  if (!admitted.ok) return admitted;
  try {
    const secret = await createClientSecret(locale, caller);
    return {
      expiresAt: secret.expiresAt,
      maxSeconds: limits.maxSessionSeconds,
      model: VOICE_REALTIME_MODEL,
      ok: true as const,
      sessionId,
      value: secret.value,
    };
  } catch {
    await serialized(async () => {
      ledger = settleReservation((await readBlobLedger()) ?? ledger, sessionId, 0);
      await persistLedger(ledger);
    });
    return { code: "unavailable" as const, ok: false as const };
  }
}

export async function settleVoiceSession(
  sessionId: string,
  seconds: number,
  transcript: { assistant: string; shopper: string },
) {
  await serialized(async () => {
    ledger = settleReservation((await readBlobLedger()) ?? ledger, sessionId, seconds);
    await persistLedger(ledger);
  });
  // Voice turns are not Eve sessions, so the live reader cannot attach them.
  if (!chatReviewCaptureEnabled()) return;
  const turnId = `voice_${createHash("sha256").update(sessionId).digest("hex").slice(0, 16)}`;
  const sealed = sealTurn(turnId, {
    assistant: redactReviewText(transcript.assistant),
    modelId: VOICE_REALTIME_MODEL,
    shopper: redactReviewText(transcript.shopper),
  });
  if (!sealed) return;
  await saveFrozenTurn(freezeTurn(sessionId, sealed, new Date())).catch(() => undefined);
}

export async function allowVoiceTool(request: Request): Promise<boolean> {
  const limits = voiceLimits();
  const caller = callerKey(request);
  return serialized(() => {
    const next = allow(
      toolHits.get(caller) ?? [],
      Date.now(),
      limits.toolLimit,
      limits.toolWindowMs,
    );
    toolHits.set(caller, next.hits);
    return next.ok;
  });
}

export function runVoiceTool(
  name: string,
  value: unknown,
  request: Request,
  locale: "ar" | "en",
  callId: string,
) {
  return executeVoiceTool(name, value, request, locale, callId);
}

async function createClientSecret(locale: "ar" | "en", caller: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing key");
  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 60 },
      session: {
        audio: {
          input: {
            noise_reduction: { type: "near_field" },
            transcription: {
              delay: "minimal",
              language: locale,
              model: VOICE_TRANSCRIPTION_MODEL,
            },
            turn_detection: {
              create_response: true,
              eagerness: "high",
              interrupt_response: true,
              type: "semantic_vad",
            },
          },
          output: { voice: VOICE_NAME },
        },
        instructions: voiceInstructions(locale),
        model: VOICE_REALTIME_MODEL,
        output_modalities: ["audio"],
        reasoning: { effort: "low" },
        tool_choice: "auto",
        tools: realtimeTools(),
        type: "realtime",
      },
    }),
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "openai-safety-identifier": caller,
    },
    method: "POST",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Token mint failed");
  const data = (await response.json()) as {
    client_secret?: { value?: string };
    expires_at?: number;
    value?: string;
  };
  const value = typeof data.value === "string" ? data.value : data.client_secret?.value;
  if (!value || value === key) throw new Error("Token mint failed");
  return { expiresAt: data.expires_at ?? null, value };
}

function callerKey(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return createHash("sha256").update(`shirtat-voice:${ip}`).digest("hex").slice(0, 32);
}

function allow(hits: readonly number[], now: number, limit: number, windowMs: number) {
  const recent = hits.filter((at) => now - at < windowMs);
  if (recent.length >= limit) return { hits: recent, ok: false };
  return { hits: [...recent, now], ok: true };
}

function serialized<T>(fn: () => Promise<T> | T): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function persistLedger(next: VoiceLedger) {
  try {
    await put(LEDGER_PATH, JSON.stringify(next), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      contentType: "application/json",
    });
  } catch {
    // The in-memory ledger still caps this instance when Blob is unset.
  }
}

async function readBlobLedger(): Promise<VoiceLedger | null> {
  try {
    const result = await get(LEDGER_PATH, { access: "private", useCache: false });
    if (!result?.stream) return null;
    const parsed = JSON.parse(await new Response(result.stream).text()) as VoiceLedger;
    if (!parsed || parsed.day !== utcDay(Date.now())) return null;
    return parsed;
  } catch {
    return null;
  }
}

import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";

export const VOICE_NAME = "marin";
export const VOICE_REALTIME_MODEL = "gpt-realtime-2.1";
export const VOICE_TRANSCRIPTION_MODEL = "gpt-realtime-whisper";

const SPECULATIVE_PER_UTTERANCE = 4;
const WORD_GAP_MS = 200;

export interface VoiceLimits {
  dailyMinuteCap: number;
  dailySessionCap: number;
  maxSessionSeconds: number;
  mintLimit: number;
  mintWindowMs: number;
  toolLimit: number;
  toolWindowMs: number;
}

export interface VoiceReservation {
  reserved: number;
  settled: boolean;
}

export interface VoiceLedger {
  day: string;
  reservations: Record<string, VoiceReservation>;
  seconds: number;
  sessions: number;
}

export type VoiceAdmit =
  | { ok: true; reserved: number }
  | { code: "daily_cap" | "rate_limited"; ok: false };

export interface VoiceChoice {
  label: string;
  message: string;
}

export interface VoiceToolView {
  cart: boolean;
  choices: VoiceChoice[];
  chooser: string | null;
  products: Array<AgentProduct | AgentProductDetails>;
}

export interface LiveCardsPlan {
  inFlight: boolean;
  lastSent: string;
  pending: string;
  quietSince: number | null;
  sentThisUtterance: number;
}

const HANDLE = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function voiceModeEnabled(env?: { VOICE_MODE_ENABLED?: string }): boolean {
  const source = env ?? { VOICE_MODE_ENABLED: process.env.VOICE_MODE_ENABLED };
  return source.VOICE_MODE_ENABLED === "1";
}

export function voiceLimits(env: Record<string, string | undefined> = process.env): VoiceLimits {
  return {
    dailyMinuteCap: intEnv(env.VOICE_DAILY_MINUTE_CAP, 200, 1, 10_000),
    dailySessionCap: intEnv(env.VOICE_DAILY_SESSION_CAP, 40, 1, 1_000),
    maxSessionSeconds: intEnv(env.VOICE_SESSION_MAX_SECONDS, 300, 30, 600),
    mintLimit: intEnv(env.VOICE_MINT_LIMIT, 8, 1, 100),
    mintWindowMs: intEnv(env.VOICE_MINT_WINDOW_SECONDS, 600, 60, 3_600) * 1000,
    toolLimit: 90,
    toolWindowMs: 5 * 60 * 1000,
  };
}

export function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function emptyLedger(day: string): VoiceLedger {
  return { day, reservations: {}, seconds: 0, sessions: 0 };
}

export function pageLocale(pathname: string): "ar" | "en" {
  return pathname === "/ar" || pathname.startsWith("/ar/") ? "ar" : "en";
}

export function admitMint(
  ledger: VoiceLedger,
  hits: readonly number[],
  now: number,
  limits: VoiceLimits,
  sessionId: string,
): { hits: number[]; ledger: VoiceLedger; result: VoiceAdmit } {
  const day = utcDay(now);
  const current = ledger.day === day ? ledger : emptyLedger(day);
  const recent = hits.filter((at) => now - at < limits.mintWindowMs);
  if (recent.length >= limits.mintLimit)
    return { hits: recent, ledger: current, result: { code: "rate_limited", ok: false } };
  const reserved = limits.maxSessionSeconds;
  if (
    current.sessions >= limits.dailySessionCap ||
    current.seconds + reserved > limits.dailyMinuteCap * 60
  )
    return { hits: recent, ledger: current, result: { code: "daily_cap", ok: false } };
  return {
    hits: [...recent, now],
    ledger: {
      day,
      reservations: pruneReservations({
        ...current.reservations,
        [sessionId]: { reserved, settled: false },
      }),
      seconds: current.seconds + reserved,
      sessions: current.sessions + 1,
    },
    result: { ok: true, reserved },
  };
}

export function settleReservation(
  ledger: VoiceLedger,
  sessionId: string,
  seconds: number,
): VoiceLedger {
  const reservation = ledger.reservations[sessionId];
  if (!reservation || reservation.settled) return ledger;
  const used = Math.min(reservation.reserved, Math.max(0, Math.floor(seconds)));
  return {
    ...ledger,
    reservations: {
      ...ledger.reservations,
      [sessionId]: { reserved: reservation.reserved, settled: true },
    },
    seconds: Math.max(0, ledger.seconds - (reservation.reserved - used)),
  };
}

export function allowWindow(
  hits: readonly number[],
  now: number,
  limit: number,
  windowMs: number,
): { hits: number[]; ok: boolean } {
  const recent = hits.filter((at) => now - at < windowMs);
  if (recent.length >= limit) return { hits: recent, ok: false };
  return { hits: [...recent, now], ok: true };
}

export function emptyLiveCardsPlan(): LiveCardsPlan {
  return { inFlight: false, lastSent: "", pending: "", quietSince: null, sentThisUtterance: 0 };
}

export function noteShopperText(plan: LiveCardsPlan, text: string, now: number): LiveCardsPlan {
  if (text === plan.pending) return plan;
  return { ...plan, pending: text, quietSince: now };
}

export function tickLiveCards(
  plan: LiveCardsPlan,
  now: number,
): { plan: LiveCardsPlan; send: string | null } {
  if (
    plan.inFlight ||
    plan.quietSince == null ||
    now - plan.quietSince < WORD_GAP_MS ||
    plan.pending.trim() === plan.lastSent ||
    plan.sentThisUtterance >= SPECULATIVE_PER_UTTERANCE ||
    !transcriptCanSearch(plan.pending)
  )
    return { plan, send: null };
  const send = plan.pending.trim();
  return {
    plan: {
      ...plan,
      inFlight: true,
      lastSent: send,
      sentThisUtterance: plan.sentThisUtterance + 1,
    },
    send,
  };
}

export function finishLiveCards(plan: LiveCardsPlan): LiveCardsPlan {
  return { ...plan, inFlight: false };
}

export function resetLiveCardsUtterance(plan: LiveCardsPlan): LiveCardsPlan {
  return { ...plan, lastSent: "", sentThisUtterance: 0 };
}

export function transcriptCanSearch(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) return true;
  if ((trimmed.match(/[\u0600-\u06FF]/g)?.length ?? 0) >= 8) return true;
  return words.length === 1 && trimmed.length >= 4;
}

export function applyShopperDelta(current: string, delta: string): string {
  return current + delta;
}

export function applyShopperFinal(transcript: string): string {
  return transcript.trim();
}

export function voiceInstructions(locale: "ar" | "en", live = false): string {
  const language = locale === "ar" ? "Arabic" : "English";
  return `You are the voice shopping assistant for Shirtat. The shopper is speaking. Page language: ${language}. Speak that language unless they clearly use the other one. Arabic replies are spoken Arabic, not transliteration. Never use emojis. Keep each spoken reply to one or two short sentences. Do not read out a list of products, prices, or sizes; the screen shows the cards and the picker.
Call tools as soon as you hear a product, gift, style, color, size, collection, or price, even when the shopper is still mid-sentence. The screen updates from those calls. When they add a constraint, call the tool again so the cards change.
Search with search-catalog using their words. Then call present-products with the returned product ids. For a product they want to examine or buy, call get-product-details. For related pieces, call get-recommendations. For a collection handle from list-collections, call browse-collection. Offer at most three short taps with offer-choices when a choice would help.
Prices, stock, and ids come only from tool results. Never invent them. If search fails, say so and offer list-collections. Custom calligraphy products cannot be added here; send the shopper to the product page. Change the cart only when asked. Never ask for payment, card, or account details. Checkout is the cart button on screen. If a cart change is uncertain, call get-cart and ask them to look at the cart rather than retrying.
Commerce country is US. Do not pass a country, language, or cart id into tools.${
    live
      ? " The shopper is still speaking. The user message is a partial transcript. If it already names a product, gift, style, color, size, or collection, call the matching tool now. If the intent is not clear yet, call no tools and write nothing."
      : ""
  }`;
}

export function liveCardsRequest(transcript: string, locale: "ar" | "en") {
  return {
    response: {
      conversation: "none" as const,
      input: [
        {
          content: [{ text: transcript, type: "input_text" as const }],
          role: "user" as const,
          type: "message" as const,
        },
      ],
      instructions: voiceInstructions(locale, true),
      max_output_tokens: 400,
      metadata: { purpose: "live-cards" },
      output_modalities: ["text" as const],
      reasoning: { effort: "low" as const },
      tool_choice: "auto" as const,
    },
    type: "response.create" as const,
  };
}

export function voiceProgram(input: {
  cart: boolean;
  choices: readonly VoiceChoice[];
  chooser: string | null;
  handles: readonly string[];
}): string | null {
  const lines: string[] = [];
  const children: string[] = [];
  const handles = [...new Set(input.handles.filter((handle) => HANDLE.test(handle)))].slice(0, 12);
  if (handles.length) {
    lines.push(`cards = ProductCards(${JSON.stringify(handles)})`);
    children.push("cards");
  }
  if (input.chooser && HANDLE.test(input.chooser)) {
    lines.push(`pick = Chooser(${JSON.stringify(input.chooser)})`);
    children.push("pick");
  }
  if (input.cart) {
    lines.push("bag = Cart()");
    children.push("bag");
  }
  const choices = input.choices
    .filter((choice) => choice.label.trim() && choice.message.trim())
    .slice(0, 3);
  if (choices.length) {
    const options = choices
      .map(
        (choice) =>
          `{label: ${JSON.stringify(choice.label.trim())}, action: @ToAssistant(${JSON.stringify(choice.message.trim())})}`,
      )
      .join(", ");
    lines.push(`next = FollowUps([${options}])`);
    children.push("next");
  }
  if (!children.length) return null;
  lines.push(`root = Stack([${children.join(", ")}])`);
  return lines.join("\n");
}

export function isLiveCardsResponse(metadata: unknown): boolean {
  return (
    !!metadata &&
    typeof metadata === "object" &&
    "purpose" in metadata &&
    metadata.purpose === "live-cards"
  );
}

function intEnv(value: string | undefined, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function pruneReservations(
  reservations: Record<string, VoiceReservation>,
): Record<string, VoiceReservation> {
  const entries = Object.entries(reservations);
  if (entries.length <= 200) return reservations;
  const unsettled = entries.filter(([, reservation]) => !reservation.settled);
  const settled = entries.filter(([, reservation]) => reservation.settled).slice(-40);
  return Object.fromEntries([...unsettled, ...settled].slice(-200));
}

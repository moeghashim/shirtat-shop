import { z } from "zod";

import {
  type FrozenTurn,
  type ProjectedTurn,
  type TurnFeedback,
  chatReviewCaptureEnabled,
  freezeTurn,
  gradeChecks,
  isSessionId,
  isTurnId,
  isTurnVersion,
  parseChecks,
  sealTurn,
} from "@/lib/chat-review";
import { readLiveTurns } from "@/lib/chat-review/live";
import {
  type StoredPointer,
  deleteReviewSession,
  listPointers,
  readFeedback,
  readFrozenTurn,
  saveFeedback,
  saveFrozenTurn,
} from "@/lib/chat-review/store";

import type {
  AdminActionResult,
  ChatDetailView,
  ChatSessionSummary,
  ChatTurnView,
  ChatsView,
} from "./types";

/**
 * Owner-only shopping chat review, served to the admin app through the signed
 * /api/internal/admin routes. Same storage and rules as the former /admin/chats pages.
 */

function groupSessions(pointers: StoredPointer[]): ChatSessionSummary[] {
  const grouped = new Map<string, ChatSessionSummary>();
  for (const pointer of pointers) {
    const current = grouped.get(pointer.sessionId);
    if (current) {
      current.turns += 1;
      continue;
    }
    grouped.set(pointer.sessionId, {
      direction: pointer.direction,
      preview: pointer.preview,
      sessionId: pointer.sessionId,
      turns: 1,
    });
  }
  return [...grouped.values()];
}

export async function readChatsView(): Promise<ChatsView> {
  try {
    return {
      captureEnabled: chatReviewCaptureEnabled(),
      sessions: groupSessions(await listPointers()),
      storeError: false,
    };
  } catch {
    return { captureEnabled: chatReviewCaptureEnabled(), sessions: [], storeError: true };
  }
}

function mergeTurns(live: ProjectedTurn[], stored: FrozenTurn[]) {
  const liveIds = new Set(live.map((turn) => turn.turnId));
  const rows: { replaced: boolean; turn: ProjectedTurn }[] = [];
  for (const turn of live) {
    rows.push({ replaced: false, turn });
    for (const previous of stored) {
      if (previous.turnId === turn.turnId && previous.version !== turn.version) {
        rows.push({ replaced: true, turn: previous });
      }
    }
  }
  for (const turn of stored) {
    if (liveIds.has(turn.turnId)) continue;
    rows.push({ replaced: false, turn });
  }
  return rows;
}

function view(turn: ProjectedTurn, feedback: TurnFeedback | null, replaced = false): ChatTurnView {
  return {
    feedback,
    graded: feedback ? gradeChecks(turn.assistant, feedback.checks) : [],
    replaced,
    turn,
  };
}

/** Layout fixture: not a shopper transcript and nothing is stored. */
function sampleView(): ChatDetailView {
  const english = sealTurn("turn_en", {
    assistant: "The Ana Ibn Jala hoodie is $64.99.",
    modelId: "gpt-6-luna",
    shopper: "Which hoodie works as a gift?",
  });
  const arabic = sealTurn("turn_ar", {
    assistant: "تيشيرت تفكّر سعره 33.99 دولار.",
    modelId: "gpt-6-luna",
    shopper: "أريد هدية بخط عربي",
  });
  const turns: ChatTurnView[] = [];
  if (english) {
    turns.push(
      view(english, {
        checks: [
          { kind: "includes", text: "$64.99" },
          { kind: "excludes", text: "checkout" },
          { kind: "manual", text: "The reply names one product" },
        ],
        expected: "Name one gift and its price.",
        savedAt: "2026-11-06T00:00:00.000Z",
        sessionId: "sample-layout",
        turnId: english.turnId,
        turnVersion: english.version,
        verdict: "pass",
      }),
    );
  }
  if (arabic) turns.push(view(arabic, null));
  return {
    liveUnavailable: false,
    sample: true,
    sessionId: "sample-layout",
    storeError: false,
    turns,
  };
}

export async function readChatDetailView(
  sessionId: string,
  host: string,
  fixture: string | null,
): Promise<ChatDetailView | null> {
  if (fixture === "sample") return sampleView();
  if (!isSessionId(sessionId)) return null;
  const live = await readLiveTurns(sessionId, host);
  let stored: FrozenTurn[] = [];
  let feedback = new Map<string, TurnFeedback>();
  let storeError = false;
  try {
    const pointers = (await listPointers()).filter((pointer) => pointer.sessionId === sessionId);
    stored = (
      await Promise.all(
        pointers.map((pointer) => readFrozenTurn(sessionId, pointer.turnId, pointer.version)),
      )
    ).filter((turn): turn is FrozenTurn => turn !== null);
    const saved = await Promise.all(
      stored.map((turn) => readFeedback(sessionId, turn.turnId, turn.version)),
    );
    feedback = new Map(
      saved.flatMap((item) =>
        item ? [[`${item.turnId}:${item.turnVersion}`, item] as const] : [],
      ),
    );
  } catch {
    storeError = true;
  }
  return {
    liveUnavailable: live === null,
    sample: false,
    sessionId,
    storeError,
    turns: mergeTurns(live ?? [], stored).map((row) =>
      view(row.turn, feedback.get(`${row.turn.turnId}:${row.turn.version}`) ?? null, row.replaced),
    ),
  };
}

const feedbackSchema = z.strictObject({
  excludes: z.string().max(8000),
  expected: z.string().max(2000),
  includes: z.string().max(8000),
  manual: z.string().max(8000),
  sessionId: z.string(),
  turnId: z.string(),
  turnVersion: z.string(),
  verdict: z.enum(["fail", "pass", "ungraded"]),
});

export async function saveChatFeedback(form: FormData, host: string): Promise<AdminActionResult> {
  const parsed = feedbackSchema.safeParse({
    excludes: form.get("excludes"),
    expected: form.get("expected"),
    includes: form.get("includes"),
    manual: form.get("manual"),
    sessionId: form.get("sessionId"),
    turnId: form.get("turnId"),
    turnVersion: form.get("turnVersion"),
    verdict: form.get("verdict"),
  });
  if (!parsed.success) return { code: "invalid", ok: false };
  const input = parsed.data;
  if (!isSessionId(input.sessionId) || !isTurnId(input.turnId) || !isTurnVersion(input.turnVersion))
    return { code: "invalid", ok: false };
  const checks = parseChecks(input.includes, input.excludes, input.manual);
  if (!checks) return { code: "invalid", ok: false };
  const live = await readLiveTurns(input.sessionId, host);
  const liveTurn = live?.find((turn) => turn.turnId === input.turnId) ?? null;
  const stored = await readFrozenTurn(input.sessionId, input.turnId, input.turnVersion);
  const turn =
    liveTurn?.version === input.turnVersion
      ? freezeTurn(input.sessionId, liveTurn, new Date(stored?.capturedAt ?? Date.now()))
      : stored?.version === input.turnVersion
        ? stored
        : null;
  if (!turn) return { code: "mismatch", ok: false };
  await saveFrozenTurn(turn);
  await saveFeedback({
    checks,
    expected: input.expected.trim(),
    savedAt: new Date().toISOString(),
    sessionId: input.sessionId,
    turnId: input.turnId,
    turnVersion: turn.version,
    verdict: input.verdict,
  });
  return { code: "saved", ok: true };
}

export async function deleteChatSession(form: FormData): Promise<AdminActionResult> {
  const sessionId = form.get("sessionId");
  if (typeof sessionId !== "string" || !isSessionId(sessionId))
    return { code: "invalid", ok: false };
  await deleteReviewSession(sessionId);
  return { code: "deleted", ok: true };
}

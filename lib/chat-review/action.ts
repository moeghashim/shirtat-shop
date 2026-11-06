"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getSession } from "@/lib/creators/auth";

import {
  type TurnFeedback,
  freezeTurn,
  isSessionId,
  isTurnId,
  isTurnVersion,
  parseChecks,
  reviewAccess,
} from "./index";
import { readLiveTurns, reviewHost } from "./live";
import { deleteReviewSession, readFrozenTurn, saveFeedback, saveFrozenTurn } from "./store";

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

export async function saveReviewFeedbackAction(form: FormData): Promise<void> {
  const session = await getSession();
  if (!reviewAccess(session)) redirect("/creators/signin");
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
  if (!parsed.success) redirect("/admin/chats?error=invalid");
  const input = parsed.data;
  if (
    !isSessionId(input.sessionId) ||
    !isTurnId(input.turnId) ||
    !isTurnVersion(input.turnVersion)
  ) {
    redirect("/admin/chats?error=invalid");
  }
  const checks = parseChecks(input.includes, input.excludes, input.manual);
  if (!checks) redirect(reviewPath(input.sessionId, "invalid"));
  const live = await readLiveTurns(input.sessionId, await reviewHost());
  const liveTurn = live?.find((turn) => turn.turnId === input.turnId) ?? null;
  const stored = await readFrozenTurn(input.sessionId, input.turnId, input.turnVersion);
  const turn =
    liveTurn?.version === input.turnVersion
      ? freezeTurn(input.sessionId, liveTurn, new Date(stored?.capturedAt ?? Date.now()))
      : stored?.version === input.turnVersion
        ? stored
        : null;
  if (!turn) redirect(reviewPath(input.sessionId, "mismatch"));
  await saveFrozenTurn(turn);
  const feedback: TurnFeedback = {
    checks,
    expected: input.expected.trim(),
    savedAt: new Date().toISOString(),
    sessionId: input.sessionId,
    turnId: input.turnId,
    turnVersion: turn.version,
    verdict: input.verdict,
  };
  await saveFeedback(feedback);
  redirect(reviewPath(input.sessionId, "saved"));
}

export async function openReviewSessionAction(form: FormData): Promise<void> {
  const session = await getSession();
  if (!reviewAccess(session)) redirect("/creators/signin");
  const sessionId = form.get("sessionId");
  if (typeof sessionId !== "string" || !isSessionId(sessionId.trim()))
    redirect("/admin/chats?error=invalid");
  redirect(`/admin/chats/${sessionId.trim()}`);
}

export async function deleteReviewSessionAction(form: FormData): Promise<void> {
  const session = await getSession();
  if (!reviewAccess(session)) redirect("/creators/signin");
  const sessionId = form.get("sessionId");
  if (typeof sessionId !== "string" || !isSessionId(sessionId))
    redirect("/admin/chats?error=invalid");
  await deleteReviewSession(sessionId);
  redirect("/admin/chats?deleted=1");
}

function reviewPath(sessionId: string, code: string): string {
  return `/admin/chats/${sessionId}?${code === "saved" ? "saved=1" : `error=${code}`}`;
}

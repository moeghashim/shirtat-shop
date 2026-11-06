import { createHash } from "node:crypto";

import { ADMIN_EMAIL } from "../creators/terms";

export const REVIEW_RETAIN_MS = 30 * 24 * 60 * 60 * 1000;

const SESSION_ID = /^[A-Za-z0-9_-]{8,200}$/;
const TURN_ID = /^[A-Za-z0-9_.:-]{1,200}$/;
const VERSION = /^[a-f0-9]{64}$/;

export interface ReviewSession {
  email: string;
  isAdmin: boolean;
}

export interface TurnDraft {
  assistant: string;
  modelId: string | null;
  shopper: string;
}

export interface ProjectedTurn {
  assistant: string;
  direction: "ltr" | "rtl";
  modelId: string | null;
  shopper: string;
  turnId: string;
  version: string;
}

export interface FrozenTurn extends ProjectedTurn {
  capturedAt: string;
  retainUntil: string;
  sessionId: string;
}

export interface ReviewCheck {
  kind: "excludes" | "includes" | "manual";
  text: string;
}

export interface GradedCheck extends ReviewCheck {
  result: "fail" | "manual" | "pass";
}

export interface TurnFeedback {
  checks: ReviewCheck[];
  expected: string;
  savedAt: string;
  sessionId: string;
  turnId: string;
  turnVersion: string;
  verdict: "fail" | "pass" | "ungraded";
}

export interface ReviewStreamEvent {
  data?: {
    finishReason?: string;
    message?: string;
    modelId?: string;
    turnId?: string;
  };
  type: string;
}

export interface ReviewExport {
  assistant: string;
  checks: GradedCheck[];
  executable: "fail" | "none" | "pass";
  expected: string;
  judging: {
    executable: string;
    manual: string;
    modelJudge: string;
  };
  kind: "shirtat.chat-review.case";
  modelId: string | null;
  ownerVerdict: TurnFeedback["verdict"];
  sessionId: string;
  shopper: string;
  turnId: string;
  turnVersion: string;
  version: 1;
}

export function chatReviewCaptureEnabled(): boolean {
  return process.env.CHAT_REVIEW_CAPTURE === "1";
}

export function reviewAccess(session: ReviewSession | null): session is ReviewSession {
  return Boolean(session?.isAdmin && session.email.trim().toLowerCase() === ADMIN_EMAIL);
}

export function isSessionId(value: string): boolean {
  return SESSION_ID.test(value);
}

export function isTurnId(value: string): boolean {
  return TURN_ID.test(value);
}

export function isTurnVersion(value: string): boolean {
  return VERSION.test(value);
}

export function redactReviewText(input: string): string {
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\bgid:\/\/shopify\/[A-Za-z]+\/\d+\b/g, "[id]")
    .replace(/\b(?:bearer\s+)[A-Za-z0-9._~+/-]{8,}\b/gi, "[secret]")
    .replace(/\b(?:\d[ -]?){13,19}\b/g, "[number]")
    .replace(/\b\+?\d[\d().\s-]{7,}\d\b/g, "[phone]");
}

export function textDirection(text: string): "ltr" | "rtl" {
  const arabic = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  return arabic > latin ? "rtl" : "ltr";
}

export function emptyDraft(): TurnDraft {
  return { assistant: "", modelId: null, shopper: "" };
}

export function withShopper(draft: TurnDraft, message: string): TurnDraft {
  const text = redactReviewText(message).trim();
  if (!text) return draft;
  return { ...draft, shopper: draft.shopper ? `${draft.shopper}\n${text}` : text };
}

export function withAssistant(
  draft: TurnDraft,
  message: string,
  finishReason: string | undefined,
): TurnDraft {
  if (finishReason === "tool-calls") return draft;
  return { ...draft, assistant: redactReviewText(message).trim() };
}

export function withModel(draft: TurnDraft, modelId: string): TurnDraft {
  return modelId ? { ...draft, modelId } : draft;
}

export function turnVersion(turn: Pick<ProjectedTurn, "assistant" | "shopper" | "turnId">): string {
  return createHash("sha256")
    .update(JSON.stringify(["v1", turn.turnId, turn.shopper, turn.assistant]))
    .digest("hex");
}

export function projectTurns(events: readonly ReviewStreamEvent[]): ProjectedTurn[] {
  const drafts = new Map<string, TurnDraft>();
  const order: string[] = [];
  for (const event of events) {
    const turnId = event.data?.turnId;
    if (!turnId || !isTurnId(turnId)) continue;
    let draft = drafts.get(turnId);
    if (!draft) {
      draft = emptyDraft();
      drafts.set(turnId, draft);
      order.push(turnId);
    }
    if (event.type === "message.received" && event.data?.message)
      drafts.set(turnId, withShopper(draft, event.data.message));
    else if (event.type === "step.started" && event.data?.modelId)
      drafts.set(turnId, withModel(draft, event.data.modelId));
    else if (event.type === "message.completed" && event.data?.message)
      drafts.set(turnId, withAssistant(draft, event.data.message, event.data.finishReason));
  }
  return order.flatMap((turnId) => {
    const draft = drafts.get(turnId);
    if (!draft) return [];
    return sealTurn(turnId, draft) ?? [];
  });
}

export function sealTurn(turnId: string, draft: TurnDraft): ProjectedTurn | null {
  const shopper = draft.shopper.trim();
  const assistant = draft.assistant.trim();
  if (!shopper && !assistant) return null;
  const projected = {
    assistant,
    direction: textDirection(`${shopper}\n${assistant}`),
    modelId: draft.modelId,
    shopper,
    turnId,
  };
  return { ...projected, version: turnVersion(projected) };
}

export function freezeTurn(sessionId: string, turn: ProjectedTurn, now: Date): FrozenTurn {
  return {
    ...turn,
    capturedAt: now.toISOString(),
    retainUntil: new Date(now.getTime() + REVIEW_RETAIN_MS).toISOString(),
    sessionId,
  };
}

export function parseChecks(
  includes: string,
  excludes: string,
  manual: string,
): ReviewCheck[] | null {
  const checks = [
    ...lines(includes).map((text) => ({ kind: "includes" as const, text })),
    ...lines(excludes).map((text) => ({ kind: "excludes" as const, text })),
    ...lines(manual).map((text) => ({ kind: "manual" as const, text })),
  ];
  if (checks.length > 20 || checks.some((check) => check.text.length > 500)) return null;
  return checks;
}

export function gradeChecks(assistant: string, checks: readonly ReviewCheck[]): GradedCheck[] {
  return checks.map((check) => {
    if (check.kind === "manual") return { ...check, result: "manual" };
    const found = assistant.includes(check.text);
    const pass = check.kind === "includes" ? found : !found;
    return { ...check, result: pass ? "pass" : "fail" };
  });
}

export function executableVerdict(checks: readonly GradedCheck[]): ReviewExport["executable"] {
  const executable = checks.filter((check) => check.result !== "manual");
  if (!executable.length) return "none";
  return executable.every((check) => check.result === "pass") ? "pass" : "fail";
}

export function buildExport(turn: FrozenTurn, feedback: TurnFeedback): ReviewExport | null {
  if (
    feedback.sessionId !== turn.sessionId ||
    feedback.turnId !== turn.turnId ||
    feedback.turnVersion !== turn.version
  )
    return null;
  const checks = gradeChecks(turn.assistant, feedback.checks);
  return {
    assistant: turn.assistant,
    checks,
    executable: executableVerdict(checks),
    expected: feedback.expected,
    judging: {
      executable:
        "The includes and excludes checks compare this frozen assistant text. They do not call a model.",
      manual: "Manual lines are a rubric for a person. This file does not grade them.",
      modelJudge: "This export does not run an LLM judge and does not train a model.",
    },
    kind: "shirtat.chat-review.case",
    modelId: turn.modelId,
    ownerVerdict: feedback.verdict,
    sessionId: turn.sessionId,
    shopper: turn.shopper,
    turnId: turn.turnId,
    turnVersion: turn.version,
    version: 1,
  };
}

const PRIVATE = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };

export function reviewExportResponse(
  session: ReviewSession | null,
  loaded: { feedback: TurnFeedback; turn: FrozenTurn } | null,
): Response {
  const body =
    session && reviewAccess(session) && loaded ? buildExport(loaded.turn, loaded.feedback) : null;
  if (!body) return new Response(null, { headers: PRIVATE, status: 404 });
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      ...PRIVATE,
      "content-disposition": `attachment; filename="chat-review-${body.turnId}.json"`,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

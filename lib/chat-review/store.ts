import { del, get, list, put } from "@vercel/blob";

import {
  type FrozenTurn,
  type TurnDraft,
  type TurnFeedback,
  isSessionId,
  isTurnId,
  isTurnVersion,
} from "./index";

const ACCESS = "private" as const;

export interface StoredPointer {
  capturedAt: string;
  direction: FrozenTurn["direction"];
  preview: string;
  retainUntil: string;
  sessionId: string;
  turnId: string;
  version: string;
}

function pointerPath(sessionId: string, turnId: string, version: string): string {
  return `chat-review/pointers/${sessionId}/${turnId}/${version}.json`;
}

function turnPath(sessionId: string, turnId: string, version: string): string {
  return `chat-review/turns/${sessionId}/${turnId}/${version}.json`;
}

function feedbackPath(sessionId: string, turnId: string, version: string): string {
  return `chat-review/feedback/${sessionId}/${turnId}/${version}.json`;
}

function draftPath(sessionId: string, turnId: string): string {
  return `chat-review/drafts/${sessionId}/${turnId}.json`;
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: ACCESS, useCache: false });
  if (!result?.stream) return null;
  return JSON.parse(await new Response(result.stream).text()) as T;
}

async function writeJson(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType: "application/json",
  });
}

async function pathnames(prefix: string): Promise<string[]> {
  const paths: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000, prefix });
    paths.push(...page.blobs.map((blob) => blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return paths;
}

export async function readDraft(sessionId: string, turnId: string): Promise<TurnDraft | null> {
  if (!isSessionId(sessionId) || !isTurnId(turnId)) return null;
  return readJson<TurnDraft>(draftPath(sessionId, turnId));
}

export async function writeDraft(
  sessionId: string,
  turnId: string,
  draft: TurnDraft,
): Promise<void> {
  if (!isSessionId(sessionId) || !isTurnId(turnId)) return;
  await writeJson(draftPath(sessionId, turnId), draft);
}

export async function saveFrozenTurn(turn: FrozenTurn): Promise<void> {
  if (!isSessionId(turn.sessionId) || !isTurnId(turn.turnId) || !isTurnVersion(turn.version))
    return;
  const pointer: StoredPointer = {
    capturedAt: turn.capturedAt,
    direction: turn.direction,
    preview: (turn.shopper || turn.assistant).slice(0, 80),
    retainUntil: turn.retainUntil,
    sessionId: turn.sessionId,
    turnId: turn.turnId,
    version: turn.version,
  };
  await writeJson(turnPath(turn.sessionId, turn.turnId, turn.version), turn);
  await writeJson(pointerPath(turn.sessionId, turn.turnId, turn.version), pointer);
  await del(draftPath(turn.sessionId, turn.turnId)).catch(() => undefined);
}

export async function readFrozenTurn(
  sessionId: string,
  turnId: string,
  version: string,
): Promise<FrozenTurn | null> {
  if (!isSessionId(sessionId) || !isTurnId(turnId) || !isTurnVersion(version)) return null;
  return readJson<FrozenTurn>(turnPath(sessionId, turnId, version));
}

export async function saveFeedback(feedback: TurnFeedback): Promise<void> {
  if (
    !isSessionId(feedback.sessionId) ||
    !isTurnId(feedback.turnId) ||
    !isTurnVersion(feedback.turnVersion)
  )
    return;
  await writeJson(
    feedbackPath(feedback.sessionId, feedback.turnId, feedback.turnVersion),
    feedback,
  );
}

export async function readFeedback(
  sessionId: string,
  turnId: string,
  version: string,
): Promise<TurnFeedback | null> {
  if (!isSessionId(sessionId) || !isTurnId(turnId) || !isTurnVersion(version)) return null;
  return readJson<TurnFeedback>(feedbackPath(sessionId, turnId, version));
}

export async function listPointers(): Promise<StoredPointer[]> {
  const now = Date.now();
  const paths = await pathnames("chat-review/pointers/");
  const pointers: StoredPointer[] = [];
  const expired: string[] = [];
  for (const pathname of paths) {
    const pointer = await readJson<StoredPointer>(pathname);
    if (!pointer) continue;
    if (Date.parse(pointer.retainUntil) <= now) {
      expired.push(
        pathname,
        turnPath(pointer.sessionId, pointer.turnId, pointer.version),
        feedbackPath(pointer.sessionId, pointer.turnId, pointer.version),
      );
      continue;
    }
    pointers.push(pointer);
  }
  if (expired.length) await del(expired);
  return pointers.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export async function deleteReviewSession(sessionId: string): Promise<void> {
  if (!isSessionId(sessionId)) return;
  const paths = (
    await Promise.all([
      pathnames(`chat-review/pointers/${sessionId}/`),
      pathnames(`chat-review/turns/${sessionId}/`),
      pathnames(`chat-review/feedback/${sessionId}/`),
      pathnames(`chat-review/drafts/${sessionId}/`),
    ])
  ).flat();
  if (paths.length) await del(paths);
}

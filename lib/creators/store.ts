import { createHash, randomUUID } from "node:crypto";

import { del, get, list, put } from "@vercel/blob";

import type { CreatorRecord, UserRecord } from "./types";

const ACCESS = "private" as const;

function emailKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: ACCESS, useCache: false });
  if (!result || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as T;
}

async function writeJson(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export function newId(): string {
  return randomUUID();
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  return readJson<UserRecord>(`users/${emailKey(email)}.json`);
}

export async function saveUser(user: UserRecord): Promise<void> {
  await writeJson(`users/${emailKey(user.email)}.json`, user);
}

export async function getCreator(id: string): Promise<CreatorRecord | null> {
  return readJson<CreatorRecord>(`creators/${id}.json`);
}

export async function saveCreator(creator: CreatorRecord): Promise<void> {
  await writeJson(`creators/${creator.id}.json`, {
    ...creator,
    updatedAt: new Date().toISOString(),
  });
}

export async function listCreators(): Promise<CreatorRecord[]> {
  const out: CreatorRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "creators/", cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const record = await readJson<CreatorRecord>(blob.pathname);
      if (record) out.push(record);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function uploadDesignFile(
  creatorId: string,
  file: File,
): Promise<{ contentType: string; name: string; pathname: string; size: number }> {
  const safe = file.name.replace(/[^\w.-]+/g, "_").slice(-80) || "design";
  const pathname = `uploads/${creatorId}/${Date.now()}-${safe}`;
  const blob = await put(pathname, file, {
    access: ACCESS,
    addRandomSuffix: true,
    contentType: file.type,
  });
  return { contentType: file.type, name: file.name, pathname: blob.pathname, size: file.size };
}

export async function readUpload(pathname: string) {
  return get(pathname, { access: ACCESS });
}

/** Deletes a user, their creator record and uploads (used for test cleanup and account removal). */
export async function deleteCreatorAndUser(creator: CreatorRecord): Promise<void> {
  const uploads = await list({ prefix: `uploads/${creator.id}/` });
  const paths = [
    `creators/${creator.id}.json`,
    `users/${emailKey(creator.email)}.json`,
    ...uploads.blobs.map((b) => b.pathname),
  ];
  await del(paths);
}

export interface QueuedEmail {
  createdAt: string;
  creatorId: string;
  html: string;
  id: string;
  sentAt?: string;
  sentFrom?: string;
  status: "queued" | "sent" | "cancelled";
  subject: string;
  text: string;
  to: string;
}

/** Outgoing emails waiting to be sent from the Grok Bot inbox by a routine (no SMTP/API available). */
export async function queueEmail(email: QueuedEmail): Promise<void> {
  await writeJson(`email-queue/${email.id}.json`, email);
}

export async function getQueuedEmail(id: string): Promise<QueuedEmail | null> {
  return readJson<QueuedEmail>(`email-queue/${id}.json`);
}

export async function listQueuedEmails(): Promise<QueuedEmail[]> {
  const out: QueuedEmail[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "email-queue/", cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const record = await readJson<QueuedEmail>(blob.pathname);
      if (record) out.push(record);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Cancels any still-queued emails for a creator (on resend or deletion). */
export async function cancelQueuedEmails(creatorId: string): Promise<void> {
  for (const e of await listQueuedEmails()) {
    if (e.creatorId === creatorId && e.status === "queued")
      await queueEmail({ ...e, status: "cancelled" });
  }
}

export async function deleteQueuedEmails(creatorId: string): Promise<void> {
  const ids = (await listQueuedEmails())
    .filter((e) => e.creatorId === creatorId)
    .map((e) => `email-queue/${e.id}.json`);
  if (ids.length) await del(ids);
}

export interface ResetToken {
  email: string;
  expiresAt: string;
  uid: string;
}

function tokenKey(raw: string): string {
  return `resets/${createHash("sha256").update(raw).digest("hex")}.json`;
}

export async function saveResetToken(raw: string, token: ResetToken): Promise<void> {
  await writeJson(tokenKey(raw), token);
}

/** Returns and deletes (single use) a valid reset token. */
export async function consumeResetToken(raw: string): Promise<ResetToken | null> {
  const key = tokenKey(raw);
  const token = await readJson<ResetToken>(key).catch(() => null);
  if (!token) return null;
  await del(key);
  return new Date(token.expiresAt).getTime() > Date.now() ? token : null;
}

export async function peekResetToken(raw: string): Promise<ResetToken | null> {
  const token = await readJson<ResetToken>(tokenKey(raw)).catch(() => null);
  return token && new Date(token.expiresAt).getTime() > Date.now() ? token : null;
}

/** Admin password set through reset/change; overrides ADMIN_PASSWORD_HASH when present. */
export async function getAdminPasswordHash(): Promise<string | null> {
  return (await readJson<{ hash: string }>("admin/password.json").catch(() => null))?.hash ?? null;
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  await writeJson("admin/password.json", { hash, updatedAt: new Date().toISOString() });
}

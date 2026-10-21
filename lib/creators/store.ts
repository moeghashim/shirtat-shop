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

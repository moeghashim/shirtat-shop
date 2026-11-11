import { sql } from "drizzle-orm";

import { selectSource } from "../data/source-config.ts";
import { getDatabase } from "../db/client.server.ts";
import type { RuntimeEnvironment } from "./config.server.ts";
import { AssistantError } from "./errors.ts";

export function createMemoryLimiter(capacity = 10000) {
  const buckets = new Map<string, { count: number; expires: number }>();
  return (key: string, limit: number, now: number, expires: number) => {
    for (const [id, value] of buckets) if (value.expires <= now) buckets.delete(id);
    const bucket = buckets.get(key);
    if (!bucket && buckets.size >= capacity) return false;
    if ((bucket?.count ?? 0) >= limit) return false;
    buckets.set(key, { count: (bucket?.count ?? 0) + 1, expires });
    return true;
  };
}
const memory = createMemoryLimiter();
export function trustedIP(request: Request, worker: boolean) {
  const value = worker ? request.headers.get("cf-connecting-ip") : null;
  // One Cloudflare-supplied address only. No forwarded chains, arbitrary identifiers or Node header trust.
  if (!value || value.length > 45) return "unknown";
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) && value.split(".").every((part) => Number(part) <= 255)) return value;
  try {
    if (/^[a-fA-F0-9:]+$/.test(value) && value.includes(":")) return new URL(`http://[${value}]`).hostname;
  } catch {
    /* Malformed addresses share the conservative bucket. */
  }
  return "unknown";
}
export async function limiterKey(kind: string, identity: string, window: number) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${kind}:${identity}`));
  return `assistant:v1:${window}:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
export async function admit(env: RuntimeEnvironment, ip: string, userId?: string, now = Date.now()) {
  const window = Math.floor(now / 60000);
  const expires = (window + 1) * 60000;
  const retry = Math.max(1, Math.ceil((expires - now) / 1000));
  const checks: [string, string, number][] = userId
    ? [
        ["user", userId, 10],
        ["ip", ip, 30],
      ]
    : [["ip", ip, 10]];
  try {
    const database = selectSource(env) === "db" ? getDatabase() : undefined;
    if (database)
      await database.execute(
        sql`delete from auth_rate_limit where key like 'assistant:v1:%' and last_request < ${window * 60000}`,
      );
    for (const [kind, identity, limit] of checks) {
      const key = await limiterKey(kind, identity, window);
      const accepted = database
        ? (
            await database.execute(sql`
        insert into auth_rate_limit (id, key, count, last_request) values (${crypto.randomUUID()}, ${key}, 1, ${now})
        on conflict (key) do update set count = auth_rate_limit.count + 1, last_request = ${now}
        where auth_rate_limit.count < ${limit} returning count
      `)
          ).length > 0
        : memory(key, limit, now, expires);
      if (!accepted) throw new AssistantError("rate", 429, retry);
    }
  } catch (error) {
    throw error instanceof AssistantError ? error : new AssistantError("unavailable");
  }
}

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Request signing between the Shirtat admin app (admin.shirtat.co) and the storefront's
 * owner-only API under /api/internal/admin. Both apps import this file, so the format has
 * one definition. The admin app signs only after its better-auth owner check passes; the
 * storefront rejects anything without a fresh, valid signature.
 */

export const ADMIN_API_PREFIX = "/api/internal/admin";
export const ADMIN_API_SECRET_ENV = "SHIRTAT_ADMIN_API_SECRET";
export const ADMIN_API_MAX_SKEW_SECONDS = 300;

export const ADMIN_API_HEADERS = {
  actor: "x-shirtat-admin-actor",
  signature: "x-shirtat-admin-signature",
  timestamp: "x-shirtat-admin-timestamp",
} as const;

const EMAIL = /^[^\s@]{1,100}@[^\s@]{1,150}\.[^\s@]{2,40}$/;
const MIN_SECRET_LENGTH = 32;

export interface SignInput {
  actor: string;
  body?: Uint8Array | null;
  method: string;
  /** Path and query exactly as requested, e.g. /api/internal/admin/file?p=uploads%2Fa.png */
  path: string;
  secret: string;
  timestamp: number;
}

export function usableSecret(secret: string | undefined): secret is string {
  return (
    typeof secret === "string" && secret.trim() === secret && secret.length >= MIN_SECRET_LENGTH
  );
}

function bodyHash(body: Uint8Array | null | undefined): string {
  return createHash("sha256")
    .update(body ?? new Uint8Array())
    .digest("hex");
}

function canonical(input: Omit<SignInput, "secret">): string {
  return [
    "shirtat-admin-v1",
    String(input.timestamp),
    input.method.toUpperCase(),
    input.path,
    input.actor.toLowerCase(),
    bodyHash(input.body),
  ].join("\n");
}

export function signAdminRequest(input: SignInput): Record<string, string> {
  if (!usableSecret(input.secret)) throw new Error(`${ADMIN_API_SECRET_ENV} is not configured`);
  if (!EMAIL.test(input.actor)) throw new Error("A signed admin request needs the owner's email");
  const signature = createHmac("sha256", input.secret).update(canonical(input)).digest("base64url");
  return {
    [ADMIN_API_HEADERS.actor]: input.actor.toLowerCase(),
    [ADMIN_API_HEADERS.signature]: signature,
    [ADMIN_API_HEADERS.timestamp]: String(input.timestamp),
  };
}

export type VerifyResult = { actor: string; ok: true } | { ok: false; reason: string };

export function verifyAdminRequest(input: {
  body?: Uint8Array | null;
  headers: Headers;
  method: string;
  now: number;
  path: string;
  secret: string | undefined;
}): VerifyResult {
  if (!usableSecret(input.secret)) return { ok: false, reason: "not_configured" };
  const actor = input.headers.get(ADMIN_API_HEADERS.actor)?.trim().toLowerCase() ?? "";
  const given = input.headers.get(ADMIN_API_HEADERS.signature) ?? "";
  const stamp = input.headers.get(ADMIN_API_HEADERS.timestamp) ?? "";
  if (!EMAIL.test(actor) || !given || !/^\d{9,12}$/.test(stamp))
    return { ok: false, reason: "missing" };
  const timestamp = Number(stamp);
  if (Math.abs(input.now - timestamp) > ADMIN_API_MAX_SKEW_SECONDS)
    return { ok: false, reason: "stale" };
  const expected = Buffer.from(
    createHmac("sha256", input.secret)
      .update(
        canonical({ actor, body: input.body, method: input.method, path: input.path, timestamp }),
      )
      .digest("base64url"),
  );
  const actual = Buffer.from(given);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, reason: "signature" };
  }
  return { actor, ok: true };
}

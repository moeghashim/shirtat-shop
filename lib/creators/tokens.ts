import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { CreatorRecord } from "./types";

const DETAILS_TTL_DAYS = 14;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return value;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://shirtat.co";
}

/** Issues a new single-use details token (stored hashed) and returns the full link. */
export function issueDetailsToken(creator: CreatorRecord): string {
  const raw = randomBytes(24).toString("base64url");
  creator.detailsToken = {
    expiresAt: new Date(Date.now() + DETAILS_TTL_DAYS * 86400000).toISOString(),
    hash: createHash("sha256").update(raw).digest("hex"),
  };
  const prefix = creator.locale === "ar" ? "/ar" : "";
  return `${siteUrl()}${prefix}/creators/details?t=${encodeURIComponent(`${creator.id}.${raw}`)}`;
}

export function parseDetailsToken(token: string): { id: string; raw: string } | null {
  const i = token.indexOf(".");
  if (i < 1) return null;
  return { id: token.slice(0, i), raw: token.slice(i + 1) };
}

export function checkDetailsToken(creator: CreatorRecord, raw: string): boolean {
  const t = creator.detailsToken;
  if (!t || new Date(t.expiresAt).getTime() < Date.now()) return false;
  const a = Buffer.from(createHash("sha256").update(raw).digest("hex"));
  const b = Buffer.from(t.hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Short-lived signed URL so Shopify can fetch a private design file when creating the draft product. */
export function signedAssetUrl(pathname: string, ttlSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = createHmac("sha256", secret()).update(`${pathname}:${exp}`).digest("base64url");
  return `${siteUrl()}/api/creators/asset?p=${encodeURIComponent(pathname)}&exp=${exp}&sig=${sig}`;
}

export function verifyAssetSignature(pathname: string, exp: string, sig: string): boolean {
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  const expected = Buffer.from(
    createHmac("sha256", secret()).update(`${pathname}:${exp}`).digest("base64url"),
  );
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

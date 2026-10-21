import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { cookies } from "next/headers";

import { getAdminPasswordHash, getUserByEmail } from "./store";
import { ADMIN_EMAIL } from "./terms";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const COOKIE = "shirtat_session";
const MAX_AGE = 60 * 60 * 24 * 14;

export interface Session {
  email: string;
  isAdmin: boolean;
  uid: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64url"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET is not configured");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function createSession(session: Session): Promise<void> {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + MAX_AGE }),
  ).toString("base64url");
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    maxAge: MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session & {
      exp: number;
    };
    if (data.exp < Date.now() / 1000) return null;
    return { email: data.email, isAdmin: data.isAdmin, uid: data.uid };
  } catch {
    return null;
  }
}

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

/** Checks credentials. The admin signs in with ADMIN_PASSWORD_HASH (env) and can never be registered publicly. */
export async function authenticate(email: string, password: string): Promise<Session | null> {
  const normalized = email.trim().toLowerCase();
  if (isAdminEmail(normalized)) {
    const hash = (await getAdminPasswordHash()) ?? process.env.ADMIN_PASSWORD_HASH;
    if (hash && (await verifyPassword(password, hash))) {
      return { email: normalized, isAdmin: true, uid: "admin" };
    }
    return null;
  }
  const user = await getUserByEmail(normalized);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  return { email: user.email, isAdmin: false, uid: user.id };
}

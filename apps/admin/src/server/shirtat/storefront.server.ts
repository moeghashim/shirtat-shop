import {
  ADMIN_API_PREFIX,
  ADMIN_API_SECRET_ENV,
  signAdminRequest,
  usableSecret,
} from "../../../../../lib/admin-api/signature.ts";
import { isOwner, OWNER_EMAIL } from "../../lib/auth/roles.ts";
import { readAuthState } from "../../lib/auth/session.server.ts";
import { runtimeEnvironment } from "../runtime.server.ts";

/**
 * The storefront (shirtat.co) keeps the designer, Shopify, email and chat data and its secrets.
 * This app reaches it only through the signed owner API at /api/internal/admin, after the
 * better-auth owner check below. SHIRTAT_ADMIN_API_SECRET is the one secret both apps share.
 */

export class StorefrontUnavailableError extends Error {}

type Env = Record<string, string | undefined>;

function env(): Env {
  return runtimeEnvironment() as unknown as Env;
}

export function storefrontOrigin(): string {
  const value = env().SHIRTAT_STOREFRONT_URL?.trim();
  if (value) {
    try {
      const url = new URL(value);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) return url.origin;
    } catch {
      // use the production storefront
    }
  }
  return "https://shirtat.co";
}

/** Throws unless the signed-in user is an owner. Local demo mode (no database) acts as the owner. */
export async function requireOwnerActor(): Promise<string> {
  const auth = await readAuthState();
  if (auth.mode === "demo") {
    if (env().VERCEL) throw new Error("The owner admin needs sign-in on deployed environments.");
    return OWNER_EMAIL;
  }
  if (!auth.user || !isOwner(auth.user)) throw new Error("Only the owner can use this page.");
  return auth.user.email;
}

export interface StorefrontCall {
  /** Path below /api/internal/admin, with any query string, e.g. "/designers" or "/file?p=…". */
  path: string;
  method?: "GET" | "POST";
  form?: FormData;
}

/** Owner-checked, signed request to the storefront's admin API. */
export async function storefrontRequest(call: StorefrontCall): Promise<Response> {
  const actor = await requireOwnerActor();
  const secret = env()[ADMIN_API_SECRET_ENV];
  if (!usableSecret(secret)) throw new StorefrontUnavailableError(`${ADMIN_API_SECRET_ENV} is not set on this app.`);
  const method = call.method ?? "GET";
  const path = `${ADMIN_API_PREFIX}${call.path}`;
  let body: Uint8Array<ArrayBuffer> | undefined;
  const headers: Record<string, string> = { accept: "application/json" };
  if (call.form) {
    const encoded = new Request("http://form.local/", { body: call.form, method: "POST" });
    body = new Uint8Array(await encoded.arrayBuffer());
    headers["content-type"] = encoded.headers.get("content-type") ?? "multipart/form-data";
  }
  Object.assign(
    headers,
    signAdminRequest({ actor, body, method, path, secret, timestamp: Math.floor(Date.now() / 1000) }),
  );
  let response: Response;
  try {
    response = await fetch(`${storefrontOrigin()}${path}`, {
      body,
      cache: "no-store",
      headers,
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(method === "POST" ? 280_000 : 60_000),
    });
  } catch {
    throw new StorefrontUnavailableError("The storefront did not answer.");
  }
  if (response.status === 404 && !call.path.startsWith("/file") && !call.path.startsWith("/chat-export"))
    throw new StorefrontUnavailableError(
      "The storefront refused the request. Check that SHIRTAT_ADMIN_API_SECRET matches on both projects.",
    );
  return response;
}

/** JSON read or write; a non-JSON answer becomes a visible error instead of empty data. */
export async function storefrontJson<T>(call: StorefrontCall): Promise<T> {
  const response = await storefrontRequest(call);
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json"))
    throw new StorefrontUnavailableError(`The storefront answered ${response.status} without data.`);
  return (await response.json()) as T;
}

import { ADMIN_API_SECRET_ENV, verifyAdminRequest } from "./signature";

export const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex",
} as const;

export interface AdminRequest {
  actor: string;
  body: Uint8Array<ArrayBuffer>;
  url: URL;
}

/** Same 404 for unsigned, stale and misconfigured requests, so the routes do not advertise themselves. */
export function notFound(): Response {
  return new Response(null, { headers: PRIVATE_HEADERS, status: 404 });
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { headers: PRIVATE_HEADERS, status });
}

/**
 * Accepts only requests the admin app signed with SHIRTAT_ADMIN_API_SECRET after its own
 * better-auth owner check. Returns null when the request must be rejected.
 */
export async function authorizeAdminRequest(request: Request): Promise<AdminRequest | null> {
  const url = new URL(request.url);
  const body = new Uint8Array(await request.arrayBuffer());
  const result = verifyAdminRequest({
    body,
    headers: request.headers,
    method: request.method,
    now: Math.floor(Date.now() / 1000),
    path: `${url.pathname}${url.search}`,
    secret: process.env[ADMIN_API_SECRET_ENV],
  });
  if (!result.ok) {
    console.warn(`[admin-api] rejected ${request.method} ${url.pathname}: ${result.reason}`);
    return null;
  }
  return { actor: result.actor, body, url };
}

/** Rebuilds the signed multipart or urlencoded body as FormData. */
export async function formOf(
  request: Request,
  body: Uint8Array<ArrayBuffer>,
): Promise<FormData | null> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^(multipart\/form-data|application\/x-www-form-urlencoded)/i.test(type)) return null;
  try {
    return await new Response(body, { headers: { "content-type": type } }).formData();
  } catch {
    return null;
  }
}

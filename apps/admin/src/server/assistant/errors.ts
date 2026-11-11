export type ErrorCode =
  | "invalid"
  | "configuration"
  | "unauthorized"
  | "origin"
  | "rate"
  | "unavailable"
  | "timeout"
  | "limit"
  | "provider"
  | "refused";
export class AssistantError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly retryAfter?: number;
  constructor(code: ErrorCode, status = 503, retryAfter?: number) {
    super(
      code === "configuration"
        ? "Assistant configuration is invalid. Check server settings."
        : "Assistant request could not be completed.",
    );
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
export const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export function errorResponse(error: unknown) {
  const safe = error instanceof AssistantError ? error : new AssistantError("unavailable");
  return Response.json(
    { error: safe.code },
    {
      status: safe.status,
      headers: {
        ...privateHeaders,
        ...(safe.retryAfter ? { "Retry-After": String(safe.retryAfter) } : {}),
      },
    },
  );
}

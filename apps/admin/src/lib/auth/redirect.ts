import { APP_LANDING_ROUTE } from "../../navigation/landing.ts";

export const DEFAULT_AUTH_DESTINATION = APP_LANDING_ROUTE;

/** A navigation destination, never a URL nested inside a query value. */
export function authDestination(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  )
    return DEFAULT_AUTH_DESTINATION;
  const pathname = value.split(/[?#]/, 1)[0];
  // Reject encoded separators, controls and double-encoding in the navigation path.
  if (/%(?:2f|5c|25|0[0-9a-f]|1[0-9a-f]|7f)/i.test(pathname)) return DEFAULT_AUTH_DESTINATION;
  try {
    const decoded = decodeURIComponent(pathname);
    const url = new URL(value, "https://tenboards.invalid");
    if (
      url.origin !== "https://tenboards.invalid" ||
      url.pathname !== pathname ||
      /^\/(?:auth|api)(?:\/|$)/i.test(decoded)
    )
      return DEFAULT_AUTH_DESTINATION;
    return value;
  } catch {
    return DEFAULT_AUTH_DESTINATION;
  }
}
export function authSearch(search: Record<string, unknown>): { redirect?: string; error?: string } {
  return {
    ...(typeof search.redirect === "string" ? { redirect: authDestination(search.redirect) } : {}),
    ...(search.error ? { error: "oauth" } : {}),
  };
}
export function authErrorCallback(value: unknown, destination: string) {
  const path = typeof value === "string" ? value.split("?", 1)[0] : "";
  const safePath = /^\/auth\/v2\/(login|register)$/.test(path) ? path : "/auth/v2/login";
  return `${safePath}?${new URLSearchParams({ redirect: authDestination(destination), error: "oauth" })}`;
}

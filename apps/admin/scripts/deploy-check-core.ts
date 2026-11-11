import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

export function deploymentOrigin(value: string) {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new Error("Provide an HTTP(S) origin without credentials, path, query or fragment.");
  }
}
export async function checkDeployment(
  target: string,
  options: {
    demo?: boolean;
    authRoundtrip?: boolean;
    timeoutMs?: number;
    report?: (message: string) => void;
  } = {},
) {
  const origin = deploymentOrigin(target);
  const report = options.report ?? console.log;
  const timeoutMs = options.timeoutMs ?? 8000;
  if (options.demo && options.authRoundtrip) throw new Error("Demo checks cannot create accounts.");
  if (
    options.authRoundtrip &&
    !origin.startsWith("https:") &&
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname)
  )
    throw new Error("Credential checks require HTTPS or explicit loopback development.");
  const cookies = new Map<string, string>();
  async function send(route: string, body?: unknown): Promise<Response> {
    const url = new URL(route, origin);
    if (url.origin !== origin) throw new Error("Cross-origin request rejected.");
    for (let attempt = 0; attempt < (body === undefined ? 2 : 1); attempt++) {
      try {
        const response = await fetch(url, {
          method: body === undefined ? "GET" : "POST",
          redirect: "manual",
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            accept: "application/json, text/html",
            ...(body !== undefined ? { origin, "content-type": "application/json" } : {}),
            ...(cookies.size ? { cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; ") } : {}),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        // Only the explicit account round-trip consumes cookies, and only this origin receives them.
        if (options.authRoundtrip)
          for (const value of response.headers.getSetCookie()) {
            const [pair, ...attributes] = value.split(";");
            const split = pair.indexOf("=");
            const name = pair.slice(0, split);
            const cookie = pair.slice(split + 1);
            if (!/^(?:__Secure-)?better-auth\./.test(name)) continue;
            const domain = attributes
              .find((v) => /^\s*domain=/i.test(v))
              ?.trim()
              .slice(7)
              .replace(/^\./, "");
            if (domain && domain !== new URL(origin).hostname)
              throw new Error("Foreign-domain session cookie rejected.");
            if (!cookie || attributes.some((v) => /^\s*max-age=0$/i.test(v))) cookies.delete(name);
            else cookies.set(name, cookie);
          }
        return response;
      } catch {
        if (body !== undefined || attempt === 1) throw new Error(`Request failed or timed out: ${route}`);
        await delay(200);
      }
    }
    throw new Error("Request failed.");
  }
  const status = (response: Response, expected: number, route: string) => {
    if (response.status !== expected)
      throw new Error(`${route}: expected HTTP ${expected}, received ${response.status}.`);
  };
  const privateResponse = (response: Response) => {
    const cache = response.headers.get("cache-control") ?? "";
    if (!/private/i.test(cache) || !/no-store/i.test(cache))
      throw new Error("Session response must be private, no-store.");
  };
  async function json(response: Response): Promise<unknown> {
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new Error("Expected a JSON response.");
    const text = await response.text();
    if (text.length > 65536) throw new Error("Unexpectedly large session response.");
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON response (body redacted).");
    }
  }
  function identity(value: unknown): { id: string; email: string } {
    if (
      !value ||
      typeof value !== "object" ||
      !("user" in value) ||
      !value.user ||
      typeof value.user !== "object" ||
      !("id" in value.user) ||
      typeof value.user.id !== "string" ||
      !("email" in value.user) ||
      typeof value.user.email !== "string"
    )
      throw new Error("Session identity is missing or invalid.");
    return { id: value.user.id, email: value.user.email };
  }
  for (const route of ["/auth/v2/login", "/auth/v2/register", "/unauthorized"]) {
    const response = await send(route);
    status(response, 200, route);
    if (!response.headers.get("content-type")?.includes("text/html")) throw new Error(`${route}: expected HTML.`);
    await response.body?.cancel();
    report(`PASS public ${route}`);
  }
  const notFound = await send("/deployment-check-missing-route");
  status(notFound, 404, "unknown public route");
  await notFound.body?.cancel();
  const dashboard = await send("/dashboard/default");
  if (options.demo) status(dashboard, 200, "demo dashboard");
  else {
    if (![302, 303, 307, 308].includes(dashboard.status))
      throw new Error("Signed-out dashboard must redirect; auth may be disabled.");
    const location = dashboard.headers.get("location");
    if (!location) throw new Error("Protected redirect has no destination.");
    const destination = new URL(location, origin);
    if (
      destination.origin !== origin ||
      destination.pathname !== "/auth/v2/login" ||
      destination.searchParams.get("redirect") !== "/dashboard/default" ||
      destination.hash
    )
      throw new Error("Unsafe or invalid protected-route redirect.");
  }
  await dashboard.body?.cancel();
  const session = await send("/api/auth/get-session");
  status(session, options.demo ? 404 : 200, "signed-out session");
  const payload = await json(session);
  if (options.demo) {
    if (
      !payload ||
      typeof payload !== "object" ||
      !("message" in payload) ||
      payload.message !== "Authentication is disabled in this demo."
    )
      throw new Error("Expected an explicitly disabled demo auth endpoint.");
  } else {
    privateResponse(session);
    if (payload !== null) throw new Error("Expected exactly null for the signed-out session.");
  }
  report(`PASS ${options.demo ? "demo" : "auth-on"} mode, public 404, protected behavior and signed-out session`);
  if (!options.authRoundtrip) {
    report("PASS read-only deployment check; no account writes requested.");
    return;
  }
  const email = `deploy-check-${Date.now()}-${randomBytes(6).toString("hex")}@example.test`;
  const password = randomBytes(32).toString("base64url");
  async function readSession() {
    const response = await send("/api/auth/get-session");
    status(response, 200, "session");
    privateResponse(response);
    return json(response);
  }
  let attempted = false;
  try {
    attempted = true;
    const signup = await send("/api/auth/sign-up/email", { name: "Deployment check", email, password });
    status(signup, 200, "signup");
    const created = identity(await json(signup));
    if (created.email !== email || !cookies.size) throw new Error("Signup did not establish the expected session.");
    if (identity(await readSession()).id !== created.id) throw new Error("Signup session identity mismatch.");
    let protectedResponse = await send("/dashboard/default");
    status(protectedResponse, 200, "authenticated dashboard");
    await protectedResponse.body?.cancel();
    let signout = await send("/api/auth/sign-out", {});
    status(signout, 200, "signout");
    await signout.body?.cancel();
    if ((await readSession()) !== null) throw new Error("Signout retained session authority.");
    const signin = await send("/api/auth/sign-in/email", { email, password });
    status(signin, 200, "signin");
    if (identity(await json(signin)).id !== created.id) throw new Error("Signin identity mismatch.");
    if (identity(await readSession()).id !== created.id) throw new Error("Signin session identity mismatch.");
    protectedResponse = await send("/dashboard/default");
    status(protectedResponse, 200, "signed-in dashboard");
    await protectedResponse.body?.cancel();
    signout = await send("/api/auth/sign-out", {});
    status(signout, 200, "final signout");
    await signout.body?.cancel();
    if ((await readSession()) !== null) throw new Error("Final signout retained authority.");
    report("PASS explicit signup/signout/signin/session/protected-access round-trip; sessions signed out.");
  } finally {
    if (cookies.size) {
      try {
        const response = await send("/api/auth/sign-out", {});
        status(response, 200, "cleanup signout");
        await response.body?.cancel();
      } catch {
        report("Account cleanup needs review: final signout could not be confirmed.");
      }
    }
    if (attempted)
      report(
        `Retained or potentially retained throwaway account: ${email}. Use the documented reviewer cleanup procedure.`,
      );
    cookies.clear();
  }
}

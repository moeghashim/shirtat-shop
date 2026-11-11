import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";

import { runtimeEnvironment } from "../../server/runtime.server.ts";
import { AUTH_SERVICE_ERROR, getAuth } from "./auth.server.ts";
import { authConfiguration } from "./config.ts";
import { requireSession } from "./session.server.ts";

export type AccountDetails =
  | {
      status: "ready";
      user: { id: string; name: string; email: string };
      hasPassword: boolean;
      sessions: { id: string; description: string; createdAt: string; expiresAt: string; current: boolean }[];
    }
  | { status: "reauth" };

function needsReauthentication(error: unknown) {
  if (!error || typeof error !== "object" || !("body" in error)) return false;
  const body = error.body;
  return !!body && typeof body === "object" && "code" in body && body.code === "SESSION_NOT_FRESH";
}

export async function readAccountDetails(): Promise<AccountDetails | null> {
  const state = await requireSession();
  if (state.mode === "demo") return null;
  const auth = getAuth();
  if (!auth || !state.user) throw new Error("Sign in to continue.");
  try {
    const headers = getRequestHeaders();
    const current = await auth.api.getSession({ headers });
    if (!current) throw new Error("Sign in to continue.");
    const [accounts, sessions] = await Promise.all([
      auth.api.listUserAccounts({ headers }),
      auth.api.listSessions({ headers }),
    ]);
    return {
      status: "ready",
      user: state.user,
      hasPassword: accounts.some((account) => account.providerId === "credential"),
      sessions: sessions.map((session) => ({
        id: session.id,
        description: session.userAgent?.trim().slice(0, 240) || "Browser details unavailable",
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        current: session.id === current.session.id,
      })),
    };
  } catch (error) {
    if (needsReauthentication(error)) return { status: "reauth" };
    throw new Error(AUTH_SERVICE_ERROR);
  }
}

export async function revokeOwnedSession(id: string) {
  setResponseHeader("Cache-Control", "private, no-store");
  const config = authConfiguration(runtimeEnvironment());
  const headers = getRequestHeaders();
  if (!config.enabled || headers.get("origin") !== config.baseURL)
    throw new Error("This request must come from your sign-in site.");
  const state = await requireSession();
  const auth = getAuth();
  if (state.mode !== "auth" || !state.user || !auth) throw new Error("Sign in to continue.");
  try {
    const current = await auth.api.getSession({ headers });
    if (!current) throw new Error("Sign in to continue.");
    const sessions = await auth.api.listSessions({ headers });
    const target = sessions.find((session) => session.id === id);
    if (!target) return { status: "unavailable" as const };
    const isCurrent = target.id === current.session.id;
    if (isCurrent) await auth.api.signOut({ headers });
    else await auth.api.revokeSession({ headers, body: { token: target.token } });
    return { status: "revoked" as const, current: isCurrent };
  } catch (error) {
    if (needsReauthentication(error)) return { status: "reauth" as const };
    throw new Error(AUTH_SERVICE_ERROR);
  }
}

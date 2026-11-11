import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { sql } from "drizzle-orm";

import { authAccount, authRateLimit, authSession, authUser, authVerification } from "../../server/db/auth-schema.ts";
import { getDatabase } from "../../server/db/client.server.ts";
import { runtimeEnvironment, workerRequestScope } from "../../server/runtime.server.ts";
import { authConfiguration } from "./config.ts";
import { inviteSignUp } from "./invite-context.ts";
import { accountName } from "./name.ts";
import { authDestination, authErrorCallback } from "./redirect.ts";

function createAuth(config: Extract<ReturnType<typeof authConfiguration>, { enabled: true }>) {
  return betterAuth({
    appName: "Shirtat",
    baseURL: config.baseURL,
    secret: config.secret,
    trustedOrigins: [config.baseURL],
    database: drizzleAdapter(getDatabase(), {
      provider: "pg",
      schema: {
        user: authUser,
        session: authSession,
        account: authAccount,
        verification: authVerification,
        rateLimit: authRateLimit,
      },
    }),
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "designer",
          input: false,
        },
      },
    },
    emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
    socialProviders: {
      ...(config.providers.google ? { google: config.providers.google } : {}),
      ...(config.providers.github
        ? { github: { ...config.providers.github, scope: ["read:user", "user:email"] } }
        : {}),
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (
          !["/sign-in/social", "/sign-in/email", "/sign-up/email", "/update-user", "/change-password"].includes(
            ctx.path,
          )
        )
          return;
        const body = { ...ctx.body };
        if (ctx.path === "/sign-up/email" && !inviteSignUp.getStore()) {
          throw new APIError("FORBIDDEN", {
            code: "SIGN_UP_CLOSED",
            message: "Sign-up is closed. Ask the owner for an invite.",
          });
        }
        if (ctx.path === "/sign-up/email" || ctx.path === "/update-user") {
          const name = accountName(body.name);
          if (!name)
            throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Enter a name of 1–100 characters." });
          if (ctx.path === "/update-user" && Object.keys(body).some((key) => key !== "name"))
            throw new APIError("BAD_REQUEST", {
              code: "INVALID_ACCOUNT_UPDATE",
              message: "Only your name can be updated here.",
            });
          body.name = name;
        }
        // Apply the account policy even when a caller bypasses our form.
        if (ctx.path === "/change-password") body.revokeOtherSessions = true;
        if (ctx.path === "/sign-in/social" || body.callbackURL !== undefined)
          body.callbackURL = authDestination(body.callbackURL);
        if (ctx.path === "/sign-in/social") {
          body.newUserCallbackURL = authDestination(body.newUserCallbackURL ?? body.callbackURL);
          body.errorCallbackURL = authErrorCallback(body.errorCallbackURL, body.callbackURL);
        }
        return { context: { ...ctx, body } };
      }),
    },
    account: { accountLinking: { enabled: false } },
    session: { cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database", window: 10, max: 100 },
    advanced: {
      useSecureCookies: config.baseURL.startsWith("https://"),
      // Cloudflare overwrites this header. Never trust a caller's forwarding chain.
      ...(workerRequestScope() ? { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } } : {}),
    },
    logger: { disabled: true },
    telemetry: { enabled: false },
    plugins: [tanstackStartCookies()],
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
const authKey = Symbol("request auth");
export function getAuth() {
  const config = authConfiguration(runtimeEnvironment());
  if (!config.enabled) return null;
  const scope = workerRequestScope();
  if (scope) {
    let auth = scope.resources.get(authKey) as ReturnType<typeof createAuth> | undefined;
    if (!auth) {
      auth = createAuth(config);
      scope.resources.set(authKey, auth);
    }
    return auth;
  }
  instance ??= createAuth(config);
  return instance;
}
export const AUTH_SERVICE_ERROR =
  "Authentication is unavailable. Check the database connection and migrations, then retry.";
let storageReady = false;
export async function assertAuthStorage() {
  if (storageReady) return;
  try {
    // Even a signed-out request must fail closed when auth storage is missing.
    await getDatabase().execute(
      sql`select role from auth_user, auth_session, auth_account, auth_verification, auth_rate_limit limit 0`,
    );
    storageReady = true;
  } catch {
    throw new Error(AUTH_SERVICE_ERROR);
  }
}
export async function handleAuth(request: Request) {
  try {
    const auth = getAuth();
    if (!auth) return Response.json({ message: "Authentication is disabled in this demo." }, { status: 404 });
    const response = await auth.handler(request);
    response.headers.set("Cache-Control", "private, no-store");
    const retryAfter = response.headers.get("X-Retry-After");
    if (response.status === 429 && retryAfter) response.headers.set("Retry-After", retryAfter);
    if (response.status >= 500) return Response.json({ message: AUTH_SERVICE_ERROR }, { status: 503 });
    return response;
  } catch {
    return Response.json({ message: AUTH_SERVICE_ERROR }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

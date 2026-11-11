import { z } from "zod";

import { dataRefSchema } from "../../lib/assistant/data-contract.ts";
import { requireSession } from "../../lib/auth/session.server.ts";
import { runtimeEnvironment, workerRequestScope } from "../runtime.server.ts";
import { canonicalOrigin } from "./config.server.ts";
import { resolveReferences } from "./data-tools.server.ts";
import { AssistantError, errorResponse, privateHeaders } from "./errors.ts";
import { readJsonInput } from "./input.ts";
import { admit, trustedIP } from "./limiter.server.ts";

const schema = z.strictObject({ refs: z.array(dataRefSchema).min(1).max(4) });
export async function handleRefresh(request: Request) {
  const deadline = Date.now() + 20000;
  const active = () => {
    if (request.signal.aborted || Date.now() >= deadline) throw new AssistantError("timeout");
  };
  try {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { ...privateHeaders, Allow: "POST" } });
    const env = runtimeEnvironment();
    if (request.headers.get("origin") !== canonicalOrigin(env, request.url, false))
      throw new AssistantError("origin", 403);
    active();
    let state: Awaited<ReturnType<typeof requireSession>>;
    try {
      state = await requireSession();
    } catch (error) {
      throw new AssistantError(
        error instanceof Error && error.message === "Sign in to continue." ? "unauthorized" : "unavailable",
        error instanceof Error && error.message === "Sign in to continue." ? 401 : 503,
      );
    }
    active();
    const parsed = schema.safeParse(await readJsonInput(request));
    if (!parsed.success) throw new AssistantError("invalid", 400);
    active();
    await admit(env, trustedIP(request, !!workerRequestScope()), state.user?.id);
    active();
    const results = await resolveReferences(request, deadline, parsed.data.refs);
    active();
    const body = JSON.stringify({ v: 2, results });
    if (new TextEncoder().encode(body).byteLength > 32768) throw new AssistantError("limit", 413);
    return new Response(body, { headers: { ...privateHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return errorResponse(error);
  }
}

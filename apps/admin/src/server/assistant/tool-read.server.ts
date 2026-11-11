import { requireSession } from "../../lib/auth/session.server.ts";
import { selectSource } from "../data/source.ts";
import { assertReadActive, DataReadTimeout, withToolTransaction } from "../db/client.server.ts";
import { runtimeEnvironment, workerRequestScope } from "../runtime.server.ts";
import { AssistantError } from "./errors.ts";
import { admit, trustedIP } from "./limiter.server.ts";

// Shared execution boundary for the registry and model-free refresh resolver.
// Every invocation authorizes and charges independently before entering its read.
export async function executeToolRead<T>(
  request: Request,
  requestDeadline: number,
  read: () => Promise<T>,
): Promise<T> {
  try {
    const deadline = Math.min(requestDeadline, Date.now() + 5000);
    const active = () => assertReadActive(request.signal, deadline);
    active();
    const state = await requireSession();
    active();
    const env = runtimeEnvironment();
    await admit(env, trustedIP(request, !!workerRequestScope()), state.user?.id);
    active();
    const result =
      selectSource(env) === "db" ? await withToolTransaction(request.signal, deadline, read) : await read();
    active();
    return result;
  } catch (error) {
    if (error instanceof DataReadTimeout) throw new AssistantError("timeout", 408);
    throw error;
  }
}

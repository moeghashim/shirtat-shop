import { recordedReply } from "../../lib/assistant/recorded.ts";
import { requireSession } from "../../lib/auth/session.server.ts";
import { runtimeEnvironment, workerRequestScope } from "../runtime.server.ts";
import { assistantConfiguration, canonicalOrigin, selectProvider } from "./config.server.ts";
import { dashboardResponse } from "./dashboard.server.ts";
import { AssistantError, errorResponse, privateHeaders } from "./errors.ts";
import { readInput } from "./input.ts";
import { admit, trustedIP } from "./limiter.server.ts";
import { providerStream } from "./providers.server.ts";
import { boundedStream, type SourceEvent } from "./stream.ts";

export async function handleAssistant(request: Request) {
  const started = Date.now();
  const active = () => {
    if (request.signal.aborted || Date.now() >= started + 20000) throw new AssistantError("timeout", 408);
  };
  try {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { ...privateHeaders, Allow: "POST" } });
    const env = runtimeEnvironment();
    const config = assistantConfiguration(env);
    const expectedOrigin = canonicalOrigin(env, request.url, config.length > 0);
    if (request.headers.get("origin") !== expectedOrigin) throw new AssistantError("origin", 403);
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
    const input = await readInput(request);
    active();
    const provider = selectProvider(config, input.provider);
    active();
    await admit(env, trustedIP(request, !!workerRequestScope()), state.user?.id);
    if (input.operation === "edit") return await dashboardResponse(request, input, provider, started);
    if (
      input.operation === "dashboard" ||
      /^(?:show|build|create) (?:a )?(?:revenue |finance |analytics |crm |ecommerce )?dashboard/i.test(
        input.messages.at(-1)?.content ?? "",
      )
    )
      return await dashboardResponse(request, input, provider, started);
    // No session or DB work may happen after this point: Worker request resources close on return.
    const body = boundedStream((signal) => {
      if (provider) return providerStream(provider, input.messages, signal);
      const text = recordedReply(input.messages.at(-1)?.content ?? "");
      let offset = 0;
      let timer: ReturnType<typeof setTimeout>;
      let wake: (() => void) | undefined;
      const cancel = () => {
        clearTimeout(timer);
        wake?.();
      };
      signal.addEventListener("abort", cancel, { once: true });
      return new ReadableStream<SourceEvent>({
        async pull(controller) {
          await new Promise<void>((resolve) => {
            wake = resolve;
            timer = setTimeout(resolve, 24);
          });
          if (signal.aborted) {
            controller.close();
            return;
          }
          if (offset < text.length) {
            controller.enqueue({ type: "text-delta", text: text.slice(offset, offset + 32) });
            offset += 32;
          } else {
            controller.enqueue({ type: "finish", finishReason: "stop" });
            controller.close();
            signal.removeEventListener("abort", cancel);
          }
        },
        cancel() {
          cancel();
          signal.removeEventListener("abort", cancel);
        },
      });
    }, request.signal);
    return new Response(body, { headers: { ...privateHeaders, "Content-Type": "text/event-stream; charset=utf-8" } });
  } catch (error) {
    return errorResponse(error);
  }
}

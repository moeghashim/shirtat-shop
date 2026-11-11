import type { DataResultMap } from "../../lib/assistant/data-contract.ts";
import { inspectLanguage } from "../../lib/assistant/language.ts";
import { bytes } from "../../lib/assistant/registry.ts";
import { encodeEvent, type StreamEvent } from "../../lib/assistant/transport.ts";

export type SourceEvent =
  | { type: "text-delta"; text: string }
  | { type: "finish"; finishReason: string }
  | { type: string };
export const deadlines = { first: 20000, idle: 15000, total: 60000 };
export function boundedStream(
  source: (signal: AbortSignal) => ReadableStream<SourceEvent>,
  requestSignal: AbortSignal,
  timing = deadlines,
  results?: DataResultMap,
  validate?: (source: string) => boolean,
) {
  const abort = new AbortController();
  const version = results ? 2 : 1;
  let wireBytes = 0;
  const encode = (event: StreamEvent) => {
    const encoded = encodeEvent(event);
    if (results && wireBytes + encoded.byteLength > 98304 - (event.type === "error" ? 0 : 128))
      throw new Error("Stream limit");
    wireBytes += encoded.byteLength;
    return encoded;
  };
  let reader: ReadableStreamDefaultReader<SourceEvent> | undefined;
  let finished = false;
  let content = "";
  let contentBytes = 0;
  let timer: ReturnType<typeof setTimeout>;
  let total: ReturnType<typeof setTimeout>;
  let finish: (event?: StreamEvent) => void = () => {
    /* Cancellation may race a closed reader. */
  };
  const disconnect = () => finish({ v: version, type: "error", code: "unavailable" });
  return new ReadableStream<Uint8Array>(
    {
      start(controller) {
        finish = (event) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          clearTimeout(total);
          requestSignal.removeEventListener("abort", disconnect);
          abort.abort();
          void reader
            ?.cancel()
            .catch(() => {
              /* Cancellation may race a closed reader. */
            })
            .finally(() => reader?.releaseLock());
          if (event) {
            controller.enqueue(encode(event));
            controller.close();
          }
        };
        requestSignal.addEventListener("abort", disconnect, { once: true });
        timer = setTimeout(() => finish({ v: version, type: "error", code: "timeout" }), timing.first);
        total = setTimeout(() => finish({ v: version, type: "error", code: "timeout" }), timing.total);
        if (requestSignal.aborted) {
          disconnect();
          return;
        }
        if (results) controller.enqueue(encode({ v: 2, type: "data", results }));
        try {
          reader = source(abort.signal).getReader();
        } catch {
          finish({ v: version, type: "error", code: "provider" });
        }
      },
      async pull(controller) {
        if (finished || !reader) return;
        try {
          while (!finished) {
            const part = await reader.read();
            if (finished) return;
            if (part.done) {
              finish({ v: version, type: "error", code: "provider" });
              return;
            }
            const event = part.value;
            if (event.type === "text-delta" && "text" in event && typeof event.text === "string" && event.text) {
              contentBytes += bytes(event.text);
              if (contentBytes > 65536) {
                finish({ v: version, type: "error", code: "limit" });
                return;
              }
              content += event.text;
              clearTimeout(timer);
              timer = setTimeout(() => finish({ v: version, type: "error", code: "timeout" }), timing.idle);
              controller.enqueue(encode({ v: version, type: "text-delta", text: event.text }));
              return;
            }
            if (event.type === "finish") {
              const usage = "totalUsage" in event ? (event.totalUsage as { outputTokens?: number }) : undefined;
              if (
                (usage?.outputTokens ?? 0) > (results ? 3072 : 4096) ||
                ("finishReason" in event && event.finishReason === "length")
              ) {
                finish({ v: version, type: "error", code: "limit" });
                return;
              }
              const valid =
                "finishReason" in event &&
                event.finishReason === "stop" &&
                (validate ? validate(content) : inspectLanguage(content, true, results).status === "ready");
              finish(
                valid
                  ? { v: version, type: "finish" }
                  : { v: version, type: "error", code: content ? "invalid" : "refused" },
              );
              return;
            }
            if (event.type === "error" || event.type === "abort" || event.type.startsWith("tool-")) {
              finish({ v: version, type: "error", code: "provider" });
              return;
            }
            // Reasoning, metadata, usage, sources and protocol bookkeeping never reach the renderer.
          }
        } catch {
          finish({ v: version, type: "error", code: "provider" });
        }
      },
      cancel() {
        finish();
      },
    },
    { highWaterMark: 1 },
  );
}

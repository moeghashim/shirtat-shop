import type { ProviderId } from "../src/lib/assistant/config.ts";
export const mockOutput = 'root = Stack([Text("Synthetic Café 🙂 response")])';
export type WireCase =
  | "success"
  | "slow"
  | "idle"
  | "heartbeat"
  | "wireoverflow"
  | "empty"
  | "malformed"
  | "refusal"
  | "429"
  | "500"
  | "truncated"
  | "endless"
  | "oversize";
const frame = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;
export function providerWire(id: ProviderId, mode: WireCase = "success") {
  const text = mode === "empty" || mode === "refusal" ? "" : mode === "oversize" ? "x".repeat(65537) : mockOutput;
  if (mode === "malformed") return "data: {INVALID\n\n";
  let chunks: string[];
  if (id === "anthropic") {
    const event = (type: string, value: Record<string, unknown>) => `event: ${type}\n${frame({ type, ...value })}`;
    chunks = [
      event("message_start", {
        message: {
          id: "synthetic",
          type: "message",
          role: "assistant",
          model: "fixture",
          content: [],
          usage: { input_tokens: 1, output_tokens: 0 },
        },
      }),
      event("content_block_start", { index: 0, content_block: { type: "text", text: "" } }),
      event("content_block_delta", { index: 0, delta: { type: "text_delta", text } }),
      event("content_block_stop", { index: 0 }),
      event("message_delta", {
        delta: { stop_reason: mode === "refusal" ? "refusal" : "end_turn", stop_sequence: null },
        usage: { output_tokens: 10 },
      }),
      event("message_stop", {}),
    ];
  } else if (id === "openai" || id === "xai") {
    const response = {
      id: "synthetic",
      object: "response",
      created_at: 1,
      model: "fixture",
      status: "completed",
      output: [],
      usage: {
        input_tokens: 1,
        output_tokens: 10,
        total_tokens: 11,
        input_tokens_details: { cached_tokens: 0 },
        output_tokens_details: { reasoning_tokens: 0 },
      },
      error: null,
      incomplete_details: null,
    };
    chunks = [
      frame({ type: "response.created", response: { ...response, status: "in_progress" } }),
      frame({
        type: "response.output_item.added",
        output_index: 0,
        item: { id: "message", type: "message", role: "assistant", content: [], status: "in_progress" },
      }),
      frame({ type: "response.output_text.delta", item_id: "message", output_index: 0, content_index: 0, delta: text }),
      frame({
        type: "response.output_item.done",
        output_index: 0,
        item: {
          id: "message",
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text, annotations: [] }],
          status: "completed",
        },
      }),
      frame({ type: "response.completed", response }),
    ];
  } else if (id === "meta") {
    chunks = [
      frame({
        id: "synthetic",
        object: "chat.completion.chunk",
        created: 1,
        model: "fixture",
        choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }],
      }),
      frame({
        id: "synthetic",
        object: "chat.completion.chunk",
        created: 1,
        model: "fixture",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 10, total_tokens: 11 },
      }),
      "data: [DONE]\n\n",
    ];
  } else {
    chunks = [
      frame({ candidates: [{ content: { role: "model", parts: [{ text }] }, index: 0 }], modelVersion: "fixture" }),
      frame({
        candidates: [
          { content: { role: "model", parts: [] }, finishReason: mode === "refusal" ? "SAFETY" : "STOP", index: 0 },
        ],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 10, totalTokenCount: 11 },
        modelVersion: "fixture",
      }),
    ];
  }
  return (
    mode === "truncated"
      ? chunks
          .slice(0, 3)
          .filter(
            (chunk) =>
              !chunk.includes('"finishReason"') &&
              !chunk.includes('"finish_reason":"stop"') &&
              !chunk.includes("[DONE]"),
          )
      : chunks
  ).join("");
}
export function wireResponse(
  id: ProviderId,
  mode: WireCase,
  signal?: AbortSignal | null,
  onCancel = () => {
    /* Optional test observation. */
  },
) {
  if (mode === "429" || mode === "500")
    return new Response("SYNTHETIC_PRIVATE_UPSTREAM_ERROR", { status: Number(mode) });
  if (mode === "wireoverflow")
    return new Response(new Uint8Array(2 * 1024 * 1024 + 1), { headers: { "Content-Type": "text/event-stream" } });
  const bytes = new TextEncoder().encode(
    providerWire(id, mode === "idle" || mode === "heartbeat" ? "truncated" : mode),
  );
  const repeating = new TextEncoder().encode(
    `${providerWire(id, "truncated").split("\n\n").filter(Boolean).at(-1) ?? ""}\n\n`,
  );
  let offset = 0;
  let closed = false;
  let end: (() => void) | undefined;
  const cancel = () => {
    if (!closed) {
      closed = true;
      onCancel();
      end?.();
    }
  };
  signal?.addEventListener("abort", cancel, { once: true });
  return new Response(
    new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (closed) {
          controller.close();
          return;
        }
        if (mode === "endless") {
          await new Promise<void>((resolve) => {
            end = resolve;
          });
          controller.close();
          return;
        }
        if (offset === bytes.length && (mode === "idle" || mode === "heartbeat")) {
          await new Promise<void>((resolve) => {
            end = resolve;
            if (mode === "heartbeat") setTimeout(resolve, 1000);
          });
          if (closed) controller.close();
          else controller.enqueue(repeating);
          return;
        }
        if (offset === bytes.length) {
          closed = true;
          signal?.removeEventListener("abort", cancel);
          controller.close();
          return;
        }
        // Deliberately split JSON and Unicode independently of provider token boundaries.
        const width = mode === "oversize" ? 16384 : 37;
        if (mode === "slow") await new Promise((resolve) => setTimeout(resolve, 100));
        if (closed) {
          controller.close();
          return;
        }
        controller.enqueue(bytes.slice(offset, offset + width));
        offset = Math.min(bytes.length, offset + width);
      },
      cancel() {
        cancel();
        signal?.removeEventListener("abort", cancel);
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}

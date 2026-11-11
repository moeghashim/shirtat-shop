import type { ProviderId } from "../src/lib/assistant/config.ts";
import { mockOutput, providerWire } from "./assistant-wire-fixtures.ts";
export const toolArgs = {
  domain: "default",
  metric: "performance",
  range: "available",
  segment: "all",
  limit: 10,
} as const;
export const toolRef = { kind: "data-ref", version: 1, tool: "dashboard_read", args: toolArgs } as const;
export const toolText = `root = Stack([DashboardGrid([Panel("overview", [DashboardChart("Available performance observations", "line", ${JSON.stringify(toolRef)})])])])`;
const frame = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;
export function toolWire(id: ProviderId, name = "dashboard_read", args: unknown = toolArgs, count = 1) {
  const json = JSON.stringify(args),
    halves = [json.slice(0, 20), json.slice(20)];
  if (id === "anthropic") {
    const event = (type: string, value: object) => `event: ${type}\n${frame({ type, ...value })}`;
    return (
      event("message_start", {
        message: {
          id: "synthetic",
          type: "message",
          role: "assistant",
          model: "fixture",
          content: [],
          usage: { input_tokens: 1, output_tokens: 0 },
        },
      }) +
      Array.from(
        { length: count },
        (_, index) =>
          event("content_block_start", {
            index,
            content_block: { type: "tool_use", id: `call${index}`, name, input: {} },
          }) +
          halves
            .map((partial_json) =>
              event("content_block_delta", { index, delta: { type: "input_json_delta", partial_json } }),
            )
            .join("") +
          event("content_block_stop", { index }),
      ).join("") +
      event("message_delta", {
        delta: { stop_reason: "tool_use", stop_sequence: null },
        usage: { output_tokens: 20 },
      }) +
      event("message_stop", {})
    );
  }
  if (id === "openai" || id === "xai") {
    const response = {
      id: "synthetic",
      object: "response",
      created_at: 1,
      model: "fixture",
      status: "completed",
      output: [],
      usage: {
        input_tokens: 1,
        output_tokens: 20,
        total_tokens: 21,
        input_tokens_details: { cached_tokens: 0 },
        output_tokens_details: { reasoning_tokens: 0 },
      },
      error: null,
      incomplete_details: null,
    };
    return (
      frame({ type: "response.created", response: { ...response, status: "in_progress" } }) +
      Array.from({ length: count }, (_, index) => {
        const item = {
          id: `item${index}`,
          type: "function_call",
          call_id: `call${index}`,
          name,
          arguments: json,
          status: "completed",
        };
        return (
          frame({
            type: "response.output_item.added",
            output_index: index,
            item: { ...item, arguments: "", status: "in_progress" },
          }) +
          halves
            .map((delta) =>
              frame({ type: "response.function_call_arguments.delta", item_id: item.id, output_index: index, delta }),
            )
            .join("") +
          frame({
            type: "response.function_call_arguments.done",
            item_id: item.id,
            output_index: index,
            arguments: json,
          }) +
          frame({ type: "response.output_item.done", output_index: index, item })
        );
      }).join("") +
      frame({ type: "response.completed", response })
    );
  }
  if (id === "meta") {
    const chunk = (delta: object, finish_reason: string | null = null) =>
      frame({
        id: "synthetic",
        object: "chat.completion.chunk",
        created: 1,
        model: "fixture",
        choices: [{ index: 0, delta, finish_reason }],
      });
    return (
      Array.from(
        { length: count },
        (_, index) =>
          chunk({
            role: "assistant",
            tool_calls: [{ index, id: `call${index}`, type: "function", function: { name, arguments: halves[0] } }],
          }) + chunk({ tool_calls: [{ index, function: { arguments: halves[1] } }] }),
      ).join("") +
      chunk({}, "tool_calls") +
      "data: [DONE]\n\n"
    );
  }
  return (
    frame({
      candidates: [
        {
          content: { role: "model", parts: Array.from({ length: count }, () => ({ functionCall: { name, args } })) },
          index: 0,
        },
      ],
      modelVersion: "fixture",
    }) +
    frame({
      candidates: [{ content: { role: "model", parts: [] }, index: 0, finishReason: "STOP" }],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 20, totalTokenCount: 21 },
      modelVersion: "fixture",
    })
  );
}
export function fragmentWire(wire: string, chunkSize = 17) {
  const bytes = new TextEncoder().encode(wire);
  let offset = 0;
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(c) {
        if (offset >= bytes.length) {
          c.close();
          return;
        }
        c.enqueue(bytes.slice(offset, offset + chunkSize));
        offset += chunkSize;
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}
export function finalToolWire(id: ProviderId) {
  return providerWire(id).replaceAll(JSON.stringify(mockOutput).slice(1, -1), JSON.stringify(toolText).slice(1, -1));
}

import { z } from "zod";

import { type DataResultMap, dataResultMapSchema } from "./data-contract.ts";
import { bytes, limits } from "./registry.ts";

export const streamEvent = z.discriminatedUnion("type", [
  z.strictObject({ v: z.literal(2), type: z.literal("data"), results: dataResultMapSchema }),
  z.strictObject({
    v: z.union([z.literal(1), z.literal(2)]),
    type: z.literal("text-delta"),
    text: z.string().max(65536),
  }),
  z.strictObject({ v: z.union([z.literal(1), z.literal(2)]), type: z.literal("finish") }),
  z.strictObject({
    v: z.union([z.literal(1), z.literal(2)]),
    type: z.literal("error"),
    code: z.enum(["provider", "timeout", "limit", "refused", "invalid", "unavailable"]),
  }),
]);
export type StreamEvent = z.infer<typeof streamEvent>;
export const encodeEvent = (event: StreamEvent) => new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
export class StreamFailure extends Error {
  readonly code: string;
  constructor(code: string) {
    super("The response could not be completed.");
    this.code = code;
  }
}
export async function consumeStream(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onText: (text: string) => void,
  onData?: (results: DataResultMap) => void,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "";
  let text = "";
  let textBytes = 0;
  let terminal = false;
  let version: number | undefined;
  let receivedData = false;
  let wireBytes = 0;
  const cancel = () => {
    void reader.cancel().catch(() => {
      /* Cancellation may race a closed reader. */
    });
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const part = await reader.read();
      if (part.done) {
        buffer += decoder.decode();
        break;
      }
      wireBytes += part.value.byteLength;
      if (wireBytes > (version === 2 ? 98304 : 2 * 1024 * 1024)) throw new StreamFailure("limit");
      buffer += decoder.decode(part.value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (terminal || !frame.startsWith("data: ")) throw new StreamFailure("invalid");
        const event = streamEvent.parse(JSON.parse(frame.slice(6)));
        if (version !== undefined && version !== event.v) throw new StreamFailure("invalid");
        version = event.v;
        if (event.v === 2 && wireBytes > 98304) throw new StreamFailure("limit");
        if (event.type === "data") {
          if (receivedData || text.length) throw new StreamFailure("invalid");
          receivedData = true;
          onData?.(event.results);
        } else if (event.type === "text-delta") {
          if (event.v === 2 && !receivedData) throw new StreamFailure("invalid");
          textBytes += bytes(event.text);
          if (textBytes > limits.outputBytes) throw new StreamFailure("limit");
          text += event.text;
          onText(text);
        } else {
          if (event.v === 2 && event.type === "finish" && !receivedData) throw new StreamFailure("invalid");
          terminal = true;
          if (event.type === "error") throw new StreamFailure(event.code);
        }
        boundary = buffer.indexOf("\n\n");
      }
      if (bytes(buffer) > 400000) throw new StreamFailure("limit");
    }
    signal.throwIfAborted();
    if (!terminal || buffer.length) throw new StreamFailure("invalid");
    return text;
  } finally {
    signal.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {
      /* Cancellation may race a closed reader. */
    });
    reader.releaseLock();
  }
}

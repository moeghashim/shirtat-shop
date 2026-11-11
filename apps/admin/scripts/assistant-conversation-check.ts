import { bytes } from "../src/lib/assistant/registry.ts";
import {
  ContextLimit,
  failureCode,
  initialConversation,
  conversationReducer as reduce,
  requestHistory,
  responseFailure,
  retryDeadline,
  type Turn,
} from "../src/routes/(main)/dashboard/assistant/-components/conversation.ts";
import { requestSchema } from "../src/server/assistant/input.ts";
import assert from "node:assert/strict";

const turn = (id: number, status: Turn["status"] = "completed", text = 'root = Text("safe")'): Turn => ({
  id,
  status,
  prompt: `synthetic ${id}`,
  attribution: "Synthetic",
  text,
});
let state = reduce(initialConversation, { type: "start", turn: turn(1, "streaming"), regenerate: false });
state = reduce(state, { type: "update", id: 1, text: "partial", status: "stopped" });
assert.equal(reduce(state, { type: "update", id: 1, text: "late", status: "completed" }), state);
state = reduce(state, { type: "start", turn: turn(3, "streaming"), regenerate: true });
assert.equal(state.turns.length, 1);
assert.equal(reduce(state, { type: "update", id: 1, status: "error" }), state);
state = reduce(state, { type: "clear", generation: 4 });
assert.equal(reduce(state, { type: "update", id: 3, text: "late" }), state);
assert.equal(reduce(state, { type: "start", turn: turn(2), regenerate: false }), state);
const turns = Array.from({ length: 12 }, (_, index) => turn(index));
const bounded = requestHistory(turns, "current", "meta");
const body = requestSchema.parse(JSON.parse(bounded.body));
assert.equal(bounded.dropped, 3);
assert.equal(body.messages.length, 19);
assert.equal(body.messages[0].content, "synthetic 3");
assert.equal(body.messages.at(-1)?.content, "current");
assert.equal(body.provider, "meta");
assert.ok(bytes(bounded.body) <= 65536);
assert.equal(
  JSON.parse(requestHistory([turn(1, "stopped", "partial"), turn(2, "error")], "next").body).messages.length,
  1,
);
assert.throws(() => requestHistory([], "é".repeat(4097)), ContextLimit);
assert.throws(() => requestHistory([turn(1, "completed", "x".repeat(32769))], "next"), ContextLimit);
const escaped = turn(1, "completed", "\u0000".repeat(12000));
assert.throws(() => requestHistory([escaped], "next"), ContextLimit);
const olderLarge = requestHistory([escaped, turn(2)], "next");
assert.equal(olderLarge.dropped, 1);
assert.equal(requestHistory([turn(1, "completed", "x".repeat(40000)), turn(2)], "next").dropped, 1);
assert.equal(retryDeadline("2", 1000), 3000);
assert.equal(retryDeadline("Thu, 01 Jan 1970 00:00:05 GMT", 1000), 5000);
assert.equal(retryDeadline("invalid", 1000), 61000);
assert.equal(failureCode("SYNTHETIC_PRIVATE_RESPONSE"), "unavailable");
console.log(
  "PASS generation reducer: late chunk/error/start ignored; regenerate replaces latest; clear invalidates history",
);
console.log(
  "PASS context whole-pair trimming, byte/message/escaped JSON caps, oversized latest blocks, stopped/error never replay",
);
console.log("PASS Retry-After delta/date/default and safe error allowlist");

for (const code of ["unavailable", "configuration", "provider"] as const)
  assert.equal(await responseFailure(new Response(JSON.stringify({ error: code }), { status: 503 })), code);
assert.equal(
  await responseFailure(new Response('{"error":"<script>secret</script>"}', { status: 503 })),
  "unavailable",
);
assert.equal(await responseFailure(new Response("not JSON", { status: 429 })), "rate");
assert.equal(await responseFailure(new Response("x".repeat(1025), { status: 503 })), "unavailable");
let cancelled = false;
assert.equal(
  await responseFailure(
    new Response(
      new ReadableStream({
        cancel() {
          cancelled = true;
        },
      }),
      { status: 503 },
    ),
  ),
  "unavailable",
);
assert.ok(cancelled);
console.log("PASS bounded allowlisted HTTP error codes distinguish outages/configuration and cancel stalled bodies");

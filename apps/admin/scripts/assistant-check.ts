import "./assistant-blocks-check.ts";
import { createParser, generateSystemPrompt } from "@openuidev/lang-core";

import { inspectLanguage } from "../src/lib/assistant/language.ts";
import { examples, recordedReplies, recordedStream } from "../src/lib/assistant/recorded.ts";
import { bytes, getLibrarySpec, getSpecLibrary, promptOptions, schemas } from "../src/lib/assistant/registry.ts";
import { consumeStream, encodeEvent } from "../src/lib/assistant/transport.ts";
import assert from "node:assert/strict";

let passed = 0;
const check = (condition: unknown) => {
  assert.ok(condition);
  passed++;
};
const parser = createParser(getSpecLibrary().toJSONSchema(), "Stack");
for (const [id, source] of Object.entries({
  ...recordedReplies,
  numbers: 'root = Stack([Table(["Value"], [[-12.5], [1e-3], [2E+2], [-0.25]])])',
})) {
  const result = inspectLanguage(source, true);
  check(result.status === "ready");
  const parsed = parser.parse(result.response ?? "");
  assert.deepEqual(parsed.meta.errors, [], id);
  check(!parsed.meta.incomplete);
  for (let offset = 0; offset <= source.length; offset++) {
    const partial = inspectLanguage(source.slice(0, offset));
    // A valid split must never be rejected; no unvalidated partial gets rendered.
    assert.notEqual(partial.status, "invalid", `${id} split ${offset}`);
    if (partial.response) check(parser.parse(partial.response).meta.errors.length === 0);
  }
}
for (const source of [
  'root = Html("<script>alert(1)</script>")',
  'root = Stack([iframe("https://evil.test")])',
  'root = Stack([Query("records", {})])',
  'root = Stack([Mutation("delete", {})])',
  'root = Stack([@OpenUrl("javascript:alert(1)")])',
  "root = Stack([$data])",
  'root = Stack([Text("safe")]); exploit = @Fetch("https://evil.test")',
  'root = Stack([Text("safe" + "other")])',
  "root = Stack([Text(window.location)])",
  'root = Stack([Text("ok", {onClick:"evil"})])',
  'root = Stack([Card("x",["unvalidated"])])',
  'root = Stack([{name:"Text",props:{text:"spoofed node"}}])',
  "root = Stack([Text({__proto__: {polluted:true}})])",
  'root = Stack([Text({"constructor":"evil"})])',
  'root = Stack([Table(["a"], [[1,2]])])',
  'root = Stack([Chart("a","line",["a"],[{label:"b",values:[1e999]}])])',
  'root = Stack([Chart("a","bar",["a"],[{label:"b",values:[]}])])',
  'root = Stack([Text("x")]); root = Stack([])',
  "root = Stack([a]); a = Stack([a])",
  "root = Stack([a])",
  'root = Stack([Text("unfinished)',
  `root = Stack([${Array(200).fill('Text("x")').join(",")}])`,
  `root = ${"Stack([".repeat(13)}Text("x")${"])".repeat(13)}`,
  `root = Stack([Text("${"x".repeat(65536)}")])`,
]) {
  check(inspectLanguage(source, true).status === "invalid");
}
check(
  inspectLanguage('root = Stack([Text("<script>plain escaped text</script> https://evil.test")])', true).status ===
    "ready",
);
check(schemas.Table.safeParse({ columns: ["a"], rows: Array.from({ length: 50 }, () => [1]) }).success);
check(!schemas.Table.safeParse({ columns: ["a"], rows: Array.from({ length: 51 }, () => [1]) }).success);
check(
  !schemas.Chart.safeParse({
    title: "x",
    kind: "bar",
    labels: ["x"],
    series: Array.from({ length: 5 }, () => ({ label: "x", values: [1] })),
  }).success,
);
const system = generateSystemPrompt({ library: getLibrarySpec(), promptOptions });
check(bytes(system) <= 32768);
check(Object.keys(getLibrarySpec().components).length === Object.keys(schemas).length);
const source = 'root = Stack([Text("Café 🙂 漢字")])';
const chunks = [...encodeEvent({ v: 1, type: "text-delta", text: source }), ...encodeEvent({ v: 1, type: "finish" })];
for (const width of [1, 2, 3, 7, 101]) {
  let offset = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= chunks.length) controller.close();
      else {
        controller.enqueue(new Uint8Array(chunks.slice(offset, offset + width)));
        offset += width;
      }
    },
  });
  check(
    (await consumeStream(stream, new AbortController().signal, () => {
      /* Only the completed result is inspected here. */
    })) === source,
  );
}
for (const frames of [
  [encodeEvent({ v: 1, type: "text-delta", text: "x" })],
  [encodeEvent({ v: 1, type: "finish" }), encodeEvent({ v: 1, type: "finish" })],
  [encodeEvent({ v: 1, type: "error", code: "provider" })],
  [encodeEvent({ v: 1, type: "text-delta", text: "x".repeat(65537) })],
  [new Uint8Array([0xff])],
]) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) controller.enqueue(frame);
      controller.close();
    },
  });
  await assert.rejects(
    consumeStream(stream, new AbortController().signal, () => {
      /* Only the completed result is inspected here. */
    }),
  );
  passed++;
}
for (const example of examples)
  check(
    (
      await consumeStream(
        recordedStream(example.prompt, new AbortController().signal, 0),
        new AbortController().signal,
        () => {
          /* Only the completed result is inspected here. */
        },
      )
    ).includes("Recorded"),
  );
const controller = new AbortController();
const cancelled = consumeStream(recordedStream("sample", controller.signal, 500), controller.signal, () => {
  /* Only the completed result is inspected here. */
});
controller.abort();
await assert.rejects(cancelled);
passed++;
console.log(`PASS Assistant language, registry, stream and cancellation: ${passed} assertions`);

for (const levels of [6, 7, 8])
  for (const reachable of [false, true]) {
    const statements = ['a0 = ["x"]'];
    for (let i = 1; i <= levels; i++)
      statements.push(
        `a${i} = [${Array(10)
          .fill(`a${i - 1}`)
          .join(",")}]`,
      );
    const attack = `root = Stack([Text(${reachable ? `a${levels}` : '"safe"'})])\n${statements.join("\n")}`;
    const started = performance.now();
    assert.equal(inspectLanguage(attack, true).status, "invalid");
    assert.ok(performance.now() - started < 250, "Reference fan-out must reject within a bounded amount of work");
  }
console.log("PASS six reachable/unreachable reference fan-out attacks (10^6–10^8), each under 250ms");

await import("./assistant-data-check.ts");

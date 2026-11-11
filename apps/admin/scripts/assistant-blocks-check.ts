import {
  dataRefKey,
  dataRefSchema,
  dataResultMapSchema,
  dataResultSchema,
} from "../src/lib/assistant/data-contract.ts";
import { inspectLanguage, serializeTree } from "../src/lib/assistant/language.ts";
import { blockRecordedReply, recordedReplies } from "../src/lib/assistant/recorded.ts";
import { systemPrompt } from "../src/server/assistant/prompt.ts";
import assert from "node:assert/strict";

const ref = dataRefSchema.parse({
  kind: "data-ref",
  version: 1,
  tool: "dashboard_read",
  args: { domain: "default", metric: "performance", range: "available", segment: "all", limit: 50 },
});
const chart = (data: unknown) => `DashboardChart("Sample","area",${JSON.stringify(data)})`;
const panel = (id: string, data = ref) => `Panel("${id}",[${chart(data)}])`;
const grid = (panels: string[]) => `root = Stack([DashboardGrid([${panels.join(",")}])])`;
const snapshot = {
  ref,
  kind: "series" as const,
  data: { labels: ["Mon"], series: [{ label: "Sample", values: [1] }] },
  source: "demo" as const,
  asOf: "2026-11-06T00:00:00.000Z",
  periodLabel: "Available",
  truncated: false,
};
const map = { [dataRefKey(ref)]: snapshot };
assert.equal(inspectLanguage(grid([panel("a")]), true, map).status, "ready");
assert.equal(inspectLanguage(grid([panel("a")]), true, {}).status, "invalid");
assert.equal(
  inspectLanguage(grid([panel("a")]), true, {
    [dataRefKey(ref)]: { ...snapshot, kind: "stat", data: { label: "x", value: 1, detail: "" } },
  }).status,
  "invalid",
);
for (const source of [
  grid([panel("a"), panel("a")]),
  grid(Array.from({ length: 9 }, (_, i) => panel(`p${i}`))),
  'root = Stack([Panel("orphan",[Text("x")])])',
  'root = Stack([DashboardGrid([Text("x")])])',
  `root = Stack([StatCard(${JSON.stringify(ref)})])`,
  grid([panel("a")]) + `; unused = DashboardGrid([${panel("a")}])`,
  grid([panel("a", { ...ref, args: { ...ref.args, metric: "revenue" } } as typeof ref)]),
  grid([panel("a", { ...ref, version: 2 } as unknown as typeof ref)]),
  'root = Stack([PageHeader("x","y",{style:"red"})])',
])
  assert.equal(inspectLanguage(source, true).status, "invalid", source);
const distinct = ["default", "analytics", "finance", "crm", "ecommerce"].map((domain, i) =>
  panel(`p${i}`, {
    ...ref,
    args: {
      ...ref.args,
      domain,
      metric: ["performance", "traffic-quality", "transaction-overview", "pipeline", "revenue"][i],
    },
  } as typeof ref),
);
assert.equal(inspectLanguage(grid(distinct), true).status, "invalid");
assert.equal(inspectLanguage(grid(distinct.slice(0, 4)), true).status, "ready");
for (const source of [blockRecordedReply, ...Object.values(recordedReplies)]) {
  const result = inspectLanguage(source, true);
  assert.equal(result.status, "ready");
  assert.ok(result.tree);
  assert.equal(serializeTree(result.tree), result.response);
  for (let i = 0; i <= source.length; i++)
    assert.notEqual(inspectLanguage(source.slice(0, i)).status, "invalid", `split ${i}`);
}
assert.ok(dataResultSchema.safeParse(snapshot).success);
assert.ok(
  !dataResultSchema.safeParse({ ...snapshot, data: { ...snapshot.data, series: [{ label: "x", values: [Infinity] }] } })
    .success,
);
assert.ok(!dataResultMapSchema.safeParse({ bad: snapshot }).success);
assert.ok(!dataResultSchema.safeParse({ ...snapshot, extra: true }).success);
assert.ok(systemPrompt().length < 32768);
// A snapshot update changes values without rewriting a definition or doing I/O.
const definition = inspectLanguage(grid([panel("a")]), true, map);
const refreshed = {
  ...map,
  [dataRefKey(ref)]: { ...snapshot, data: { ...snapshot.data, series: [{ label: "Sample", values: [2] }] } },
};
assert.equal(inspectLanguage(grid([panel("a")]), true, refreshed).response, definition.response);
console.log("Blocks library: refs, results, caps, identity, splits, legacy and serializer checks passed.");

assert.equal(inspectLanguage('root = Stack([Text("unused result")])', true, map).status, "invalid");
assert.equal(
  inspectLanguage(`${grid([panel("a")])}; unused = [{nested: DashboardGrid([${panel("a")}])}]`, true).status,
  "invalid",
);
const largeTable = {
  ...snapshot,
  kind: "table",
  data: { columns: ["x"], rows: Array.from({ length: 3 }, () => ["x".repeat(4096)]) },
};
assert.ok(!dataResultSchema.safeParse(largeTable).success);
assert.ok(!dataRefSchema.safeParse({ ...ref, args: { ...ref.args, range: "90d" } }).success);
assert.ok(!dataRefSchema.safeParse({ ...ref, args: { ...ref.args, limit: 11 } }).success);

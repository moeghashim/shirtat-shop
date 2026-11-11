import { applyPatch, editSnapshots, panels, references, singlePanel } from "../src/lib/assistant/canvas.ts";
import { type DataResultMap, dataRefKey } from "../src/lib/assistant/data-contract.ts";
import { formatReportingDate, formatReportingMonth, formatSnapshotTime } from "../src/lib/assistant/date-format.ts";
import { inspectLanguage } from "../src/lib/assistant/language.ts";
import { requestSchema } from "../src/server/assistant/input.ts";
import { toolRef, toolText } from "./assistant-tool-wire.ts";
import assert from "node:assert/strict";

const first = singlePanel(toolText);
const second = { ...first, props: { ...first.props, id: "second" } };
// Build through the same validated patch seam, not string rewriting.
const initial = { version: 1 as const, revision: 0, tree: inspectLanguage(toolText, true).tree! };
const two = applyPatch(initial, { version: 1, baseRevision: 0, op: "add", targetId: "second", panel: second });
const replacement = {
  ...first,
  props: {
    ...first.props,
    children: [{ name: "DashboardChart" as const, props: { title: "Changed", kind: "bar", data: toolRef } }],
  },
};
const patch = {
  version: 1 as const,
  baseRevision: 1,
  op: "replace" as const,
  targetId: "overview",
  panel: replacement,
};
const next = applyPatch(two, patch);
assert.equal(panels(next.tree)[1], panels(two.tree)[1]);
assert.notEqual(panels(next.tree)[0], panels(two.tree)[0]);
assert.equal(panels(next.tree)[0].props.id, "overview");
assert.throws(() => applyPatch(next, patch), /Stale/);
assert.throws(() => applyPatch(two, { ...patch, targetId: "missing" }));
assert.throws(() => applyPatch(two, { ...patch, panel: { name: "Text", props: { text: "bad" } } }));
assert.throws(() => singlePanel('root = Stack([Text("Not a panel")])'));
let full = two;
for (let i = 2; i < 8; i++)
  full = applyPatch(full, { ...patch, baseRevision: full.revision, op: "add", targetId: `panel${i}` });
assert.throws(() => applyPatch(full, { ...patch, baseRevision: full.revision, op: "add", targetId: "ninth" }));
const key = dataRefKey(toolRef);
const snapshots: DataResultMap = {
  [key]: {
    ref: toolRef,
    kind: "series",
    source: "demo",
    asOf: "2026-11-06T00:00:00.000Z",
    periodLabel: "Available",
    truncated: false,
    data: { labels: ["A"], series: [{ label: "Count", values: [1] }] },
  },
};
assert.equal(editSnapshots(next.tree, snapshots, {})[key], snapshots[key]);
assert.throws(() => editSnapshots(next.tree, snapshots, snapshots));
assert.throws(() => editSnapshots(next.tree, {}, {}));
assert.equal(references(next.tree).length, 1);
console.log(
  "PASS targeted identity, preserved snapshot objects, local IDs, stale patch, whole-tree limits and strict single-panel gate",
);

assert.throws(() => singlePanel(toolText, new Set()));
assert.throws(() =>
  singlePanel(
    toolText +
      `; hidden = DashboardChart("Hidden", "line", ${JSON.stringify({ ...toolRef, args: { ...toolRef.args, limit: 25 } })})`,
    new Set([dataRefKey(toolRef)]),
  ),
);

const editRequest = {
  operation: "edit",
  messages: [{ role: "user", content: "Make this a bar chart" }],
  edit: { definition: toolText, baseRevision: 0, op: "replace", targetId: "overview" },
};
assert.equal(requestSchema.safeParse(editRequest).success, true);
assert.equal(requestSchema.safeParse({ ...editRequest, results: snapshots }).success, false);
assert.equal(requestSchema.safeParse({ ...editRequest, edit: { ...editRequest.edit, op: "remove" } }).success, false);
assert.equal(requestSchema.safeParse({ ...editRequest, edit: undefined }).success, false);

for (const timezone of ["America/Los_Angeles", "Asia/Tokyo", "UTC"]) {
  process.env.TZ = timezone;
  assert.equal(formatSnapshotTime("2026-11-06T21:50:59.934Z"), "Nov 6, 2026, 21:50 UTC");
  assert.equal(formatSnapshotTime("2026-04-01T00:00:00.000Z"), "Apr 1, 2026, 00:00 UTC");
  assert.equal(formatReportingDate("2026-04-01"), "Apr 1, 2026");
  assert.equal(formatReportingMonth("2026-04-01T00:00:00.000Z"), "Apr 2026");
}

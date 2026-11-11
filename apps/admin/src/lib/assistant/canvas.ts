import { type DataRef, type DataResultMap, dataRefKey, dataRefSchema } from "./data-contract.ts";
import { inspectLanguage, serializeTree, validateTree } from "./language.ts";
import { type SafeNode, schemas } from "./registry.ts";

export type DashboardDefinition = { version: 1; revision: number; tree: SafeNode };
export type DashboardPatch = {
  version: 1;
  baseRevision: number;
  op: "replace" | "add";
  targetId: string;
  panel: SafeNode;
};
export function panels(tree: SafeNode): SafeNode[] {
  if (tree.name === "Panel") return [tree];
  return ((tree.props.children ?? []) as SafeNode[]).flatMap(panels);
}
export function references(tree: SafeNode): DataRef[] {
  const found = new Map<string, DataRef>();
  function visit(node: SafeNode) {
    const ref = dataRefSchema.safeParse(node.props.data);
    if (ref.success) found.set(dataRefKey(ref.data), ref.data);
    for (const child of (node.props.children ?? []) as SafeNode[]) visit(child);
  }
  visit(tree);
  return [...found.values()];
}
export function singlePanel(source: string, allowedRefs?: ReadonlySet<string>): SafeNode {
  const checked = inspectLanguage(source, true, undefined, allowedRefs);
  const root = checked.tree;
  const children = root?.props.children as SafeNode[] | undefined;
  const grid = children?.[0];
  const items = grid?.props.children as SafeNode[] | undefined;
  if (
    checked.status !== "ready" ||
    children?.length !== 1 ||
    grid?.name !== "DashboardGrid" ||
    items?.length !== 1 ||
    items[0].name !== "Panel"
  )
    throw new Error("One panel required");
  return items[0];
}
export function applyPatch(current: DashboardDefinition, patch: DashboardPatch): DashboardDefinition {
  if (patch.version !== 1 || patch.baseRevision !== current.revision || !["replace", "add"].includes(patch.op))
    throw new Error("Stale dashboard edit");
  const existing = panels(current.tree);
  const target = existing.find((p) => p.props.id === patch.targetId);
  if (patch.op === "replace" ? !target : !!target) throw new Error("Invalid target");
  const panel = { ...patch.panel, props: { ...schemas.Panel.parse(patch.panel.props), id: patch.targetId } };
  if (panel.name !== "Panel") throw new Error("Panel required");
  let added = false;
  function update(node: SafeNode): SafeNode {
    if (node === target) return panel;
    const children = node.props.children as SafeNode[] | undefined;
    if (!children) return node;
    let next = children.map(update);
    if (patch.op === "add" && node.name === "DashboardGrid" && !added) {
      next = [...next, panel];
      added = true;
    }
    return next.length === children.length && next.every((child, i) => child === children[i])
      ? node
      : { ...node, props: { ...node.props, children: next } };
  }
  const tree = update(current.tree);
  if (patch.op === "add" && !added) throw new Error("Dashboard grid required");
  validateTree(tree);
  return { version: 1, revision: current.revision + 1, tree };
}
/** Keep existing snapshot objects; accept only newly resolved refs, never replacements from an edit. */
export function editSnapshots(tree: SafeNode, old: DataResultMap, fresh: DataResultMap): DataResultMap {
  const refs = references(tree);
  if (Object.keys(fresh).some((key) => old[key] || !refs.some((ref) => dataRefKey(ref) === key)))
    throw new Error("Unexpected edit result");
  const results = Object.fromEntries(
    refs.map((ref) => {
      const key = dataRefKey(ref);
      return [key, old[key] ?? fresh[key]];
    }),
  );
  validateTree(tree, results);
  return results;
}
export function panelSource(panel: SafeNode) {
  return serializeTree({
    name: "Stack",
    props: { children: [{ name: "DashboardGrid", props: { children: [panel] } }] },
  });
}

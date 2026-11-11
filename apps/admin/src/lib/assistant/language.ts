import { type DataRef, type DataResultMap, dataRefKey, dataResultMapSchema } from "./data-contract.ts";
import { bytes, type ComponentName, limits, type SafeNode, schemas } from "./registry.ts";

type Value = string | number | boolean | null | Value[] | { [key: string]: Value } | Call | Ref;
type Call = { call: string; args: Value[] };
type Ref = { ref: string };
class Pending extends Error {}
class Invalid extends Error {}
const names = new Set(Object.keys(schemas));
// A deliberately smaller, non-executable subset of OpenUI Lang. Never send raw
// model source to the OpenUI evaluator. Only canonical, validated literal calls.
export function inspectLanguage(
  source: string,
  complete = false,
  results?: DataResultMap,
  allowedRefs?: ReadonlySet<string>,
): { status: "ready" | "pending" | "invalid"; response: string | null; tree?: SafeNode } {
  if (bytes(source) > limits.outputBytes) return { status: "invalid", response: null };
  let offset = 0;
  let count = 0;
  const statements = new Map<string, Value>();
  const skip = () => {
    while (/\s/.test(source[offset] ?? "") && offset < source.length) offset++;
  };
  const take = (token: string) => {
    skip();
    if (offset === source.length) throw new Pending();
    if (source[offset++] !== token) throw new Invalid();
  };
  const identifier = () => {
    skip();
    const match = /^[A-Za-z][A-Za-z0-9_]{0,63}/.exec(source.slice(offset));
    if (!match) {
      if (offset === source.length) throw new Pending();
      throw new Invalid();
    }
    offset += match[0].length;
    return match[0];
  };
  function value(depth: number): Value {
    if (depth > 36 || ++count > 12000) throw new Invalid();
    skip();
    if (offset === source.length) throw new Pending();
    const char = source[offset];
    if (char === '"') {
      const start = offset++;
      let escaped = false;
      while (offset < source.length) {
        const current = source[offset++];
        if (current === '"' && !escaped) return JSON.parse(source.slice(start, offset)) as string;
        escaped = current === "\\" && !escaped;
      }
      throw new Pending();
    }
    if (char === "[") {
      offset++;
      const result: Value[] = [];
      skip();
      if (source[offset] === "]") {
        offset++;
        return result;
      }
      while (true) {
        result.push(value(depth + 1));
        skip();
        if (source[offset] === "]") {
          offset++;
          return result;
        }
        take(",");
      }
    }
    if (char === "{") {
      offset++;
      const result: Record<string, Value> = Object.create(null);
      skip();
      if (source[offset] === "}") {
        offset++;
        return result;
      }
      while (true) {
        const key = source[offset] === '"' ? value(depth + 1) : identifier();
        if (
          typeof key !== "string" ||
          ["__proto__", "constructor", "prototype", "call", "ref"].includes(key) ||
          Object.hasOwn(result, key)
        )
          throw new Invalid();
        take(":");
        result[key] = value(depth + 1);
        skip();
        if (source[offset] === "}") {
          offset++;
          return result;
        }
        take(",");
        skip();
      }
    }
    if (!complete && /^-?(?:\d+(?:\.\d*)?(?:[eE][+-]?\d*)?)?$/.test(source.slice(offset))) throw new Pending();
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(source.slice(offset));
    if (number) {
      offset += number[0].length;
      const result = Number(number[0]);
      if (!Number.isFinite(result)) throw new Invalid();
      return result;
    }
    const name = identifier();
    skip();
    if (name === "true") return true;
    if (name === "false") return false;
    if (name === "null") return null;
    if (source[offset] !== "(") return { ref: name };
    if (!names.has(name)) throw new Invalid();
    offset++;
    const args: Value[] = [];
    skip();
    if (source[offset] === ")") {
      offset++;
      return { call: name, args };
    }
    while (true) {
      args.push(value(depth + 1));
      skip();
      if (source[offset] === ")") {
        offset++;
        return { call: name, args };
      }
      take(",");
    }
  }
  let pending = false;
  try {
    while (true) {
      skip();
      if (offset === source.length) break;
      if (statements.size >= limits.nodes) throw new Invalid();
      const name = identifier();
      if (statements.has(name) || names.has(name)) throw new Invalid();
      take("=");
      const result = value(0);
      skip();
      if (source[offset] === ";") offset++;
      // Values are committed only once a whole statement has parsed.
      statements.set(name, result);
    }
  } catch (error) {
    if (!(error instanceof Pending) || complete) return { status: "invalid", response: null };
    pending = true;
  }
  const constructed = new WeakSet<object>();
  let nodes = 0;
  let work = 0;
  const visitedReferences = new Set(["root"]);
  let unresolved = false;
  let usesBlocks = false;
  function resolve(input: Value, depth: number, refs: Set<string>): unknown {
    if (++work > 12000 || depth > limits.depth) throw new Invalid();
    if (Array.isArray(input)) return input.map((item) => resolve(item, depth, refs));
    if (input === null || typeof input !== "object") return input;
    if ("ref" in input) {
      const name = input.ref as string;
      if (refs.has(name)) throw new Invalid();
      visitedReferences.add(name);
      const found = statements.get(name);
      if (found === undefined) {
        unresolved = true;
        return null;
      }
      return resolve(found, depth, new Set([...refs, name]));
    }
    if ("call" in input) {
      if (++nodes > limits.nodes) throw new Invalid();
      const call = input as Call;
      const name = call.call as ComponentName;
      const schema = schemas[name];
      if (
        ["DashboardGrid", "Panel", "DashboardCard", "PageHeader", "StatCard", "DashboardChart", "DataTable"].includes(
          name,
        )
      )
        usesBlocks = true;
      const keys = Object.keys(schema.shape);
      if (call.args.length !== keys.length) throw new Invalid();
      const raw = Object.fromEntries(keys.map((key, index) => [key, resolve(call.args[index], depth + 1, refs)]));
      if ("children" in schema.shape) {
        if (!Array.isArray(raw.children)) throw new Invalid();
        raw.children = raw.children.filter((child) => child !== null);
        if (
          !(raw.children as unknown[]).every(
            (child) => typeof child === "object" && child !== null && constructed.has(child),
          )
        )
          throw new Invalid();
      }
      const checked = schema.safeParse(raw);
      if (!checked.success) throw new Invalid();
      const node = { name, props: checked.data } satisfies SafeNode;
      constructed.add(node);
      return node;
    }
    return Object.fromEntries(Object.entries(input).map(([key, val]) => [key, resolve(val, depth, refs)]));
  }
  try {
    const rootValue = statements.get("root");
    if (!rootValue) return { status: complete ? "invalid" : "pending", response: null };
    const root = resolve(rootValue, 1, new Set(["root"])) as SafeNode | null;
    const unreachable: SafeNode[] = [];
    function collectUnused(value: unknown) {
      if (++work > 12000) throw new Invalid();
      if (!value || typeof value !== "object") return;
      if (constructed.has(value)) unreachable.push(value as SafeNode);
      else for (const child of Object.values(value)) collectUnused(child);
    }
    // Validate unreachable statements too; they cannot hide unsupported calls.
    for (const [key, val] of statements)
      if (!visitedReferences.has(key)) {
        const unused = resolve(val, 1, new Set([key]));
        collectUnused(unused);
      }
    if (!root && unresolved && !complete) return { status: "pending", response: null };
    if (!root || root.name !== "Stack" || (complete && unresolved)) throw new Invalid();
    if (unresolved && usesBlocks) return { status: "pending", response: null };
    validateTree(
      { name: "Stack", props: { children: [...(root.props.children as SafeNode[]), ...unreachable] } },
      results,
      allowedRefs,
    );
    return { status: pending || unresolved ? "pending" : "ready", response: `root = ${serialize(root)}`, tree: root };
  } catch {
    return { status: "invalid", response: null };
  }
}
function serialize(value: unknown): string {
  if (value && typeof value === "object" && "name" in value && "props" in value) {
    const node = value as SafeNode;
    return `${node.name}(${Object.keys(schemas[node.name].shape)
      .map((key) => serialize(node.props[key]))
      .join(",")})`;
  }
  if (Array.isArray(value)) return `[${value.map(serialize).join(",")}]`;
  return JSON.stringify(value);
}

/** Validate again when application code constructs or edits a tree; no evaluator or I/O. */
export function validateTree(root: SafeNode, results?: DataResultMap, allowedRefs?: ReadonlySet<string>): SafeNode {
  const snapshots = results === undefined ? undefined : dataResultMapSchema.parse(results);
  const ids = new Set<string>();
  const refs = new Set<string>();
  let nodes = 0;
  function visit(node: SafeNode, depth: number, parent?: string) {
    if (++nodes > limits.nodes || depth > limits.depth || !Object.hasOwn(schemas, node.name))
      throw new Error("Invalid tree");
    const props = schemas[node.name].parse(node.props);
    if (node.name === "Panel") {
      const p = schemas.Panel.parse(props);
      if (parent !== "DashboardGrid" || ids.has(p.id) || p.children.length !== 1) throw new Error("Invalid panel");
      ids.add(p.id);
      if (ids.size > limits.panels) throw new Error("Too many panels");
    }
    if ("data" in props && props.data.kind === "data-ref") {
      const ref = props.data as DataRef;
      const key = dataRefKey(ref);
      if (allowedRefs && !allowedRefs.has(key)) throw new Error("Unknown reference");
      refs.add(key);
      if (refs.size > limits.refs) throw new Error("Too many references");
      const expected = ({ StatCard: "stat", DataTable: "table", DashboardChart: "series" } as Record<string, string>)[
        node.name
      ];
      // The initial capability catalog exposes series only.
      if (expected !== "series") throw new Error("Incompatible reference kind");
      if (snapshots && (!snapshots[key] || snapshots[key].kind !== expected))
        throw new Error("Unknown or incompatible result");
    }
    if ("children" in props)
      for (const child of props.children) {
        if (!child || typeof child !== "object" || !("name" in child) || !("props" in child))
          throw new Error("Invalid child");
        const next = child as SafeNode;
        if (node.name === "DashboardGrid" && next.name !== "Panel") throw new Error("Grid requires panels");
        visit(next, depth + 1, node.name);
      }
  }
  if (root.name !== "Stack") throw new Error("Stack root required");
  visit(root, 1);
  if (snapshots && Object.keys(snapshots).some((key) => !refs.has(key))) throw new Error("Unused result reference");
  let work = 0;
  function countWork(value: unknown) {
    if (++work > 12000) throw new Error("Tree work limit exceeded");
    if (value && typeof value === "object") for (const child of Object.values(value)) countWork(child);
  }
  countWork(root);
  if (bytes(`root = ${serialize(root)}`) > limits.outputBytes) throw new Error("Tree too large");
  return root;
}
export function serializeTree(root: SafeNode, results?: DataResultMap): string {
  return `root = ${serialize(validateTree(root, results))}`;
}

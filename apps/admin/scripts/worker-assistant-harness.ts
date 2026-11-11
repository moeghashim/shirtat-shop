// Test-only egress barrier around the actual compiled application. Not imported by production.
// @ts-expect-error Generated module has no declaration.
import app from "../.output/server/index.mjs";
import { providers } from "../src/server/assistant/config.server.ts";
import { finalToolWire, fragmentWire, toolArgs, toolWire } from "./assistant-tool-wire.ts";
import { type WireCase, wireResponse } from "./assistant-wire-fixtures.ts";

let calls = 0;
let cancelled = 0;
let violations = 0;
let leaks = 0;
for (const method of ["log", "warn", "error", "info", "debug"] as const) {
  const original = console[method].bind(console);
  console[method] = (...args) => {
    if (/synthetic-v07-|SYNTHETIC_USER_PROMPT|Synthetic Café|Bearer /i.test(args.map(String).join(" "))) {
      leaks++;
      return;
    }
    original(...args);
  };
}
const outputRequests: {
  provider: string;
  model: string;
  explicitKey: boolean;
  storageDisabled: boolean;
  noTools: boolean;
  cap: boolean;
  instructions: boolean;
}[] = [];
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  const id =
    url.hostname === "api.anthropic.com"
      ? "anthropic"
      : url.hostname === "api.openai.com"
        ? "openai"
        : url.hostname === "api.x.ai"
          ? "xai"
          : url.hostname === "api.meta.ai"
            ? "meta"
            : url.hostname === "generativelanguage.googleapis.com"
              ? "google"
              : undefined;
  if (!id) {
    violations++;
    throw new Error("Test blocked unexpected egress.");
  }
  calls++;
  const headers = new Headers(init?.headers);
  const key = [...headers.values()].find((value) => value.includes("synthetic-v07-")) ?? "";
  const mode = (key.split("synthetic-v07-")[1]?.split("-")[1] as WireCase) ?? "success";
  const body = JSON.parse(String(init?.body));
  if (key.includes("-tools")) {
    const padding = key.includes("aggregate") ? `:${"x".repeat(1100000)}\n\n` : "";
    if (body.tools?.length && key.includes("editnocall")) return fragmentWire(finalToolWire(id));
    if (body.tools?.length)
      return fragmentWire(
        padding +
          toolWire(
            id,
            key.includes("unknown") ? "write_data" : "dashboard_read",
            key.includes("invalid") ? { ...toolArgs, range: "90days" } : toolArgs,
            key.includes("fifth") ? 5 : key.includes("multi") ? 2 : 1,
          ),
        padding ? 4096 : 17,
      );
    return fragmentWire(padding + (key.includes("finalcall") ? toolWire(id) : finalToolWire(id)), padding ? 4096 : 17);
  }
  outputRequests.push({
    provider: id,
    model: body.model ?? providers.find((p) => p.id === id)!.model,
    explicitKey: key.includes(`synthetic-v07-${id}-`),
    storageDisabled: !["openai", "xai"].includes(id) || body.store === false,
    noTools: !body.tools?.length,
    cap: body.max_tokens === 4096 || body.max_output_tokens === 4096 || body.generationConfig?.maxOutputTokens === 4096,
    instructions: JSON.stringify(body).includes("Stack"),
  });
  return wireResponse(id, mode, init?.signal, () => {
    cancelled++;
  });
};
export default {
  fetch(request: Request, env: unknown, context: unknown) {
    const url = new URL(request.url);
    if (url.pathname === "/__assistant_probe")
      return Response.json({ calls, cancelled, violations, leaks, outputRequests });
    const scoped = { ...(env as Record<string, unknown>) };
    const enabled = request.headers.get("x-v07-providers");
    if (enabled !== null)
      for (const entry of providers) if (!enabled.split(",").includes(entry.id)) delete scoped[entry.key];
    const mode = request.headers.get("x-v07-case") ?? "success";
    for (const entry of providers) if (scoped[entry.key]) scoped[entry.key] = `synthetic-v07-${entry.id}-${mode}`;
    return app.fetch(request, scoped, context);
  },
};

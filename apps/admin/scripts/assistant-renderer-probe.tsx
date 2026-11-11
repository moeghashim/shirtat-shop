import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { ResponseBoundary, SafeResponse } from "../src/routes/(main)/dashboard/assistant/-components/safe-response";

// Development-only browser regression entrypoint, never imported by application code.
export async function run() {
  const host = document.createElement("section");
  host.setAttribute("aria-label", "Renderer safety regression");
  document.querySelector("main")?.append(host);
  const root = createRoot(host, {
    onCaughtError() {
      /* Expected synthetic throw; no output logging. */
    },
  });
  flushSync(() => root.render(<SafeResponse text={'root = iframe("https://invalid.test")'} complete />));
  const rejected = !!host.textContent?.includes("unsupported content") && !host.querySelector("iframe");
  flushSync(() => root.render(<SafeResponse text={'root = Stack([Text("Recovered safely")])'} complete />));
  await new Promise((resolve) => setTimeout(resolve, 100));
  const recovered = host.textContent?.includes("Recovered safely") === true;
  flushSync(() =>
    root.render(
      <ResponseBoundary>
        <Failing />
      </ResponseBoundary>,
    ),
  );
  const boundary = host.textContent?.includes("could not be displayed") === true;
  return { rejected, recovered, boundary };
}

function Failing(): never {
  throw new Error("Synthetic renderer failure");
}

export async function runBlocks() {
  const { AssistantDataProvider } = await import("../src/routes/(main)/dashboard/assistant/-components/registry");
  const { dataRefSchema, dataRefKey } = await import("../src/lib/assistant/data-contract");
  const ref = dataRefSchema.parse({
    kind: "data-ref",
    version: 1,
    tool: "dashboard_read",
    args: { domain: "default", metric: "performance", range: "available", segment: "all", limit: 10 },
  });
  const text = `root = Stack([DashboardGrid([Panel("stable",[DashboardChart("Host snapshot","line",${JSON.stringify(ref)})])])])`;
  const host = document.createElement("section");
  document.querySelector("main")?.append(host);
  const root = createRoot(host);
  const render = (value: number) =>
    flushSync(() =>
      root.render(
        <AssistantDataProvider
          results={{
            [dataRefKey(ref)]: {
              ref,
              kind: "series",
              data: { labels: ["Sample"], series: [{ label: "Count", values: [value] }] },
              source: "demo",
              asOf: "2026-11-06T00:00:00.000Z",
              periodLabel: "Available",
              truncated: false,
            },
          }}
        >
          <SafeResponse text={text} complete />
        </AssistantDataProvider>,
      ),
    );
  render(73);
  await new Promise((resolve) => setTimeout(resolve, 100));
  const first = host.querySelector("[data-panel-id]");
  const initial = host.textContent?.includes("73");
  render(91);
  await new Promise((resolve) => setTimeout(resolve, 100));
  const refreshed = host.textContent?.includes("91") && !host.textContent?.includes("73");
  const stable = first === host.querySelector("[data-panel-id]");
  root.unmount();
  host.remove();
  return { initial, refreshed, stable };
}

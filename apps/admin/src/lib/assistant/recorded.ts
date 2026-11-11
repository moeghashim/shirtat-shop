import { encodeEvent } from "./transport.ts";

export const examples = [
  { id: "overview", label: "Summarize a sample launch", prompt: "Summarize a sample launch" },
  { id: "table", label: "Compare sample plans", prompt: "Compare sample plans in a table" },
  { id: "chart", label: "Chart a sample week", prompt: "Chart a sample week" },
] as const;
export const recordedReplies = {
  overview:
    'root = Stack([intro,summary,notes])\nintro = Text("Recorded example · Illustrative launch data, not your workspace records.")\nsummary = Card("Launch snapshot", [Stat("Ready tasks", "18 of 24", "A synthetic planning example."), Badge("On track", "success")])\nnotes = List(["Confirm the remaining review owners.", "Reserve time for accessibility checks.", "Share the release notes after approval."])',
  table:
    'root = Stack([intro,plans])\nintro = Text("Recorded comparison · Fictional plans for illustration only.")\nplans = Card("Sample plans", [Table(["Plan", "Seats", "Monthly price"], [["Starter", 3, "$12"], ["Team", 12, "$36"], ["Studio", 30, "$72"]]), Badge("Illustrative", "neutral")])',
  chart:
    'root = Stack([intro,bars,lines])\nintro = Text("Recorded charts · Synthetic counts for one sample week.")\nbars = Chart("Sample tasks completed", "bar", ["Mon", "Tue", "Wed", "Thu", "Fri"], [{label: "Completed", values: [8,12,9,16,14]}, {label: "Planned", values: [10,12,12,15,16]}])\nlines = Chart("Sample review trend", "line", ["Mon", "Tue", "Wed", "Thu", "Fri"], [{label: "Reviewed", values: [3,5,8,7,11]}])',
};
export function recordedReply(prompt: string) {
  if (prompt.trim().toLowerCase() === "show sample blocks") return blockRecordedReply;
  const key = /chart|week/i.test(prompt) ? "chart" : /table|plan|compare/i.test(prompt) ? "table" : "overview";
  const matched = examples.some((example) => example.prompt.toLowerCase() === prompt.trim().toLowerCase());
  return matched
    ? recordedReplies[key]
    : recordedReplies[key].replace("Recorded", "Recorded fallback — no model was called. Recorded");
}
export function recordedStream(prompt: string, signal: AbortSignal, delayMs = 24) {
  const response = recordedReply(prompt);
  let offset = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let wake: (() => void) | undefined;
  const cancel = () => {
    clearTimeout(timer);
    wake?.();
  };
  signal.addEventListener("abort", cancel, { once: true });
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (signal.aborted) {
        controller.close();
        signal.removeEventListener("abort", cancel);
        return;
      }
      if (offset >= response.length) {
        controller.enqueue(encodeEvent({ v: 1, type: "finish" }));
        controller.close();
        signal.removeEventListener("abort", cancel);
        return;
      }
      await new Promise<void>((resolve) => {
        wake = resolve;
        timer = setTimeout(resolve, delayMs);
      });
      if (signal.aborted) {
        controller.close();
        signal.removeEventListener("abort", cancel);
        return;
      }
      controller.enqueue(encodeEvent({ v: 1, type: "text-delta", text: response.slice(offset, offset + 32) }));
      offset += 32;
    },
    cancel() {
      cancel();
      signal.removeEventListener("abort", cancel);
    },
  });
}

/** Literal library showcase; workspace-backed recorded dashboards belong to task 003. */
export const blockRecordedReply = `root = Stack([PageHeader("Sample blocks", "Illustrative values, not workspace records."), DashboardGrid([
Panel("summary", [DashboardCard("Sample launch", [StatCard({kind:"literal",value:{label:"Ready tasks",value:18,detail:"Synthetic planning example."}})])]),
Panel("plans", [DataTable("Sample plans", {kind:"literal",value:{columns:["Plan","Seats"],rows:[["Starter",3],["Team",12]]}})]),
Panel("bar", [DashboardChart("Sample completed", "bar", {kind:"literal",value:{labels:["Mon","Tue"],series:[{label:"Completed",values:[8,12]}]}})]),
Panel("line", [DashboardChart("Sample reviewed", "line", {kind:"literal",value:{labels:["Mon","Tue"],series:[{label:"Reviewed",values:[3,5]}]}})]),
Panel("area", [DashboardChart("Sample activity", "area", {kind:"literal",value:{labels:["Mon","Tue"],series:[{label:"Activity",values:[4,9]}]}})])
])])`;

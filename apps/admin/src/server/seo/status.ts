import type { SeoStatus, SeoTask } from "../../../../../lib/seo-plan/types.ts";
import { checkedByLine, formatCheckDate, planDoneLine, type SeoChecklistLocale } from "./copy.ts";

export interface TaskCheckState {
  done: boolean;
  doneAt: Date | null;
  doneByName: string | null;
}

// A saved check overrides the done bit. Unchecking a plan-done task returns it to not-started.
export function effectiveTaskStatus(planStatus: SeoStatus, check: { done: boolean } | null | undefined): SeoStatus {
  if (!check) return planStatus;
  if (check.done) return "done";
  return planStatus === "done" ? "not-started" : planStatus;
}

export function applyTaskChecks(
  tasks: readonly SeoTask[],
  checks: readonly { done: boolean; taskId: string }[],
): SeoTask[] {
  const byId = new Map(checks.map((check) => [check.taskId, check]));
  return tasks.map((task) => {
    const status = effectiveTaskStatus(task.status, byId.get(task.id));
    return status === task.status ? task : { ...task, status };
  });
}

export function parseCheckedFilter(value: string | undefined): "all" | "done" | "open" {
  if (value === "done" || value === "open") return value;
  return "all";
}

export function matchesCheckedFilter(status: SeoStatus, filter: "all" | "done" | "open"): boolean {
  if (filter === "done") return status === "done";
  if (filter === "open") return status !== "done";
  return true;
}

export function completionLine(
  locale: SeoChecklistLocale,
  input: { check: TaskCheckState | null; planStatus: SeoStatus; planUpdated: string },
): string | null {
  const status = effectiveTaskStatus(input.planStatus, input.check);
  if (status !== "done") return null;
  if (input.check?.done) {
    const when = input.check.doneAt ? formatCheckDate(input.check.doneAt, locale) : null;
    return checkedByLine(locale, input.check.doneByName, when);
  }
  const updated = new Date(`${input.planUpdated}T00:00:00Z`);
  if (Number.isNaN(updated.getTime())) return planDoneLine(locale, input.planUpdated);
  return planDoneLine(locale, formatCheckDate(updated, locale));
}

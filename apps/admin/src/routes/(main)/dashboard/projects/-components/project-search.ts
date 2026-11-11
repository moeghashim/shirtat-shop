import { z } from "zod";

import { priorities, taskStatuses } from "@/server/data/projects.types";
export const searchSchema = z.object({
  query: z.string().max(200).catch(""),
  status: z.enum(taskStatuses).optional().catch(undefined),
  assigneeId: z.string().max(120).optional().catch(undefined),
  priority: z.enum(priorities).optional().catch(undefined),
  label: z.string().max(80).optional().catch(undefined),
  sort: z.enum(["position", "dueDate", "title"]).catch("position"),
  offset: z.number().int().min(0).max(100000).catch(0),
  limit: z.union([z.literal(10), z.literal(20), z.literal(50), z.literal(100)]).catch(100),
});
export type ProjectSearch = z.infer<typeof searchSchema>;
export const statusLabels = {
  backlog: "Backlog",
  todo: "To do",
  "in-progress": "In progress",
  review: "Review",
  done: "Done",
  canceled: "Canceled",
};
export function displayDate(date: string | null) {
  return date
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
        new Date(`${date}T00:00:00Z`),
      )
    : "Unscheduled";
}

export function relativeDueDate(date: string | null, today: string) {
  if (!date) return "No due date";
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return new Intl.DateTimeFormat(
    "en-US",
    days > 1 && days < 7 ? { weekday: "short", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" },
  ).format(new Date(`${date}T00:00:00Z`));
}

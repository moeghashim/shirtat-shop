import { ArrowDown, ArrowRight, ArrowUp, CheckCircle, Circle, CircleOff, HelpCircle, Timer } from "lucide-react";
import { z } from "zod";

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
});

export type Task = z.infer<typeof taskSchema>;

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const statuses = [
  {
    value: "backlog",
    label: "Backlog",
    icon: HelpCircle,
    className: "bg-muted text-muted-foreground",
  },
  {
    value: "todo",
    label: "Todo",
    icon: Circle,
    className: "bg-info-surface text-info",
  },
  {
    value: "in progress",
    label: "In Progress",
    icon: Timer,
    className: "bg-warning-surface text-warning",
  },
  {
    value: "done",
    label: "Done",
    icon: CheckCircle,
    className: "bg-success-surface text-success",
  },
  {
    value: "canceled",
    label: "Canceled",
    icon: CircleOff,
    className: "bg-muted text-muted-foreground",
  },
];

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDown,
    className: "bg-muted text-muted-foreground",
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRight,
    className: "bg-warning-surface text-warning",
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUp,
    className: "bg-danger-surface text-danger",
  },
];

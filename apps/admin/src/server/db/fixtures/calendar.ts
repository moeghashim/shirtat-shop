import type { CalendarTemplate } from "../../data/calendar.types.ts";

type Civil = { day: number; hour?: number; minute?: number; month?: number };
const events: { title: string; start: Civil; end?: Civil; allDay?: boolean; groupId?: string; display?: string }[] = [
  { title: "Monthly planning", start: { day: 1, hour: 9, minute: 30 }, end: { day: 1, hour: 10, minute: 30 } },
  { title: "Design review", start: { day: 3, hour: 11, minute: 0 }, end: { day: 3, hour: 12, minute: 0 } },
  { title: "Client check-in", start: { day: 4, hour: 15, minute: 0 }, end: { day: 4, hour: 15, minute: 45 } },
  { title: "Product workshop", start: { day: 7 }, end: { day: 9 }, allDay: true },
  { groupId: "standup", title: "Team standup", start: { day: 9, hour: 10, minute: 0 } },
  { title: "Finance sync", start: { day: 10, hour: 14, minute: 30 }, end: { day: 10, hour: 15, minute: 0 } },
  {
    title: "Focus block",
    start: { day: 12, hour: 9, minute: 0 },
    end: { day: 12, hour: 12, minute: 0 },
    display: "background",
  },
  {
    title: "Release readiness — accessibility, documentation and support review",
    start: { day: 15, hour: 13, minute: 0 },
    end: { day: 15, hour: 14, minute: 0 },
  },
  { title: "Team retrospective", start: { day: 15, hour: 15, minute: 0 }, end: { day: 15, hour: 16, minute: 0 } },
  { title: "Sprint planning", start: { day: 15, hour: 9, minute: 30 }, end: { day: 15, hour: 11, minute: 0 } },
  { groupId: "standup", title: "Team standup", start: { day: 16, hour: 10, minute: 0 } },
  { title: "Ops handoff", start: { day: 18, hour: 16, minute: 0 }, end: { day: 18, hour: 16, minute: 45 } },
  { title: "Quarterly report due", start: { day: 24 }, allDay: true },
  { title: "Reset day", start: { day: 28 }, allDay: true },
  { title: "Jordan Lee Birthday", start: { day: 6, month: 9 }, allDay: true },
];
export const templates: CalendarTemplate[] = events.map((e, i) => ({
  id: `event-${i + 1}`,
  title: e.title,
  startDay: e.start.day,
  startHour: e.start.hour ?? null,
  startMinute: e.start.minute ?? null,
  endDay: e.end?.day ?? null,
  endHour: e.end?.hour ?? null,
  endMinute: e.end?.minute ?? null,
  fixedMonth: e.start.month ?? null,
  allDay: e.allDay ?? null,
  groupId: e.groupId ?? null,
  display: e.display ?? null,
}));
export const calendars = [
  { value: "all", label: "All calendars" },
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "team", label: "Team" },
  { value: "focus", label: "Focus time" },
];

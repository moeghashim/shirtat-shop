export type CalendarTemplate = {
  id: string;
  title: string;
  startDay: number;
  startHour: number | null;
  startMinute: number | null;
  endDay: number | null;
  endHour: number | null;
  endMinute: number | null;
  fixedMonth: number | null;
  allDay: boolean | null;
  groupId: string | null;
  display: string | null;
};
export type CalendarData = {
  renderedAt: string;
  templates: CalendarTemplate[];
  calendars: { value: string; label: string }[];
};
// Pure projection shared by parity and the browser; never reads a clock or fixture.
export function projectEvents(templates: CalendarTemplate[], renderedAt: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", timeZone }).formatToParts(
    new Date(renderedAt),
  );
  const year = parts.find((p) => p.type === "year")?.value;
  if (!year) throw new Error("Invalid calendar year");
  const month = Number(parts.find((p) => p.type === "month")?.value);
  if (!month) throw new Error("Invalid calendar month");
  const pad = (v: number) => String(v).padStart(2, "0");
  return templates.map((t) => {
    const date = (day: number, hour: number | null, minute: number | null) =>
      `${year}-${pad(t.fixedMonth ?? month)}-${pad(day)}${hour === null ? "" : `T${pad(hour)}:${pad(minute ?? 0)}:00`}`;
    return {
      id: `event:${t.id}`,
      title: t.title,
      start: date(t.startDay, t.startHour, t.startMinute),
      ...(t.endDay === null ? {} : { end: date(t.endDay, t.endHour, t.endMinute) }),
      ...(t.allDay === null ? {} : { allDay: t.allDay }),
      ...(t.groupId === null ? {} : { groupId: t.groupId }),
      ...(t.display === null ? {} : { display: t.display }),
    };
  });
}

import {
  scheduleRange,
  scheduleSpan,
  shiftMonths,
  spanPosition,
} from "../src/routes/(main)/dashboard/projects/-components/schedule.ts";
import { projectEvents } from "../src/server/data/calendar.types.ts";
import { addCivilDays, inclusiveDuration, type Task, taskCalendarEvents } from "../src/server/data/projects.types.ts";
import assert from "node:assert/strict";

for (const zone of ["UTC", "America/Chicago", "Pacific/Kiritimati"]) {
  process.env.TZ = zone;
  for (const [a, b, n] of [
    ["2026-03-07", "2026-03-09", 3],
    ["2026-10-31", "2026-11-02", 3],
    ["2028-02-28", "2028-03-01", 3],
    ["2026-12-31", "2027-01-01", 2],
  ] as const) {
    assert.equal(inclusiveDuration(a, b), n);
    assert.equal(scheduleSpan({ startDate: a, endDate: b })?.duration, n);
    assert.equal(addCivilDays(a, n - 1), b);
  }
  assert.equal(scheduleSpan({ startDate: null, endDate: null }), null);
  assert.equal(scheduleSpan({ startDate: "2026-06-20", endDate: null })?.duration, 1);
  for (const v of [
    { startDate: null, endDate: "2026-06-20" },
    { startDate: "2026-06-21", endDate: "2026-06-20" },
    { startDate: "2026-02-29", endDate: null },
  ])
    assert.throws(() => scheduleSpan(v));
  assert.equal(shiftMonths("2026-12-31", 1), "2027-01-01");
  assert.equal(scheduleRange("2028-02-14", "months", 1).days, 29);
  assert.throws(() => scheduleRange("2026-01-01", "weeks", 13));
  const range = scheduleRange("2026-06-20", "weeks", 1),
    span = scheduleSpan({ startDate: "2026-06-18", endDate: "2026-06-29" });
  assert.ok(span);
  assert.deepEqual(spanPosition(span, range), {
    visible: true,
    offset: 0,
    days: 7,
    continuesBefore: true,
    continuesAfter: true,
  });
  assert.equal(spanPosition({ start: "2026-01-01", end: "2026-01-02", duration: 2 }, range).visible, false);
  const task = {
    id: "sample:same",
    title: "A long schedule title ".repeat(20),
    startDate: "2026-06-20",
    endDate: null,
  } as Task;
  const events = taskCalendarEvents([task]);
  assert.equal(events[0].end, "2026-06-21");
  assert.equal(events[0].id, "task:sample:same");
  assert.equal(events[0].title, task.title);
  const templates = [
    {
      id: "sample:same",
      title: "Event",
      startDay: 1,
      startHour: null,
      startMinute: null,
      endDay: 2,
      endHour: null,
      endMinute: null,
      fixedMonth: null,
      allDay: true,
      groupId: null,
      display: null,
    },
  ];
  const projected = projectEvents(templates, "2026-01-01T00:30:00Z", zone);
  assert.equal(projected[0].id, "event:sample:same");
  assert.equal(projected[0].start, zone === "America/Chicago" ? "2025-12-01" : "2026-01-01");
  assert.throws(() => taskCalendarEvents([{ ...task, endDate: "2026-06-19" }]));
  console.log(
    `PASS ${zone}: civil spans, DST/leap/year edges, missing/same/reversed dates, clipping/bounds, long title, identity and request timezone projection`,
  );
}

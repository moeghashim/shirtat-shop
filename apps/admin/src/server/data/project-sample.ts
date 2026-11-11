import * as fixtures from "../db/fixtures/projects.ts";
import { addCivilDays, SAMPLE_DATE } from "./projects.types.ts";

// Only shipped samples move with the request clock. Adopter rows keep their dates.
export const sampleTaskIds = fixtures.projectTasks.map((task) => task.id);
const taskIds = new Set(sampleTaskIds);
const projectIds = new Set(fixtures.projects.map((project) => project.id));
const activityIds = new Set(fixtures.activity.map((activity) => activity.id));
export function sampleDayOffset(today: string) {
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${SAMPLE_DATE}T00:00:00Z`)) / 86400000);
}
function dates<T extends { startDate: string | null; dueDate: string | null; endDate?: string | null }>(
  row: T,
  today: string,
): T {
  const shift = (date: string | null) => (date === null ? null : addCivilDays(date, sampleDayOffset(today)));
  return {
    ...row,
    startDate: shift(row.startDate),
    dueDate: shift(row.dueDate),
    ...("endDate" in row ? { endDate: shift(row.endDate ?? null) } : {}),
  };
}
export function sampleTask<
  T extends { id: string; startDate: string | null; endDate: string | null; dueDate: string | null },
>(row: T, today: string): T {
  return taskIds.has(row.id) ? dates(row, today) : row;
}
export function sampleProject<T extends { id: string; startDate: string | null; dueDate: string | null }>(
  row: T,
  today: string,
): T {
  return projectIds.has(row.id) ? dates(row, today) : row;
}
export function sampleActivity<T extends { id: string; occurredAt: string }>(row: T, today: string): T {
  return activityIds.has(row.id)
    ? {
        ...row,
        occurredAt: addCivilDays(row.occurredAt.slice(0, 10), sampleDayOffset(today)) + row.occurredAt.slice(10),
      }
    : row;
}

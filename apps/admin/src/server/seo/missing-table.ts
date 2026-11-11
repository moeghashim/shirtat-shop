export function isMissingChecksTable(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as { cause?: unknown; code?: unknown; message?: unknown };
    if (record.code === "42P01") return true;
    if (
      typeof record.message === "string" &&
      record.message.includes("seo_task_check") &&
      record.message.includes("does not exist")
    ) {
      return true;
    }
    current = record.cause;
  }
  return false;
}

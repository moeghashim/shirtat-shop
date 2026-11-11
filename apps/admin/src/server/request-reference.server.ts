import { getRequestHeader } from "@tanstack/react-start/server";

import { z } from "zod";

const referenceSchema = z.iso.datetime({ offset: true });
// A read-only capture input, never a replacement for Date or live client clocks.
// No header means the real request time; malformed headers are ignored.
export function requestReference() {
  const parsed = referenceSchema.safeParse(getRequestHeader("x-tenboards-qa-reference"));
  return parsed.success ? new Date(parsed.data).toISOString() : new Date().toISOString();
}

import { isOwner } from "../../lib/auth/roles.ts";
import type { AuthState } from "../../lib/auth/types.ts";
import type { DataSource } from "../data/source-config.ts";
import type { TaskCheckState } from "./status.ts";

export type SeoToggleDenial = "forbidden" | "unavailable" | "unknown-task";

export function canToggleSeoTasks(auth: AuthState): boolean {
  return auth.mode === "auth" && auth.user !== null && isOwner(auth.user);
}

export function seoToggleDecision(input: {
  auth: AuthState;
  knownTask: boolean;
  source: DataSource;
}): "allow" | SeoToggleDenial {
  if (!canToggleSeoTasks(input.auth)) return "forbidden";
  if (!input.knownTask) return "unknown-task";
  if (input.source !== "db") return "unavailable";
  return "allow";
}

export function nextTaskCheck(
  existing: TaskCheckState | null,
  done: boolean,
  actor: { id: string; name: string },
  now: Date,
): { changed: boolean } & TaskCheckState & { doneBy: string | null } {
  if (existing && existing.done === done) {
    return {
      changed: false,
      done: existing.done,
      doneAt: existing.doneAt,
      doneBy: null,
      doneByName: existing.doneByName,
    };
  }
  if (!done) return { changed: true, done: false, doneAt: null, doneBy: null, doneByName: null };
  return { changed: true, done: true, doneAt: now, doneBy: actor.id, doneByName: actor.name };
}

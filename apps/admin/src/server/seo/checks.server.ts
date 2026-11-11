import { eq } from "drizzle-orm";

import { seoPlan } from "../../../../../lib/seo-plan/index.ts";
import type { SeoStatus } from "../../../../../lib/seo-plan/types.ts";
import { readAuthState } from "../../lib/auth/session.server.ts";
import { selectSource } from "../data/source-config.ts";
import { authUser } from "../db/auth-schema.ts";
import { getDatabase } from "../db/client.server.ts";
import { seoTaskCheck } from "../db/seo-schema.ts";
import { runtimeEnvironment } from "../runtime.server.ts";
import { isMissingChecksTable } from "./missing-table.ts";
import { completionLine, effectiveTaskStatus, type TaskCheckState } from "./status.ts";
import { nextTaskCheck, type SeoToggleDenial, seoToggleDecision } from "./toggle.ts";

export interface SavedTaskCheck extends TaskCheckState {
  taskId: string;
}

export type SeoCheckRead =
  | { checks: SavedTaskCheck[]; state: "demo" | "missing-table" }
  | { checks: SavedTaskCheck[]; state: "ready" };

export type SeoToggleResult =
  | { completion: string | null; done: boolean; ok: true; status: SeoStatus; taskId: string }
  | { ok: false; reason: SeoToggleDenial };

function asDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function selectChecks(): Promise<SavedTaskCheck[]> {
  const rows = await getDatabase()
    .select({
      done: seoTaskCheck.done,
      doneAt: seoTaskCheck.doneAt,
      doneByName: authUser.name,
      taskId: seoTaskCheck.taskId,
    })
    .from(seoTaskCheck)
    .leftJoin(authUser, eq(seoTaskCheck.doneBy, authUser.id));
  return rows.map((row) => ({
    done: row.done,
    doneAt: asDate(row.doneAt),
    doneByName: row.doneByName,
    taskId: row.taskId,
  }));
}

export async function readSeoTaskChecks(): Promise<SeoCheckRead> {
  if (selectSource(runtimeEnvironment()) !== "db") return { checks: [], state: "demo" };
  try {
    return { checks: await selectChecks(), state: "ready" };
  } catch (error) {
    if (isMissingChecksTable(error)) return { checks: [], state: "missing-table" };
    throw new Error("Unable to load SEO task checks.");
  }
}

export async function toggleSeoTaskCheck(input: { done: boolean; taskId: string }): Promise<SeoToggleResult> {
  const auth = await readAuthState();
  const task = seoPlan.tasks.find((item) => item.id === input.taskId) ?? null;
  const decision = seoToggleDecision({
    auth,
    knownTask: task !== null,
    source: selectSource(runtimeEnvironment()),
  });
  if (decision !== "allow" || !task) return { ok: false, reason: decision === "allow" ? "unknown-task" : decision };
  const actor = auth.mode === "auth" ? auth.user : null;
  if (!actor) return { ok: false, reason: "forbidden" };

  let existing: SavedTaskCheck | null;
  try {
    const checks = await selectChecks();
    existing = checks.find((check) => check.taskId === input.taskId) ?? null;
  } catch (error) {
    if (isMissingChecksTable(error)) return { ok: false, reason: "unavailable" };
    throw new Error("Unable to load SEO task checks.");
  }

  const next = nextTaskCheck(existing, input.done, actor, new Date());
  if (next.changed) {
    try {
      await getDatabase()
        .insert(seoTaskCheck)
        .values({ done: next.done, doneAt: next.doneAt, doneBy: next.doneBy, taskId: input.taskId })
        .onConflictDoUpdate({
          target: seoTaskCheck.taskId,
          set: { done: next.done, doneAt: next.doneAt, doneBy: next.doneBy },
        });
    } catch (error) {
      if (isMissingChecksTable(error)) return { ok: false, reason: "unavailable" };
      throw new Error("Unable to save the SEO task check.");
    }
  }

  return {
    completion: completionLine("en", {
      check: { done: next.done, doneAt: next.doneAt, doneByName: next.doneByName },
      planStatus: task.status,
      planUpdated: task.updated,
    }),
    done: next.done,
    ok: true,
    status: effectiveTaskStatus(task.status, { done: next.done }),
    taskId: input.taskId,
  };
}

import { progressOf, seoPlan } from "../../../../../lib/seo-plan/index.ts";
import { isMissingChecksTable } from "./missing-table.ts";
import {
  applyTaskChecks,
  completionLine,
  effectiveTaskStatus,
  matchesCheckedFilter,
  parseCheckedFilter,
} from "./status.ts";
import { nextTaskCheck, seoToggleDecision } from "./toggle.ts";
import assert from "node:assert/strict";
import test from "node:test";

const providers = { github: false, google: false } as const;
const owner = { email: "owner@example.com", id: "owner-1", name: "Moe", role: "owner" };
const designer = { email: "designer@example.com", id: "designer-1", name: "Nora", role: "designer" };
const ownerEmail = { email: "moe@10claws.com", id: "owner-2", name: "Moe", role: "designer" };

test("effective status uses a saved check and otherwise keeps the plan", () => {
  assert.equal(effectiveTaskStatus("not-started", null), "not-started");
  assert.equal(effectiveTaskStatus("in-progress", undefined), "in-progress");
  assert.equal(effectiveTaskStatus("blocked-on-approval", { done: true }), "done");
  assert.equal(effectiveTaskStatus("done", { done: true }), "done");
  assert.equal(effectiveTaskStatus("done", { done: false }), "not-started");
  assert.equal(effectiveTaskStatus("in-progress", { done: false }), "in-progress");
  assert.equal(effectiveTaskStatus("blocked-on-approval", { done: false }), "blocked-on-approval");
  assert.equal(effectiveTaskStatus("not-started", { done: false }), "not-started");
});

test("progress counts follow the effective status", () => {
  const baseline = progressOf(seoPlan.tasks, "en");
  const checked = applyTaskChecks(seoPlan.tasks, [{ done: true, taskId: "1" }]);
  const progress = progressOf(checked, "en");
  assert.equal(progress.done, baseline.done + 1);
  assert.equal(progress.notStarted, baseline.notStarted - 1);
  assert.equal(progress.total, baseline.total);
  assert.equal(checked.find((task) => task.id === "2")?.status, "not-started");

  const unchecked = applyTaskChecks(seoPlan.tasks, [{ done: false, taskId: "hreflang" }]);
  const afterUncheck = progressOf(unchecked, "en");
  assert.equal(afterUncheck.done, baseline.done - 1);
  assert.equal(unchecked.find((task) => task.id === "hreflang")?.status, "not-started");
  assert.equal(seoPlan.tasks.find((task) => task.id === "hreflang")?.status, "done");
});

test("checklist filters distinguish done from every other status", () => {
  assert.equal(parseCheckedFilter(undefined), "all");
  assert.equal(parseCheckedFilter("later"), "all");
  assert.equal(parseCheckedFilter("done"), "done");
  assert.equal(parseCheckedFilter("open"), "open");
  assert.equal(matchesCheckedFilter("done", "done"), true);
  assert.equal(matchesCheckedFilter("in-progress", "done"), false);
  assert.equal(matchesCheckedFilter("done", "open"), false);
  assert.equal(matchesCheckedFilter("blocked-on-approval", "open"), true);
  assert.equal(matchesCheckedFilter("not-started", "all"), true);
});

test("a done line names who and when, and a plan-done line stays on the plan", () => {
  const when = new Date("2026-11-11T15:04:00Z");
  assert.equal(
    completionLine("en", {
      check: { done: true, doneAt: when, doneByName: "Moe" },
      planStatus: "not-started",
      planUpdated: "2026-11-10",
    }),
    "Checked by Moe · Nov 11, 2026 UTC",
  );
  assert.equal(
    completionLine("ar", {
      check: null,
      planStatus: "done",
      planUpdated: "2026-11-10",
    })?.startsWith("مُنجزة في الخطة"),
    true,
  );
  assert.equal(
    completionLine("en", {
      check: { done: false, doneAt: null, doneByName: null },
      planStatus: "done",
      planUpdated: "2026-11-10",
    }),
    null,
  );
});

test("only the owner can toggle a task, and the decision is made before a write", () => {
  assert.equal(
    seoToggleDecision({ auth: { mode: "demo", providers, user: null }, knownTask: true, source: "db" }),
    "forbidden",
  );
  assert.equal(
    seoToggleDecision({ auth: { mode: "auth", providers, user: null }, knownTask: true, source: "db" }),
    "forbidden",
  );
  assert.equal(
    seoToggleDecision({ auth: { mode: "auth", providers, user: designer }, knownTask: true, source: "db" }),
    "forbidden",
  );
  assert.equal(
    seoToggleDecision({ auth: { mode: "auth", providers, user: designer }, knownTask: false, source: "demo" }),
    "forbidden",
  );
  assert.equal(
    seoToggleDecision({ auth: { mode: "auth", providers, user: owner }, knownTask: false, source: "db" }),
    "unknown-task",
  );
  assert.equal(
    seoToggleDecision({ auth: { mode: "auth", providers, user: owner }, knownTask: true, source: "demo" }),
    "unavailable",
  );
  assert.equal(
    seoToggleDecision({ auth: { mode: "auth", providers, user: owner }, knownTask: true, source: "db" }),
    "allow",
  );
  assert.equal(
    seoToggleDecision({ auth: { mode: "auth", providers, user: ownerEmail }, knownTask: true, source: "db" }),
    "allow",
  );
});

test("repeating a check keeps who and when, and unchecking clears them", () => {
  const saved = { done: true, doneAt: new Date("2026-11-01T00:00:00Z"), doneByName: "Moe" };
  const again = nextTaskCheck(saved, true, { id: "other", name: "Nora" }, new Date("2026-11-11T00:00:00Z"));
  assert.equal(again.changed, false);
  assert.equal(again.doneAt, saved.doneAt);
  assert.equal(again.doneByName, "Moe");
  assert.equal(again.doneBy, null);

  const cleared = nextTaskCheck(saved, false, owner, new Date("2026-11-11T00:00:00Z"));
  assert.equal(cleared.changed, true);
  assert.equal(cleared.done, false);
  assert.equal(cleared.doneAt, null);
  assert.equal(cleared.doneBy, null);

  const first = nextTaskCheck(null, true, owner, new Date("2026-11-11T00:00:00Z"));
  assert.equal(first.changed, true);
  assert.equal(first.doneBy, owner.id);
  assert.equal(first.doneByName, owner.name);
  const same = nextTaskCheck(
    { done: first.done, doneAt: first.doneAt, doneByName: first.doneByName },
    true,
    owner,
    new Date("2026-12-01T00:00:00Z"),
  );
  assert.equal(same.changed, false);
  assert.equal(same.doneAt, first.doneAt);
});

test("a missing task-check table is recognized without treating every database error as missing", () => {
  assert.equal(isMissingChecksTable({ code: "42P01" }), true);
  assert.equal(isMissingChecksTable({ cause: { code: "42P01", message: "relation does not exist" } }), true);
  assert.equal(isMissingChecksTable({ message: 'relation "seo_task_check" does not exist' }), true);
  assert.equal(isMissingChecksTable({ code: "42P01", cause: { code: "42P01" } }), true);
  assert.equal(isMissingChecksTable({ code: "ECONNREFUSED" }), false);
  assert.equal(isMissingChecksTable({ message: 'relation "auth_user" does not exist' }), false);
  const cycle: { cause?: unknown } = {};
  cycle.cause = cycle;
  assert.equal(isMissingChecksTable(cycle), false);
});

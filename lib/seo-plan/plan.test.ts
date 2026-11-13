import assert from "node:assert/strict";
import test from "node:test";

import { isUnlocalizedPath, localizePath } from "../i18n/index";
import { resolveSearchWindow } from "../search-console/index";
import { SITEMAP_STATIC_PATHS } from "../seo/index";
import {
  filterTasks,
  parseSeoTool,
  parseTaskFilter,
  presentTasks,
  progressOf,
  seoPlan,
  seoPlanSchema,
} from "./index";

test("unknown tools are rejected and known tools are kept", () => {
  assert.equal(parseSeoTool(null), null);
  assert.equal(parseSeoTool("seo_tasks"), "seo_tasks");
  assert.equal(parseSeoTool("drop_table"), null);
});

test("the plan file matches the schema and the seeded statuses", () => {
  const parsed = seoPlanSchema.parse(seoPlan);
  assert.equal(parsed.tasks.length, seoPlan.tasks.length);
  const ids = seoPlan.tasks.map((task) => task.id);
  for (let number = 1; number <= 24; number += 1) assert.ok(ids.includes(String(number)));
  assert.deepEqual(
    seoPlan.tasks.filter((task) => task.status === "done").map((task) => task.id),
    ["hreflang", "canonicals", "sitemap", "5", "8", "11"],
  );
  assert.deepEqual(
    seoPlan.tasks.filter((task) => task.status === "in-progress").map((task) => task.id),
    [],
  );
  for (const id of ["5", "8", "11"]) {
    const task = seoPlan.tasks.find((item) => item.id === id);
    assert.equal(task?.link, "https://github.com/moeghashim/shirtat-shop/pull/19");
    assert.equal(task?.status, "done");
  }
  const granted = seoPlan.approvals.filter((item) => item.state === "granted");
  assert.deepEqual(
    granted.map((item) => item.id),
    ["search-console", "dataforseo"],
  );
  assert.ok(granted.every((item) => item.updated === "2026-11-10"));
  assert.equal(
    seoPlan.tasks.every((task) => task.link === null || task.link.startsWith("https://")),
    true,
  );
});

test("a done task without evidence is rejected", () => {
  const broken = structuredClone(seoPlan);
  const done = broken.tasks.find((task) => task.id === "hreflang");
  assert.ok(done);
  done.evidence = null;
  assert.equal(seoPlanSchema.safeParse(broken).success, false);
});

test("an unknown status is rejected", () => {
  const broken = structuredClone(seoPlan);
  const task = broken.tasks[0];
  assert.ok(task);
  (task as { status: string }).status = "later";
  assert.equal(seoPlanSchema.safeParse(broken).success, false);
});

test("progress counts done tasks only and filters do not change that total", () => {
  const progress = progressOf(seoPlan.tasks, "en");
  assert.equal(progress.done, 6);
  assert.equal(progress.inProgress, 0);
  assert.equal(progress.total, seoPlan.tasks.length);
  assert.equal(progress.percent, Math.round((6 / seoPlan.tasks.length) * 100));
  assert.equal(progress.phases.find((phase) => phase.id === "foundation")?.percent, 100);
  assert.equal(progress.phases.find((phase) => phase.id === "now")?.done, 2);
  assert.equal(progress.phases.find((phase) => phase.id === "dec")?.done, 1);
  const now = filterTasks(seoPlan.tasks, parseTaskFilter({ phase: "now" }));
  assert.equal(now.length, 9);
  assert.equal(
    now.some((task) => task.id === "5" && task.status === "done"),
    true,
  );
  assert.equal(filterTasks(seoPlan.tasks, parseTaskFilter({ phase: "nope" })).length, 0);
  const arabic = presentTasks("ar", parseTaskFilter({ area: "Technical", phase: "foundation" }));
  assert.ok(arabic.some((task) => task.id === "hreflang" && /[\u0600-\u06FF]/.test(task.action)));
  const english = presentTasks("en", parseTaskFilter({ phase: "foundation" }));
  assert.ok(english.some((task) => task.id === "hreflang" && task.action.includes("hreflang")));
});

test("search windows are last 28 or 90 days through yesterday, or an explicit range", () => {
  const now = new Date("2026-11-10T15:00:00Z");
  assert.deepEqual(resolveSearchWindow("28", now), { end: "2026-11-09", start: "2026-10-13" });
  assert.deepEqual(resolveSearchWindow("90", now), { end: "2026-11-09", start: "2026-08-12" });
  assert.deepEqual(resolveSearchWindow(null, now)?.end, "2026-11-09");
  assert.deepEqual(resolveSearchWindow("2026-10-01:2026-10-31", now), {
    end: "2026-10-31",
    start: "2026-10-01",
  });
  assert.equal(resolveSearchWindow("2026-11-01:2026-10-01", now), null);
  assert.equal(resolveSearchWindow("nope", now), null);
});

test("old owner /admin paths stay unlocalized and out of the sitemap", () => {
  assert.equal(isUnlocalizedPath("/admin/seo"), true);
  assert.equal(isUnlocalizedPath("/admin/chats"), true);
  assert.equal(localizePath("ar", "/admin/seo"), "/admin/seo");
  assert.equal(localizePath("ar", "/admin/chats"), "/admin/chats");
  assert.equal(
    SITEMAP_STATIC_PATHS.some((path) => path.startsWith("/admin")),
    false,
  );
});

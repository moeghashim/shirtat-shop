import { captureRoutes } from "./screenshot-routes.ts";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.argv[2];
assert.ok(root, "Provide the acceptance evidence root");
type Row = { route: string; theme: string; viewport: string; phase: string; errors: string[] };
type Report = { preset: string; projectId: string; baseURL: string; results: Row[] };
const retries: { preset: string; projectId: string; report: string }[] = process.argv[3]
  ? JSON.parse(await readFile(process.argv[3], "utf8"))
  : [];
const presets = ["default", "graphite", "pine", "iris"],
  projects = ["sample-docs", "sample-empty"];
assert.ok(retries.every((r) => presets.includes(r.preset) && projects.includes(r.projectId)));
const routes = captureRoutes.filter((r) => r.route.includes("$projectId")).map((r) => r.route);
const key = (r: Row) => `${r.route}|${r.theme}|${r.viewport}`;
const expected = routes.flatMap((route) =>
  ["light", "dark"].flatMap((theme) => ["desktop", "mobile"].map((viewport) => `${route}|${theme}|${viewport}`)),
);
const reports = [];
let pass = true;
for (const preset of presets)
  for (const projectId of projects) {
    const file = `projects/${preset}/${projectId}/report.json`,
      source: Report = JSON.parse(await readFile(path.join(root, file), "utf8"));
    assert.equal(source.preset, preset);
    assert.equal(source.projectId, projectId);
    assert.deepEqual(source.results.map(key).sort(), [...expected].sort());
    const final = new Map(source.results.map((r) => [key(r), r]));
    const applied = [];
    for (const retry of retries.filter((r) => r.preset === preset && r.projectId === projectId)) {
      const report: Report = JSON.parse(await readFile(path.join(root, retry.report), "utf8"));
      assert.equal(report.preset, preset);
      assert.equal(report.projectId, projectId);
      assert.equal(report.baseURL, source.baseURL);
      assert.ok(report.results.length);
      assert.equal(new Set(report.results.map(key)).size, report.results.length);
      for (const row of report.results) {
        assert.ok(final.has(key(row)));
        assert.equal(row.phase, "direct");
        final.set(key(row), row);
      }
      applied.push(retry.report);
    }
    const errors = [...final.values()].filter((r) => r.errors.length || r.phase !== "direct");
    pass &&= errors.length === 0;
    reports.push({
      preset,
      projectId,
      file,
      cases: source.results.length,
      originalErrors: source.results.filter((r) => r.errors.length),
      retries: applied,
      errors,
      pass: errors.length === 0,
    });
  }
console.log(
  JSON.stringify(
    {
      expectedTotal: expected.length * presets.length * projects.length,
      actualTotal: reports.reduce((n, r) => n + r.cases, 0),
      pass,
      reports,
    },
    null,
    2,
  ),
);
if (!pass) process.exitCode = 1;

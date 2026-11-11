import { captureRoutes, httpRoutes } from "./screenshot-routes.ts";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    root: { type: "string" },
    retries: { type: "string" },
    environments: { type: "string", default: "dev,workers" },
  },
});
const environments = values.environments.split(",");
if (
  !environments.length ||
  new Set(environments).size !== environments.length ||
  environments.some((x) => !["before", "dev", "db", "workers"].includes(x))
)
  throw new Error("Invalid environments");
if (!values.root) throw new Error("Provide --root with <environment>/<preset> reports");
const generated = await readFile("src/routeTree.gen.ts", "utf8");
const block = generated.split("export interface FileRoutesByFullPath {")[1]?.split("\n}")[0];
if (!block) throw new Error("Generated inventory missing");
const routes = [...block.matchAll(/^\s*'([^']+)':/gm)].map((match) => match[1]);
const catalog: string[] = captureRoutes.map((entry) => entry.route);
if (
  routes.length !== catalog.length + httpRoutes.length ||
  routes.some((route) => !catalog.includes(route) && !httpRoutes.includes(route))
)
  throw new Error("Generated routes and capture catalog differ");
const presets = ["default", "graphite", "pine", "iris"];
const expected = catalog.flatMap((route) =>
  ["light", "dark"].flatMap((theme) => ["desktop", "mobile"].map((viewport) => `${route}|${theme}|${viewport}`)),
);
type CaptureRow = { route: string; theme: string; viewport: string; phase: string; errors: string[] };
type CaptureReport = {
  preset: string;
  baseURL: string;
  reference?: string;
  timezone?: string;
  maskedLiveClocks?: boolean;
  results: CaptureRow[];
};
const retryManifest: { environment: string; preset: string; report: string }[] = values.retries
  ? JSON.parse(await readFile(values.retries, "utf8"))
  : [];
if (retryManifest.some((item) => !environments.includes(item.environment) || !presets.includes(item.preset)))
  throw new Error("Unknown retry environment/preset");
const keyOf = (row: CaptureRow) => `${row.route}|${row.theme}|${row.viewport}`;
const reports = [];
let failed = false;
for (const environment of environments) {
  for (const preset of presets) {
    const file = path.join(environment, preset, "report.json");
    const report = JSON.parse(await readFile(path.join(values.root, file), "utf8")) as CaptureReport;
    const originalErrors = report.results.filter((row) => row.errors.length);
    const resolved = new Map(report.results.map((row) => [keyOf(row), row]));
    const retries = [];
    for (const item of retryManifest.filter((item) => item.environment === environment && item.preset === preset)) {
      const retry = JSON.parse(await readFile(path.join(values.root, item.report), "utf8")) as CaptureReport;
      if (
        retry.preset !== preset ||
        retry.baseURL !== report.baseURL ||
        retry.reference !== report.reference ||
        retry.timezone !== report.timezone ||
        retry.maskedLiveClocks !== report.maskedLiveClocks ||
        !retry.results.length
      )
        throw new Error(`Mismatched retry: ${item.report}`);
      const keys = retry.results.map(keyOf);
      if (
        new Set(keys).size !== keys.length ||
        keys.some((key) => !resolved.has(key)) ||
        retry.results.some((row) => row.phase !== "direct")
      )
        throw new Error(`Invalid retry coverage: ${item.report}`);
      for (const row of retry.results) resolved.set(keyOf(row), row);
      retries.push({
        report: item.report,
        cases: retry.results.length,
        errors: retry.results.filter((row) => row.errors.length),
      });
    }
    const seen = report.results.map((row) => `${row.route}|${row.theme}|${row.viewport}`);
    const missing = expected.filter((key) => !seen.includes(key));
    const unexpected = seen.filter((key) => !expected.includes(key));
    const duplicates = seen.filter((key, index) => seen.indexOf(key) !== index);
    const errors = [...resolved.values()].filter((row) => row.errors.length);
    const pass =
      !missing.length &&
      !unexpected.length &&
      !duplicates.length &&
      !errors.length &&
      report.preset === preset &&
      report.results.every((row) => row.phase === "direct");
    failed ||= !pass;
    reports.push({
      environment,
      preset,
      baseURL: report.baseURL,
      file,
      expected: expected.length,
      actual: seen.length,
      pass,
      missing,
      unexpected,
      duplicates,
      originalErrors,
      retries,
      errors,
    });
  }
}
console.log(
  JSON.stringify(
    {
      catalogCount: catalog.length,
      routes: captureRoutes,
      expectedPerEnvironment: expected.length * presets.length,
      expectedTotal: expected.length * presets.length * environments.length,
      actualTotal: reports.reduce((sum, row) => sum + row.actual, 0),
      pass: !failed,
      reports,
    },
    null,
    2,
  ),
);
if (failed) process.exitCode = 1;

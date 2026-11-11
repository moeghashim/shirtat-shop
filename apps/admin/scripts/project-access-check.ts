import { chromium } from "playwright";
import postgres from "postgres";

import { callRpc, localDatabase, startTestServer, testHeaders, testSecret } from "./auth-test-support.ts";
import { cacheCaptureFonts } from "./screenshot-assets.ts";
import { testOrigin } from "./test-port.ts";
import assert from "node:assert/strict";

const server = await startTestServer({
  DATABASE_URL: localDatabase,
  BETTER_AUTH_SECRET: testSecret(),
  BETTER_AUTH_URL: testOrigin("http://localhost:3011"),
});
const browser = await chromium.launch(),
  db = postgres(localDatabase, { max: 1 });
const context = await browser.newContext({ extraHTTPHeaders: testHeaders });
await cacheCaptureFonts(context);
const page = await context.newPage(),
  email = `project-v08-${Date.now()}@example.test`;
const file = "/src/routes/(main)/dashboard/projects/-components/project-functions.ts";
try {
  await page.goto(`${server.baseURL}/auth/v2/login`);
  for (const [rpcFile, name] of [
    [file, "loadProject"],
    [file, "loadProjectTasks"],
    [file, "loadProjectBoard"],
    [file.replace("project-functions", "workspace-functions"), "loadWorkspaceHome"],
    [file.replace("project-functions", "workspace-functions"), "loadProjectsIndex"],
    [file.replace("project-functions", "workspace-functions"), "loadProjectNavigation"],
    ...["loadProjectOverview", "loadProjectTimeline", "loadProjectFiles"].map((name) => [
      file.replace("project-functions", "project-view-functions"),
      name,
    ]),
  ]) {
    const result = await callRpc(page, rpcFile, name, "GET", { projectId: "sample-docs" });
    assert.equal(result.ok, false);
    assert.equal(result.message, "Sign in to continue.");
  }
  for (const path of [
    "/dashboard/home",
    "/dashboard/projects",
    "/dashboard/projects/sample-docs/board",
    "/dashboard/projects/missing/list",
    "/dashboard/projects/sample-docs",
    "/dashboard/projects/missing",
  ]) {
    let response = await context.request.get(server.baseURL + path, { maxRedirects: 0 });
    const location = response.headers().location;
    if (location?.startsWith(`${path}?`))
      response = await context.request.get(server.baseURL + location, { maxRedirects: 0 });
    assert.equal(response.status(), 307);
    assert.match(response.headers().location, /auth\/v2\/login/);
  }
  const signup = await context.request.post(`${server.baseURL}/api/auth/sign-up/email`, {
    headers: { origin: server.baseURL },
    data: { name: "Project test", email, password: testSecret() },
  });
  assert.equal(signup.status(), 200);
  const user = (await signup.json()).user;
  for (const suffix of ["", "/"]) {
    let response = await context.request.get(`${server.baseURL}/dashboard/projects/sample-docs${suffix}`, {
      maxRedirects: 0,
    });
    if (response.headers().location === "/dashboard/projects/sample-docs")
      response = await context.request.get(server.baseURL + response.headers().location, { maxRedirects: 0 });
    assert.equal(response.status(), 307);
    assert.equal(response.headers().location, "/dashboard/projects/sample-docs/overview");
  }
  assert.equal((await context.request.get(`${server.baseURL}/dashboard/projects/missing`)).status(), 404);

  await page.goto(`${server.baseURL}/dashboard/projects/sample-docs/list`);
  await page.getByRole("heading", { name: "Documentation refresh", exact: true }).waitFor();
  for (const name of ["loadProjectOverview", "loadProjectTimeline", "loadProjectFiles"]) {
    const result = await callRpc(page, file.replace("project-functions", "project-view-functions"), name, "GET", {
      projectId: "sample-docs",
    });
    assert.equal(result.ok, true);
    assert.match(result.cacheControl, /private.*no-store/);
    assert.equal(
      (
        await callRpc(page, file.replace("project-functions", "project-view-functions"), name, "GET", {
          projectId: "missing",
        })
      ).result,
      null,
    );
  }
  const workspaceFile = file.replace("project-functions", "workspace-functions");
  const navigation = await callRpc(page, workspaceFile, "loadProjectNavigation", "GET");
  assert.equal(navigation.ok, true);
  assert.equal(navigation.result.projects.length, 3);
  assert.equal(navigation.result.error, false);
  assert.match(navigation.cacheControl, /private.*no-store/);
  const home = await callRpc(page, workspaceFile, "loadWorkspaceHome", "GET");
  assert.equal(home.ok, true);
  assert.equal(home.result.sampleMember, "board:jordan");
  assert.ok(home.result.myTasks.length <= home.result.myTaskTotal);
  assert.match(home.cacheControl, /private.*no-store/);
  const index = await callRpc(page, workspaceFile, "loadProjectsIndex", "GET", { query: "Documentation" });
  assert.equal(index.result.projects.length, 1);
  assert.equal(index.result.total, 3);
  const tasks = await callRpc(page, file, "loadProjectTasks", "GET", { projectId: "sample-docs" });
  assert.equal(tasks.ok, true);
  assert.equal(tasks.result.total, 5);
  assert.ok(tasks.result.items.every((t: { projectId: string }) => t.projectId === "sample-docs"));
  assert.match(tasks.cacheControl, /private.*no-store/);
  for (const input of [{ projectId: "sample-docs", id: "board:tender-workflow-map" }, { projectId: "sample-empty" }]) {
    const result = await callRpc(page, file, "loadProjectTasks", "GET", input);
    assert.equal(result.result.total, 0);
  }
  assert.equal((await callRpc(page, file, "loadProjectTasks", "GET", { projectId: "missing" })).result, null);
  for (const input of [
    { projectId: "../wrong" },
    { projectId: "a".repeat(121) },
    { projectId: "sample-docs", limit: 101 },
    { projectId: "sample-docs", status: "unknown" },
  ])
    assert.equal((await callRpc(page, file, "loadProjectTasks", "GET", input)).ok, false);
  const missing = await context.request.get(`${server.baseURL}/dashboard/projects/missing/board`);
  assert.equal(missing.status(), 404);
  await db`delete from auth_session where user_id=${user.id}`;
  for (const name of ["loadWorkspaceHome", "loadProjectsIndex"]) {
    assert.equal((await callRpc(page, workspaceFile, name, "GET", {})).message, "Sign in to continue.");
  }
  assert.equal(
    (await callRpc(page, file, "loadProjectTasks", "GET", { projectId: "sample-docs" })).message,
    "Sign in to continue.",
  );
  assert.equal(
    (await context.request.get(`${server.baseURL}/dashboard/projects/sample-docs/board`, { maxRedirects: 0 })).status(),
    307,
  );
  console.log(
    `PASS ${process.env.AUTH_TEST_RUNTIME ?? "Node"}: denied/direct guarded RPCs, unknown-project auth boundary, DB scope/empty/missing, malformed/filter bounds, private cache, revocation`,
  );
} finally {
  await db`delete from auth_user where email=${email}`;
  await db.end();
  await context.close();
  await browser.close();
  await server.stop();
}

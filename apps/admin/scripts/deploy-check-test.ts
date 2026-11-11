import { checkDeployment, deploymentOrigin } from "./deploy-check-core.ts";
import assert from "node:assert/strict";
import { createServer } from "node:http";

for (const value of [
  "file:///tmp/test",
  "https://user:secret@example.test",
  "https://example.test/path",
  "https://example.test?secret=1",
  "invalid",
])
  assert.throws(() => deploymentOrigin(value));
console.log("PASS invalid/credential-bearing deployment targets rejected");
for (const mode of [
  "auth",
  "demo",
  "wrong-mode",
  "unsafe-redirect",
  "invalid-session",
  "bad-cache",
  "public-redirect",
  "server-error",
  "timeout",
]) {
  const requests: { method?: string; cookie?: string }[] = [];
  const server = createServer((req, res) => {
    requests.push({ method: req.method, cookie: req.headers.cookie });
    if (mode === "timeout") return;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Set-Cookie", "better-auth.session_token=SHOULD_NOT_FORWARD; Path=/; HttpOnly");
    if (mode === "server-error") {
      res.writeHead(500);
      res.end("PRIVATE_ERROR_MARKER");
      return;
    }
    if (mode === "public-redirect" && req.url === "/auth/v2/login") {
      res.writeHead(302, { location: "https://evil.example" });
      res.end();
      return;
    }
    if (req.url === "/api/auth/get-session") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", mode === "bad-cache" ? "public" : "private, no-store");
      if (["demo", "wrong-mode"].includes(mode)) {
        res.writeHead(404);
        res.end(JSON.stringify({ message: "Authentication is disabled in this demo." }));
      } else res.end(mode === "invalid-session" ? '{"unexpected":"PRIVATE_ERROR_MARKER"}' : "null");
    } else if (req.url === "/dashboard/default") {
      if (!["demo", "wrong-mode"].includes(mode))
        res.writeHead(307, {
          location:
            mode === "unsafe-redirect"
              ? "https://evil.example/auth/v2/login?redirect=/dashboard/default"
              : "/auth/v2/login?redirect=%2Fdashboard%2Fdefault",
        });
      res.end("<html>dashboard</html>");
    } else if (req.url === "/deployment-check-missing-route") {
      res.writeHead(404);
      res.end("missing");
    } else res.end("<html>public</html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const messages: string[] = [];
  try {
    const run = () =>
      checkDeployment(origin, { demo: mode === "demo", timeoutMs: 150, report: (s) => messages.push(s) });
    if (["auth", "demo"].includes(mode)) await run();
    else await assert.rejects(run, (error: Error) => !error.message.includes("PRIVATE_ERROR_MARKER"));
    assert.ok(requests.length > 0);
    assert.ok(requests.every((r) => r.method === "GET" && !r.cookie));
    assert.ok(!messages.some((s) => s.includes("PRIVATE_ERROR_MARKER")));
    if (mode === "unsafe-redirect") assert.ok(requests.length <= 7, "Redirect must never be followed");
    console.log(`PASS deployment checker ${mode}: bounded GET-only requests, no cookie replay or body leakage`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  if (mode === "auth") await assert.rejects(() => checkDeployment(origin, { timeoutMs: 100, report: () => undefined }));
}

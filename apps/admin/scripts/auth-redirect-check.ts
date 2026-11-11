import { authDestination, authErrorCallback, DEFAULT_AUTH_DESTINATION } from "../src/lib/auth/redirect.ts";
import assert from "node:assert/strict";

assert.equal(DEFAULT_AUTH_DESTINATION, "/dashboard/default");
assert.equal(
  authErrorCallback(undefined, "https://evil.example"),
  "/auth/v2/login?redirect=%2Fdashboard%2Fdefault&error=oauth",
);
const hostile = [
  undefined,
  "",
  "https://evil.example",
  "//evil.example",
  "///evil.example",
  "/\\evil",
  "/%2fevil",
  "/%5cevil",
  "/%252fevil",
  "/%255cevil",
  "/%00evil",
  "/%0aevil",
  "/%7fevil",
  "/auth/v2/login",
  "/api/auth/sign-out",
  "/AUTH/v2/register",
  "/%61uth/v1/login",
  "/dashboard/../auth/v2/login",
  "/dashboard/%2e%2e/api/auth",
  `/dashboard/${String.fromCharCode(10)}`,
  "/%invalid",
];
for (const value of hostile) assert.equal(authDestination(value), DEFAULT_AUTH_DESTINATION);
const valid = [
  "/dashboard/default",
  "/dashboard/home",
  "/dashboard/profile?tab=account#sessions",
  "/dashboard/tasks?q=space%20test",
  "/mail",
  "/chat",
  "/unknown-app-page",
  "/dashboard/tasks?next=https://evil.example&path=%2Fapi#task",
  "/dashboard/tasks?q=%252f",
];
for (const value of valid) assert.equal(authDestination(value), value);
console.log(`Redirect validator: ${hostile.length + valid.length}/${hostile.length + valid.length} passing.`);

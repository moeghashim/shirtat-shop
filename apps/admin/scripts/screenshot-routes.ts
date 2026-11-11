export { captureRoutes } from "../src/navigation/route-catalog.ts";

// HTTP endpoints have separate API tests and no visual document.
// Redirect-only aliases have HTTP/browser coverage in legacy-redirect-check.ts.
// Validated project-index redirects have route/RPC coverage in project-access-check.ts.
export const httpRoutes: string[] = [
  "/dashboard/kanban",
  "/dashboard/tasks",
  "/dashboard/calendar",
  "/dashboard/file-manager",
  "/dashboard/projects/$projectId",
  "/dashboard/projects/$projectId/",
  "/api/auth/$",
  "/api/assistant",
  "/api/assistant-refresh",
  "/dashboard/default-v1",
  "/dashboard/crm-v1",
  "/dashboard/finance-v1",
  "/dashboard/analytics-v1",
  "/auth/v1/login",
  "/auth/v1/register",
];

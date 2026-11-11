import { createMiddleware, createStart } from "@tanstack/react-start";

const configurationBoundary = createMiddleware().server(async ({ next }) => {
  const { authConfiguration } = await import("./lib/auth/config");
  const { getRequest } = await import("@tanstack/react-start/server");
  const { runtimeEnvironment, withRuntimeRequest } = await import("./server/runtime.server");
  const invalidConfiguration = () =>
    new Response("Authentication/data configuration is invalid. Check your server environment.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  return withRuntimeRequest(
    getRequest(),
    async () => {
      try {
        const config = authConfiguration(runtimeEnvironment());
        if (config.enabled) {
          const { assertAuthStorage } = await import("./lib/auth/auth.server");
          await assertAuthStorage();
        }
      } catch {
        return invalidConfiguration();
      }
      return next();
    },
    invalidConfiguration,
  );
});
export const startInstance = createStart(() => ({ requestMiddleware: [configurationBoundary] }));

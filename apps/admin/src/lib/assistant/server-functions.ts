import { createServerFn } from "@tanstack/react-start";

export const getAssistantConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { requireSession } = await import("../auth/session.server");
  await requireSession();
  const { getRequest, setResponseHeader } = await import("@tanstack/react-start/server");
  const { runtimeEnvironment } = await import("../../server/runtime.server");
  const { assistantConfiguration, canonicalOrigin, publicConfiguration } = await import(
    "../../server/assistant/config.server"
  );
  setResponseHeader("Cache-Control", "private, no-store");
  setResponseHeader("X-Content-Type-Options", "nosniff");
  const env = runtimeEnvironment();
  const config = assistantConfiguration(env);
  canonicalOrigin(env, getRequest().url, config.length > 0);
  return publicConfiguration(config);
});

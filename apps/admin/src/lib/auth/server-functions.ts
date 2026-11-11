import { createServerFn } from "@tanstack/react-start";
export const getAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const { readAuthState } = await import("./session.server");
  return readAuthState();
});

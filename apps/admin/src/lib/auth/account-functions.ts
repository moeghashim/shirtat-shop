import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

export const getAccountDetails = createServerFn({ method: "GET" }).handler(async () => {
  const { readAccountDetails } = await import("./account.server");
  return readAccountDetails();
});
export const revokeAccountSession = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(200) }).strict())
  .handler(async ({ data }) => {
    const { revokeOwnedSession } = await import("./account.server");
    return revokeOwnedSession(data.id);
  });

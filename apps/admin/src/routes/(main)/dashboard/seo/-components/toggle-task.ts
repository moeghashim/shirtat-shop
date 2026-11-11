import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

const toggleSchema = z.strictObject({
  done: z.boolean(),
  taskId: z.string().trim().min(1).max(80),
});

export const toggleSeoTask = createServerFn({ method: "POST" })
  .validator((input: unknown) => toggleSchema.parse(input))
  .handler(async ({ data }) => {
    const { toggleSeoTaskCheck } = await import("@/server/seo/checks.server");
    return toggleSeoTaskCheck(data);
  });

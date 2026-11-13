import { createServerFn } from "@tanstack/react-start";

import type { AdminActionResult, DesignerOp, DesignersView } from "../../../../../../../../lib/admin-api/types.ts";

const OPS: readonly DesignerOp[] = ["apply", "create", "delete", "design", "resend", "update"];

export type DesignersLoad = { data: DesignersView; error: null } | { data: null; error: string };

/** Owner-only read of designers, sign-ups, sales and the email queue from the storefront. No writes. */
export const loadDesigners = createServerFn({ method: "GET" }).handler(async (): Promise<DesignersLoad> => {
  const { storefrontJson } = await import("@/server/shirtat/storefront.server");
  try {
    return { data: await storefrontJson<DesignersView>({ path: "/designers" }), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "The storefront could not be reached." };
  }
});

/** Owner-only designer change. The form carries `_op`; the rest is forwarded as submitted. */
export const runDesignersAction = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Expected form data.");
    const op = input.get("_op");
    if (typeof op !== "string" || !OPS.includes(op as DesignerOp)) throw new Error("Unknown action.");
    return input;
  })
  .handler(async ({ data }): Promise<AdminActionResult> => {
    const { storefrontJson } = await import("@/server/shirtat/storefront.server");
    const op = data.get("_op") as DesignerOp;
    data.delete("_op");
    try {
      return await storefrontJson<AdminActionResult>({ form: data, method: "POST", path: `/designers?op=${op}` });
    } catch (error) {
      return {
        code: "failed",
        detail: error instanceof Error ? error.message : "The storefront could not be reached.",
        ok: false,
      };
    }
  });

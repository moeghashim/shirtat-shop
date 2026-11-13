import { type FormEvent, useState } from "react";

import { useRouter } from "@tanstack/react-router";

import type { AdminActionResult, DesignerOp } from "../../../../../../../../lib/admin-api/types.ts";
import { runDesignersAction } from "./functions";
import { actionMessage } from "./messages";

export interface ActionNotice {
  ok: boolean;
  text: string;
}

/** Submits a designer form to the storefront, then reloads the page data. */
export function useDesignerAction(onDone: (notice: ActionNotice) => void) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const submit = (op: DesignerOp, extra?: Record<string, string>) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    form.set("_op", op);
    for (const [key, value] of Object.entries(extra ?? {})) form.set(key, value);
    setPending(true);
    void runDesignersAction({ data: form })
      .then((result: AdminActionResult) => {
        onDone({ ok: result.ok, text: actionMessage(result) });
        return router.invalidate();
      })
      .catch(() => onDone({ ok: false, text: "The change did not go through. Try again." }))
      .finally(() => setPending(false));
  };
  return { pending, submit };
}

export function fileUrl(pathname: string): string {
  return `/api/designers/file?p=${encodeURIComponent(pathname)}`;
}

export function shopifyAdminUrl(productId: string): string {
  return `https://admin.shopify.com/store/shirtatco/products/${productId.split("/").pop()}`;
}

export const stamp = (iso?: string | null) => (iso ? `${iso.slice(0, 16).replace("T", " ")} UTC` : "");

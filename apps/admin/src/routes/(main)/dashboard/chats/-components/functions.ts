import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

import { isOwner } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/server-functions";

import type { AdminActionResult, ChatDetailView, ChatsView } from "../../../../../../../../lib/admin-api/types.ts";

export type Loaded<T> = { data: T; error: null } | { data: null; error: string };

function failure(error: unknown): { data: null; error: string } {
  return { data: null, error: error instanceof Error ? error.message : "The storefront could not be reached." };
}

/** Chat review is owner-only; designers are sent to their own page. */
export async function requireOwnerRoute() {
  const auth = await getAuthState();
  if (auth.mode === "auth" && auth.user && !isOwner(auth.user)) {
    throw redirect({ to: "/dashboard/designers", replace: true });
  }
}

export const loadChats = createServerFn({ method: "GET" }).handler(async (): Promise<Loaded<ChatsView>> => {
  const { storefrontJson } = await import("@/server/shirtat/storefront.server");
  try {
    return { data: await storefrontJson<ChatsView>({ path: "/chats" }), error: null };
  } catch (error) {
    return failure(error);
  }
});

const detailSchema = z.strictObject({
  fixture: z.string().max(20).optional(),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,200}$/),
});

export const loadChatDetail = createServerFn({ method: "GET" })
  .validator((input: unknown) => detailSchema.parse(input))
  .handler(async ({ data }): Promise<Loaded<ChatDetailView>> => {
    const { storefrontJson } = await import("@/server/shirtat/storefront.server");
    const query = data.fixture === "sample" ? "?fixture=sample" : "";
    try {
      return {
        data: await storefrontJson<ChatDetailView>({ path: `/chats/${encodeURIComponent(data.sessionId)}${query}` }),
        error: null,
      };
    } catch (error) {
      return failure(error);
    }
  });

export const runChatAction = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Expected form data.");
    const op = input.get("_op");
    if (op !== "feedback" && op !== "delete") throw new Error("Unknown action.");
    return input;
  })
  .handler(async ({ data }): Promise<AdminActionResult> => {
    const { storefrontJson } = await import("@/server/shirtat/storefront.server");
    const op = data.get("_op") as "delete" | "feedback";
    data.delete("_op");
    try {
      return await storefrontJson<AdminActionResult>({ form: data, method: "POST", path: `/chats?op=${op}` });
    } catch (error) {
      return { code: "failed", detail: error instanceof Error ? error.message : undefined, ok: false };
    }
  });

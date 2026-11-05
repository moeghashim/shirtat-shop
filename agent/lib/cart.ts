import {
  createCartCookie,
  createCartServerHandlers,
  createShopifyRequestContext,
} from "@shopify/hydrogen";
import { defineState } from "eve/context";
import type { ToolContext } from "eve/tools";
import { z } from "zod";

import { shopConfig } from "../../lib/config";
import { CART_FRAGMENT } from "../../lib/shopify/fragments/cart";
import { createRequestStorefrontClient } from "../../lib/shopify/storefront/server";

const cartHandlers = createCartServerHandlers({ fragment: CART_FRAGMENT });

export const CART_UNCONFIRMED =
  "Cart change could not be confirmed. Inspect the cart before requesting another change; it may already have succeeded.";

type CartWriteResult = { cartUpdated: true; warnings: string[] } | { error: string; url?: string };

type WriteSlot =
  | { status: "pending" }
  | { status: "uncertain" }
  | { status: "done"; result: CartWriteResult };

const cartWrites = defineState("shirtat.cart-writes", () => ({
  blocked: [] as string[],
  byCall: {} as Record<string, WriteSlot>,
}));

function remember(callId: string, slot: WriteSlot, blockKey?: string) {
  cartWrites.update((current) => {
    const byCall = { ...current.byCall, [callId]: slot };
    const ids = Object.keys(byCall);
    for (const id of ids.slice(0, Math.max(0, ids.length - 40))) delete byCall[id];
    const blocked =
      slot.status === "uncertain" && blockKey
        ? [...new Set([...current.blocked, blockKey])].slice(-40)
        : current.blocked;
    return { blocked, byCall };
  });
}

export function clearBlockedCartWrites() {
  cartWrites.update((current) => ({ ...current, blocked: [] }));
}

export async function commitCartWrite<T extends CartWriteResult>(
  ctx: ToolContext,
  blockKey: string,
  run: () => Promise<T>,
): Promise<T | { error: string }> {
  const existing = cartWrites.get().byCall[ctx.callId];
  if (existing?.status === "done") return existing.result as T;
  if (existing || cartWrites.get().blocked.includes(blockKey)) return { error: CART_UNCONFIRMED };
  remember(ctx.callId, { status: "pending" });
  try {
    const result = await run();
    if ("error" in result && result.error === CART_UNCONFIRMED) {
      remember(ctx.callId, { status: "uncertain" }, blockKey);
      return result;
    }
    remember(ctx.callId, { status: "done", result });
    return result;
  } catch {
    remember(ctx.callId, { status: "uncertain" }, blockKey);
    return { error: CART_UNCONFIRMED };
  }
}

export function lineAttributes(line: {
  attributes?: Array<{ key: string; value?: string | null }> | null;
}) {
  const attributes = (line.attributes ?? []).flatMap((attribute) =>
    attribute.value ? [{ key: attribute.key, value: attribute.value }] : [],
  );
  return attributes.length ? attributes : undefined;
}

export function getSessionCartId(ctx: ToolContext) {
  const cartId = ctx.session.auth.current?.attributes.cartId;
  return typeof cartId === "string" ? cartId : undefined;
}

export async function getCart(cartId: string | undefined) {
  if (!cartId) return undefined;
  const request = new Request(new URL("/api/cart", shopConfig.site.url), {
    headers: { cookie: createCartCookie(cartId).split(";")[0] },
  });
  const requestContext = createShopifyRequestContext({ i18n: shopConfig.localization, request });
  const storefrontClient = createRequestStorefrontClient(requestContext);
  const { data } = await cartHandlers.get({ request, storefrontClient });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.cart ?? undefined;
}

export async function mutateCart(cartId: string | undefined, payload: object) {
  if (!cartId) return { error: "Open the storefront to change your cart." };
  const request = new Request(new URL("/api/cart", shopConfig.site.url), {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
      cookie: createCartCookie(cartId).split(";")[0],
    },
    method: "POST",
  });
  const requestContext = createShopifyRequestContext({
    i18n: shopConfig.localization,
    request,
  });
  const storefrontClient = createRequestStorefrontClient(requestContext);
  try {
    const result = await cartHandlers.post({ request, storefrontClient });
    if (result.type !== "json") throw new Error("Cart mutation could not be confirmed.");
    const data = z
      .object({
        cart: z.object({ id: z.string() }).nullable(),
        userErrors: z.array(z.object({ message: z.string() })).optional(),
        warnings: z.array(z.object({ message: z.string() })).optional(),
      })
      .parse(result.data);
    if (data.userErrors?.length)
      return { error: data.userErrors.map((error) => error.message).join("; ") };
    if (!data.cart || data.cart.id !== cartId)
      throw new Error("Cart change could not be confirmed.");
    return {
      cartUpdated: true as const,
      warnings: data.warnings?.map((warning) => warning.message) ?? [],
    };
  } catch {
    return { error: CART_UNCONFIRMED };
  }
}

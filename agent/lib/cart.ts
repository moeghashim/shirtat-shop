import {
  createCartCookie,
  createCartServerHandlers,
  createShopifyRequestContext,
} from "@shopify/hydrogen";
import { defineState } from "eve/context";
import type { ToolContext } from "eve/tools";
import { z } from "zod";

import { CART_BUYER_COUNTRY_UPDATE, cartBuyerCountry } from "../../lib/cart/buyer";
import { shopConfig } from "../../lib/config";
import type { CommerceLocale } from "../../lib/config/types";
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

function cartRequestContext(locale: CommerceLocale, cartId: string) {
  const request = new Request(new URL("/api/cart", shopConfig.site.url), {
    headers: { cookie: createCartCookie(cartId).split(";")[0] },
  });
  const requestContext = createShopifyRequestContext({ i18n: locale, request });
  return { request, storefrontClient: createRequestStorefrontClient(requestContext) };
}

async function loadCart(cartId: string, locale: CommerceLocale) {
  const context = cartRequestContext(locale, cartId);
  let { data } = await cartHandlers.get(context);
  if (data.errors?.length) throw new Error(data.errors[0].message);
  if (data.cart && cartBuyerCountry(data.cart) !== locale.country) {
    const { data: updated, errors } = await context.storefrontClient.graphql(
      CART_BUYER_COUNTRY_UPDATE,
      { variables: { buyerIdentity: { countryCode: locale.country }, cartId } },
    );
    if (errors?.length) throw new Error(errors[0].message);
    const userErrors = updated?.cartBuyerIdentityUpdate?.userErrors ?? [];
    if (userErrors.length) throw new Error(userErrors.map((error) => error.message).join("; "));
    data = (await cartHandlers.get(context)).data;
    if (data.errors?.length) throw new Error(data.errors[0].message);
  }
  return { cart: data.cart ?? undefined, context };
}

export async function getCart(cartId: string | undefined, locale: CommerceLocale) {
  if (!cartId) return undefined;
  return (await loadCart(cartId, locale)).cart;
}

export async function mutateCart(
  cartId: string | undefined,
  payload: object,
  locale: CommerceLocale,
) {
  if (!cartId) return { error: "Open the storefront to change your cart." };
  const { context } = await loadCart(cartId, locale);
  const request = new Request(new URL("/api/cart", shopConfig.site.url), {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
      cookie: createCartCookie(cartId).split(";")[0],
    },
    method: "POST",
  });
  const storefrontClient = context.storefrontClient;
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

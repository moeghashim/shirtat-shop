import { createCartServerHandlers, getCartId, type StorefrontClient } from "@shopify/hydrogen";

import type { getHydrogenCustomerSession } from "@/lib/auth/request";
import { cartBuyerCountry, updateCartBuyerCountry } from "@/lib/cart/buyer";
import { isSupportedCountry } from "@/lib/commerce";
import { CART_FRAGMENT } from "@/lib/shopify/fragments/cart";

// Hydrogen's cart actions have no buyer-country intent. `{ buyerCountry: true }` updates the cart to the request's country before any other action.
const BUYER_COUNTRY_BODY = "buyerCountry";

type CartRoute = {
  get: (context: CartRouteContext) => Promise<{ data: { cart: object | null }; type: string }>;
  post: ((context: CartRouteContext) => Promise<unknown>) & { method: string; pathname: string };
};

type CartRouteContext = {
  request: Request;
  storefrontClient: Pick<StorefrontClient, "graphql" | "requestContext">;
};

function isBuyerCountryRequest(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const record = body as Record<string, unknown>;
  return (
    record[BUYER_COUNTRY_BODY] === true &&
    record.lines === undefined &&
    record.discountCodes === undefined &&
    record.attributes === undefined &&
    record.note === undefined
  );
}

async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  try {
    return await request.clone().json();
  } catch {
    return null;
  }
}

function withBuyerCountry<T extends { post: { method: string; pathname: string } }>(
  handlers: T,
): T {
  const route = handlers as unknown as CartRoute;
  const post = route.post;
  const wrapped = async (context: CartRouteContext) => {
    const country = context.storefrontClient.requestContext.i18n.country;
    const cartId = getCartId(context.request);
    const buyerCountryRequest = isBuyerCountryRequest(await readJson(context.request));
    if (cartId && isSupportedCountry(country)) {
      const current = await route.get(context);
      if (current.type === "json" && cartBuyerCountry(current.data.cart) !== country) {
        await updateCartBuyerCountry(context.storefrontClient, cartId, country);
        if (buyerCountryRequest) return route.get(context);
      } else if (buyerCountryRequest) {
        return current;
      }
    }
    if (buyerCountryRequest) return route.get(context);
    return post(context);
  };
  Object.defineProperties(wrapped, {
    method: { value: post.method },
    pathname: { value: post.pathname },
  });
  route.post = wrapped as CartRoute["post"];
  return handlers;
}

export const cartHandlers = withBuyerCountry(createCartServerHandlers({ fragment: CART_FRAGMENT }));

export function createCustomerCartHandlers(
  customerSession: Awaited<ReturnType<typeof getHydrogenCustomerSession>>,
) {
  return withBuyerCountry(
    createCartServerHandlers({
      customerSession,
      fragment: CART_FRAGMENT,
    }),
  );
}

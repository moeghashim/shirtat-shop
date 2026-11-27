import { gql, type StorefrontClient } from "@shopify/hydrogen";

import { type SupportedCountry } from "@/lib/commerce";

// Presentment follows buyerIdentity.countryCode when it disagrees with @inContext.
export const CART_BUYER_COUNTRY_UPDATE = gql(/* GraphQL */ `
  mutation cartBuyerIdentityUpdate($buyerIdentity: CartBuyerIdentityInput!, $cartId: ID!) {
    cartBuyerIdentityUpdate(buyerIdentity: $buyerIdentity, cartId: $cartId) {
      cart {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`);

export async function updateCartBuyerCountry(
  storefrontClient: Pick<StorefrontClient, "graphql">,
  cartId: string,
  country: SupportedCountry,
) {
  const { data, errors } = await storefrontClient.graphql(CART_BUYER_COUNTRY_UPDATE, {
    variables: { buyerIdentity: { countryCode: country }, cartId },
  });
  if (errors?.length) throw new Error(errors[0].message);
  const userErrors = data?.cartBuyerIdentityUpdate?.userErrors ?? [];
  if (userErrors.length) throw new Error(userErrors.map((error) => error.message).join("; "));
}

export function cartBuyerCountry(cart: object | null | undefined): string | null {
  if (!cart || !("buyerIdentity" in cart)) return null;
  const identity = cart.buyerIdentity;
  if (!identity || typeof identity !== "object" || !("countryCode" in identity)) return null;
  const code = identity.countryCode;
  return typeof code === "string" && code ? code : null;
}

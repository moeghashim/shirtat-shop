import { gql } from "@shopify/hydrogen";

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

export function cartBuyerCountry(cart: object | null | undefined): string | null {
  if (!cart || !("buyerIdentity" in cart)) return null;
  const identity = cart.buyerIdentity;
  if (!identity || typeof identity !== "object" || !("countryCode" in identity)) return null;
  const code = identity.countryCode;
  return typeof code === "string" && code ? code : null;
}

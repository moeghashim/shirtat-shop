import { defineTool } from "eve/tools";
import { z } from "zod";

import { CUSTOM_SKU_PREFIX, CUSTOM_TAG, isCustomDesignHandle } from "../../lib/custom/products";
import { fetchVariantForCart } from "../../lib/shopify/operations/products/server";
import { commitCartWrite, getSessionCartId, mutateCart } from "../lib/cart";

export default defineTool({
  description:
    "Add a ProductVariant ID that get-product-details shows as available and matching the requested options to the shopper's cart. Only when asked. Never add a custom-design variant, and never retry an uncertain change.",
  inputSchema: z.strictObject({
    quantity: z.number().int().min(1).max(99).default(1),
    variantId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/[0-9]+$/),
  }),
  execute: ({ quantity, variantId }, ctx) =>
    commitCartWrite(ctx, `add:${variantId}`, async () => {
      const cartId = getSessionCartId(ctx);
      if (!cartId) return { error: "Open the storefront to change your cart." };
      const variant = await fetchVariantForCart({ id: variantId });
      if (!variant) return { error: "That variant is not available." };
      const url = `/products/${variant.handle}`;
      if (
        isCustomDesignHandle(variant.handle) ||
        variant.tags.includes(CUSTOM_TAG) ||
        variant.sku?.startsWith(CUSTOM_SKU_PREFIX)
      )
        return {
          error: "Custom designs are made on the product page. Do not invent text, style, or fit.",
          url,
        };
      if (!variant.availableForSale) return { error: "That option is sold out.", url };
      if (variant.requiresComponents || variant.requiresSellingPlan)
        return { error: "Choose that option on the product page.", url };
      return mutateCart(cartId, {
        lines: [{ merchandiseId: variant.id, quantity }],
      });
    }),
});

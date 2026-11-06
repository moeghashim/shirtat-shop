import { defineTool } from "eve/tools";
import { z } from "zod";

import { fetchProductVariantBySelectedOptions } from "../../lib/shopify/operations/products/server";
import {
  commitCartWrite,
  getCart,
  getSessionCartId,
  lineAttributes,
  mutateCart,
} from "../lib/cart";
import { productOptionsSchema } from "../lib/catalog";

export default defineTool({
  description:
    "Change the options of an existing cart line, such as its size or color, keeping its quantity and any custom-design properties. Read get-cart first. Never invent design text, style, preset, or fit.",
  inputSchema: z.strictObject({
    lineId: z.string().regex(/^gid:\/\/shopify\/CartLine\/[^\s]+$/),
    options: productOptionsSchema,
  }),
  execute: ({ lineId, options }, ctx) =>
    commitCartWrite(ctx, `line:${lineId}`, async () => {
      const cartId = getSessionCartId(ctx);
      if (!cartId) return { error: "Open the storefront to change your cart." };
      const line = (await getCart(cartId))?.lines.nodes.find((node) => node.id === lineId);
      if (!line) return { error: "This line is not in the current cart." };
      if ("parentRelationship" in line && line.parentRelationship)
        return { error: "Change this item through the item it belongs to." };

      const selection = new Map(
        line.merchandise.selectedOptions.map((option) => [option.name.toLowerCase(), option]),
      );
      for (const option of options) selection.set(option.name.toLowerCase(), option);
      const result = await fetchProductVariantBySelectedOptions({
        handle: line.merchandise.product.handle,
        selectedOptions: [...selection.values()].map(({ name, value }) => ({ name, value })),
      });
      if (!result) return { error: "This product is no longer available." };
      const optionNames = new Set(result.options.map((option) => option.name.toLowerCase()));
      if (!options.length || options.some((option) => !optionNames.has(option.name.toLowerCase())))
        return { error: "Name options this product has.", options: result.options };

      const { variant } = result;
      if (!variant) return { error: "No variant has those options.", options: result.options };
      if (variant.id === line.merchandise.id)
        return { error: "This line already has those options." };
      if (!variant.availableForSale) return { error: "That option is sold out." };

      const sellingPlanId = line.sellingPlanAllocation?.sellingPlan.id;
      if (variant.requiresComponents || (variant.requiresSellingPlan && !sellingPlanId))
        return { error: "Choose that option on the product page." };

      const attributes = lineAttributes(line);
      return mutateCart(cartId, {
        lines: [
          {
            id: lineId,
            merchandiseId: variant.id,
            quantity: line.quantity,
            ...(attributes ? { attributes } : {}),
            ...(sellingPlanId ? { sellingPlanId } : {}),
          },
        ],
      });
    }),
});

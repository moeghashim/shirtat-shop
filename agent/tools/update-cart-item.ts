import { defineTool } from "eve/tools";
import { z } from "zod";

import {
  commitCartWrite,
  getCart,
  getSessionCartId,
  lineAttributes,
  mutateCart,
} from "../lib/cart";

export default defineTool({
  description:
    "Set the quantity of an existing cart line, or remove it with quantity zero, keeping any custom-design properties. Read get-cart first.",
  inputSchema: z.strictObject({
    lineId: z.string().regex(/^gid:\/\/shopify\/CartLine\/[^\s]+$/),
    quantity: z.number().int().min(0).max(99),
  }),
  execute: ({ lineId, quantity }, ctx) =>
    commitCartWrite(ctx, `line:${lineId}`, async () => {
      const cartId = getSessionCartId(ctx);
      if (!cartId) return { error: "Open the storefront to change your cart." };
      const line = (await getCart(cartId))?.lines.nodes.find((node) => node.id === lineId);
      if (!line) return { error: "This line is not in the current cart." };
      const attributes = lineAttributes(line);
      return mutateCart(cartId, {
        lines: [{ id: lineId, quantity, ...(attributes ? { attributes } : {}) }],
      });
    }),
});

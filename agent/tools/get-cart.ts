import { defineTool } from "eve/tools";
import { z } from "zod";

import { CUSTOM_PROPERTY } from "../../lib/custom/products";
import { clearBlockedCartWrites, getCart, getSessionCartId } from "../lib/cart";

export default defineTool({
  description:
    "Read a minimal summary of the current cart before editing a line. Not needed after a successful change; the confirmation already shows the cart. Design properties on a line are preserved by later updates and must not be rewritten.",
  inputSchema: z.strictObject({}),
  execute: async (_input, ctx) => {
    const cart = await getCart(getSessionCartId(ctx));
    if (!cart) return { error: "Cart is unavailable. Refresh the storefront." };
    clearBlockedCartWrites();
    return {
      empty: !cart.lines.nodes.length,
      lines: cart.lines.nodes.map((line) => {
        const design = Object.fromEntries(
          (line.attributes ?? []).flatMap((attribute) =>
            attribute.value && (Object.values(CUSTOM_PROPERTY) as string[]).includes(attribute.key)
              ? [[attribute.key, attribute.value]]
              : [],
          ),
        );
        return {
          ...(Object.keys(design).length ? { design } : {}),
          lineId: line.id,
          options: line.merchandise.selectedOptions.map((option) => option.value).join(" / "),
          productTitle: line.merchandise.product.title,
          quantity: line.quantity,
          variantId: line.merchandise.id,
        };
      }),
      note: cart.note || null,
      totalQuantity: cart.totalQuantity,
    };
  },
});

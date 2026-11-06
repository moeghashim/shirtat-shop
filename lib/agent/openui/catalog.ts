import { steps } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const noteProps = z.object({
  text: z.string().max(400).describe("One or two short sentences. No prices and no product lists."),
});

export const productCardsProps = z.object({
  handles: z
    .array(z.string().max(255))
    .max(12)
    .describe("Handles already returned by a product tool in this turn."),
});

export const chooserProps = z.object({
  handle: z
    .string()
    .max(255)
    .describe("Handle of one product returned by get-product-details in this turn."),
});

export const cartProps = z.object({});

export const followUpsProps = z.object({
  options: z
    .array(
      z.object({
        action: z.union([steps.ToAssistant.ref]),
        label: z.string().max(80),
      }),
    )
    .max(3),
});

export const shoppingCopy = {
  cart: "The shopper's live cart, including quantity, remove, and checkout. No arguments. Checkout leaves this chat for Shopify.",
  chooser:
    "Size and color picker for one product from get-product-details. Pass only its handle. Prices, stock, and options come from that tool result.",
  followUps: "Up to three short replies the shopper can tap. Each action is @ToAssistant.",
  note: "A short lead-in in the shopper's language. Do not restate cards or prices.",
  productCards:
    "Product cards for handles already returned by present-products, browse-collection, or get-recommendations. Prices and availability come from those results.",
  stack: "Vertical shopping reply. This is the root.",
} as const;

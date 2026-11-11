import { z } from "zod";

const handle = z
  .string()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
  .max(255);
const productId = z.string().regex(/^gid:\/\/shopify\/Product\/[0-9]+$/);
const variantId = z.string().regex(/^gid:\/\/shopify\/ProductVariant\/[0-9]+$/);
const lineId = z.string().regex(/^gid:\/\/shopify\/CartLine\/[^\s]+$/);
const option = z.strictObject({
  name: z.string().max(100),
  value: z.string().max(100),
});
const options = z.array(option).max(10);

export const voiceToolNames = [
  "add-to-cart",
  "browse-collection",
  "change-cart-item-options",
  "get-cart",
  "get-product-details",
  "get-recommendations",
  "list-collections",
  "offer-choices",
  "present-products",
  "search-catalog",
  "update-cart-item",
] as const;

export type VoiceToolName = (typeof voiceToolNames)[number];

const schemas = {
  "add-to-cart": z.strictObject({
    quantity: z.number().int().min(1).max(99).default(1),
    variantId,
  }),
  "browse-collection": z.strictObject({
    collection: handle,
    sortKey: z
      .enum(["best-selling", "created-descending", "manual", "price-ascending", "price-descending"])
      .default("manual"),
  }),
  "change-cart-item-options": z.strictObject({
    lineId,
    options: options.min(1),
  }),
  "get-cart": z.strictObject({}),
  "get-product-details": z.strictObject({ handle }),
  "get-recommendations": z.strictObject({ handle }),
  "list-collections": z.strictObject({}),
  "offer-choices": z.strictObject({
    choices: z
      .array(
        z.strictObject({
          label: z.string().trim().min(1).max(80),
          message: z.string().trim().min(1).max(200).optional(),
        }),
      )
      .min(1)
      .max(3),
  }),
  "present-products": z.strictObject({
    ids: z.array(productId).max(12),
    options: options.default([]),
  }),
  "search-catalog": z.strictObject({
    available: z.boolean().optional(),
    limit: z.number().int().min(1).max(12).default(8),
    maxPriceMinor: z.number().int().min(0).max(10_000_000).optional(),
    minPriceMinor: z.number().int().min(0).max(10_000_000).optional(),
    options: options.default([]),
    query: z.string().trim().min(1).max(200),
  }),
  "update-cart-item": z.strictObject({
    lineId,
    quantity: z.number().int().min(0).max(99),
  }),
} satisfies Record<VoiceToolName, z.ZodType>;

const descriptions: Record<VoiceToolName, string> = {
  "add-to-cart":
    "Add an available variant id from get-product-details to the shopper's cart. Only when asked. Never add a custom-design variant, and never retry an uncertain change.",
  "browse-collection": "Browse products by a collection handle from list-collections.",
  "change-cart-item-options":
    "Change the size or color of an existing cart line. Read get-cart first. Never invent design text.",
  "get-cart": "Read the current cart before editing a line.",
  "get-product-details":
    "Load one product and its variant picker. Use when the shopper wants details or to buy, not for the first search cards.",
  "get-recommendations": "Show related products for a product handle.",
  "list-collections": "List this store's collection handles and titles.",
  "offer-choices":
    "Show up to three short tappable choices on screen. Use the shopper's language. Do not invent a price.",
  "present-products":
    "Render product ids returned by search-catalog. Pass only options the shopper explicitly requested.",
  "search-catalog":
    "Search this store's Shopify catalog with the shopper's words. Call as soon as a product, gift, style, or constraint is clear, even mid-sentence. Do not pass country, language, or a cart id.",
  "update-cart-item":
    "Set an existing cart line's quantity, or remove it with quantity zero. Read get-cart first.",
};

export function isVoiceToolName(value: string): value is VoiceToolName {
  return (voiceToolNames as readonly string[]).includes(value);
}

export function parseVoiceToolArguments<Name extends VoiceToolName>(
  name: Name,
  value: unknown,
): { data: z.infer<(typeof schemas)[Name]> } | { error: string } {
  const parsed = schemas[name].safeParse(value ?? {});
  if (!parsed.success) return { error: "Those tool arguments are not usable." };
  return { data: parsed.data as z.infer<(typeof schemas)[Name]> };
}

export function realtimeTools() {
  return voiceToolNames.map((name) => ({
    description: descriptions[name],
    name,
    parameters: parametersFor(schemas[name]),
    type: "function" as const,
  }));
}

function parametersFor(schema: z.ZodType) {
  const json = z.toJSONSchema(schema) as { $schema?: string };
  const { $schema, ...parameters } = json;
  return parameters;
}

import { getCartId } from "@shopify/hydrogen";

import { CART_UNCONFIRMED, getCart, lineAttributes, mutateCart } from "@/agent/lib/cart";
import { matchingProducts, toModelProductDetails, toModelProducts } from "@/agent/lib/catalog";
import { agentProfileUrl } from "@/agent/lib/profile";
import { toAgentProduct, toAgentProductDetails } from "@/lib/agent/products";
import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { CUSTOM_SKU_PREFIX, CUSTOM_TAG, isCustomDesignHandle } from "@/lib/custom/products";
import { commerceLocale } from "@/lib/i18n";
import { fetchCollections } from "@/lib/shopify/operations/collections/server";
import {
  fetchCollectionProducts,
  fetchProductRecommendations,
  fetchProductsByIds,
  fetchProductVariantBySelectedOptions,
  fetchProductWithVariants,
  fetchVariantForCart,
} from "@/lib/shopify/operations/products/server";

import type { VoiceToolView } from "./index";
import { isVoiceToolName, parseVoiceToolArguments, type VoiceToolName } from "./schema";

export interface VoiceToolResult {
  model: unknown;
  view: VoiceToolView;
}

const emptyView = (): VoiceToolView => ({
  cart: false,
  choices: [],
  chooser: null,
  products: [],
});

const calls = new Map<string, Promise<VoiceToolResult>>();

export function executeVoiceTool(
  name: string,
  value: unknown,
  request: Request,
  localeName: "ar" | "en",
  callId: string,
): Promise<VoiceToolResult> {
  const existing = calls.get(callId);
  if (existing) return existing;
  const pending = runTool(name, value, request, commerceLocale(localeName)).catch(() =>
    done({ error: "That action failed." }, emptyView()),
  );
  calls.set(callId, pending);
  if (calls.size > 200) {
    const first = calls.keys().next().value;
    if (first) calls.delete(first);
  }
  return pending;
}

async function runTool(
  name: string,
  value: unknown,
  request: Request,
  locale: CommerceLocale,
): Promise<VoiceToolResult> {
  if (!isVoiceToolName(name)) return done({ error: "That tool is not available." }, emptyView());
  const cartId = getCartId({ cookie: request.headers.get("cookie") ?? undefined }) ?? undefined;
  if (name === "add-to-cart") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return addToCart(parsed.data, cartId, locale);
  }
  if (name === "browse-collection") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return browse(parsed.data, locale);
  }
  if (name === "change-cart-item-options") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return changeOptions(parsed.data, cartId, locale);
  }
  if (name === "get-cart") return emptyArgs(name, value, () => readCart(cartId));
  if (name === "get-product-details") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return productDetails(parsed.data.handle, locale);
  }
  if (name === "get-recommendations") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return recommendations(parsed.data.handle, locale);
  }
  if (name === "list-collections") return emptyArgs(name, value, () => collections(locale));
  if (name === "offer-choices") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return offerChoices(parsed.data.choices);
  }
  if (name === "present-products") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return present(parsed.data, locale);
  }
  if (name === "search-catalog") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return searchCatalog(parsed.data, locale);
  }
  if (name === "update-cart-item") {
    const parsed = parseVoiceToolArguments(name, value);
    if ("error" in parsed) return done({ error: parsed.error }, emptyView());
    return updateLine(parsed.data, cartId);
  }
  return done({ error: "That tool is not available." }, emptyView());
}

function emptyArgs(
  name: "get-cart" | "list-collections",
  value: unknown,
  run: () => Promise<VoiceToolResult>,
) {
  const parsed = parseVoiceToolArguments(name, value);
  if ("error" in parsed) return done({ error: parsed.error }, emptyView());
  return run();
}

async function searchCatalog(
  args: {
    available?: boolean;
    limit: number;
    maxPriceMinor?: number;
    minPriceMinor?: number;
    options: { name: string; value: string }[];
    query: string;
  },
  locale: CommerceLocale,
): Promise<VoiceToolResult> {
  const available = args.available ?? true;
  const first = await catalogSearch({ ...args, available });
  const result =
    "error" in first || first.ids.length || args.available !== undefined
      ? first
      : await catalogSearch({ ...args, available: false });
  if ("error" in result) return done({ error: result.error }, emptyView());
  const products = await cardsFor(result.ids, args.options, locale);
  const model = modelProducts(products);
  return done({ ...model, available, ids: result.ids }, { ...emptyView(), products });
}

async function present(
  args: { ids: string[]; options: { name: string; value: string }[] },
  locale: CommerceLocale,
): Promise<VoiceToolResult> {
  const products = await cardsFor(args.ids, args.options, locale);
  const model = toModelProducts({ products });
  return done(model.type === "json" ? model.value : { products: [] }, { ...emptyView(), products });
}

async function recommendations(handle: string, locale: CommerceLocale): Promise<VoiceToolResult> {
  const [related, complementary] = await Promise.all([
    fetchProductRecommendations({ handle, intent: "RELATED", locale }),
    fetchProductRecommendations({ handle, intent: "COMPLEMENTARY", locale }),
  ]);
  const products = [
    ...new Map([...related, ...complementary].map((product) => [product.id, product])).values(),
  ]
    .slice(0, 12)
    .map(toAgentProduct);
  return done(modelProducts(products), { ...emptyView(), products });
}

async function browse(
  args: {
    collection: string;
    sortKey:
      | "best-selling"
      | "created-descending"
      | "manual"
      | "price-ascending"
      | "price-descending";
  },
  locale: CommerceLocale,
): Promise<VoiceToolResult> {
  const { products: found } = await fetchCollectionProducts({
    collection: args.collection,
    limit: 12,
    locale,
    sortKey: args.sortKey,
  });
  if (!found.length)
    return done(
      { error: "No products found for this collection handle. Use list-collections for handles." },
      emptyView(),
    );
  const products = found.map(toAgentProduct);
  return done(modelProducts(products), { ...emptyView(), products });
}

async function collections(locale: CommerceLocale): Promise<VoiceToolResult> {
  const listed = (await fetchCollections({ limit: 24, locale })).map(
    ({ description, handle, title }) => ({
      description: description.slice(0, 160),
      handle,
      title,
    }),
  );
  return done({ collections: listed }, emptyView());
}

async function productDetails(handle: string, locale: CommerceLocale): Promise<VoiceToolResult> {
  const product = await fetchProductWithVariants({ handle, locale });
  if (!product) return done({ error: "Product not found." }, emptyView());
  const details: AgentProductDetails = {
    ...toAgentProductDetails(product),
    customDesign: isCustomDesignHandle(product.handle),
  };
  const model = toModelProductDetails({ product: details });
  return done(model.type === "json" ? model.value : { error: "Product not found." }, {
    ...emptyView(),
    chooser: details.handle,
    products: [details],
  });
}

function offerChoices(
  input: readonly { label: string; message?: string }[],
): Promise<VoiceToolResult> {
  const offered = input.map((choice) => ({
    label: choice.label,
    message: choice.message ?? choice.label,
  }));
  return Promise.resolve(done({ choices: offered }, { ...emptyView(), choices: offered }));
}

async function readCart(cartId: string | undefined): Promise<VoiceToolResult> {
  const cart = await getCart(cartId);
  if (!cart) return done({ error: "Cart is unavailable. Refresh the storefront." }, emptyView());
  return done(summarize(cart), { ...emptyView(), cart: true });
}

async function addToCart(
  args: { quantity: number; variantId: string },
  cartId: string | undefined,
  locale: CommerceLocale,
): Promise<VoiceToolResult> {
  if (!cartId) return done({ error: "Open the storefront to change your cart." }, emptyView());
  const variant = await fetchVariantForCart({ id: args.variantId, locale });
  if (!variant) return done({ error: "That variant is not available." }, emptyView());
  const url = `/products/${variant.handle}`;
  if (
    isCustomDesignHandle(variant.handle) ||
    variant.tags.includes(CUSTOM_TAG) ||
    variant.sku?.startsWith(CUSTOM_SKU_PREFIX)
  )
    return done(
      {
        error: "Custom designs are made on the product page. Do not invent text, style, or fit.",
        url,
      },
      emptyView(),
    );
  if (!variant.availableForSale)
    return done({ error: "That option is sold out.", url }, emptyView());
  if (variant.requiresComponents || variant.requiresSellingPlan)
    return done({ error: "Choose that option on the product page.", url }, emptyView());
  return cartResult(
    await mutateCart(cartId, { lines: [{ merchandiseId: variant.id, quantity: args.quantity }] }),
  );
}

async function updateLine(
  args: { lineId: string; quantity: number },
  cartId: string | undefined,
): Promise<VoiceToolResult> {
  if (!cartId) return done({ error: "Open the storefront to change your cart." }, emptyView());
  const line = (await getCart(cartId))?.lines.nodes.find((node) => node.id === args.lineId);
  if (!line) return done({ error: "This line is not in the current cart." }, emptyView());
  const attributes = lineAttributes(line);
  return cartResult(
    await mutateCart(cartId, {
      lines: [{ id: args.lineId, quantity: args.quantity, ...(attributes ? { attributes } : {}) }],
    }),
  );
}

async function changeOptions(
  args: { lineId: string; options: { name: string; value: string }[] },
  cartId: string | undefined,
  locale: CommerceLocale,
): Promise<VoiceToolResult> {
  if (!cartId) return done({ error: "Open the storefront to change your cart." }, emptyView());
  const line = (await getCart(cartId))?.lines.nodes.find((node) => node.id === args.lineId);
  if (!line) return done({ error: "This line is not in the current cart." }, emptyView());
  if ("parentRelationship" in line && line.parentRelationship)
    return done({ error: "Change this item through the item it belongs to." }, emptyView());
  const selection = new Map(
    line.merchandise.selectedOptions.map((option) => [option.name.toLowerCase(), option]),
  );
  for (const option of args.options) selection.set(option.name.toLowerCase(), option);
  const result = await fetchProductVariantBySelectedOptions({
    handle: line.merchandise.product.handle,
    locale,
    selectedOptions: [...selection.values()].map(({ name, value }) => ({ name, value })),
  });
  if (!result) return done({ error: "This product is no longer available." }, emptyView());
  const optionNames = new Set(result.options.map((option) => option.name.toLowerCase()));
  if (args.options.some((option) => !optionNames.has(option.name.toLowerCase())))
    return done({ error: "Name options this product has.", options: result.options }, emptyView());
  const variant = result.variant;
  if (!variant)
    return done({ error: "No variant has those options.", options: result.options }, emptyView());
  if (variant.id === line.merchandise.id)
    return done({ error: "This line already has those options." }, emptyView());
  if (!variant.availableForSale) return done({ error: "That option is sold out." }, emptyView());
  const sellingPlanId = line.sellingPlanAllocation?.sellingPlan.id;
  if (variant.requiresComponents || (variant.requiresSellingPlan && !sellingPlanId))
    return done({ error: "Choose that option on the product page." }, emptyView());
  const attributes = lineAttributes(line);
  return cartResult(
    await mutateCart(cartId, {
      lines: [
        {
          id: args.lineId,
          merchandiseId: variant.id,
          quantity: line.quantity,
          ...(attributes ? { attributes } : {}),
          ...(sellingPlanId ? { sellingPlanId } : {}),
        },
      ],
    }),
  );
}

async function cardsFor(
  ids: readonly string[],
  options: { name: string; value: string }[],
  locale: CommerceLocale,
): Promise<AgentProduct[]> {
  const unique = [...new Set(ids)].slice(0, 12);
  if (!unique.length) return [];
  return matchingProducts(await fetchProductsByIds({ ids: unique, locale }), options);
}

async function catalogSearch(args: {
  available: boolean;
  limit: number;
  maxPriceMinor?: number;
  minPriceMinor?: number;
  query: string;
}): Promise<{ error: string } | { ids: string[] }> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) return { error: "Catalog search is unavailable. Offer a collection instead." };
  const price =
    args.minPriceMinor != null || args.maxPriceMinor != null
      ? {
          ...(args.maxPriceMinor != null ? { max: args.maxPriceMinor } : {}),
          ...(args.minPriceMinor != null ? { min: args.minPriceMinor } : {}),
        }
      : undefined;
  try {
    const response = await fetch(`https://${domain}/api/ucp/mcp`, {
      body: JSON.stringify({
        id: "search",
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          _meta: { "ucp-agent": { profile: agentProfileUrl() } },
          arguments: {
            context: {
              address_country: shopConfig.localization.country,
              language: shopConfig.localization.locale,
            },
            filters: { available: args.available, ...(price ? { price } : {}) },
            limit: args.limit,
            query: args.query,
          },
          name: "search_catalog",
        },
      }),
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok)
      return { error: "Catalog search is unavailable. Offer a collection instead." };
    const payload = await readCatalogBody(await response.text());
    return { ids: collectProductIds(payload).slice(0, args.limit) };
  } catch {
    return { error: "Catalog search is unavailable. Offer a collection instead." };
  }
}

function cartResult(
  result: { cartUpdated: true; warnings: string[] } | { error: string; url?: string },
): VoiceToolResult {
  if ("error" in result)
    return done(result, { ...emptyView(), cart: result.error === CART_UNCONFIRMED });
  return done(result, { ...emptyView(), cart: true });
}

function summarize(cart: NonNullable<Awaited<ReturnType<typeof getCart>>>) {
  return {
    empty: !cart.lines.nodes.length,
    lines: cart.lines.nodes.map((line) => ({
      lineId: line.id,
      options: line.merchandise.selectedOptions.map((option) => option.value).join(" / "),
      productTitle: line.merchandise.product.title,
      quantity: line.quantity,
      variantId: line.merchandise.id,
    })),
    note: cart.note || null,
    totalQuantity: cart.totalQuantity,
  };
}

function modelProducts(products: AgentProduct[]): { products: unknown } {
  const model = toModelProducts({ products });
  if (model.type !== "json" || !model.value || typeof model.value !== "object")
    return { products: [] };
  return model.value as { products: unknown };
}

function done(model: unknown, view: VoiceToolView): VoiceToolResult {
  return { model, view };
}

async function readCatalogBody(text: string): Promise<unknown> {
  const trimmed = text.trim();
  if (!trimmed.startsWith("data:")) return JSON.parse(trimmed) as unknown;
  let last: unknown = null;
  for (const line of trimmed.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    last = JSON.parse(data) as unknown;
  }
  return last;
}

function collectProductIds(value: unknown, into = new Set<string>()): string[] {
  if (typeof value === "string") {
    if (/^gid:\/\/shopify\/Product\/\d+$/.test(value)) into.add(value);
    return [...into];
  }
  if (!value || typeof value !== "object") return [...into];
  for (const entry of Object.values(value)) collectProductIds(entry, into);
  return [...into];
}

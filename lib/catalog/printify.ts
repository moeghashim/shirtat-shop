/**
 * Printify integration (enabled by PRINTIFY_ENABLED=1, PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID).
 *
 * Approach – Shopify stays the single source of products; Printify is the print/fulfilment backend:
 *  1. "Apply design" creates a Printify product in the API shop (no sales channel, so Printify never
 *     creates its own Shopify product → no duplicates), with only the chosen variants enabled and the
 *     design on the front print area. It is never published from Printify.
 *  2. The Shopify DRAFT is then created by our workflow with Printify's mockup images, and each Shopify
 *     variant's SKU is `PFY-<printifyProductId>-<printifyVariantId>` (plus a product metafield
 *     shirtat.printify_product_id). Drafts stay unpublished until Moe publishes them.
 *  3. On orders/paid (Shopify webhook) `submitPrintifyOrder` reads those SKUs and creates a Printify
 *     order. Printify holds API orders until they are sent to production (in Printify or via API).
 */
import { SUPPLIER_CATALOG, supplierVariant, variantPrice } from "./pricing";

const API = "https://api.printify.com/v1";

export function printifyEnabled(): boolean {
  return (
    process.env.PRINTIFY_ENABLED === "1" &&
    Boolean(process.env.PRINTIFY_API_TOKEN) &&
    Boolean(process.env.PRINTIFY_SHOP_ID)
  );
}

async function pf<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "shirtat.co",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Printify ${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

export interface PrintifyProductInput {
  colors: string[];
  description: string;
  imageUrl: string;
  /** Front print scale (0–1 of the print area width). */
  scale?: number;
  sizes: string[];
  title: string;
  typeId: string;
}

export interface PrintifyProductResult {
  id: string;
  mockups: string[];
  /** "<color>|<size>" → Printify variant id */
  variantIds: Record<string, number>;
}

export const skuFor = (productId: string, variantId: number) => `PFY-${productId}-${variantId}`;

export function parseSku(
  sku: string | null | undefined,
): { productId: string; variantId: number } | null {
  const m = sku?.match(/^PFY-([a-f0-9]+)-(\d+)$/);
  return m ? { productId: m[1]!, variantId: Number(m[2]) } : null;
}

/** Uploads the design and creates the Printify product. Returns null while disabled. */
export async function createPrintifyProduct(
  input: PrintifyProductInput,
): Promise<PrintifyProductResult | null> {
  if (!printifyEnabled()) return null;
  const cat = SUPPLIER_CATALOG[input.typeId];
  if (!cat) throw new Error(`No Printify catalog entry for ${input.typeId}`);
  const variantIds: Record<string, number> = {};
  const variants: { id: number; is_enabled: boolean; price: number }[] = [];
  for (const color of input.colors) {
    for (const size of input.sizes) {
      const v = supplierVariant(input.typeId, color, size);
      const price = variantPrice(input.typeId, color, size);
      if (!v || !price || variants.some((x) => x.id === v.id)) continue;
      variantIds[`${color}|${size}`] = v.id;
      variants.push({ id: v.id, is_enabled: true, price: Math.round(Number(price) * 100) });
    }
  }
  if (!variants.length) throw new Error(`No Printify variants for ${input.typeId}`);
  const image = await pf<{ id: string }>("POST", "/uploads/images.json", {
    file_name: `${input.title.replace(/[^\w-]+/g, "-")}.png`,
    url: input.imageUrl,
  });
  const product = await pf<{ id: string; images: { src: string; is_default: boolean }[] }>(
    "POST",
    `/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`,
    {
      blueprint_id: cat.blueprintId,
      description: input.description,
      print_areas: [
        {
          placeholders: [
            {
              images: [{ angle: 0, id: image.id, scale: input.scale ?? 0.8, x: 0.5, y: 0.45 }],
              position: "front",
            },
          ],
          variant_ids: variants.map((v) => v.id),
        },
      ],
      print_provider_id: cat.providerId,
      title: input.title,
      variants,
    },
  );
  const mockups = [...product.images]
    .sort((a, b) => Number(b.is_default) - Number(a.is_default))
    .map((i) => i.src)
    .slice(0, 6);
  return { id: product.id, mockups, variantIds };
}

export async function deletePrintifyProduct(id: string): Promise<void> {
  if (!printifyEnabled()) return;
  await pf("DELETE", `/shops/${process.env.PRINTIFY_SHOP_ID}/products/${id}.json`);
}

export interface ShopifyOrderPayload {
  admin_graphql_api_id?: string;
  id: number;
  line_items: {
    id?: number;
    product_id?: number | null;
    quantity: number;
    sku: string | null;
    title?: string;
    variant_title?: string | null;
  }[];
  name: string;
  email?: string;
  shipping_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    country_code?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    province_code?: string;
    zip?: string;
  };
}

/** Creates a Printify order for the given lines of a paid Shopify order (held until sent to production). */
export async function submitPrintifyOrder(
  order: ShopifyOrderPayload,
  lines: { productId: string; quantity: number; variantId: number }[],
): Promise<string | null> {
  if (!printifyEnabled()) return null;
  if (!lines.length || !order.shipping_address) return null;
  const a = order.shipping_address;
  const res = await pf<{ id: string }>(
    "POST",
    `/shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`,
    {
      address_to: {
        address1: a.address1,
        address2: a.address2 ?? "",
        city: a.city,
        country: a.country_code,
        email: order.email,
        first_name: a.first_name,
        last_name: a.last_name,
        phone: a.phone ?? "",
        region: a.province_code ?? "",
        zip: a.zip,
      },
      external_id: `shopify-${order.id}`,
      label: order.name,
      line_items: lines.map((l) => ({
        product_id: l.productId,
        quantity: l.quantity,
        variant_id: l.variantId,
      })),
      send_shipping_notification: false,
      shipping_method: 1,
    },
  );
  return res.id;
}

/**
 * Sends a held Printify order to production. Idempotent: only an order still "on-hold" is sent;
 * anything already sent (or further along) is left alone. Returns the resulting status.
 */
export async function sendPrintifyOrderToProduction(orderId: string): Promise<string> {
  const shop = process.env.PRINTIFY_SHOP_ID;
  const current = await pf<{ status?: string }>("GET", `/shops/${shop}/orders/${orderId}.json`);
  if (current.status && current.status !== "on-hold") return current.status;
  await pf("POST", `/shops/${shop}/orders/${orderId}/send_to_production.json`, {});
  return "sending-to-production";
}

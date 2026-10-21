/**
 * Printify integration point (DISABLED until credentials exist).
 *
 * Needed to enable (set as Vercel env vars, never committed):
 *   PRINTIFY_API_TOKEN   – Personal Access Token from Printify → My account → Connections (scopes:
 *                          shops.read, catalog.read, products.read, products.write, uploads.write,
 *                          orders.read, orders.write)
 *   PRINTIFY_SHOP_ID     – the shop id returned by GET /v1/shops.json for the connected Shopify store
 *   PRINTIFY_ENABLED=1   – explicit switch
 * Also: per type, a print provider id and variant ids (GET /v1/catalog/blueprints/{id}/print_providers/{pid}/variants.json).
 *
 * Flow when enabled: upload the design image (POST /v1/uploads/images.json), create the product
 * (POST /v1/shops/{shop_id}/products.json) with blueprint, provider, variants and print area, then
 * publish it to Shopify so Printify fulfils orders automatically.
 */
import { SUPPLIER_COSTS } from "./pricing";

const API = "https://api.printify.com/v1";

export function printifyEnabled(): boolean {
  return (
    process.env.PRINTIFY_ENABLED === "1" &&
    Boolean(process.env.PRINTIFY_API_TOKEN) &&
    Boolean(process.env.PRINTIFY_SHOP_ID)
  );
}

export interface PrintifyProductInput {
  colors: string[];
  description: string;
  imageUrl: string;
  title: string;
  typeId: string;
}

/** Returns null while disabled; otherwise creates the Printify product and returns its id. */
export async function createPrintifyProduct(input: PrintifyProductInput): Promise<string | null> {
  if (!printifyEnabled()) return null;
  const cost = SUPPLIER_COSTS[input.typeId];
  if (!cost?.blueprintId) throw new Error(`No Printify blueprint configured for ${input.typeId}`);
  const headers = {
    Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
    "Content-Type": "application/json",
  };
  const upload = await fetch(`${API}/uploads/images.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ file_name: `${input.title}.png`, url: input.imageUrl }),
  }).then((r) => r.json() as Promise<{ id: string }>);
  // Provider and variant ids must be configured before this is enabled; see the header comment.
  throw new Error(
    `Printify provider/variant mapping not configured yet (uploaded image ${upload.id})`,
  );
}

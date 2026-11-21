import { GA_MEASUREMENT_ID, gaClientId, gaSessionId } from "@/lib/analytics";

const COLLECT_URL = "https://www.google-analytics.com/mp/collect";

export interface Ga4PurchaseItem {
  item_id?: string;
  item_name?: string;
  price?: number;
  quantity: number;
}

export interface Ga4PurchaseParams {
  currency?: string;
  items: Ga4PurchaseItem[];
  session_id?: number;
  shipping?: number;
  tax?: number;
  transaction_id: string;
  value?: number;
}

export interface Ga4PurchasePayload {
  client_id: string;
  events: Array<{ name: "purchase"; params: Ga4PurchaseParams }>;
}

export type Ga4PurchaseResult = "failed" | "sent" | "skipped" | "unconfigured";

// The Google & YouTube pixel does not run on shop.app, so only that host is sent from the server.
export function isShopAppLanding(landingSite: string | null | undefined): boolean {
  const value = landingSite?.trim();
  if (!value) return false;
  const withScheme = /^[a-z][a-z\d+\-.]*:/i.test(value)
    ? value
    : `https://${value.replace(/^\/\//, "")}`;
  try {
    return new URL(withScheme).hostname.toLowerCase() === "shop.app";
  } catch {
    return false;
  }
}

export function ga4PurchasePayload(order: unknown): Ga4PurchasePayload | null {
  if (!isRecord(order)) return null;
  const transactionId = orderName(order);
  if (!transactionId) return null;
  const params: Ga4PurchaseParams = {
    items: purchaseItems(order),
    transaction_id: transactionId,
  };
  const currency = currencyCode(order.currency);
  const sessionId = sessionNumber(noteAttribute(order, "_ga_sid"));
  const shipping = shippingAmount(order);
  const tax = money(order.current_total_tax ?? order.total_tax);
  const value = purchaseValue(order, shipping, tax);
  if (currency) params.currency = currency;
  if (sessionId !== undefined) params.session_id = sessionId;
  if (shipping !== undefined) params.shipping = shipping;
  if (tax !== undefined) params.tax = tax;
  if (value !== undefined) params.value = value;
  return {
    client_id: gaClientId(noteAttribute(order, "_ga_cid")) ?? syntheticClientId(order),
    events: [{ name: "purchase", params }],
  };
}

export async function notifyGa4Purchase(
  order: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Ga4PurchaseResult> {
  try {
    if (!isShopAppLanding(orderLandingSite(order))) return "skipped";
    const secret = process.env.GA4_API_SECRET?.trim() ?? "";
    if (!secret) {
      console.warn("[ga4] purchase skipped: GA4_API_SECRET is unset");
      return "unconfigured";
    }
    const payload = ga4PurchasePayload(order);
    if (!payload) return "skipped";
    const endpoint = new URL(COLLECT_URL);
    endpoint.searchParams.set("measurement_id", GA_MEASUREMENT_ID);
    endpoint.searchParams.set("api_secret", secret);
    const response = await fetchImpl(endpoint, {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) {
      console.error("[ga4] measurement protocol", response.status);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[ga4] purchase", error instanceof Error ? error.name : "error");
    return "failed";
  }
}

// GA4 purchase value is merchandise revenue after discounts. Shipping and tax stay in their own fields.
function purchaseValue(
  order: Record<string, unknown>,
  shipping: number | undefined,
  tax: number | undefined,
): number | undefined {
  const subtotal = money(order.current_subtotal_price ?? order.subtotal_price);
  if (subtotal !== undefined) return subtotal;
  const total = money(order.current_total_price ?? order.total_price);
  if (total === undefined) return undefined;
  return money(Math.max(0, total - (tax ?? 0) - (shipping ?? 0)));
}

function orderLandingSite(order: unknown): string | null {
  if (!isRecord(order) || typeof order.landing_site !== "string") return null;
  return order.landing_site;
}

function orderName(order: Record<string, unknown>): string | null {
  if (typeof order.name !== "string") return null;
  const name = order.name.trim().replace(/^#/, "");
  return name ? name.slice(0, 128) : null;
}

function syntheticClientId(order: Record<string, unknown>): string {
  const raw =
    typeof order.id === "number" && Number.isFinite(order.id)
      ? String(Math.trunc(order.id))
      : typeof order.id === "string"
        ? order.id
        : typeof order.admin_graphql_api_id === "string"
          ? order.admin_graphql_api_id
          : "";
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "") || "0";
  return `0.${digits}`;
}

function sessionNumber(value: string | null): number | undefined {
  const session = gaSessionId(value);
  if (!session) return undefined;
  const numeric = Number(session);
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : undefined;
}

function purchaseItems(order: Record<string, unknown>): Ga4PurchaseItem[] {
  if (!Array.isArray(order.line_items)) return [];
  const items: Ga4PurchaseItem[] = [];
  for (const item of order.line_items) {
    if (!isRecord(item)) continue;
    const quantity = quantityOf(item.quantity);
    if (!quantity) continue;
    const sku = typeof item.sku === "string" ? item.sku.trim() : "";
    const name = firstString(item.name, item.title);
    if (!sku && !name) continue;
    const price = money(item.price);
    const entry: Ga4PurchaseItem = { quantity };
    if (sku) entry.item_id = sku.slice(0, 100);
    if (name) entry.item_name = name.slice(0, 100);
    if (price !== undefined) entry.price = price;
    items.push(entry);
  }
  return items;
}

function shippingAmount(order: Record<string, unknown>): number | undefined {
  const current = moneySet(order.current_shipping_price_set);
  if (current !== undefined) return current;
  const total = moneySet(order.total_shipping_price_set);
  if (total !== undefined) return total;
  if (!Array.isArray(order.shipping_lines)) return undefined;
  let sum = 0;
  let any = false;
  for (const line of order.shipping_lines) {
    if (!isRecord(line)) continue;
    const amount = money(
      typeof line.discounted_price === "string" || typeof line.discounted_price === "number"
        ? line.discounted_price
        : line.price,
    );
    if (amount === undefined) continue;
    sum += amount;
    any = true;
  }
  return any ? Math.round(sum * 100) / 100 : undefined;
}

function moneySet(value: unknown): number | undefined {
  if (!isRecord(value) || !isRecord(value.shop_money)) return undefined;
  return money(value.shop_money.amount);
}

function money(amount: unknown): number | undefined {
  const numeric =
    typeof amount === "number" ? amount : typeof amount === "string" ? Number(amount) : Number.NaN;
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1_000_000) return undefined;
  return Math.round(numeric * 100) / 100;
}

function quantityOf(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded >= 1 && rounded <= 999 ? rounded : null;
}

function currencyCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : undefined;
}

function noteAttribute(order: Record<string, unknown>, name: string): string | null {
  if (!Array.isArray(order.note_attributes)) return null;
  for (const attribute of order.note_attributes) {
    if (!isRecord(attribute)) continue;
    const key =
      typeof attribute.name === "string"
        ? attribute.name
        : typeof attribute.key === "string"
          ? attribute.key
          : "";
    if (key.toLowerCase() !== name) continue;
    return typeof attribute.value === "string" ? attribute.value : null;
  }
  return null;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

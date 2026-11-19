// Webhook fallback when the order has no consent attribute: these countries require opt-in.
const CONSENT_REQUIRED_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "BR",
  "CH",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "HR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LI",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

const EVENT_ID_KIND = {
  AddToCart: "atc",
  InitiateCheckout: "ic",
  PageView: "pv",
  ViewContent: "vc",
} as const;

export const STOREFRONT_EVENT_NAMES = [
  "AddToCart",
  "InitiateCheckout",
  "PageView",
  "ViewContent",
] as const;

export type StorefrontEventName = (typeof STOREFRONT_EVENT_NAMES)[number];
export type MetaEventName = StorefrontEventName | "Purchase";

export interface MetaContent {
  id: string;
  itemPrice?: number;
  quantity: number;
}

export interface MetaEventDraft {
  contentIds: string[];
  contentName?: string;
  contentType?: "product";
  contents: MetaContent[];
  currency?: string;
  eventId: string;
  eventName: MetaEventName;
  eventTime: number;
  numItems?: number;
  sourceUrl: string;
  value?: number;
}

export interface ConsentFlags {
  analyticsAllowed: boolean | null;
  marketingAllowed: boolean | null;
  saleOfDataAllowed: boolean | null;
}

export interface ParsedConsent {
  analytics: boolean | null;
  marketing: boolean | null;
  saleOfData: boolean | null;
}

export interface PurchaseCustomer {
  city?: string;
  country?: string;
  email?: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  state?: string;
  zip?: string;
}

export interface PurchaseMatch {
  customer: PurchaseCustomer;
  event: MetaEventDraft;
  fbc: string | null;
  fbp: string | null;
  ip: string | null;
  userAgent: string | null;
}

export type PurchaseResult =
  | { match: PurchaseMatch; status: "ok" }
  | { reason: "consent" | "invalid" | "stale"; status: "skip" };

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export function countryCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  if (code === "UK") return "GB";
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export function trackingAllowed(input: ConsentFlags & { country: string | null }): boolean {
  if (
    input.analyticsAllowed === false ||
    input.marketingAllowed === false ||
    input.saleOfDataAllowed === false
  ) {
    return false;
  }
  if (
    input.analyticsAllowed === true &&
    input.marketingAllowed === true &&
    input.saleOfDataAllowed === true
  ) {
    return true;
  }
  const unknown =
    input.analyticsAllowed === null &&
    input.marketingAllowed === null &&
    input.saleOfDataAllowed === null;
  if (!unknown) return false;
  const country = countryCode(input.country);
  if (!country) return false;
  return !CONSENT_REQUIRED_COUNTRIES.has(country);
}

export function purchaseAllowed(input: {
  consentAttribute: string | null;
  country: string | null;
}): boolean {
  const attribute = input.consentAttribute?.trim().toLowerCase() ?? "";
  if (attribute === "0" || attribute === "denied" || attribute === "no") return false;
  if (attribute === "1" || attribute === "granted" || attribute === "yes") return true;
  return trackingAllowed({
    analyticsAllowed: null,
    country: input.country,
    marketingAllowed: null,
    saleOfDataAllowed: null,
  });
}

// Numeric variant ids match the id Shopify writes into a Meta catalog.
export function shopifyContentId(id: string | number | null | undefined): string | null {
  if (typeof id === "number") {
    return Number.isSafeInteger(id) && id > 0 ? String(id) : null;
  }
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  if (/^\d{1,20}$/.test(trimmed) && trimmed !== "0") return trimmed;
  return trimmed.match(/^gid:\/\/shopify\/[A-Za-z]+\/(\d{1,20})$/)?.[1] ?? null;
}

export function purchaseEventId(orderId: string | number): string | null {
  const numeric = String(orderId).match(/(\d{1,20})\s*$/)?.[1];
  if (!numeric || numeric === "0") return null;
  return `purchase_${numeric}`;
}

export function storefrontEventId(eventName: StorefrontEventName, uuid: string): string | null {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) {
    return null;
  }
  return `${EVENT_ID_KIND[eventName]}_${uuid}`;
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value || null;
  }
  return null;
}

export function parseTrackingConsent(cookieHeader: string | null): ParsedConsent | null {
  const raw = readCookie(cookieHeader, "_tracking_consent");
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  let data: unknown;
  try {
    data = JSON.parse(decoded);
  } catch {
    return null;
  }
  if (!isRecord(data)) return null;
  const cmp = nestedRecord(data, ["con", "CMP"]) ?? nestedRecord(data, ["consent", "CMP"]);
  if (cmp) {
    return {
      analytics: consentFlag(cmp.a),
      marketing: consentFlag(cmp.m),
      saleOfData: consentFlag(cmp.s),
    };
  }
  return {
    analytics: consentFlag(data.analytics ?? data.analyticsProcessingAllowed),
    marketing: consentFlag(data.marketing ?? data.marketingAllowed),
    saleOfData: consentFlag(data.sale_of_data ?? data.saleOfData ?? data.saleOfDataAllowed),
  };
}

export function clientAddress(forwardedFor: string | null, realIp: string | null): string | null {
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "";
  if (!candidate || candidate.length > 64) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(candidate)) return candidate;
  if (candidate.includes(":") && /^[0-9a-fA-F:]+$/.test(candidate)) return candidate;
  return null;
}

export function fbcFromUrl(sourceUrl: string, nowMs = Date.now()): string | null {
  let fbclid: string | null = null;
  try {
    fbclid = new URL(sourceUrl).searchParams.get("fbclid");
  } catch {
    return null;
  }
  if (!fbclid || fbclid.length > 512 || /[\s;]/.test(fbclid)) return null;
  return `fb.1.${nowMs}.${fbclid}`;
}

export function metaBrowserId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^fb\.\d+\.[^\s;]{1,240}$/.test(trimmed)) return null;
  return trimmed;
}

export function sourceUrlAllowed(sourceUrl: string, requestHost: string | null): boolean {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.host.toLowerCase();
  const allowed = new Set([
    "checkout.shirtat.co",
    "localhost",
    "localhost:3000",
    "shirtat.co",
    "www.shirtat.co",
  ]);
  if (requestHost) allowed.add(requestHost.toLowerCase());
  return allowed.has(host);
}

export function pageViewEvent(input: {
  eventId: string;
  eventTime: number;
  sourceUrl: string;
}): MetaEventDraft {
  return {
    contentIds: [],
    contents: [],
    eventId: input.eventId,
    eventName: "PageView",
    eventTime: input.eventTime,
    sourceUrl: input.sourceUrl,
  };
}

export function viewContentEvent(input: {
  eventId: string;
  eventTime: number;
  price?: string;
  productId?: string;
  quantity?: number;
  sourceUrl: string;
  title?: string;
  variantId?: string;
  currency?: string;
}): MetaEventDraft | null {
  const id = shopifyContentId(input.variantId) ?? shopifyContentId(input.productId);
  const quantity = normalizeQuantity(input.quantity ?? 1);
  if (!id || !quantity) return null;
  const priced = pricedMoney(input.price, input.currency);
  return {
    contentIds: [id],
    contentName: clip(input.title),
    contentType: "product",
    contents: [{ id, itemPrice: moneyAmount(input.price), quantity }],
    currency: priced.currency,
    eventId: input.eventId,
    eventName: "ViewContent",
    eventTime: input.eventTime,
    numItems: quantity,
    sourceUrl: input.sourceUrl,
    value: priced.value === undefined ? undefined : roundMoney(priced.value * quantity),
  };
}

export function addToCartEvent(input: {
  currency?: string;
  eventId: string;
  eventTime: number;
  price?: string;
  quantity: number;
  sourceUrl: string;
  title?: string;
  variantId?: string;
}): MetaEventDraft | null {
  const id = shopifyContentId(input.variantId);
  const quantity = normalizeQuantity(input.quantity);
  if (!id || !quantity) return null;
  const priced = pricedMoney(input.price, input.currency);
  return {
    contentIds: [id],
    contentName: clip(input.title),
    contentType: "product",
    contents: [{ id, itemPrice: moneyAmount(input.price), quantity }],
    currency: priced.currency,
    eventId: input.eventId,
    eventName: "AddToCart",
    eventTime: input.eventTime,
    numItems: quantity,
    sourceUrl: input.sourceUrl,
    value: priced.value === undefined ? undefined : roundMoney(priced.value * quantity),
  };
}

export function initiateCheckoutEvent(input: {
  currency?: string;
  eventId: string;
  eventTime: number;
  lines: Array<{ price?: string; quantity: number; variantId?: string }>;
  sourceUrl: string;
  value?: string | number;
}): MetaEventDraft | null {
  const contents: MetaContent[] = [];
  for (const line of input.lines) {
    const id = shopifyContentId(line.variantId);
    const quantity = normalizeQuantity(line.quantity);
    if (!id || !quantity) continue;
    contents.push({ id, itemPrice: moneyAmount(line.price), quantity });
    if (contents.length === 50) break;
  }
  const total = pricedMoney(input.value, input.currency);
  if (!contents.length && total.value === undefined) return null;
  const numItems = contents.reduce((sum, line) => sum + line.quantity, 0);
  const code = input.currency?.trim().toUpperCase();
  return {
    contentIds: contents.map((line) => line.id),
    contentType: contents.length ? "product" : undefined,
    contents,
    currency: total.currency ?? (code && /^[A-Z]{3}$/.test(code) ? code : undefined),
    eventId: input.eventId,
    eventName: "InitiateCheckout",
    eventTime: input.eventTime,
    numItems: numItems || undefined,
    sourceUrl: input.sourceUrl,
    value: total.value,
  };
}

export function purchaseFromOrder(order: unknown, nowMs = Date.now()): PurchaseResult {
  if (!isRecord(order)) return { reason: "invalid", status: "skip" };
  const eventId = purchaseEventId(
    typeof order.id === "number" || typeof order.id === "string" ? order.id : "",
  );
  if (!eventId) return { reason: "invalid", status: "skip" };
  const country = orderCountry(order);
  if (
    !purchaseAllowed({
      consentAttribute: noteAttribute(order, "meta_consent"),
      country,
    })
  ) {
    return { reason: "consent", status: "skip" };
  }
  const eventTime = orderEventTime(order, nowMs);
  if (eventTime === null) return { reason: "stale", status: "skip" };
  const contents = orderContents(order);
  const currency = firstString(order.currency, order.presentment_currency);
  const rawTotal = order.current_total_price ?? order.total_price;
  const total = pricedMoney(
    typeof rawTotal === "string" || typeof rawTotal === "number" ? rawTotal : undefined,
    currency,
  );
  const event: MetaEventDraft = {
    contentIds: contents.map((line) => line.id),
    contentType: contents.length ? "product" : undefined,
    contents,
    currency: total.currency,
    eventId,
    eventName: "Purchase",
    eventTime,
    numItems: contents.reduce((sum, line) => sum + line.quantity, 0) || undefined,
    sourceUrl: "https://checkout.shirtat.co/",
    value: total.value,
  };
  return {
    match: {
      customer: orderCustomer(order, country),
      event,
      fbc: metaBrowserId(noteAttribute(order, "_fbc")),
      fbp: metaBrowserId(noteAttribute(order, "_fbp")),
      ip: typeof order.browser_ip === "string" ? clientAddress(order.browser_ip, null) : null,
      userAgent: orderUserAgent(order),
    },
    status: "ok",
  };
}

export function pixelCustomData(event: MetaEventDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (event.contentIds.length) data.content_ids = event.contentIds;
  if (event.contentName) data.content_name = event.contentName;
  if (event.contentType) data.content_type = event.contentType;
  if (event.contents.length) {
    data.contents = event.contents.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      ...(line.itemPrice === undefined ? {} : { item_price: line.itemPrice }),
    }));
  }
  if (event.currency) data.currency = event.currency;
  if (event.numItems) data.num_items = event.numItems;
  if (event.value !== undefined) data.value = event.value;
  return data;
}

export function capiEventData(
  event: MetaEventDraft,
  userData: Record<string, unknown>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    action_source: "website",
    event_id: event.eventId,
    event_name: event.eventName,
    event_source_url: event.sourceUrl,
    event_time: event.eventTime,
    user_data: userData,
  };
  const custom = pixelCustomData(event);
  if (Object.keys(custom).length) data.custom_data = custom;
  return data;
}

export function normalizeEmail(email: string | undefined): string | null {
  if (!email) return null;
  const value = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

export function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function normalizeText(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}]/gu, "");
  return normalized || null;
}

export function normalizeState(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return normalized.length >= 2 ? normalized.slice(0, 2) : null;
}

export function normalizeZip(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]/g, "");
  return normalized ? normalized.slice(0, 16) : null;
}

export function eventTimeInRange(eventTime: number, nowMs: number): boolean {
  if (!Number.isInteger(eventTime)) return false;
  const now = Math.floor(nowMs / 1000);
  return eventTime <= now + 60 && now - eventTime <= SEVEN_DAYS_SECONDS;
}

function orderEventTime(order: Record<string, unknown>, nowMs: number): number | null {
  const raw = order.processed_at ?? order.created_at ?? order.updated_at;
  const parsed = typeof raw === "string" ? Date.parse(raw) : Number.NaN;
  const eventTime = Number.isFinite(parsed) ? Math.floor(parsed / 1000) : Math.floor(nowMs / 1000);
  return eventTimeInRange(eventTime, nowMs) ? eventTime : null;
}

function orderContents(order: Record<string, unknown>): MetaContent[] {
  if (!Array.isArray(order.line_items)) return [];
  const contents: MetaContent[] = [];
  for (const item of order.line_items) {
    if (!isRecord(item)) continue;
    const id = shopifyContentId(
      typeof item.variant_id === "number" || typeof item.variant_id === "string"
        ? item.variant_id
        : null,
    );
    const quantity = typeof item.quantity === "number" ? normalizeQuantity(item.quantity) : null;
    if (!id || !quantity) continue;
    contents.push({
      id,
      itemPrice: moneyAmount(
        typeof item.price === "string" || typeof item.price === "number" ? item.price : undefined,
      ),
      quantity,
    });
    if (contents.length === 50) break;
  }
  return contents;
}

function orderCountry(order: Record<string, unknown>): string | null {
  const billing = isRecord(order.billing_address) ? order.billing_address : null;
  const shipping = isRecord(order.shipping_address) ? order.shipping_address : null;
  return (
    countryCode(typeof billing?.country_code === "string" ? billing.country_code : null) ??
    countryCode(typeof shipping?.country_code === "string" ? shipping.country_code : null)
  );
}

function orderCustomer(order: Record<string, unknown>, country: string | null): PurchaseCustomer {
  const customer = isRecord(order.customer) ? order.customer : null;
  const billing = isRecord(order.billing_address) ? order.billing_address : null;
  const shipping = isRecord(order.shipping_address) ? order.shipping_address : null;
  const email = firstString(order.email, customer?.email, billing?.email);
  const phone = firstString(order.phone, customer?.phone, billing?.phone, shipping?.phone);
  const externalId =
    typeof customer?.id === "number" && customer.id > 0 ? String(customer.id) : undefined;
  return {
    city: firstString(billing?.city, shipping?.city),
    country: country ?? undefined,
    email,
    externalId,
    firstName: firstString(customer?.first_name, billing?.first_name, shipping?.first_name),
    lastName: firstString(customer?.last_name, billing?.last_name, shipping?.last_name),
    phone,
    state: firstString(billing?.province_code, shipping?.province_code),
    zip: firstString(billing?.zip, shipping?.zip),
  };
}

function orderUserAgent(order: Record<string, unknown>): string | null {
  const details = isRecord(order.client_details) ? order.client_details : null;
  const agent = typeof details?.user_agent === "string" ? details.user_agent.trim() : "";
  return agent ? agent.slice(0, 512) : null;
}

function noteAttribute(order: Record<string, unknown>, name: string): string | null {
  if (!Array.isArray(order.note_attributes)) return null;
  for (const attribute of order.note_attributes) {
    if (!isRecord(attribute) || typeof attribute.name !== "string") continue;
    if (attribute.name.toLowerCase() !== name) continue;
    return typeof attribute.value === "string" ? attribute.value : null;
  }
  return null;
}

function moneyAmount(amount: string | number | undefined): number | undefined {
  const numeric =
    typeof amount === "number" ? amount : amount === undefined ? Number.NaN : Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1_000_000) return undefined;
  return roundMoney(numeric);
}

function pricedMoney(
  amount: string | number | undefined,
  currency: string | undefined,
): { currency?: string; value?: number } {
  const code = currency?.trim().toUpperCase();
  const validCurrency = code && /^[A-Z]{3}$/.test(code) ? code : undefined;
  const numeric =
    typeof amount === "number" ? amount : amount === undefined ? undefined : Number(amount);
  const value =
    numeric !== undefined && Number.isFinite(numeric) && numeric >= 0 && numeric <= 1_000_000
      ? roundMoney(numeric)
      : undefined;
  if (!validCurrency || value === undefined) return {};
  return { currency: validCurrency, value };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeQuantity(quantity: number): number | null {
  if (!Number.isFinite(quantity)) return null;
  const rounded = Math.round(quantity);
  return rounded >= 1 && rounded <= 999 ? rounded : null;
}

function clip(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 200) : undefined;
}

function consentFlag(value: unknown): boolean | null {
  if (value === true || value === "1" || value === "yes") return true;
  if (value === false || value === "0" || value === "no") return false;
  return null;
}

function nestedRecord(
  record: Record<string, unknown>,
  path: string[],
): Record<string, unknown> | null {
  let current: unknown = record;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return isRecord(current) ? current : null;
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

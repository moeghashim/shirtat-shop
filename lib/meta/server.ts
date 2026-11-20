import { createHash } from "node:crypto";

import { z } from "zod";

import {
  capiEventData,
  clientAddress,
  countryCode,
  eventTimeInRange,
  fbcFromUrl,
  metaBrowserId,
  normalizeEmail,
  normalizePhone,
  normalizeState,
  normalizeText,
  normalizeZip,
  parseTrackingConsent,
  purchaseFromOrder,
  readCookie,
  sourceUrlAllowed,
  trackingAllowed,
  type MetaEventDraft,
  type PurchaseCustomer,
} from "@/lib/meta";

const GRAPH_VERSION = "v27.0";

const contentSchema = z.strictObject({
  id: z.string().regex(/^\d{1,20}$/),
  itemPrice: z.number().finite().nonnegative().max(1_000_000).optional(),
  quantity: z.number().int().positive().max(999),
});

const storefrontEventSchema = z.strictObject({
  consent: z.strictObject({
    analytics: z.boolean(),
    marketing: z.boolean(),
    saleOfData: z.boolean(),
  }),
  contentIds: z.array(z.string().regex(/^\d{1,20}$/)).max(50),
  contentName: z.string().trim().min(1).max(200).optional(),
  contentType: z.literal("product").optional(),
  contents: z.array(contentSchema).max(50).optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  eventId: z
    .string()
    .regex(/^(atc|ic|pv|vc)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
  eventName: z.enum(["AddToCart", "InitiateCheckout", "PageView", "ViewContent"]),
  eventTime: z.number().int(),
  numItems: z.number().int().positive().max(9999).optional(),
  sourceUrl: z.string().max(2000),
  value: z.number().finite().nonnegative().max(1_000_000).optional(),
});

export interface MetaRequestSignals {
  cookieHeader: string | null;
  country: string | null;
  forwardedFor: string | null;
  json: unknown;
  nowMs?: number;
  realIp: string | null;
  requestHost: string | null;
  userAgent: string | null;
}

export type StorefrontDecision =
  | { ok: false; status: 204 | 400 }
  | { event: MetaEventDraft; ok: true; user: Record<string, unknown> };

export function metaPixelId(): string | null {
  const value = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
  return /^\d{5,20}$/.test(value) ? value : null;
}

export function metaConfigured(): boolean {
  return Boolean(metaPixelId() && metaAccessToken());
}

export function evaluateStorefrontEvent(input: MetaRequestSignals): StorefrontDecision {
  const parsed = storefrontEventSchema.safeParse(input.json);
  if (!parsed.success) return { ok: false, status: 400 };
  const nowMs = input.nowMs ?? Date.now();
  if (!eventTimeInRange(parsed.data.eventTime, nowMs)) return { ok: false, status: 400 };
  if (!sourceUrlAllowed(parsed.data.sourceUrl, input.requestHost))
    return { ok: false, status: 400 };
  const cookie = parseTrackingConsent(input.cookieHeader);
  const allowed = trackingAllowed({
    analyticsAllowed: mergeFlag(cookie?.analytics, parsed.data.consent.analytics),
    country: countryCode(input.country),
    marketingAllowed: mergeFlag(cookie?.marketing, parsed.data.consent.marketing),
    saleOfDataAllowed: mergeFlag(cookie?.saleOfData, parsed.data.consent.saleOfData),
  });
  if (!allowed) return { ok: false, status: 204 };
  const event: MetaEventDraft = {
    contentIds: parsed.data.contentIds,
    contentName: parsed.data.contentName,
    contentType: parsed.data.contentType,
    contents: parsed.data.contents ?? [],
    currency: parsed.data.currency,
    eventId: parsed.data.eventId,
    eventName: parsed.data.eventName,
    eventTime: parsed.data.eventTime,
    numItems: parsed.data.numItems,
    sourceUrl: parsed.data.sourceUrl,
    value: parsed.data.value,
  };
  const fbp = metaBrowserId(readCookie(input.cookieHeader, "_fbp"));
  const fbc =
    metaBrowserId(readCookie(input.cookieHeader, "_fbc")) ??
    fbcFromUrl(parsed.data.sourceUrl, nowMs);
  return {
    event,
    ok: true,
    user: capiUserData({
      fbc,
      fbp,
      ip: clientAddress(input.forwardedFor, input.realIp),
      userAgent: input.userAgent?.slice(0, 512) ?? null,
    }),
  };
}

export async function deliverMetaEvent(
  event: MetaEventDraft,
  userData: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<"failed" | "sent" | "unconfigured"> {
  const pixelId = metaPixelId();
  const token = metaAccessToken();
  if (!pixelId || !token) return "unconfigured";
  const body = new URLSearchParams();
  body.set("access_token", token);
  body.set("data", JSON.stringify([capiEventData(event, userData)]));
  const testCode = metaTestEventCode();
  if (testCode) body.set("test_event_code", testCode);
  try {
    const response = await fetchImpl(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`,
      {
        body,
        method: "POST",
      },
    );
    if (!response.ok) {
      console.error("[meta] conversions api", response.status);
      return "failed";
    }
    return "sent";
  } catch {
    console.error("[meta] conversions api failed");
    return "failed";
  }
}

export async function notifyMetaPurchase(
  order: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<"failed" | "sent" | "skipped" | "unconfigured"> {
  if (!metaConfigured()) return "unconfigured";
  const purchase = purchaseFromOrder(order);
  if (purchase.status !== "ok") return "skipped";
  const userData = capiUserData({
    customer: purchase.match.customer,
    fbc: purchase.match.fbc,
    fbp: purchase.match.fbp,
    ip: purchase.match.ip,
    userAgent: purchase.match.userAgent,
  });
  const result = await deliverMetaEvent(purchase.match.event, userData, fetchImpl);
  return result === "unconfigured" ? "skipped" : result;
}

export function capiUserData(input: {
  customer?: PurchaseCustomer;
  fbc?: string | null;
  fbp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Record<string, unknown> {
  const customer = input.customer;
  const data: Record<string, unknown> = {};
  const ip = input.ip?.trim();
  const userAgent = input.userAgent?.trim();
  if (ip) data.client_ip_address = ip;
  if (userAgent) data.client_user_agent = userAgent;
  assignHashed(data, "country", normalizeCountry(customer?.country));
  assignHashed(data, "ct", normalizeText(customer?.city));
  assignHashed(data, "em", normalizeEmail(customer?.email));
  assignHashed(data, "external_id", customer?.externalId?.trim() || null);
  if (input.fbc) data.fbc = input.fbc;
  if (input.fbp) data.fbp = input.fbp;
  assignHashed(data, "fn", normalizeText(customer?.firstName));
  assignHashed(data, "ln", normalizeText(customer?.lastName));
  assignHashed(data, "ph", normalizePhone(customer?.phone));
  assignHashed(data, "st", normalizeState(customer?.state));
  assignHashed(data, "zp", normalizeZip(customer?.zip));
  return data;
}

function assignHashed(data: Record<string, unknown>, key: string, value: string | null): void {
  if (!value) return;
  data[key] = [sha256(value)];
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeCountry(value: string | undefined): string | null {
  return countryCode(value)?.toLowerCase() ?? null;
}

function mergeFlag(cookie: boolean | null | undefined, reported: boolean): boolean | null {
  if (cookie === false) return false;
  if (cookie === true) return true;
  return reported;
}

function metaAccessToken(): string | null {
  const value = process.env.META_CAPI_ACCESS_TOKEN?.trim() ?? "";
  return value || null;
}

function metaTestEventCode(): string | null {
  const value = process.env.META_TEST_EVENT_CODE?.trim() ?? "";
  return /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : null;
}

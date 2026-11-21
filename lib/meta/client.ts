"use client";

import { getShopifyScriptTags, initializeShopifyScripts } from "@shopify/hydrogen";

import {
  GA_CLIENT_ATTRIBUTE,
  GA_SESSION_ATTRIBUTE,
  readGaCheckoutIds,
  withGaCheckoutAttributes,
  type GaCheckoutIds,
} from "@/lib/analytics";
import { shopConfig } from "@/lib/config";
import {
  addToCartEvent,
  initiateCheckoutEvent,
  metaConsentFromFlags,
  pageViewEvent,
  pixelCustomData,
  storedMetaConsent,
  storefrontEventId,
  viewContentEvent,
  withMetaConsentAttribute,
  type MetaEventDraft,
} from "@/lib/meta";

export { checkoutUrlWithMetaConsent } from "@/lib/meta";
import { drainMeta, metaIsLive } from "@/lib/meta/queue";
import { SHOPIFY_ROUTE_TEMPLATES } from "@/lib/shopify/routing";

const PIXEL_ID = pixelIdFromEnv();

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  push?: Fbq;
  queue?: unknown[];
  version?: string;
};

type PrivacyApi = {
  analyticsProcessingAllowed?: () => boolean;
  marketingAllowed?: () => boolean;
  saleOfDataAllowed?: () => boolean;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let pixelStarted = false;
let pixelInited = false;
let consentWatching = false;

export function beginMeta(navigate?: (url: string) => void): void {
  if (!PIXEL_ID || pixelStarted || navigator.webdriver) return;
  pixelStarted = true;
  mountConsentScripts(navigate);
  watchConsent();
}

export function whenConsentKnown(timeoutMs: number): Promise<void> {
  beginMeta();
  if (privacyApi() || !PIXEL_ID) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timer);
      document.removeEventListener("consentTrackingApiLoaded", finish);
      document.removeEventListener("visitorConsentCollected", finish);
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    document.addEventListener("consentTrackingApiLoaded", finish);
    document.addEventListener("visitorConsentCollected", finish);
  });
}

export function trackPageView(sourceUrl: string): void {
  const eventId = createId("PageView");
  if (!eventId) return;
  sendMetaEvent(
    pageViewEvent({
      eventId,
      eventTime: eventTimeNow(),
      sourceUrl,
    }),
  );
}

export function trackViewContent(input: {
  currency?: string;
  eventTime?: number;
  price?: string;
  productId?: string;
  sourceUrl?: string;
  title?: string;
  variantId?: string;
}): void {
  const eventId = createId("ViewContent");
  if (!eventId) return;
  const event = viewContentEvent({
    currency: input.currency,
    eventId,
    eventTime: input.eventTime ?? eventTimeNow(),
    price: input.price,
    productId: input.productId,
    sourceUrl: input.sourceUrl ?? window.location.href,
    title: input.title,
    variantId: input.variantId,
  });
  if (event) sendMetaEvent(event);
}

export function trackAddToCart(input: {
  currency?: string;
  eventTime?: number;
  price?: string;
  quantity: number;
  sourceUrl?: string;
  title?: string;
  variantId?: string;
}): void {
  const eventId = createId("AddToCart");
  if (!eventId) return;
  const event = addToCartEvent({
    currency: input.currency,
    eventId,
    eventTime: input.eventTime ?? eventTimeNow(),
    price: input.price,
    quantity: input.quantity,
    sourceUrl: input.sourceUrl ?? window.location.href,
    title: input.title,
    variantId: input.variantId,
  });
  if (event) sendMetaEvent(event);
}

export function trackInitiateCheckout(input: {
  currency?: string;
  lines: Array<{ price?: string; quantity: number; variantId?: string }>;
  value?: string | number;
}): void {
  const eventId = createId("InitiateCheckout");
  if (!eventId) return;
  const event = initiateCheckoutEvent({
    currency: input.currency,
    eventId,
    eventTime: eventTimeNow(),
    lines: input.lines,
    sourceUrl: window.location.href,
    value: input.value,
  });
  if (event) sendMetaEvent(event);
}

export function metaConsentGranted(): boolean {
  return readStorefrontMetaConsent() === "granted";
}

export function readStorefrontMetaConsent() {
  const privacy = privacyApi();
  return metaConsentFromFlags({
    analyticsAllowed: consentMethod(privacy?.analyticsProcessingAllowed),
    globalPrivacyControl: globalPrivacyControl(),
    marketingAllowed: consentMethod(privacy?.marketingAllowed),
    saleOfDataAllowed: consentMethod(privacy?.saleOfDataAllowed),
  });
}

export async function recordCheckoutConsent(
  attributes: ReadonlyArray<{ key: string; value?: string | null }>,
  gaIds?: GaCheckoutIds | null,
): Promise<void> {
  await whenConsentKnown(1000);
  const consent = readStorefrontMetaConsent();
  const fresh = typeof document === "undefined" ? null : readGaCheckoutIds(document.cookie);
  const ids: GaCheckoutIds = {
    clientId: fresh?.clientId ?? gaIds?.clientId ?? null,
    sessionId: fresh?.sessionId ?? gaIds?.sessionId ?? null,
  };
  const needsConsent = Boolean(consent) && storedMetaConsent(attributes) !== consent;
  const needsGa =
    (ids.clientId !== null && cartAttribute(attributes, GA_CLIENT_ATTRIBUTE) !== ids.clientId) ||
    (ids.sessionId !== null && cartAttribute(attributes, GA_SESSION_ATTRIBUTE) !== ids.sessionId);
  if (!needsConsent && !needsGa) return;
  const next =
    needsConsent && consent
      ? withMetaConsentAttribute(attributes, consent, ids)
      : withGaCheckoutAttributes(attributes, ids);
  const attempts = consent === "denied" && needsConsent ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await postCartAttributes(next)) return;
  }
}

function cartAttribute(
  attributes: ReadonlyArray<{ key: string; value?: string | null }>,
  key: string,
): string | null {
  for (const attribute of attributes) {
    if (attribute.key?.toLowerCase() !== key) continue;
    return typeof attribute.value === "string" && attribute.value ? attribute.value : null;
  }
  return null;
}

function sendMetaEvent(event: MetaEventDraft): void {
  if (!PIXEL_ID || !metaConsentGranted()) return;
  ensurePixelStub(PIXEL_ID);
  const custom = pixelCustomData(event);
  window.fbq?.("track", event.eventName, custom, { eventID: event.eventId });
  const body = {
    consent: { analytics: true, marketing: true, saleOfData: true },
    contentIds: event.contentIds,
    ...(event.contentName ? { contentName: event.contentName } : {}),
    ...(event.contentType ? { contentType: event.contentType } : {}),
    ...(event.contents.length ? { contents: event.contents } : {}),
    ...(event.currency ? { currency: event.currency } : {}),
    eventId: event.eventId,
    eventName: event.eventName,
    eventTime: event.eventTime,
    ...(event.numItems ? { numItems: event.numItems } : {}),
    sourceUrl: event.sourceUrl,
    ...(event.value !== undefined ? { value: event.value } : {}),
  };
  void fetch("/api/meta/events", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined);
}

function ensurePixelStub(pixelId: string): void {
  if (!window.fbq) {
    const fbq = function fbqStub(this: Fbq, ...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue?.push(args);
    } as Fbq;
    fbq.push = fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    // oxlint-disable-next-line no-underscore-dangle -- Facebook's loader reads this global.
    window._fbq = fbq;
  }
  if (!pixelInited) {
    pixelInited = true;
    window.fbq?.("init", pixelId);
  }
  if (document.getElementById("meta-pixel")) return;
  const script = document.createElement("script");
  script.async = true;
  script.id = "meta-pixel";
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

function watchConsent(): void {
  if (consentWatching) return;
  consentWatching = true;
  const read = () => {
    if (!metaConsentGranted() || metaIsLive()) return;
    drainMeta();
  };
  document.addEventListener("consentTrackingApiLoaded", read);
  document.addEventListener("visitorConsentCollected", read);
  read();
}

function mountConsentScripts(navigate?: (url: string) => void): void {
  const shopId = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID;
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!shopId || !domain || document.getElementById("shopify-consent")) return;
  const { scripts } = getShopifyScriptTags({
    analytics: { channel: "headless" },
    consent: { mode: shopConfig.analytics.shopify.consent.mode },
    i18n: {
      country: shopConfig.localization.country,
      language: shopConfig.localization.language,
    },
    shop: { myshopifyDomain: domain, shopId, storefrontId: "" },
    shopifyAnalytics: false,
  });
  for (const script of scripts) {
    const id = script.attributes?.id;
    if (id === "shopify-standard-actions" || id === "shopify-analytics-bus") continue;
    if (id && document.getElementById(id)) continue;
    const element = document.createElement("script");
    for (const [name, value] of Object.entries(script.attributes ?? {})) {
      if (typeof value === "boolean") {
        if (value) element.setAttribute(name, "");
        continue;
      }
      if (value !== undefined) element.setAttribute(name, value);
    }
    if (script.innerHTML) element.text = script.innerHTML;
    document.head.appendChild(element);
  }
  void initializeShopifyScripts({
    consent: { mode: shopConfig.analytics.shopify.consent.mode },
    navigate,
    routes: SHOPIFY_ROUTE_TEMPLATES,
    webMcp: false,
  });
}

function consentMethod(method: (() => boolean) | undefined): boolean | null {
  if (!method) return null;
  try {
    const value = method();
    return typeof value === "boolean" ? value : null;
  } catch {
    return null;
  }
}

function globalPrivacyControl(): boolean {
  return (
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}

async function postCartAttributes(
  attributes: Array<{ key: string; value: string }>,
): Promise<boolean> {
  try {
    const response = await fetch("/api/cart", {
      body: JSON.stringify({ attributes }),
      credentials: "same-origin",
      headers: { accept: "application/json", "content-type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return false;
    const payload: unknown = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object") return true;
    const errors = (payload as { userErrors?: unknown }).userErrors;
    return !Array.isArray(errors) || errors.length === 0;
  } catch {
    return false;
  }
}

function privacyApi(): PrivacyApi | null {
  const shopify = (
    window as Window & {
      Shopify?: { customerPrivacy?: PrivacyApi };
    }
  ).Shopify;
  return shopify?.customerPrivacy ?? null;
}

function createId(
  eventName: "AddToCart" | "InitiateCheckout" | "PageView" | "ViewContent",
): string | null {
  if (!PIXEL_ID || !globalThis.crypto?.randomUUID) return null;
  return storefrontEventId(eventName, globalThis.crypto.randomUUID());
}

function eventTimeNow(): number {
  return Math.floor(Date.now() / 1000);
}

function pixelIdFromEnv(): string | null {
  const value = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
  return /^\d{5,20}$/.test(value) ? value : null;
}

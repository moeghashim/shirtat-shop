"use client";

import { getShopifyScriptTags, initializeShopifyScripts } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import {
  addToCartEvent,
  initiateCheckoutEvent,
  pageViewEvent,
  pixelCustomData,
  storefrontEventId,
  viewContentEvent,
  type MetaEventDraft,
} from "@/lib/meta";
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
  price?: string;
  productId?: string;
  title?: string;
  variantId?: string;
}): void {
  const eventId = createId("ViewContent");
  if (!eventId) return;
  const event = viewContentEvent({
    currency: input.currency,
    eventId,
    eventTime: eventTimeNow(),
    price: input.price,
    productId: input.productId,
    sourceUrl: window.location.href,
    title: input.title,
    variantId: input.variantId,
  });
  if (event) sendMetaEvent(event);
}

export function trackAddToCart(input: {
  currency?: string;
  price?: string;
  quantity: number;
  title?: string;
  variantId?: string;
}): void {
  const eventId = createId("AddToCart");
  if (!eventId) return;
  const event = addToCartEvent({
    currency: input.currency,
    eventId,
    eventTime: eventTimeNow(),
    price: input.price,
    quantity: input.quantity,
    sourceUrl: window.location.href,
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
  const privacy = privacyApi();
  if (
    !privacy?.marketingAllowed ||
    !privacy.saleOfDataAllowed ||
    !privacy.analyticsProcessingAllowed
  ) {
    return false;
  }
  return (
    privacy.marketingAllowed() &&
    privacy.saleOfDataAllowed() &&
    privacy.analyticsProcessingAllowed()
  );
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

import assert from "node:assert/strict";
import test from "node:test";

import { checkoutUrlWithMetaConsent, withMetaConsentAttribute } from "@/lib/meta";

import { ga4PurchasePayload, isShopAppLanding, notifyGa4Purchase } from "./ga4-server";
import {
  checkoutUrlWithGaAttributes,
  gaClientId,
  gaSessionCookieName,
  gaSessionId,
  readGaCheckoutIds,
} from "./index";

function shopPayOrder(overrides: Record<string, unknown> = {}) {
  return {
    currency: "USD",
    current_subtotal_price: "58.48",
    current_total_price: "67.98",
    current_total_tax: "4.50",
    id: 1009,
    landing_site: "https://shop.app/checkout/cn/hWN3abc?locale=en",
    line_items: [
      {
        name: "Tafakkar Tee - M",
        price: "33.99",
        quantity: 2,
        sku: "TAF-M",
        title: "Tafakkar Tee",
      },
    ],
    name: "#A-1009",
    note_attributes: [
      { name: "_ga_cid", value: "1234567890.1690000000" },
      { name: "_ga_sid", value: "1690001111" },
    ],
    total_shipping_price_set: {
      shop_money: { amount: "5.00", currency_code: "USD" },
    },
    ...overrides,
  };
}

test("ga cookies become a client id and a session id", () => {
  assert.equal(gaSessionCookieName(), "_ga_6DT5S4QRGT");
  assert.equal(gaClientId("GA1.1.1234567890.1690000000"), "1234567890.1690000000");
  assert.equal(gaClientId("GA1.2.555.666"), "555.666");
  assert.equal(gaClientId("1234567890.1690000000"), "1234567890.1690000000");
  assert.equal(gaClientId("GA1.1.not-a-client"), null);
  assert.equal(gaSessionId("GS1.1.1690001111.4.1.1690002222.0.0.0"), "1690001111");
  assert.equal(gaSessionId("GS2.1.s1747132561$o1$g0$t1747132655$j0$l0$h0"), "1747132561");
  assert.equal(gaSessionId("GS2.1.o2$g1$s1747132561$t1747132655$j0$l0$h0"), "1747132561");
  assert.equal(gaSessionId("1690001111"), "1690001111");
  assert.equal(gaSessionId("GS2.1.o1$g0"), null);

  const gs1 = readGaCheckoutIds(
    "_ga=GA1.2.555.666; _ga_6DT5S4QRGT=GS1.1.1690001111.4.1.1690002222.0.0.0",
  );
  assert.deepEqual(gs1, { clientId: "555.666", sessionId: "1690001111" });

  const encoded = encodeURIComponent("GS2.1.s1747132561$o1$g0$t1747132655$j0$l0$h0");
  const gs2 = readGaCheckoutIds(`_ga=GA1.1.1234567890.1690000000; _ga_6DT5S4QRGT=${encoded}`);
  assert.deepEqual(gs2, { clientId: "1234567890.1690000000", sessionId: "1747132561" });
  assert.deepEqual(readGaCheckoutIds(null), { clientId: null, sessionId: null });

  assert.equal(
    checkoutUrlWithGaAttributes("/cart/555:1?payment=shop_pay", gs1),
    "/cart/555:1?payment=shop_pay&attributes%5B_ga_cid%5D=555.666&attributes%5B_ga_sid%5D=1690001111",
  );
  assert.equal(
    checkoutUrlWithMetaConsent("/cart/555:1?payment=shop_pay", "granted", gs1),
    "/cart/555:1?payment=shop_pay&attributes%5B_meta_consent%5D=granted&attributes%5B_ga_cid%5D=555.666&attributes%5B_ga_sid%5D=1690001111",
  );
  assert.deepEqual(withMetaConsentAttribute([{ key: "gift", value: "yes" }], "granted", gs1), [
    { key: "gift", value: "yes" },
    { key: "_meta_consent", value: "granted" },
    { key: "_ga_cid", value: "555.666" },
    { key: "_ga_sid", value: "1690001111" },
  ]);
});

test("shop.app landing gate", () => {
  assert.equal(isShopAppLanding("https://shop.app/checkout/cn/hWN3abc"), true);
  assert.equal(isShopAppLanding("https://SHOP.APP/pay/checkout"), true);
  assert.equal(isShopAppLanding("shop.app/checkout/123"), true);
  assert.equal(isShopAppLanding("//shop.app/checkout"), true);
  assert.equal(isShopAppLanding("https://shirtat.co/products/tafakkar-t-shirt"), false);
  assert.equal(isShopAppLanding("https://checkout.shopify.com/shirtat"), false);
  assert.equal(isShopAppLanding("https://notshop.app/checkout"), false);
  assert.equal(isShopAppLanding("https://shop.app.evil.example/checkout"), false);
  assert.equal(isShopAppLanding("https://www.shop.app/checkout"), false);
  assert.equal(isShopAppLanding(""), false);
  assert.equal(isShopAppLanding(null), false);
});

test("purchase payload uses the order name, totals, and sku", () => {
  assert.deepEqual(ga4PurchasePayload(shopPayOrder()), {
    client_id: "1234567890.1690000000",
    events: [
      {
        name: "purchase",
        params: {
          currency: "USD",
          items: [
            {
              item_id: "TAF-M",
              item_name: "Tafakkar Tee - M",
              price: 33.99,
              quantity: 2,
            },
          ],
          session_id: 1690001111,
          shipping: 5,
          tax: 4.5,
          transaction_id: "A-1009",
          value: 58.48,
        },
      },
    ],
  });
  const prefixed = ga4PurchasePayload(
    shopPayOrder({ note_attributes: [{ name: "_ga_cid", value: "GA1.1.9.8" }] }),
  );
  assert.equal(prefixed?.client_id, "9.8");
  assert.equal(prefixed?.events[0]?.params.session_id, undefined);
  const synthetic = ga4PurchasePayload(shopPayOrder({ note_attributes: [] }));
  assert.equal(synthetic?.client_id, "0.1009");
  assert.equal(synthetic?.events[0]?.params.transaction_id, "A-1009");
  assert.equal("session_id" in (synthetic?.events[0]?.params ?? {}), false);
  const shipped = ga4PurchasePayload(
    shopPayOrder({
      shipping_lines: [{ discounted_price: "6.50", price: "8.00" }],
      total_shipping_price_set: undefined,
    }),
  );
  assert.equal(shipped?.events[0]?.params.shipping, 6.5);
  assert.equal(shipped?.events[0]?.params.value, 58.48);
  const discounted = ga4PurchasePayload(
    shopPayOrder({ current_subtotal_price: "50.00", current_total_price: "59.50" }),
  );
  assert.equal(discounted?.events[0]?.params.value, 50);
  const derived = ga4PurchasePayload(
    shopPayOrder({ current_subtotal_price: undefined, subtotal_price: undefined }),
  );
  assert.equal(derived?.events[0]?.params.value, 58.48);
});

test("a missing measurement protocol secret does not send", async () => {
  const previous = process.env.GA4_API_SECRET;
  const calls: Array<{ body: string; url: string }> = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = (message?: unknown) => {
    warnings.push(String(message));
  };
  console.error = (...parts: unknown[]) => {
    errors.push(parts.map(String).join(" "));
  };
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ body: String(init?.body ?? ""), url: String(input) });
    return new Response(null, { status: 204 });
  };
  try {
    process.env.GA4_API_SECRET = "test-secret";
    assert.equal(
      await notifyGa4Purchase(shopPayOrder({ landing_site: "https://shirtat.co/" }), fetchImpl),
      "skipped",
    );
    assert.equal(calls.length, 0);
    assert.equal(warnings.length, 0);

    delete process.env.GA4_API_SECRET;
    assert.equal(await notifyGa4Purchase(shopPayOrder(), fetchImpl), "unconfigured");
    assert.equal(calls.length, 0);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0] ?? "", /GA4_API_SECRET is unset/);
    assert.equal((warnings[0] ?? "").includes("test-secret"), false);

    process.env.GA4_API_SECRET = "test-secret";
    assert.equal(await notifyGa4Purchase(shopPayOrder(), fetchImpl), "sent");
    assert.equal(calls.length, 1);
    const endpoint = new URL(calls[0]?.url ?? "");
    assert.equal(
      endpoint.origin + endpoint.pathname,
      "https://www.google-analytics.com/mp/collect",
    );
    assert.equal(endpoint.searchParams.get("measurement_id"), "G-6DT5S4QRGT");
    assert.equal(endpoint.searchParams.get("api_secret"), "test-secret");
    assert.deepEqual(JSON.parse(calls[0]?.body ?? ""), ga4PurchasePayload(shopPayOrder()));

    const failing: typeof fetch = async () => {
      throw new Error("https://www.google-analytics.com/mp/collect?api_secret=test-secret");
    };
    assert.equal(await notifyGa4Purchase(shopPayOrder(), failing), "failed");
    assert.equal(
      errors.some((line) => line.includes("test-secret") || line.includes("api_secret")),
      false,
    );
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
    if (previous === undefined) delete process.env.GA4_API_SECRET;
    else process.env.GA4_API_SECRET = previous;
  }
});

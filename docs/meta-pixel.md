# Meta pixel and Conversions API

Shirtat records PageView, ViewContent, AddToCart, and InitiateCheckout in the browser and on the server, with one shared `event_id` so Meta counts each action once. Purchase is recorded from the paid-order webhook and from a Shopify custom pixel, both using `purchase_<order id>`.

Nothing loads while `NEXT_PUBLIC_META_PIXEL_ID` is unset. Server events are not sent while `META_CAPI_ACCESS_TOKEN` is unset. The token is read only on the server.

## Environment

Set these on the Vercel project `shirtat-shop`. Do not commit values.

| Name                        | Where                  | Purpose                                                                                                                           |
| --------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Production and Preview | Dataset / pixel id. Already set.                                                                                                  |
| `META_CAPI_ACCESS_TOKEN`    | Production             | Conversions API token. Server-only. Already set in production. Add it to Preview only while testing server events.                |
| `META_TEST_EVENT_CODE`      | Preview, temporarily   | Events Manager test code such as `TEST12345`. Leave unset in production. Events sent with a test code are still eligible for ads. |

`content_ids` are numeric Shopify variant ids (`gid://shopify/ProductVariant/555` becomes `555`). In Commerce Manager, set the catalog's product identifier to the Shopify variant id, which is the Facebook & Instagram channel default. `content_type` is `product`.

## What the storefront sends

After the shopper's first key press, pointer, or touch, the page loads Shopify's Customer Privacy script (`default-banner`) and, once consent allows, inserts `https://connect.facebook.net/en_US/fbevents.js`. Scroll alone does not load it, so a Lighthouse crawl does not download the tag. Automated Chrome (`navigator.webdriver`) does not load it either. The same events are posted to `POST /api/meta/events`, which calls `https://graph.facebook.com/v27.0/<pixel id>/events`.

An event is sent only when Shopify's Customer Privacy API reports analytics, marketing, and sale of data as allowed. In regions that require a choice, Shopify's banner is the choice. Until the shopper accepts, or if they decline, the pixel and the Conversions API stay quiet. Where Shopify does not require a choice, the API allows those purposes and events flow without a banner. If the privacy API never loads, nothing is sent.

Storefront events include the browser's `_fbp` and `_fbc` cookies, the client IP, and the user agent. Customer accounts are off, so those events do not include an email or phone. `fbc` is built from `fbclid` when the cookie is missing.

InitiateCheckout runs from the cart's checkout button and from Buy with Shop Pay, before the browser leaves for Shopify.

## Purchase

Checkout finishes on `checkout.shirtat.co`, so the storefront never sees the paid order. Two signals share `purchase_<numeric order id>`:

1. **Webhook.** `orders/paid` is already delivered to `POST /api/webhooks/shopify` and verified with the same HMAC as the print-on-demand webhook (`SHOPIFY_WEBHOOK_SECRET`, or the Admin app client secret when that is unset). A paid order sends a Conversions API Purchase. A failure does not change print routing. Confirm in Shopify admin that `orders/paid` points at `https://shirtat.co/api/webhooks/shopify`. Do not add a second subscription for the same topic. The repo's `POST /api/webhooks/register` already lists `ORDERS_PAID` if the subscription is missing.

2. **Custom pixel.** Shopify admin → Settings → Customer events → Add custom pixel. Name it `Meta Purchase`. Under Customer privacy, require Marketing and Analytics, and leave the pixel marked as a data sale. Paste the snippet below, replace `YOUR_PIXEL_ID` with the same value as `NEXT_PUBLIC_META_PIXEL_ID`, then save and connect. Do not put the Conversions API token in the pixel.

Before the browser leaves for checkout, the storefront reads Shopify Customer Privacy and the browser's Global Privacy Control signal. It writes a hidden cart attribute, `_meta_consent`, so the paid order carries the same choice. The value is `granted` when analytics, marketing, and sale of data are all allowed, and `denied` when any of those is refused or Global Privacy Control is on. Shop Pay permalinks include the same attribute. The webhook does not send Purchase when `_meta_consent` or `meta_consent` is `denied`; a denial wins if both are present. It sends Purchase when either attribute is `granted`, including an order in the EEA, the UK, Switzerland, or Brazil. With neither attribute, orders outside that list are still sent, and orders inside it are not. A US shopper who has not opted out is sent as before. A US shopper who opted out of sale or sharing is not sent. Writing the attribute does not block checkout, and a Conversions API failure does not change print-on-demand routing.

The Purchase payload hashes email, phone, name, city, state, postal code, country, and Shopify customer id when the order includes them. It also sends `browser_ip` and the order's user agent. It does not send a raw address.

```javascript
var PIXEL_ID = "YOUR_PIXEL_ID";
var privacy = init.customerPrivacy;
api.customerPrivacy.subscribe("visitorConsentCollected", function (event) {
  privacy = event.customerPrivacy;
});

function allowed() {
  return (
    privacy.analyticsProcessingAllowed && privacy.marketingAllowed && privacy.saleOfDataAllowed
  );
}

function numericId(id) {
  var match = id && String(id).match(/(\d+)\s*$/);
  return match ? match[1] : null;
}

analytics.subscribe("checkout_completed", function (event) {
  if (!allowed()) return;
  var checkout = event.data.checkout;
  var orderNumber = numericId(checkout.order && checkout.order.id);
  if (!orderNumber) return;
  var eventId = "purchase_" + orderNumber;
  if (!window.fbq) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL_ID);
  }
  var contents = [];
  var ids = [];
  checkout.lineItems.forEach(function (line) {
    var id = numericId(line.variant && line.variant.id);
    if (!id) return;
    ids.push(id);
    contents.push({
      id: id,
      item_price:
        line.variant && line.variant.price ? Number(line.variant.price.amount) : undefined,
      quantity: line.quantity,
    });
  });
  window.fbq(
    "track",
    "Purchase",
    {
      content_ids: ids,
      content_type: "product",
      contents: contents,
      currency: checkout.currencyCode || (checkout.totalPrice && checkout.totalPrice.currencyCode),
      num_items: contents.reduce(function (sum, line) {
        return sum + line.quantity;
      }, 0),
      value: checkout.totalPrice ? Number(checkout.totalPrice.amount) : undefined,
    },
    { eventID: eventId },
  );
});
```

## Verify in Events Manager

1. Events Manager → the Shirtat dataset → Test events. Copy the test code into `META_TEST_EVENT_CODE` on the Preview environment and redeploy that preview. Leave the variable unset on Production.
2. Open the preview, accept the privacy banner if it appears, then open a product, add it to the cart, and start checkout. Test events should show PageView, ViewContent, AddToCart, and InitiateCheckout, each once, with the same event id on the browser and server rows.
3. Place a test order after accepting privacy, or from a region that does not require a choice. The custom pixel and the `orders/paid` webhook should both show Purchase with `purchase_<order id>`. Meta keeps one of them. An order whose `_meta_consent` attribute is `denied` — a US opt-out of sale or sharing, Global Privacy Control, or a refused banner — should not show a server Purchase. The print-on-demand route for that order still runs.
4. Remove `META_TEST_EVENT_CODE` when you are done. Production Conversions API already has the token, so live events appear under Overview after the code is removed. Preview will not send server events until `META_CAPI_ACCESS_TOKEN` is set there too.

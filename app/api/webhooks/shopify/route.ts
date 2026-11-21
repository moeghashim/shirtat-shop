import { revalidateTag } from "next/cache";

import { shopifyWebhookTags, verifyShopifyWebhook } from "@/app/api/webhooks/shopify/tags";
import { autoCategorizeProduct } from "@/lib/catalog/auto-categorize";
import { approvePodOrder, routeOrderToPods } from "@/lib/catalog/pod";
import { handleCustomOrder } from "@/lib/custom/order";
import { notifyMetaPurchase } from "@/lib/meta/server";

// Webhooks registered by the site's own Admin app are signed with that app's client secret.
const SHOPIFY_WEBHOOK_SECRET =
  process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_ADMIN_CLIENT_SECRET;

export async function POST(request: Request) {
  if (!SHOPIFY_WEBHOOK_SECRET) return new Response(null, { status: 404 });

  const body = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");

  if (!verifyShopifyWebhook(body, hmacHeader, SHOPIFY_WEBHOOK_SECRET)) {
    console.error("Invalid Shopify webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!topic) {
    return Response.json({ error: "Missing topic header" }, { status: 400 });
  }

  if (topic === "orders/updated") {
    const sent = await approvePodOrder(JSON.parse(body));
    return Response.json({ sent });
  }

  if (topic === "orders/paid") {
    try {
      const order = JSON.parse(body);
      const metaPromise = notifyMetaPurchase(order).catch((error) => {
        console.error("[meta] purchase", error instanceof Error ? error.name : "error");
        return "failed" as const;
      });
      const custom = await handleCustomOrder(order).catch((e) => {
        console.error("[CUSTOM] handling failed", e);
        return 0;
      });
      const [meta, pod] = await Promise.all([metaPromise, routeOrderToPods(order)]);
      return Response.json({ custom, meta, pod });
    } catch (e) {
      console.error("POD routing failed", e);
      return Response.json({ error: "POD routing failed" }, { status: 500 });
    }
  }

  const tagsInvalidated: string[] = [];
  let categoriesAdded: string[] = [];
  const payload = parseWebhookPayload(body, topic);

  if (topic === "products/create" && isPayload(payload)) {
    try {
      categoriesAdded = await autoCategorizeProduct(payload);
    } catch (e) {
      console.error("Auto-categorize failed", e);
    }
  }

  // A publish also expires products-index. Later edits expire the product tags only.
  for (const tag of shopifyWebhookTags(topic, payload)) {
    revalidateTag(tag, { expire: 0 });
    tagsInvalidated.push(tag);
  }

  return Response.json({
    success: true,
    topic,
    tagsInvalidated,
    categoriesAdded,
  });
}

function parseWebhookPayload(body: string, topic: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    if (topic.startsWith("products/")) {
      console.error("[Shopify Webhook] Could not parse products payload");
    } else if (topic.startsWith("collections/")) {
      console.error("[Shopify Webhook] Could not parse collections payload");
    } else if (topic.startsWith("metaobjects/")) {
      console.error("[Shopify Webhook] Could not parse metaobjects payload");
    }
    return undefined;
  }
}

function isPayload(value: unknown): value is Parameters<typeof autoCategorizeProduct>[0] {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

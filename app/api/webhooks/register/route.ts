import { adminGraphql } from "@/lib/creators/shopify-admin";

/**
 * Idempotently registers the store webhooks the site relies on (fixed topics, fixed callback URL),
 * using the site's own Admin app so deliveries are signed with SHOPIFY_ADMIN_CLIENT_SECRET.
 * Takes no input, so calling it repeatedly is harmless.
 */
const CALLBACK = "https://shirtat.co/api/webhooks/shopify";
const TOPICS = ["PRODUCTS_CREATE", "PRODUCTS_UPDATE", "PRODUCTS_DELETE", "ORDERS_PAID", "COLLECTIONS_UPDATE"];

export async function POST() {
  try {
    const existing = await adminGraphql<{
      webhookSubscriptions: { nodes: { endpoint: { callbackUrl?: string }; topic: string }[] };
    }>(
      `{ webhookSubscriptions(first: 50) { nodes { topic endpoint { ... on WebhookHttpEndpoint { callbackUrl } } } } }`,
      {},
    );
    const have = new Set(
      existing.webhookSubscriptions.nodes
        .filter((n) => n.endpoint.callbackUrl === CALLBACK)
        .map((n) => n.topic),
    );
    const results: Record<string, string> = {};
    for (const topic of TOPICS) {
      if (have.has(topic)) {
        results[topic] = "exists";
        continue;
      }
      const r = await adminGraphql<{
        webhookSubscriptionCreate: { userErrors: { message: string }[] };
      }>(
        `mutation($topic: WebhookSubscriptionTopic!, $url: URL!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: { callbackUrl: $url, format: JSON }) { userErrors { message } }
        }`,
        { topic, url: CALLBACK },
      );
      const err = r.webhookSubscriptionCreate.userErrors[0]?.message;
      results[topic] = err ? `error: ${err}` : "created";
    }
    return Response.json({ results });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}

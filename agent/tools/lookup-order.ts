import { defineTool } from "eve/tools";
import { z } from "zod";

import { shopConfig } from "../../lib/config";
import { getAdminToken } from "../lib/shopify-admin";

const API_VERSION = "2026-10";
const NO_MATCH = { found: false, message: "No order matches that order number and email." };

const QUERY = `query($q: String!) { orders(first: 1, query: $q) { nodes {
  name email createdAt displayFinancialStatus displayFulfillmentStatus cancelledAt
  lineItems(first: 20) { nodes { name quantity } }
  fulfillments(first: 10) { status trackingInfo { company number url } }
} } }`;

export default defineTool({
  description:
    "Read-only order status for a shopper who gives BOTH their order number and the email used at checkout. Never call it with only one of them, and never reveal whether an order number exists when the email does not match.",
  inputSchema: z.strictObject({
    email: z.string().email().max(200),
    orderNumber: z.string().regex(/^#?[A-Za-z]{0,3}-?\d{3,8}$/),
  }),
  execute: async ({ email, orderNumber }) => {
    const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    if (!shopConfig.support.orderLookup.isEnabled || !domain) return { unavailable: true };
    const token = await getAdminToken(domain);
    if (!token) return { unavailable: true };
    const name = orderNumber.startsWith("#") ? orderNumber : `#${orderNumber}`;
    const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
      body: JSON.stringify({ query: QUERY, variables: { q: `name:${name}` } }),
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      method: "POST",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { unavailable: true };
    const json = (await response.json()) as {
      errors?: unknown;
      data?: {
        orders: {
          nodes: Array<{
            cancelledAt: string | null;
            createdAt: string;
            displayFinancialStatus: string | null;
            displayFulfillmentStatus: string;
            email: string | null;
            fulfillments: Array<{
              status: string;
              trackingInfo: Array<{
                company: string | null;
                number: string | null;
                url: string | null;
              }>;
            }>;
            lineItems: { nodes: Array<{ name: string; quantity: number }> };
            name: string;
          }>;
        };
      };
    };
    if (json.errors || !json.data) return { unavailable: true };
    const order = json.data.orders.nodes[0];
    if (!order?.email || order.email.trim().toLowerCase() !== email.trim().toLowerCase())
      return NO_MATCH;
    return {
      cancelled: Boolean(order.cancelledAt),
      found: true,
      fulfillmentStatus: order.displayFulfillmentStatus,
      items: order.lineItems.nodes,
      orderName: order.name,
      paymentStatus: order.displayFinancialStatus,
      placedAt: order.createdAt,
      shipments: order.fulfillments.map((fulfillment) => ({
        status: fulfillment.status,
        tracking: fulfillment.trackingInfo,
      })),
    };
  },
});

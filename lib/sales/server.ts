import { cacheLife } from "next/cache";

import { getUsdRates, rateOn } from "@/lib/creators/earnings";

export interface SalesTotals {
  orders: number;
  revenue: number;
  units: number;
}

export interface SalesFigures {
  currency: string;
  last60Days: SalesTotals;
  last30Days: SalesTotals;
}

const QUERY = `query SalesAggregates($cursor: String) {
  shop { currencyCode }
  orders(first: 100, after: $cursor, query: "status:any -status:cancelled") {
    pageInfo { hasNextPage endCursor }
    nodes {
      createdAt
      totalPriceSet { shopMoney { amount } }
      lineItems(first: 100) { nodes { quantity } }
    }
  }
}`;

interface OrdersResponse {
  data?: {
    shop: { currencyCode: string };
    orders: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: {
        createdAt: string;
        totalPriceSet: { shopMoney: { amount: string } };
        lineItems: { nodes: { quantity: number }[] };
      }[];
    };
  };
  errors?: unknown;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Gets a short-lived Admin API token with the client-credentials grant, cached in memory. */
export async function getAdminToken(domain: string): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  const ttlMs = Math.max((json.expires_in ?? 3600) - 300, 60) * 1000;
  cachedToken = { value: json.access_token, expiresAt: Date.now() + ttlMs };
  return json.access_token;
}

/** Returns only aggregate figures, or null when unavailable. Never returns customer data. */
export async function getSalesFigures(): Promise<SalesFigures | null> {
  "use cache";
  cacheLife("hours");

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) return null;

  try {
    const token = await getAdminToken(domain);
    if (!token) return null;
    const empty = (): SalesTotals => ({ orders: 0, revenue: 0, units: 0 });
    const last60Days = empty();
    const last30Days = empty();
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const currency = "USD";
    let rates: Map<string, number> | null = null;
    let cursor: string | null = null;

    for (let page = 0; page < 50; page++) {
      const res = await fetch(`https://${domain}/admin/api/2025-01/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ query: QUERY, variables: { cursor } }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as OrdersResponse;
      if (!json.data || json.errors) return null;
      const shopCcy = json.data.shop.currencyCode;
      if (shopCcy !== "USD" && !rates) {
        const start = new Date(Date.now() - 67 * 86400000).toISOString().slice(0, 10);
        rates = await getUsdRates(shopCcy, start, new Date().toISOString().slice(0, 10));
      }
      for (const order of json.data.orders.nodes) {
        const amount = Number(order.totalPriceSet.shopMoney.amount) || 0;
        const fx = rates ? rateOn(rates, order.createdAt.slice(0, 10)) : 1;
        if (!fx) return null;
        // Historical non-USD orders are converted to USD at the order-date rate.
        const revenue = amount * fx;
        const units = order.lineItems.nodes.reduce((sum, item) => sum + item.quantity, 0);
        for (const bucket of new Date(order.createdAt).getTime() >= cutoff
          ? [last60Days, last30Days]
          : [last60Days]) {
          bucket.orders += 1;
          bucket.revenue += revenue;
          bucket.units += units;
        }
      }
      if (!json.data.orders.pageInfo.hasNextPage) break;
      cursor = json.data.orders.pageInfo.endCursor;
    }

    return { currency, last60Days, last30Days };
  } catch {
    return null;
  }
}

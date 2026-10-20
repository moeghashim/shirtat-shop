import { cacheLife } from "next/cache";

export interface SalesTotals {
  orders: number;
  revenue: number;
  units: number;
}

export interface SalesFigures {
  currency: string;
  allTime: SalesTotals;
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

/** Returns only aggregate figures, or null when unavailable. Never returns customer data. */
export async function getSalesFigures(): Promise<SalesFigures | null> {
  "use cache";
  cacheLife("hours");

  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!token || !domain) return null;

  try {
    const empty = (): SalesTotals => ({ orders: 0, revenue: 0, units: 0 });
    const allTime = empty();
    const last30Days = empty();
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let currency = "GBP";
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
      currency = json.data.shop.currencyCode;
      for (const order of json.data.orders.nodes) {
        const revenue = Number(order.totalPriceSet.shopMoney.amount) || 0;
        const units = order.lineItems.nodes.reduce((sum, item) => sum + item.quantity, 0);
        for (const bucket of new Date(order.createdAt).getTime() >= cutoff
          ? [allTime, last30Days]
          : [allTime]) {
          bucket.orders += 1;
          bucket.revenue += revenue;
          bucket.units += units;
        }
      }
      if (!json.data.orders.pageInfo.hasNextPage) break;
      cursor = json.data.orders.pageInfo.endCursor;
    }

    return { currency, allTime, last30Days };
  } catch {
    return null;
  }
}

import { getAdminToken } from "@/lib/sales/server";

import { CREATOR_TERMS } from "./terms";
import type { CreatorRecord } from "./types";

export interface ProductEarnings {
  handle: string;
  netSales: number;
  productId: string;
  title: string;
  units: number;
}

export interface CreatorEarnings {
  /** True when some figures were converted from the shop currency at the order-date rate. */
  converted: boolean;
  currency: "USD";
  earnings: number;
  netSales: number;
  payable: number;
  pending: number;
  products: ProductEarnings[];
  quarterUnits: number;
  rate: number;
  tier: "standard" | "top";
  units: number;
  windowDays: number;
}

const API_VERSION = "2025-01";

interface Money {
  amount: string;
  currencyCode?: string;
}

/** Daily FX rates to USD from frankfurter (ECB reference rates), cached for a day. */
async function getUsdRates(from: string, start: string, end: string): Promise<Map<string, number>> {
  const res = await fetch(
    `https://api.frankfurter.dev/v1/${start}..${end}?from=${encodeURIComponent(from)}&to=USD`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) throw new Error("FX unavailable");
  const json = (await res.json()) as { rates: Record<string, { USD: number }> };
  return new Map(Object.entries(json.rates).map(([date, r]) => [date, r.USD]));
}

/** Rate for the order date, or the latest earlier business day. */
function rateOn(rates: Map<string, number>, date: string): number | undefined {
  const dates = [...rates.keys()].sort();
  let found: number | undefined;
  for (const d of dates) {
    if (d <= date) found = rates.get(d);
    else break;
  }
  return found ?? rates.get(dates[0] ?? "");
}

/** Products tagged `creator:<handle>` in Shopify (read through the Storefront API). */
export async function getCreatorProducts(
  handle: string,
): Promise<{ handle: string; id: string; title: string }[]> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return [];
  const out: { handle: string; id: string; title: string }[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 10; page++) {
    const res: Response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({
        query: `query($q: String!, $cursor: String) { products(first: 100, after: $cursor, query: $q) { pageInfo { hasNextPage endCursor } nodes { id handle title tags } } }`,
        variables: { q: `tag:'creator:${handle}'`, cursor },
      }),
      cache: "no-store",
    });
    if (!res.ok) break;
    const json = (await res.json()) as {
      data?: {
        products: {
          nodes: { handle: string; id: string; tags: string[]; title: string }[];
          pageInfo: { endCursor: string | null; hasNextPage: boolean };
        };
      };
    };
    const products = json.data?.products;
    if (!products) break;
    for (const p of products.nodes) {
      if (p.tags.some((tag) => tag.toLowerCase() === `creator:${handle}`.toLowerCase())) {
        out.push({ handle: p.handle, id: p.id, title: p.title });
      }
    }
    if (!products.pageInfo.hasNextPage) break;
    cursor = products.pageInfo.endCursor;
  }
  return out;
}

const ORDERS_QUERY = `query CreatorOrders($cursor: String) {
  shop { currencyCode }
  orders(first: 100, after: $cursor, query: "status:any -status:cancelled") {
    pageInfo { hasNextPage endCursor }
    nodes {
      createdAt
      lineItems(first: 100) {
        nodes {
          quantity
          title
          product { id }
          originalTotalSet { shopMoney { amount currencyCode } presentmentMoney { amount currencyCode } }
          discountAllocations { allocatedAmountSet { shopMoney { amount } presentmentMoney { amount } } }
        }
      }
    }
  }
}`;

interface OrdersJson {
  data?: {
    orders: {
      nodes: {
        createdAt: string;
        lineItems: {
          nodes: {
            discountAllocations: {
              allocatedAmountSet: { presentmentMoney: Money; shopMoney: Money };
            }[];
            originalTotalSet: { presentmentMoney: Money; shopMoney: Money };
            product: { id: string } | null;
            quantity: number;
            title: string;
          }[];
        };
      }[];
      pageInfo: { endCursor: string | null; hasNextPage: boolean };
    };
    shop: { currencyCode: string };
  };
  errors?: unknown;
}

function quarterStart(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1);
}

/**
 * Earnings from the last 60 days of orders (Shopify read_orders limit).
 * Net item price = line price after all allocated discounts, excluding tax and shipping.
 */
export async function getCreatorEarnings(creator: CreatorRecord): Promise<CreatorEarnings | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain || !creator.handle) return null;
  const products = await getCreatorProducts(creator.handle);
  const byId = new Map(products.map((p) => [p.id, p]));
  const token = await getAdminToken(domain);
  if (!token) return null;

  const now = new Date();
  const holdCutoff = now.getTime() - CREATOR_TERMS.holdDays * 86400000;
  const qStart = quarterStart(now);
  const perProduct = new Map<string, ProductEarnings>();
  let converted = false;
  let fx: Map<string, number> | null = null;
  const toUsd = async (
    presentment: number,
    presentmentCcy: string | undefined,
    shop: number,
    shopCcy: string,
    date: string,
  ) => {
    if (presentmentCcy === "USD") return presentment;
    if (shopCcy === "USD") return shop;
    if (!fx) {
      const start = new Date(now.getTime() - (CREATOR_TERMS.ordersWindowDays + 7) * 86400000)
        .toISOString()
        .slice(0, 10);
      fx = await getUsdRates(shopCcy, start, now.toISOString().slice(0, 10));
    }
    const rate = rateOn(fx, date);
    if (!rate) throw new Error("FX rate missing");
    converted = true;
    return shop * rate;
  };
  let units = 0;
  let netSales = 0;
  let quarterUnits = 0;
  let matureNet = 0;
  let cursor: string | null = null;

  for (let page = 0; page < 50; page++) {
    const res: Response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query: ORDERS_QUERY, variables: { cursor } }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as OrdersJson;
    if (!json.data) return null;
    const shopCcy = json.data.shop.currencyCode;
    for (const order of json.data.orders.nodes) {
      const created = new Date(order.createdAt).getTime();
      for (const line of order.lineItems.nodes) {
        const product = line.product ? byId.get(line.product.id) : undefined;
        if (!product) continue;
        const sumAlloc = (key: "presentmentMoney" | "shopMoney") =>
          line.discountAllocations.reduce(
            (sum, d) => sum + (Number(d.allocatedAmountSet[key].amount) || 0),
            0,
          );
        const netPresentment = Math.max(
          0,
          (Number(line.originalTotalSet.presentmentMoney.amount) || 0) -
            sumAlloc("presentmentMoney"),
        );
        const netShop = Math.max(
          0,
          (Number(line.originalTotalSet.shopMoney.amount) || 0) - sumAlloc("shopMoney"),
        );
        const net = await toUsd(
          netPresentment,
          line.originalTotalSet.presentmentMoney.currencyCode,
          netShop,
          line.originalTotalSet.shopMoney.currencyCode ?? shopCcy,
          order.createdAt.slice(0, 10),
        );
        units += line.quantity;
        netSales += net;
        if (created < holdCutoff) matureNet += net;
        if (created >= qStart) quarterUnits += line.quantity;
        const entry = perProduct.get(product.id) ?? {
          handle: product.handle,
          netSales: 0,
          productId: product.id,
          title: product.title,
          units: 0,
        };
        entry.units += line.quantity;
        entry.netSales += net;
        perProduct.set(product.id, entry);
      }
    }
    if (!json.data.orders.pageInfo.hasNextPage) break;
    cursor = json.data.orders.pageInfo.endCursor;
  }

  const tier =
    creator.tierOverride === "top" ||
    (creator.tierOverride === "auto" && quarterUnits >= CREATOR_TERMS.topUnitsPerQuarter)
      ? "top"
      : "standard";
  const rate = Math.max(
    CREATOR_TERMS.rateFloor,
    tier === "top" ? CREATOR_TERMS.topRate : CREATOR_TERMS.baseRate,
  );
  const earnings = netSales * rate;
  const payable = matureNet * rate;
  for (const p of products) {
    if (!perProduct.has(p.id)) {
      perProduct.set(p.id, {
        handle: p.handle,
        netSales: 0,
        productId: p.id,
        title: p.title,
        units: 0,
      });
    }
  }
  return {
    converted,
    currency: "USD",
    earnings,
    netSales,
    payable,
    pending: earnings - payable,
    products: [...perProduct.values()].sort((a, b) => b.units - a.units),
    quarterUnits,
    rate,
    tier,
    units,
    windowDays: CREATOR_TERMS.ordersWindowDays,
  };
}

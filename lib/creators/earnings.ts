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
  /** Net sales before refunds. */
  grossSales: number;
  /** After refunds. */
  netSales: number;
  payable: number;
  pending: number;
  products: ProductEarnings[];
  quarterNet: number;
  quarterUnits: number;
  rate: number;
  refundedUnits: number;
  refunds: number;
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
export async function getUsdRates(
  from: string,
  start: string,
  end: string,
): Promise<Map<string, number>> {
  const res = await fetch(
    `https://api.frankfurter.dev/v1/${start}..${end}?from=${encodeURIComponent(from)}&to=USD`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) throw new Error("FX unavailable");
  const json = (await res.json()) as { rates: Record<string, { USD: number }> };
  return new Map(Object.entries(json.rates).map(([date, r]) => [date, r.USD]));
}

/** Rate for the order date, or the latest earlier business day. */
export function rateOn(rates: Map<string, number>, date: string): number | undefined {
  const dates = [...rates.keys()].sort();
  let found: number | undefined;
  for (const d of dates) {
    if (d <= date) found = rates.get(d);
    else break;
  }
  return found ?? rates.get(dates[0] ?? "");
}

/** Products tagged `designer:<handle>` (or the legacy `creator:<handle>`) in Shopify, via the Storefront API. */
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
        variables: { q: `tag:'designer:${handle}' OR tag:'creator:${handle}'`, cursor },
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
      const wanted = [`designer:${handle}`, `creator:${handle}`].map((t) => t.toLowerCase());
      if (p.tags.some((tag) => wanted.includes(tag.toLowerCase()))) {
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
  orders(first: 50, after: $cursor, query: "status:any -status:cancelled") {
    pageInfo { hasNextPage endCursor }
    nodes {
      createdAt
      lineItems(first: 100) {
        nodes {
          id
          quantity
          product { id }
          originalTotalSet { shopMoney { amount currencyCode } presentmentMoney { amount currencyCode } }
          discountAllocations { allocatedAmountSet { shopMoney { amount } presentmentMoney { amount } } }
        }
      }
      refunds {
        refundLineItems(first: 100) {
          nodes {
            quantity
            lineItem { id }
            subtotalSet { shopMoney { amount currencyCode } presentmentMoney { amount currencyCode } }
          }
        }
      }
    }
  }
}`;

interface MoneyBag {
  presentmentMoney: Money;
  shopMoney: Money;
}

interface OrdersJson {
  data?: {
    orders: {
      nodes: {
        createdAt: string;
        lineItems: {
          nodes: {
            discountAllocations: { allocatedAmountSet: MoneyBag }[];
            id: string;
            originalTotalSet: MoneyBag;
            product: { id: string } | null;
            quantity: number;
          }[];
        };
        refunds: {
          refundLineItems: {
            nodes: { lineItem: { id: string }; quantity: number; subtotalSet: MoneyBag }[];
          };
        }[];
      }[];
      pageInfo: { endCursor: string | null; hasNextPage: boolean };
    };
    shop: { currencyCode: string };
  };
  errors?: unknown;
}

/** One order line in USD, with refunds for that line (converted at the order-date rate). */
export interface OrderLine {
  converted: boolean;
  createdAt: number;
  netUsd: number;
  productId: string;
  quantity: number;
  refundedQty: number;
  refundedUsd: number;
}

function quarterStart(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1);
}

/** All order lines from the last 60 days (Shopify read_orders limit), normalised to USD. */
export async function getOrderLines(): Promise<OrderLine[] | null> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  if (!domain) return null;
  const token = await getAdminToken(domain);
  if (!token) return null;
  const now = new Date();
  let fx: Map<string, number> | null = null;
  const toUsd = async (
    bag: MoneyBag,
    presentment: number,
    shop: number,
    shopCcy: string,
    date: string,
  ) => {
    if (bag.presentmentMoney.currencyCode === "USD") return { converted: false, usd: presentment };
    const ccy = bag.shopMoney.currencyCode ?? shopCcy;
    if (ccy === "USD") return { converted: false, usd: shop };
    if (!fx) {
      const start = new Date(now.getTime() - (CREATOR_TERMS.ordersWindowDays + 7) * 86400000)
        .toISOString()
        .slice(0, 10);
      fx = await getUsdRates(ccy, start, now.toISOString().slice(0, 10));
    }
    const rate = rateOn(fx, date);
    if (!rate) throw new Error("FX rate missing");
    return { converted: true, usd: shop * rate };
  };
  const out: OrderLine[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 100; page++) {
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
      const date = order.createdAt.slice(0, 10);
      const refunds = new Map<
        string,
        { qty: number; presentment: number; shop: number; bag: MoneyBag }
      >();
      for (const r of order.refunds) {
        for (const rl of r.refundLineItems.nodes) {
          const e = refunds.get(rl.lineItem.id) ?? {
            bag: rl.subtotalSet,
            presentment: 0,
            qty: 0,
            shop: 0,
          };
          e.qty += rl.quantity;
          e.presentment += Number(rl.subtotalSet.presentmentMoney.amount) || 0;
          e.shop += Number(rl.subtotalSet.shopMoney.amount) || 0;
          refunds.set(rl.lineItem.id, e);
        }
      }
      for (const line of order.lineItems.nodes) {
        if (!line.product) continue;
        const alloc = (k: "presentmentMoney" | "shopMoney") =>
          line.discountAllocations.reduce(
            (sum, d) => sum + (Number(d.allocatedAmountSet[k].amount) || 0),
            0,
          );
        const netP = Math.max(
          0,
          (Number(line.originalTotalSet.presentmentMoney.amount) || 0) - alloc("presentmentMoney"),
        );
        const netS = Math.max(
          0,
          (Number(line.originalTotalSet.shopMoney.amount) || 0) - alloc("shopMoney"),
        );
        const net = await toUsd(line.originalTotalSet, netP, netS, shopCcy, date);
        const r = refunds.get(line.id);
        const refunded = r
          ? await toUsd(r.bag, r.presentment, r.shop, shopCcy, date)
          : { converted: false, usd: 0 };
        out.push({
          converted: net.converted || refunded.converted,
          createdAt: new Date(order.createdAt).getTime(),
          netUsd: net.usd,
          productId: line.product.id,
          quantity: line.quantity,
          refundedQty: Math.min(r?.qty ?? 0, line.quantity),
          refundedUsd: Math.min(refunded.usd, net.usd),
        });
      }
    }
    if (!json.data.orders.pageInfo.hasNextPage) break;
    cursor = json.data.orders.pageInfo.endCursor;
  }
  return out;
}

/**
 * Earnings from the last 60 days of orders. Net item price = line price after allocated discounts,
 * excluding tax and shipping, minus refunded amounts. Refunded units do not count towards the tier.
 */
export async function getCreatorEarnings(
  creator: CreatorRecord,
  sharedLines?: OrderLine[] | null,
): Promise<CreatorEarnings | null> {
  if (!creator.handle) return null;
  const [products, lines] = await Promise.all([
    getCreatorProducts(creator.handle),
    sharedLines === undefined ? getOrderLines() : Promise.resolve(sharedLines),
  ]);
  if (!lines) return null;
  const byId = new Map(products.map((p) => [p.id, p]));
  const now = new Date();
  const holdCutoff = now.getTime() - CREATOR_TERMS.holdDays * 86400000;
  const qStart = quarterStart(now);
  const perProduct = new Map<string, ProductEarnings>();
  let converted = false;
  let units = 0;
  let grossSales = 0;
  let refunds = 0;
  let refundedUnits = 0;
  let quarterUnits = 0;
  let quarterNet = 0;
  let matureNet = 0;
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product) continue;
    converted ||= line.converted;
    const keptUnits = line.quantity - line.refundedQty;
    const net = line.netUsd - line.refundedUsd;
    units += keptUnits;
    grossSales += line.netUsd;
    refunds += line.refundedUsd;
    refundedUnits += line.refundedQty;
    if (line.createdAt < holdCutoff) matureNet += net;
    if (line.createdAt >= qStart) {
      quarterUnits += keptUnits;
      quarterNet += net;
    }
    const entry = perProduct.get(product.id) ?? {
      handle: product.handle,
      netSales: 0,
      productId: product.id,
      title: product.title,
      units: 0,
    };
    entry.units += keptUnits;
    entry.netSales += net;
    perProduct.set(product.id, entry);
  }
  const netSales = grossSales - refunds;
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
    if (!perProduct.has(p.id))
      perProduct.set(p.id, {
        handle: p.handle,
        netSales: 0,
        productId: p.id,
        title: p.title,
        units: 0,
      });
  }
  return {
    converted,
    currency: "USD",
    earnings,
    grossSales,
    netSales,
    payable,
    pending: earnings - payable,
    products: [...perProduct.values()].sort((a, b) => b.units - a.units),
    quarterNet,
    quarterUnits,
    rate,
    refundedUnits,
    refunds,
    tier,
    units,
    windowDays: CREATOR_TERMS.ordersWindowDays,
  };
}

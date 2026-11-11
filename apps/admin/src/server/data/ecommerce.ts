import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { ecommerce } from "../db/fixtures/ecommerce.ts";
import type { EcommerceData } from "./ecommerce.types.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ orderId: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoEcommerce(input: Input = {}): Promise<EcommerceData> {
  const { orderId } = inputSchema.parse(input);
  return structuredClone({
    ...ecommerce,
    orders: ecommerce.orders.filter((order) => orderId === undefined || order.id === orderId),
  });
}
export async function dbEcommerce(input: Input = {}): Promise<EcommerceData> {
  const { orderId } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const { metricPoints } = await import("../db/schema.ts");
  const {
    ecommerceReviews,
    ecommerceReports,
    ecommerceReviewAvatars,
    ecommerceKpis,
    ecommerceCategories,
    ecommerceTopProducts,
    ecommerceSources,
    ecommerceOrderCustomers,
    ecommerceOrders,
  } = await import("../db/ecommerce-schema.ts");
  const db = getDatabase();
  const points = await db
    .select()
    .from(metricPoints)
    .where(eq(metricPoints.domain, "ecommerce"))
    .orderBy(asc(metricPoints.position), asc(metricPoints.pointKey));
  function value(series: string, key: string) {
    const point = points.find((p) => p.series === series && p.pointKey === key);
    if (!point) throw new Error("Store metric is unavailable.");
    return Number(point.value);
  }
  function format(value: number, prefix: string, suffix: string, decimals: number) {
    return `${prefix}${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  }
  const [report] = await db.select().from(ecommerceReports).where(eq(ecommerceReports.id, "store"));
  if (!report) throw new Error("Store report is unavailable.");
  const [review] = await db.select().from(ecommerceReviews).where(eq(ecommerceReviews.id, report.reviewId));
  if (!review) throw new Error("Store review is unavailable.");
  const avatars = await db
    .select()
    .from(ecommerceReviewAvatars)
    .where(eq(ecommerceReviewAvatars.reportId, report.id))
    .orderBy(asc(ecommerceReviewAvatars.position), asc(ecommerceReviewAvatars.id));
  const kpis = await db.select().from(ecommerceKpis).orderBy(asc(ecommerceKpis.position), asc(ecommerceKpis.id));
  const categories = await db
    .select()
    .from(ecommerceCategories)
    .orderBy(asc(ecommerceCategories.position), asc(ecommerceCategories.name));
  const products = await db
    .select()
    .from(ecommerceTopProducts)
    .orderBy(asc(ecommerceTopProducts.position), asc(ecommerceTopProducts.name));
  const sources = await db
    .select()
    .from(ecommerceSources)
    .orderBy(asc(ecommerceSources.position), asc(ecommerceSources.name));
  const orders = await db
    .select()
    .from(ecommerceOrders)
    .innerJoin(ecommerceOrderCustomers, eq(ecommerceOrders.customerId, ecommerceOrderCustomers.id))
    .where(and(orderId === undefined ? undefined : eq(ecommerceOrders.id, orderId)))
    .orderBy(asc(ecommerceOrders.position), asc(ecommerceOrders.id));
  return {
    reportDate: report.reportDate,
    revenueCaption: report.revenueCaption,
    review,
    customerInitials: avatars.map((row) => row.initials),
    metrics: kpis.map((row) => ({
      label: row.label,
      help: row.help,
      positive: row.positive,
      value: format(value("kpi-value", row.id), row.valuePrefix, row.valueSuffix, row.valueDecimals),
      change: format(value("kpi-change", row.id), row.changePrefix, row.changeSuffix, row.changeDecimals),
    })),
    revenueOverviewData: points
      .filter((row) => row.series === "revenue")
      .map((row) => ({ period: row.pointKey, revenue: Number(row.value), profit: value("profit", row.pointKey) })),
    trafficData: points
      .filter((row) => row.series === "visitors")
      .map((row) => ({
        timestamp: row.pointKey,
        visitors: Number(row.value),
        anomalies: value("anomalies", row.pointKey),
      })),
    categories: categories.map((row) => ({ name: row.name, share: value("category-share", row.name) })),
    products: products.map((row) => ({
      name: row.name,
      category: row.category,
      share: `${Number(row.share)}%`,
      sales: format(Number(row.sales), "$", "", 0),
    })),
    trafficSources: sources.map((row) => ({
      name: row.name,
      icon: row.icon,
      visits: value("source-visits", row.name).toLocaleString("en-US"),
      share: value("source-share", row.name),
      change: `${value("source-change", row.name) < 0 ? "" : "+"}${value("source-change", row.name)}%`,
    })),
    summary: {
      storeVisits: value("summary", "storeVisits"),
      sourceVisits: value("summary", "sourceVisits"),
      topSalesShare: value("summary", "topSalesShare"),
      reviewAverage: value("summary", "reviewAverage"),
      reviewCount: value("summary", "reviewCount"),
      reviewExtra: value("summary", "reviewExtra"),
    },
    chartData: [
      {
        month: report.inventoryPeriod,
        "in-stock": value("inventory", "in-stock"),
        "low-stock": value("inventory", "low-stock"),
        "out-of-stock": value("inventory", "out-of-stock"),
      },
    ],
    orders: orders.map(
      ({
        ecommerce_orders: { position: _position, customerId: _customerId, ...order },
        ecommerce_order_customers: customer,
      }) => ({
        ...order,
        customer: customer.name,
        total: format(Number(order.total), "$", "", 2),
        items: `${order.items} ${order.items === 1 ? "item" : "items"}`,
      }),
    ),
  };
}
export async function readEcommerce(input: Input = {}) {
  return readSource(
    () => demoEcommerce(input),
    () => dbEcommerce(input),
  );
}

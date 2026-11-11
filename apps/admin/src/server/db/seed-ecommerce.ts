import type { getDatabase } from "./client.server.ts";
import {
  ecommerceCategories,
  ecommerceKpis,
  ecommerceOrderCustomers,
  ecommerceOrders,
  ecommerceReports,
  ecommerceReviewAvatars,
  ecommerceReviews,
  ecommerceSources,
  ecommerceTopProducts,
} from "./ecommerce-schema.ts";
import { ecommerce } from "./fixtures/ecommerce.ts";
import { metricPoints } from "./schema.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];
type Unit = typeof metricPoints.$inferInsert.unit;
function displayed(value: string) {
  const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  if (!match) throw new Error("Invalid metric display fixture.");
  const numeric = Number(match[2].replaceAll(",", "")) * (/[-−]/.test(match[1]) ? -1 : 1);
  return {
    value: String(numeric),
    prefix: match[1],
    suffix: match[3],
    decimals: match[2].split(".")[1]?.length ?? 0,
    unit: (value.includes("$") ? "currency" : "count") as Unit,
  };
}
export async function seedEcommerce(tx: Transaction) {
  async function point(series: string, pointKey: string, position: number, value: string | number, unit: Unit) {
    const row = {
      domain: "ecommerce",
      series,
      pointKey,
      position,
      value: String(value),
      unit,
      currency: unit === "currency" ? "USD" : null,
    };
    await tx
      .insert(metricPoints)
      .values(row)
      .onConflictDoUpdate({ target: [metricPoints.domain, metricPoints.series, metricPoints.pointKey], set: row });
  }
  await tx
    .insert(ecommerceReviews)
    .values(ecommerce.review)
    .onConflictDoUpdate({ target: ecommerceReviews.id, set: ecommerce.review });
  const report = {
    id: "store",
    reportDate: ecommerce.reportDate,
    revenueCaption: ecommerce.revenueCaption,
    inventoryPeriod: ecommerce.chartData[0].month,
    reviewId: ecommerce.review.id,
  };
  await tx.insert(ecommerceReports).values(report).onConflictDoUpdate({ target: ecommerceReports.id, set: report });
  for (const [position, initials] of ecommerce.customerInitials.entries()) {
    const row = { id: `store-avatar-${position}`, reportId: report.id, position, initials };
    await tx
      .insert(ecommerceReviewAvatars)
      .values(row)
      .onConflictDoUpdate({ target: ecommerceReviewAvatars.id, set: row });
  }
  for (const [position, metric] of ecommerce.metrics.entries()) {
    const id = `kpi-${position}`;
    const value = displayed(metric.value);
    const change = displayed(metric.change);
    const row = {
      id,
      position,
      label: metric.label,
      help: metric.help,
      positive: metric.positive,
      valuePrefix: value.prefix,
      valueSuffix: value.suffix,
      valueDecimals: value.decimals,
      changePrefix: change.prefix,
      changeSuffix: change.suffix,
      changeDecimals: change.decimals,
    };
    await tx.insert(ecommerceKpis).values(row).onConflictDoUpdate({ target: ecommerceKpis.id, set: row });
    await point("kpi-value", id, position, value.value, metric.value.includes("%") ? "percent" : value.unit);
    await point("kpi-change", id, position, change.value, metric.change.includes("$") ? "currency" : "percent");
  }
  for (const [position, row] of ecommerce.revenueOverviewData.entries()) {
    await point("revenue", row.period, position, row.revenue, "currency");
    await point("profit", row.period, position, row.profit, "currency");
  }
  for (const [position, row] of ecommerce.trafficData.entries()) {
    await point("visitors", row.timestamp, position, row.visitors, "count");
    await point("anomalies", row.timestamp, position, row.anomalies, "count");
  }
  for (const [position, [name, value]] of Object.entries(ecommerce.summary).entries()) {
    let unit: Unit = "count";
    if (name === "topSalesShare") unit = "percent";
    if (name === "reviewAverage") unit = "ratio";
    await point("summary", name, position, value, unit);
  }
  for (const [position, status] of (["in-stock", "low-stock", "out-of-stock"] as const).entries())
    await point("inventory", status, position, ecommerce.chartData[0][status], "count");
  for (const [position, category] of ecommerce.categories.entries()) {
    const row = { name: category.name, position };
    await tx.insert(ecommerceCategories).values(row).onConflictDoUpdate({ target: ecommerceCategories.name, set: row });
    await point("category-share", category.name, position, category.share, "percent");
  }
  for (const [position, product] of ecommerce.products.entries()) {
    const row = { ...product, position, share: displayed(product.share).value, sales: displayed(product.sales).value };
    await tx
      .insert(ecommerceTopProducts)
      .values(row)
      .onConflictDoUpdate({ target: ecommerceTopProducts.name, set: row });
  }
  for (const [position, source] of ecommerce.trafficSources.entries()) {
    const row = { name: source.name, position, icon: source.icon };
    await tx.insert(ecommerceSources).values(row).onConflictDoUpdate({ target: ecommerceSources.name, set: row });
    await point("source-visits", source.name, position, displayed(source.visits).value, "count");
    await point("source-share", source.name, position, source.share, "percent");
    await point("source-change", source.name, position, displayed(source.change).value, "percent");
  }
  for (const [position, order] of ecommerce.orders.entries()) {
    const customer = { id: `order-customer-${order.id}`, name: order.customer };
    await tx
      .insert(ecommerceOrderCustomers)
      .values(customer)
      .onConflictDoUpdate({ target: ecommerceOrderCustomers.id, set: customer });
    const { customer: _customer, ...record } = order;
    const row = {
      ...record,
      position,
      customerId: customer.id,
      total: displayed(order.total).value,
      items: Number.parseInt(order.items, 10),
    };
    await tx.insert(ecommerceOrders).values(row).onConflictDoUpdate({ target: ecommerceOrders.id, set: row });
  }
}

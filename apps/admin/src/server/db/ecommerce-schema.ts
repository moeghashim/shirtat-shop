import { boolean, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";

export const ecommerceReviews = pgTable("ecommerce_reviews", {
  id: text().primaryKey(),
  author: text().notNull(),
  rating: integer().notNull(),
  body: text().notNull(),
});
export const ecommerceReports = pgTable("ecommerce_reports", {
  id: text().primaryKey(),
  reportDate: text().notNull(),
  revenueCaption: text().notNull(),
  inventoryPeriod: text().notNull(),
  reviewId: text()
    .notNull()
    .references(() => ecommerceReviews.id),
});
export const ecommerceReviewAvatars = pgTable("ecommerce_review_avatars", {
  id: text().primaryKey(),
  reportId: text()
    .notNull()
    .references(() => ecommerceReports.id),
  position: integer().notNull(),
  initials: text().notNull(),
});
export const ecommerceKpis = pgTable("ecommerce_kpis", {
  id: text().primaryKey(),
  position: integer().notNull(),
  label: text().notNull(),
  help: text().notNull(),
  positive: boolean().notNull(),
  valuePrefix: text().notNull(),
  valueSuffix: text().notNull(),
  valueDecimals: integer().notNull(),
  changePrefix: text().notNull(),
  changeSuffix: text().notNull(),
  changeDecimals: integer().notNull(),
});
export const ecommerceCategories = pgTable("ecommerce_categories", {
  name: text().primaryKey(),
  position: integer().notNull(),
});
export const ecommerceTopProducts = pgTable("ecommerce_top_products", {
  name: text().primaryKey(),
  position: integer().notNull(),
  category: text()
    .notNull()
    .references(() => ecommerceCategories.name),
  share: numeric({ precision: 7, scale: 4 }).notNull(),
  sales: numeric({ precision: 16, scale: 2 }).notNull(),
});
export const ecommerceSources = pgTable("ecommerce_sources", {
  name: text().primaryKey(),
  position: integer().notNull(),
  icon: text({ enum: ["siMeta", "siGoogle", "siShopify", "siTiktok", "siEbay"] }).notNull(),
});
// An order names a customer but provides no shared customer ID. Do not infer identity across fixture sets.
export const ecommerceOrderCustomers = pgTable("ecommerce_order_customers", {
  id: text().primaryKey(),
  name: text().notNull(),
});
export const ecommerceOrders = pgTable("ecommerce_orders", {
  id: text().primaryKey(),
  position: integer().notNull(),
  customerId: text()
    .notNull()
    .references(() => ecommerceOrderCustomers.id),
  date: text().notNull(), // The existing fixture's civil wall time, not an inferred timezone instant.
  payment: text({ enum: ["Paid", "Pending", "Refunded"] }).notNull(),
  total: numeric({ precision: 16, scale: 2 }).notNull(),
  items: integer().notNull(),
  fulfillment: text({ enum: ["Fulfilled", "Returned", "Unfulfilled"] }).notNull(),
});

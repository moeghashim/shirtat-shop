import { integer, numeric, pgTable, primaryKey, text, unique } from "drizzle-orm/pg-core";

export const productCategories = pgTable("product_categories", {
  name: text().primaryKey(),
  position: integer().notNull(),
});
export const productStatuses = pgTable("product_statuses", {
  name: text().primaryKey(),
  position: integer().notNull(),
});
export const catalogProducts = pgTable("catalog_products", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  sku: text().notNull().unique(),
  category: text()
    .notNull()
    .references(() => productCategories.name),
  status: text()
    .notNull()
    .references(() => productStatuses.name),
  price: numeric({ precision: 14, scale: 2 }).notNull(),
  stock: integer().notNull(),
  sold: integer().notNull(),
});
export const invoiceParties = pgTable("invoice_parties", {
  id: text().primaryKey(),
  position: integer().notNull(),
  kind: text({ enum: ["issuer", "client"] }).notNull(),
  name: text().notNull(),
  email: text().notNull(),
  taxId: text().notNull(),
  phone: text().notNull().default(""),
  website: text().notNull().default(""),
  paymentAccountName: text().notNull().default(""),
  routingNumber: text().notNull().default(""),
  issuerName: text().notNull().default(""),
});
export const invoiceAddresses = pgTable(
  "invoice_addresses",
  {
    partyId: text()
      .notNull()
      .references(() => invoiceParties.id),
    position: integer().notNull(),
    line: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.partyId, t.position] })],
);
export const invoiceTaxes = pgTable("invoice_taxes", {
  id: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  rate: numeric({ precision: 7, scale: 4 }).notNull(),
});
export const invoiceDrafts = pgTable("invoice_drafts", {
  id: text().primaryKey(),
  referenceNumber: text().notNull(),
  issuerId: text()
    .notNull()
    .references(() => invoiceParties.id),
  clientId: text()
    .notNull()
    .references(() => invoiceParties.id),
  taxId: text()
    .notNull()
    .references(() => invoiceTaxes.id),
  discountType: text({ enum: ["fixed", "percent"] }).notNull(),
  discountValue: numeric({ precision: 14, scale: 2 }).notNull(),
  issuedOffsetDays: integer().notNull(),
  dueOffsetDays: integer().notNull(),
});
export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    draftId: text()
      .notNull()
      .references(() => invoiceDrafts.id),
    id: text().notNull(),
    position: integer().notNull(),
    description: text().notNull(),
    quantity: numeric({ precision: 14, scale: 4 }).notNull(),
    unitPrice: numeric({ precision: 14, scale: 2 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.draftId, t.id] }), unique().on(t.draftId, t.position)],
);

CREATE TABLE "catalog_products" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"category" text NOT NULL,
	"status" text NOT NULL,
	"price" numeric(14, 2) NOT NULL,
	"stock" integer NOT NULL,
	"sold" integer NOT NULL,
	CONSTRAINT "catalog_products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "invoice_addresses" (
	"partyId" text NOT NULL,
	"position" integer NOT NULL,
	"line" text NOT NULL,
	CONSTRAINT "invoice_addresses_partyId_position_pk" PRIMARY KEY("partyId","position")
);
--> statement-breakpoint
CREATE TABLE "invoice_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"referenceNumber" text NOT NULL,
	"issuerId" text NOT NULL,
	"clientId" text NOT NULL,
	"taxId" text NOT NULL,
	"discountType" text NOT NULL,
	"discountValue" numeric(14, 2) NOT NULL,
	"issuedOffsetDays" integer NOT NULL,
	"dueOffsetDays" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"draftId" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(14, 4) NOT NULL,
	"unitPrice" numeric(14, 2) NOT NULL,
	CONSTRAINT "invoice_line_items_draftId_id_pk" PRIMARY KEY("draftId","id"),
	CONSTRAINT "invoice_line_items_draftId_position_unique" UNIQUE("draftId","position")
);
--> statement-breakpoint
CREATE TABLE "invoice_parties" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"taxId" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"paymentAccountName" text DEFAULT '' NOT NULL,
	"routingNumber" text DEFAULT '' NOT NULL,
	"issuerName" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_taxes" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"rate" numeric(7, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"name" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_statuses" (
	"name" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_categories" (
	"name" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_kpis" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"help" text NOT NULL,
	"positive" boolean NOT NULL,
	"valuePrefix" text NOT NULL,
	"valueSuffix" text NOT NULL,
	"valueDecimals" integer NOT NULL,
	"changePrefix" text NOT NULL,
	"changeSuffix" text NOT NULL,
	"changeDecimals" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_order_customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"customerId" text NOT NULL,
	"date" text NOT NULL,
	"payment" text NOT NULL,
	"total" numeric(16, 2) NOT NULL,
	"items" integer NOT NULL,
	"fulfillment" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"reportDate" text NOT NULL,
	"revenueCaption" text NOT NULL,
	"inventoryPeriod" text NOT NULL,
	"reviewId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_review_avatars" (
	"id" text PRIMARY KEY NOT NULL,
	"reportId" text NOT NULL,
	"position" integer NOT NULL,
	"initials" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"author" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_sources" (
	"name" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecommerce_top_products" (
	"name" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"category" text NOT NULL,
	"share" numeric(7, 4) NOT NULL,
	"sales" numeric(16, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_category_product_categories_name_fk" FOREIGN KEY ("category") REFERENCES "public"."product_categories"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_status_product_statuses_name_fk" FOREIGN KEY ("status") REFERENCES "public"."product_statuses"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_addresses" ADD CONSTRAINT "invoice_addresses_partyId_invoice_parties_id_fk" FOREIGN KEY ("partyId") REFERENCES "public"."invoice_parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_drafts" ADD CONSTRAINT "invoice_drafts_issuerId_invoice_parties_id_fk" FOREIGN KEY ("issuerId") REFERENCES "public"."invoice_parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_drafts" ADD CONSTRAINT "invoice_drafts_clientId_invoice_parties_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."invoice_parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_drafts" ADD CONSTRAINT "invoice_drafts_taxId_invoice_taxes_id_fk" FOREIGN KEY ("taxId") REFERENCES "public"."invoice_taxes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_draftId_invoice_drafts_id_fk" FOREIGN KEY ("draftId") REFERENCES "public"."invoice_drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_orders" ADD CONSTRAINT "ecommerce_orders_customerId_ecommerce_order_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."ecommerce_order_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_reports" ADD CONSTRAINT "ecommerce_reports_reviewId_ecommerce_reviews_id_fk" FOREIGN KEY ("reviewId") REFERENCES "public"."ecommerce_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_review_avatars" ADD CONSTRAINT "ecommerce_review_avatars_reportId_ecommerce_reports_id_fk" FOREIGN KEY ("reportId") REFERENCES "public"."ecommerce_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecommerce_top_products" ADD CONSTRAINT "ecommerce_top_products_category_ecommerce_categories_name_fk" FOREIGN KEY ("category") REFERENCES "public"."ecommerce_categories"("name") ON DELETE no action ON UPDATE no action;
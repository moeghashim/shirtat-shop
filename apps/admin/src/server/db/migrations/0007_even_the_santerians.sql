CREATE TABLE "analytics_current_summary" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"value1" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_current_pages" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"bounce" numeric(24, 6) NOT NULL,
	"bounceTemplate" text NOT NULL,
	"bouncePrefix" text NOT NULL,
	"bounceDecimals" integer NOT NULL,
	"bounceGrouped" boolean NOT NULL,
	"bounceScale" integer NOT NULL,
	"bounceLeadingDecimal" boolean NOT NULL,
	"bounceUnit" text NOT NULL,
	"path" text NOT NULL,
	"time" text NOT NULL,
	"views" numeric(24, 6) NOT NULL,
	"viewsTemplate" text NOT NULL,
	"viewsPrefix" text NOT NULL,
	"viewsDecimals" integer NOT NULL,
	"viewsGrouped" boolean NOT NULL,
	"viewsScale" integer NOT NULL,
	"viewsLeadingDecimal" boolean NOT NULL,
	"viewsUnit" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_current_campaigns_data" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"label" numeric(24, 6) NOT NULL,
	"labelTemplate" text NOT NULL,
	"labelPrefix" text NOT NULL,
	"labelDecimals" integer NOT NULL,
	"labelGrouped" boolean NOT NULL,
	"labelScale" integer NOT NULL,
	"labelLeadingDecimal" boolean NOT NULL,
	"labelUnit" text NOT NULL,
	"source" text NOT NULL,
	"visitors" numeric(24, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_current_referrers_data" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"label" numeric(24, 6) NOT NULL,
	"labelTemplate" text NOT NULL,
	"labelPrefix" text NOT NULL,
	"labelDecimals" integer NOT NULL,
	"labelGrouped" boolean NOT NULL,
	"labelScale" integer NOT NULL,
	"labelLeadingDecimal" boolean NOT NULL,
	"labelUnit" text NOT NULL,
	"source" text NOT NULL,
	"visitors" numeric(24, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_current_sources_data" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"label" numeric(24, 6) NOT NULL,
	"labelTemplate" text NOT NULL,
	"labelPrefix" text NOT NULL,
	"labelDecimals" integer NOT NULL,
	"labelGrouped" boolean NOT NULL,
	"labelScale" integer NOT NULL,
	"labelLeadingDecimal" boolean NOT NULL,
	"labelUnit" text NOT NULL,
	"source" text NOT NULL,
	"visitors" numeric(24, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_v1_next_interventions" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"dealId" text NOT NULL,
	"priority" text NOT NULL,
	"owner" text NOT NULL,
	"risk" numeric(24, 6) NOT NULL,
	"recommendation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_v1_ledger_rows" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" numeric(24, 6) NOT NULL,
	"account" text NOT NULL,
	"dealId" text NOT NULL,
	"stage" text NOT NULL,
	"blocker" text NOT NULL,
	"owner" text NOT NULL,
	"idleDays" numeric(24, 6) NOT NULL,
	"closeVariance" text NOT NULL,
	"priority" text,
	"nextAction" text NOT NULL,
	"riskScore" numeric(24, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_v1_date_range" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" text NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_current_opportunities" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" text NOT NULL,
	"account" text NOT NULL,
	"stage" text NOT NULL,
	"priority" numeric(24, 6) NOT NULL,
	"health" text NOT NULL,
	"value" numeric(24, 6) NOT NULL,
	"valueTemplate" text NOT NULL,
	"valuePrefix" text NOT NULL,
	"valueDecimals" integer NOT NULL,
	"valueGrouped" boolean NOT NULL,
	"valueScale" integer NOT NULL,
	"valueLeadingDecimal" boolean NOT NULL,
	"valueUnit" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_current_summary" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"value1" text NOT NULL,
	"value2" text NOT NULL,
	"value3" text NOT NULL,
	"value4" text NOT NULL,
	"value5" text NOT NULL,
	"value6" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_v1_action_items" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" numeric(24, 6) NOT NULL,
	"title" text NOT NULL,
	"desc" text NOT NULL,
	"due" text NOT NULL,
	"priority" text NOT NULL,
	"checked" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_v1_project_revenue_chart_data" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"actual" numeric(24, 6) NOT NULL,
	"target" numeric(24, 6) NOT NULL,
	"remaining" numeric(24, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_v1_recent_leads_data" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"company" text NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"lastActivity" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_v1_region_sales_data" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"region" text NOT NULL,
	"sales" numeric(24, 6) NOT NULL,
	"percentage" numeric(24, 6) NOT NULL,
	"growth" numeric(24, 6) NOT NULL,
	"growthTemplate" text NOT NULL,
	"growthPrefix" text NOT NULL,
	"growthDecimals" integer NOT NULL,
	"growthGrouped" boolean NOT NULL,
	"growthScale" integer NOT NULL,
	"growthLeadingDecimal" boolean NOT NULL,
	"growthUnit" text NOT NULL,
	"isPositive" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "default_current_customers" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"billing" text NOT NULL,
	"joined" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "default_v1_reference" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" text NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "default_v1_proposals" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" numeric(24, 6) NOT NULL,
	"header" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"target" text NOT NULL,
	"limit" text NOT NULL,
	"reviewer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_current_balance_data" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"account" text NOT NULL,
	"amount" numeric(24, 6) NOT NULL,
	"key" text NOT NULL,
	"percentage" numeric(24, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_current_contacts" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" numeric(24, 6) NOT NULL,
	"initials" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_current_reference" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" text NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_current_transactions" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" numeric(24, 6) NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_current_crypto_assets" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" numeric(24, 6) NOT NULL,
	"name" text NOT NULL,
	"vault" text NOT NULL,
	"balance" numeric(24, 6) NOT NULL,
	"balanceTemplate" text NOT NULL,
	"balancePrefix" text NOT NULL,
	"balanceDecimals" integer NOT NULL,
	"balanceGrouped" boolean NOT NULL,
	"balanceScale" integer NOT NULL,
	"balanceLeadingDecimal" boolean NOT NULL,
	"balanceUnit" text NOT NULL,
	"usdValue" numeric(24, 6) NOT NULL,
	"usdValueTemplate" text NOT NULL,
	"usdValuePrefix" text NOT NULL,
	"usdValueDecimals" integer NOT NULL,
	"usdValueGrouped" boolean NOT NULL,
	"usdValueScale" integer NOT NULL,
	"usdValueLeadingDecimal" boolean NOT NULL,
	"usdValueUnit" text NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_current_wallet_cards" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" numeric(24, 6) NOT NULL,
	"bank" text NOT NULL,
	"last4" text NOT NULL,
	"balance" numeric(24, 6) NOT NULL,
	"balanceTemplate" text NOT NULL,
	"balancePrefix" text NOT NULL,
	"balanceDecimals" integer NOT NULL,
	"balanceGrouped" boolean NOT NULL,
	"balanceScale" integer NOT NULL,
	"balanceLeadingDecimal" boolean NOT NULL,
	"balanceUnit" text NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_v1_summary" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"value1" text NOT NULL,
	"value2" text NOT NULL,
	"value3" text NOT NULL,
	"value4" text NOT NULL,
	"value5" numeric(24, 6) NOT NULL,
	"value5Template" text NOT NULL,
	"value5Prefix" text NOT NULL,
	"value5Decimals" integer NOT NULL,
	"value5Grouped" boolean NOT NULL,
	"value5Scale" integer NOT NULL,
	"value5LeadingDecimal" boolean NOT NULL,
	"value5Unit" text NOT NULL,
	"value6" numeric(24, 6) NOT NULL,
	"value6Template" text NOT NULL,
	"value6Prefix" text NOT NULL,
	"value6Decimals" integer NOT NULL,
	"value6Grouped" boolean NOT NULL,
	"value6Scale" integer NOT NULL,
	"value6LeadingDecimal" boolean NOT NULL,
	"value6Unit" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_v1_upcoming_payments" (
	"recordKey" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"id" numeric(24, 6) NOT NULL,
	"icon" text NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(24, 6) NOT NULL,
	"date" text NOT NULL
);

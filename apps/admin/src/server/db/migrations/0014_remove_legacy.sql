DROP TABLE "analytics_coverage_assignments";--> statement-breakpoint
DROP TABLE "analytics_v1_next_interventions";--> statement-breakpoint
DROP TABLE "analytics_v1_ledger_rows";--> statement-breakpoint
DROP TABLE "analytics_v1_date_range";--> statement-breakpoint
DROP TABLE "crm_v1_action_items";--> statement-breakpoint
DROP TABLE "crm_v1_project_revenue_chart_data";--> statement-breakpoint
DROP TABLE "crm_v1_recent_leads_data";--> statement-breakpoint
DROP TABLE "crm_v1_region_sales_data";--> statement-breakpoint
DROP TABLE "default_proposal_reviewers";--> statement-breakpoint
DROP TABLE "default_v1_reference";--> statement-breakpoint
DROP TABLE "default_v1_proposals";--> statement-breakpoint
DROP TABLE "finance_v1_summary";--> statement-breakpoint
DROP TABLE "finance_v1_upcoming_payments";
--> statement-breakpoint
DELETE FROM "metric_dimensions" WHERE "domain" IN ('core-default', 'core-crm', 'core-finance', 'core-analytics') AND "series" LIKE 'v1.%';
--> statement-breakpoint
DELETE FROM "metric_points" WHERE "domain" IN ('core-default', 'core-crm', 'core-finance', 'core-analytics') AND "series" LIKE 'v1.%';

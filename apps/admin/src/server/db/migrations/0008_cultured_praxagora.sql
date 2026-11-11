CREATE TABLE "default_proposal_reviewers" (
	"value" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_v1_summary" ADD COLUMN "cardType" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "finance_v1_summary" ADD COLUMN "brandIcon" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "finance_v1_summary" ADD COLUMN "networkIcon" text DEFAULT '' NOT NULL;
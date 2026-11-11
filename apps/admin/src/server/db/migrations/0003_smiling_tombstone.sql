ALTER TABLE "profiles" ADD COLUMN "completionPercent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "recordStatus" text DEFAULT 'Unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "recordDescription" text DEFAULT '' NOT NULL;
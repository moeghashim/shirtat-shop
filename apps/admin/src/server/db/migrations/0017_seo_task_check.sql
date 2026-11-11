CREATE TABLE "seo_task_check" (
	"task_id" text PRIMARY KEY NOT NULL,
	"done" boolean NOT NULL,
	"done_at" timestamp with time zone,
	"done_by" text,
	CONSTRAINT "seo_task_check_done_stamp" CHECK ("seo_task_check"."done" = false OR "seo_task_check"."done_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "seo_task_check" ADD CONSTRAINT "seo_task_check_done_by_auth_user_id_fk" FOREIGN KEY ("done_by") REFERENCES "public"."auth_user"("id") ON DELETE set null ON UPDATE no action;

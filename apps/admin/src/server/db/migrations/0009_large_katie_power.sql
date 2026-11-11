CREATE TABLE "analytics_coverage_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"owner" text NOT NULL,
	"focus" text NOT NULL,
	"due" text NOT NULL
);

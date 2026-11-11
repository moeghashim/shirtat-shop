CREATE TABLE "directory_users" (
	"email" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"team" text NOT NULL,
	"joinedDate" text NOT NULL,
	"lastActive" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "display_roles" (
	"role" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"group" text NOT NULL,
	"accessLevel" text NOT NULL,
	"users" integer NOT NULL,
	"lastReview" text NOT NULL,
	"owner" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metric_dimensions" (
	"domain" text NOT NULL,
	"series" text NOT NULL,
	"pointKey" text NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "metric_dimensions_domain_series_pointKey_name_pk" PRIMARY KEY("domain","series","pointKey","name")
);
--> statement-breakpoint
CREATE TABLE "metric_points" (
	"domain" text NOT NULL,
	"series" text NOT NULL,
	"pointKey" text NOT NULL,
	"position" integer NOT NULL,
	"value" numeric NOT NULL,
	"unit" text NOT NULL,
	"currency" text,
	CONSTRAINT "metric_points_domain_series_pointKey_pk" PRIMARY KEY("domain","series","pointKey"),
	CONSTRAINT "metric_points_domain_series_position_unique" UNIQUE("domain","series","position"),
	CONSTRAINT "metric_currency_unit" CHECK (("metric_points"."unit" = 'currency') = ("metric_points"."currency" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role" text NOT NULL,
	"permission" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "role_permissions_role_permission_pk" PRIMARY KEY("role","permission"),
	CONSTRAINT "role_permissions_role_position_unique" UNIQUE("role","position")
);
--> statement-breakpoint
CREATE TABLE "workspace_memberships" (
	"userEmail" text NOT NULL,
	"workspaceName" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "workspace_memberships_userEmail_workspaceName_pk" PRIMARY KEY("userEmail","workspaceName"),
	CONSTRAINT "workspace_memberships_userEmail_position_unique" UNIQUE("userEmail","position")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"name" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_display_roles_role_fk" FOREIGN KEY ("role") REFERENCES "public"."display_roles"("role") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_userEmail_directory_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."directory_users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspaceName_workspaces_name_fk" FOREIGN KEY ("workspaceName") REFERENCES "public"."workspaces"("name") ON DELETE no action ON UPDATE no action;
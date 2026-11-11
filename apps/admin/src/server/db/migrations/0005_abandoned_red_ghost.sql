CREATE TABLE "board_columns" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_insights" (
	"taskId" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "board_insights_taskId_position_pk" PRIMARY KEY("taskId","position")
);
--> statement-breakpoint
CREATE TABLE "board_owners" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"columnId" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text NOT NULL,
	"dueDate" text NOT NULL,
	"progress" integer NOT NULL,
	"ownerId" text NOT NULL,
	"team" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_teams" (
	"name" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_definitions" (
	"value" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"startDay" integer NOT NULL,
	"startHour" integer,
	"startMinute" integer,
	"endDay" integer,
	"endHour" integer,
	"endMinute" integer,
	"fixedMonth" integer,
	"allDay" boolean,
	"groupId" text,
	"display" text
);
--> statement-breakpoint
CREATE TABLE "file_owners" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_shares" (
	"fileId" text PRIMARY KEY NOT NULL,
	"shared" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"label" text NOT NULL,
	"priority" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_files" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"size" text NOT NULL,
	"ownerId" text NOT NULL,
	"modifiedAt" text NOT NULL,
	"starred" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"fileCount" integer NOT NULL,
	"size" text NOT NULL,
	"updatedAt" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_insights" ADD CONSTRAINT "board_insights_taskId_board_tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."board_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_tasks" ADD CONSTRAINT "board_tasks_columnId_board_columns_id_fk" FOREIGN KEY ("columnId") REFERENCES "public"."board_columns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_tasks" ADD CONSTRAINT "board_tasks_ownerId_board_owners_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."board_owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_tasks" ADD CONSTRAINT "board_tasks_team_board_teams_name_fk" FOREIGN KEY ("team") REFERENCES "public"."board_teams"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_fileId_workspace_files_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."workspace_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_files" ADD CONSTRAINT "workspace_files_ownerId_file_owners_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."file_owners"("id") ON DELETE no action ON UPDATE no action;
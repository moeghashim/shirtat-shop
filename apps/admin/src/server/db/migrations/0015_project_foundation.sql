CREATE TABLE "project_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"actorId" text,
	"taskId" text,
	"fileId" text,
	"kind" text NOT NULL,
	"occurredAt" text NOT NULL,
	"detail" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "activity_kind" CHECK ("project_activity"."kind" in ('milestone','task','file','note')),
	CONSTRAINT "activity_time" CHECK ("project_activity"."occurredAt" ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')
);
--> statement-breakpoint
CREATE TABLE "project_events" (
	"projectId" text NOT NULL,
	"templateId" text NOT NULL,
	"taskId" text,
	"position" integer NOT NULL,
	CONSTRAINT "project_events_projectId_templateId_pk" PRIMARY KEY("projectId","templateId")
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"projectId" text NOT NULL,
	"fileId" text NOT NULL,
	"folderId" text,
	"position" integer NOT NULL,
	CONSTRAINT "project_files_projectId_fileId_pk" PRIMARY KEY("projectId","fileId")
);
--> statement-breakpoint
CREATE TABLE "project_folders" (
	"projectId" text NOT NULL,
	"folderId" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "project_folders_projectId_folderId_pk" PRIMARY KEY("projectId","folderId")
);
--> statement-breakpoint
CREATE TABLE "project_labels" (
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "project_labels_projectId_name_pk" PRIMARY KEY("projectId","name")
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"projectId" text NOT NULL,
	"personId" text NOT NULL,
	"role" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "project_members_projectId_personId_pk" PRIMARY KEY("projectId","personId")
);
--> statement-breakpoint
CREATE TABLE "project_people" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_subtasks" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"taskId" text NOT NULL,
	"title" text NOT NULL,
	"done" boolean NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_task_labels" (
	"projectId" text NOT NULL,
	"taskId" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "project_task_labels_projectId_taskId_label_pk" PRIMARY KEY("projectId","taskId","label")
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"sourceKind" text NOT NULL,
	"sourceId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"assigneeId" text,
	"dueDate" date,
	"startDate" date,
	"endDate" date,
	"position" integer NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL,
	"attachmentCount" integer DEFAULT 0 NOT NULL,
	"documentCount" integer DEFAULT 0 NOT NULL,
	"legacyProgress" integer,
	CONSTRAINT "project_tasks_sourceKind_sourceId_unique" UNIQUE("sourceKind","sourceId"),
	CONSTRAINT "project_tasks_projectId_id_unique" UNIQUE("projectId","id"),
	CONSTRAINT "task_source" CHECK ("project_tasks"."sourceKind" in ('board','ledger','sample')),
	CONSTRAINT "task_status" CHECK ("project_tasks"."status" in ('backlog','todo','in-progress','review','done','canceled')),
	CONSTRAINT "task_priority" CHECK ("project_tasks"."priority" in ('low','medium','high')),
	CONSTRAINT "task_counts" CHECK ("project_tasks"."commentCount" >= 0 and "project_tasks"."attachmentCount" >= 0 and "project_tasks"."documentCount" >= 0),
	CONSTRAINT "task_dates" CHECK ("project_tasks"."endDate" is null or ("project_tasks"."startDate" is not null and "project_tasks"."endDate" >= "project_tasks"."startDate")),
	CONSTRAINT "task_progress" CHECK ("project_tasks"."legacyProgress" is null or "project_tasks"."legacyProgress" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"startDate" date,
	"dueDate" date,
	"favorite" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "project_status" CHECK ("projects"."status" in ('planning','active','at-risk','complete')),
	CONSTRAINT "project_dates" CHECK ("projects"."dueDate" is null or "projects"."startDate" is null or "projects"."dueDate" >= "projects"."startDate")
);
--> statement-breakpoint
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_projectId_actorId_project_members_projectId_personId_fk" FOREIGN KEY ("projectId","actorId") REFERENCES "public"."project_members"("projectId","personId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_projectId_taskId_project_tasks_projectId_id_fk" FOREIGN KEY ("projectId","taskId") REFERENCES "public"."project_tasks"("projectId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_projectId_fileId_project_files_projectId_fileId_fk" FOREIGN KEY ("projectId","fileId") REFERENCES "public"."project_files"("projectId","fileId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_templateId_calendar_templates_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."calendar_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_projectId_taskId_project_tasks_projectId_id_fk" FOREIGN KEY ("projectId","taskId") REFERENCES "public"."project_tasks"("projectId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_fileId_workspace_files_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."workspace_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_projectId_folderId_project_folders_projectId_folderId_fk" FOREIGN KEY ("projectId","folderId") REFERENCES "public"."project_folders"("projectId","folderId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_folders" ADD CONSTRAINT "project_folders_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_folders" ADD CONSTRAINT "project_folders_folderId_workspace_folders_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."workspace_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_labels" ADD CONSTRAINT "project_labels_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_personId_project_people_id_fk" FOREIGN KEY ("personId") REFERENCES "public"."project_people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_subtasks" ADD CONSTRAINT "project_subtasks_projectId_taskId_project_tasks_projectId_id_fk" FOREIGN KEY ("projectId","taskId") REFERENCES "public"."project_tasks"("projectId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task_labels" ADD CONSTRAINT "project_task_labels_projectId_taskId_project_tasks_projectId_id_fk" FOREIGN KEY ("projectId","taskId") REFERENCES "public"."project_tasks"("projectId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task_labels" ADD CONSTRAINT "project_task_labels_projectId_label_project_labels_projectId_name_fk" FOREIGN KEY ("projectId","label") REFERENCES "public"."project_labels"("projectId","name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_projectId_assigneeId_project_members_projectId_personId_fk" FOREIGN KEY ("projectId","assigneeId") REFERENCES "public"."project_members"("projectId","personId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_activity_order" ON "project_activity" USING btree ("projectId","occurredAt","id");--> statement-breakpoint
CREATE INDEX "project_subtask_order" ON "project_subtasks" USING btree ("projectId","taskId","position");--> statement-breakpoint
CREATE INDEX "project_task_order" ON "project_tasks" USING btree ("projectId","position","id");--> statement-breakpoint
CREATE INDEX "project_task_filter" ON "project_tasks" USING btree ("projectId","status","assigneeId","dueDate");--> statement-breakpoint
CREATE INDEX "project_order" ON "projects" USING btree ("position","id");
--> statement-breakpoint
INSERT INTO projects (id,name,description,status,"startDate","dueDate",favorite,position) VALUES ('sample-operations','Operations rollout','Shared sample workspace','active','2026-06-01','2026-07-06',true,0);
--> statement-breakpoint
INSERT INTO project_people (id,name,initials) SELECT 'board:'||id,name,upper(left(name,1)||left(split_part(name,' ',2),1)) FROM board_owners;
--> statement-breakpoint
INSERT INTO project_people (id,name,initials) SELECT CASE WHEN name='Jordan Lee' THEN 'board:jordan' WHEN name='Alex Morgan' THEN 'file:alex-morgan' WHEN name='Sam Rivera' THEN 'file:sam-rivera' ELSE 'file:'||id END,name,initials FROM file_owners ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO project_members ("projectId","personId",role,position) SELECT 'sample-operations',id,'Contributor',row_number() OVER (ORDER BY id)-1 FROM project_people;
--> statement-breakpoint
INSERT INTO project_tasks (id,"projectId","sourceKind","sourceId",title,description,status,priority,"assigneeId","dueDate",position,"commentCount","attachmentCount","documentCount","legacyProgress")
SELECT 'board:'||t.id,'sample-operations','board',t.id,t.title,t.description,
CASE t."columnId" WHEN 'ideas' THEN 'backlog' WHEN 'planned' THEN 'todo' WHEN 'building' THEN 'in-progress' WHEN 'qa' THEN 'review' WHEN 'shipped' THEN 'done' ELSE 'backlog' END,
CASE lower(t.priority) WHEN 'low' THEN 'low' WHEN 'high' THEN 'high' ELSE 'medium' END,'board:'||t."ownerId",
(CASE WHEN t.id='tender-workflow-map' THEN '2026-06-14' WHEN t.id='license-strategy-research' THEN '2026-06-16' WHEN t.id='backup-restore-plan' THEN '2026-06-18' WHEN t.id='work-order-allocation-model' THEN '2026-06-19' WHEN t.id='future-sync-notes' THEN '2026-06-21' WHEN t.id='electron-app-shell' THEN '2026-06-20' WHEN t.id='secure-preload-api' THEN '2026-06-22' WHEN t.id='party-employee-records' THEN '2026-06-24' WHEN t.id='generated-documents-index' THEN '2026-06-25' WHEN t.id='sqlite-drizzle-schema' THEN '2026-06-26' WHEN t.id='salary-excel-import' THEN '2026-06-28' WHEN t.id='column-mapping-builder' THEN '2026-07-01' WHEN t.id='salary-row-validation' THEN '2026-07-04' WHEN t.id='payslip-preview' THEN '2026-07-06' WHEN t.id='architecture-rule' THEN '2026-06-08' WHEN t.id='private-mvp-scope' THEN '2026-06-10' WHEN t.id='mvp-module-priorities' THEN '2026-06-12' ELSE NULL END)::date,
row_number() OVER (ORDER BY c.position,t.position,t.id)-1,
coalesce((SELECT greatest(0,sum(count)) FROM board_insights WHERE "taskId"=t.id AND label='Comments'),0),
coalesce((SELECT greatest(0,sum(count)) FROM board_insights WHERE "taskId"=t.id AND label='Attachments'),0),
coalesce((SELECT greatest(0,sum(count)) FROM board_insights WHERE "taskId"=t.id AND label='Documents'),0),
CASE WHEN t.progress BETWEEN 0 AND 100 THEN t.progress ELSE NULL END
FROM board_tasks t JOIN board_columns c ON c.id=t."columnId";
--> statement-breakpoint
INSERT INTO project_tasks (id,"projectId","sourceKind","sourceId",title,description,status,priority,position)
SELECT 'ledger:'||id,'sample-operations','ledger',id,title,'',CASE WHEN status='in progress' THEN 'in-progress' WHEN status IN ('backlog','todo','done','canceled') THEN status ELSE 'backlog' END,CASE WHEN priority IN ('low','high') THEN priority ELSE 'medium' END,(SELECT count(*) FROM board_tasks)+row_number() OVER (ORDER BY position,id)-1 FROM ledger_tasks;
--> statement-breakpoint
INSERT INTO project_labels ("projectId",name) SELECT 'sample-operations',team FROM board_tasks UNION SELECT 'sample-operations',label FROM ledger_tasks;
--> statement-breakpoint
INSERT INTO project_task_labels ("projectId","taskId",label) SELECT 'sample-operations','board:'||id,team FROM board_tasks UNION ALL SELECT 'sample-operations','ledger:'||id,label FROM ledger_tasks;
--> statement-breakpoint
INSERT INTO project_folders ("projectId","folderId",position) SELECT 'sample-operations',id,position FROM workspace_folders;
--> statement-breakpoint
INSERT INTO project_files ("projectId","fileId",position) SELECT 'sample-operations',id,position FROM workspace_files;
--> statement-breakpoint
INSERT INTO project_events ("projectId","templateId",position) SELECT 'sample-operations',id,position FROM calendar_templates;

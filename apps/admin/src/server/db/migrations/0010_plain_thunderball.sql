CREATE TABLE "academy_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"studentId" text NOT NULL,
	"performanceId" text NOT NULL,
	"achievement" text NOT NULL,
	"score" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"classId" text NOT NULL,
	"submitted" numeric(24, 10) NOT NULL,
	"pending" numeric(24, 10) NOT NULL,
	"overdue" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_classes" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"grade" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_days" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_events" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"dayOffset" numeric(24, 10) NOT NULL,
	"title" text NOT NULL,
	"time" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_performance" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"classId" text NOT NULL,
	"start" numeric(24, 10) NOT NULL,
	"duration" numeric(24, 10) NOT NULL,
	"subject" text NOT NULL,
	"score" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"classId" text NOT NULL,
	"roomId" text NOT NULL,
	"date" text NOT NULL,
	"starts" text NOT NULL,
	"ends" text NOT NULL,
	"subject" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy_students" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "infrastructure_environments" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"projectId" text NOT NULL,
	"domain" text NOT NULL,
	"environment" text NOT NULL,
	"status" text NOT NULL,
	"server" text NOT NULL,
	"countryCode" text NOT NULL,
	"plan" text NOT NULL,
	"platformName" text NOT NULL,
	"platformIcon" text NOT NULL,
	"latencyMs" numeric(24, 10) NOT NULL,
	"uptimeHours" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "infrastructure_organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "infrastructure_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "infrastructure_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"environmentId" text NOT NULL,
	"cpu" numeric(24, 10) NOT NULL,
	"ram" numeric(24, 10) NOT NULL,
	"disk" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_cargo" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"shipmentId" text NOT NULL,
	"description" text NOT NULL,
	"weightKg" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_customers" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"initials" text NOT NULL,
	"tier" text NOT NULL,
	"tierLabel" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_handling" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"shipmentId" text NOT NULL,
	"label" text NOT NULL,
	"note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"shipmentId" text NOT NULL,
	"role" text NOT NULL,
	"display" text NOT NULL,
	"country" text NOT NULL,
	"countryCode" text NOT NULL,
	"longitude" numeric(24, 10) NOT NULL,
	"latitude" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"customerId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"shipmentId" text NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"shipmentId" text NOT NULL,
	"eta" text NOT NULL,
	"etaMeta" text NOT NULL,
	"status" text NOT NULL,
	"progress" numeric(24, 10) NOT NULL,
	"mode" text NOT NULL,
	"routeType" text NOT NULL,
	"transportNumber" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients_alarms" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"patientId" text NOT NULL,
	"label" text NOT NULL,
	"shortLabel" text NOT NULL,
	"durationSeconds" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients_beds" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients_events" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"patientId" text NOT NULL,
	"label" text NOT NULL,
	"time" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients_identities" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"bedId" text NOT NULL,
	"name" text NOT NULL,
	"age" numeric(24, 10) NOT NULL,
	"sex" text NOT NULL,
	"diagnosis" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"initialPatientId" text NOT NULL,
	"deviceId" text NOT NULL,
	"connected" boolean NOT NULL,
	"audioEnabled" boolean NOT NULL,
	"networkConnected" boolean NOT NULL,
	"recordingActive" boolean NOT NULL,
	"historyHours" numeric(24, 10) NOT NULL,
	"hrMin" numeric(24, 10) NOT NULL,
	"hrMax" numeric(24, 10) NOT NULL,
	"spo2Min" numeric(24, 10) NOT NULL,
	"spo2Max" numeric(24, 10) NOT NULL,
	"rrMin" numeric(24, 10) NOT NULL,
	"rrMax" numeric(24, 10) NOT NULL,
	"nibpMin" numeric(24, 10) NOT NULL,
	"nibpMax" numeric(24, 10) NOT NULL,
	"arterialMin" numeric(24, 10) NOT NULL,
	"arterialMax" numeric(24, 10) NOT NULL,
	"temperatureMin" numeric(24, 10) NOT NULL,
	"temperatureMax" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"patientId" text NOT NULL,
	"amplitude" numeric(24, 10) NOT NULL,
	"phase" numeric(24, 10) NOT NULL,
	"rhythm" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients_vitals" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"patientId" text NOT NULL,
	"heartRate" numeric(24, 10) NOT NULL,
	"arterialMap" numeric(24, 10) NOT NULL,
	"map" numeric(24, 10) NOT NULL,
	"respirationRate" numeric(24, 10) NOT NULL,
	"spo2" numeric(24, 10) NOT NULL,
	"temperature" numeric(24, 10) NOT NULL,
	"nibpSystolic" numeric(24, 10) NOT NULL,
	"nibpDiastolic" numeric(24, 10) NOT NULL,
	"arterialSystolic" numeric(24, 10) NOT NULL,
	"arterialDiastolic" numeric(24, 10) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productivity_days" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"date" text NOT NULL,
	"greeting" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productivity_focus" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"minutes" numeric(24, 10) NOT NULL,
	"seconds" numeric(24, 10) NOT NULL,
	"state" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productivity_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"completed" numeric(24, 10) NOT NULL,
	"total" numeric(24, 10) NOT NULL,
	"progress" numeric(24, 10) NOT NULL,
	"encouragement" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productivity_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productivity_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"description" text NOT NULL,
	"progress" numeric(24, 10) NOT NULL,
	"icon" text NOT NULL,
	"dueDate" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productivity_quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"quote" text NOT NULL,
	"encouragement" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productivity_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"tag" text NOT NULL,
	"time" text NOT NULL,
	"checked" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academy_achievements" ADD CONSTRAINT "academy_achievements_studentId_academy_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."academy_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_achievements" ADD CONSTRAINT "academy_achievements_performanceId_academy_performance_id_fk" FOREIGN KEY ("performanceId") REFERENCES "public"."academy_performance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_assignments" ADD CONSTRAINT "academy_assignments_classId_academy_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."academy_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_performance" ADD CONSTRAINT "academy_performance_classId_academy_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."academy_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_schedule" ADD CONSTRAINT "academy_schedule_classId_academy_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."academy_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_schedule" ADD CONSTRAINT "academy_schedule_roomId_academy_rooms_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."academy_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "infrastructure_environments" ADD CONSTRAINT "infrastructure_environments_projectId_infrastructure_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."infrastructure_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "infrastructure_projects" ADD CONSTRAINT "infrastructure_projects_organizationId_infrastructure_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."infrastructure_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "infrastructure_resources" ADD CONSTRAINT "infrastructure_resources_environmentId_infrastructure_environments_id_fk" FOREIGN KEY ("environmentId") REFERENCES "public"."infrastructure_environments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_cargo" ADD CONSTRAINT "logistics_cargo_shipmentId_logistics_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."logistics_shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_handling" ADD CONSTRAINT "logistics_handling_shipmentId_logistics_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."logistics_shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_locations" ADD CONSTRAINT "logistics_locations_shipmentId_logistics_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."logistics_shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_shipments" ADD CONSTRAINT "logistics_shipments_customerId_logistics_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."logistics_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_tags" ADD CONSTRAINT "logistics_tags_shipmentId_logistics_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."logistics_shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_tracking" ADD CONSTRAINT "logistics_tracking_shipmentId_logistics_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."logistics_shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients_alarms" ADD CONSTRAINT "patients_alarms_patientId_patients_identities_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients_events" ADD CONSTRAINT "patients_events_patientId_patients_identities_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients_identities" ADD CONSTRAINT "patients_identities_bedId_patients_beds_id_fk" FOREIGN KEY ("bedId") REFERENCES "public"."patients_beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients_settings" ADD CONSTRAINT "patients_settings_initialPatientId_patients_identities_id_fk" FOREIGN KEY ("initialPatientId") REFERENCES "public"."patients_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients_signals" ADD CONSTRAINT "patients_signals_patientId_patients_identities_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients_vitals" ADD CONSTRAINT "patients_vitals_patientId_patients_identities_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patients_identities"("id") ON DELETE no action ON UPDATE no action;
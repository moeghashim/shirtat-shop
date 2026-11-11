CREATE TABLE "demo_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"avatar" text NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_contacts" (
	"contractorId" text PRIMARY KEY NOT NULL,
	"workEmail" text NOT NULL,
	"personalEmail" text NOT NULL,
	"workPhone" text NOT NULL,
	"address" text NOT NULL,
	"emergencyContact" text NOT NULL,
	"emergencyPhone" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"contractorId" text NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"updatedAt" text NOT NULL,
	"status" text NOT NULL,
	"isRestricted" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_employment" (
	"contractorId" text PRIMARY KEY NOT NULL,
	"jobTitle" text NOT NULL,
	"jobLevel" text NOT NULL,
	"department" text NOT NULL,
	"team" text NOT NULL,
	"currentProject" text NOT NULL,
	"workplace" text NOT NULL,
	"timeZone" text NOT NULL,
	"startDate" text NOT NULL,
	"engagementLength" text NOT NULL,
	"employmentType" text NOT NULL,
	"weeklyHours" text NOT NULL,
	"schedule" text NOT NULL,
	"contractingEntity" text NOT NULL,
	"noticePeriod" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_leave" (
	"contractorId" text PRIMARY KEY NOT NULL,
	"leavePolicy" text NOT NULL,
	"annualLeaveAllowance" text NOT NULL,
	"remainingLeave" text NOT NULL,
	"carriedOverLeave" text NOT NULL,
	"usedLeave" text NOT NULL,
	"scheduledLeave" text NOT NULL,
	"pendingLeaveRequests" text NOT NULL,
	"leaveYear" text NOT NULL,
	"nextLeave" text NOT NULL,
	"lastWorkingDay" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_people" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"initials" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"contractorId" text PRIMARY KEY NOT NULL,
	"managerId" text NOT NULL,
	"name" text NOT NULL,
	"preferredName" text NOT NULL,
	"legalName" text NOT NULL,
	"pronouns" text NOT NULL,
	"initials" text NOT NULL,
	"avatar" text NOT NULL,
	"engagementStatus" text NOT NULL,
	"dateOfBirth" text NOT NULL,
	"bio" text NOT NULL,
	"updatedBy" text NOT NULL,
	"updatedAt" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_contacts" ADD CONSTRAINT "profile_contacts_contractorId_profiles_contractorId_fk" FOREIGN KEY ("contractorId") REFERENCES "public"."profiles"("contractorId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_documents" ADD CONSTRAINT "profile_documents_contractorId_profiles_contractorId_fk" FOREIGN KEY ("contractorId") REFERENCES "public"."profiles"("contractorId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_employment" ADD CONSTRAINT "profile_employment_contractorId_profiles_contractorId_fk" FOREIGN KEY ("contractorId") REFERENCES "public"."profiles"("contractorId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_leave" ADD CONSTRAINT "profile_leave_contractorId_profiles_contractorId_fk" FOREIGN KEY ("contractorId") REFERENCES "public"."profiles"("contractorId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_managerId_profile_people_id_fk" FOREIGN KEY ("managerId") REFERENCES "public"."profile_people"("id") ON DELETE no action ON UPDATE no action;
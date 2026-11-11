CREATE TABLE "chat_contacts" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"company" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"website" text NOT NULL,
	"location" text NOT NULL,
	"timezone" text NOT NULL,
	"status" text NOT NULL,
	"qualifiedAt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" integer PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"group" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"preview" text NOT NULL,
	"time" text NOT NULL,
	"isUnread" boolean NOT NULL,
	"isOnline" boolean NOT NULL,
	"unreadCount" integer NOT NULL,
	"contactId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_counts" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" integer PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"position" integer NOT NULL,
	"align" text NOT NULL,
	"text" text NOT NULL,
	"time" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_reactions" (
	"messageId" integer PRIMARY KEY NOT NULL,
	"reaction" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_tags" (
	"contactId" integer NOT NULL,
	"position" integer NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "chat_tags_contactId_position_pk" PRIMARY KEY("contactId","position")
);
--> statement-breakpoint
CREATE TABLE "chat_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_accounts" (
	"id" integer PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_attachments" (
	"messageId" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"size" text NOT NULL,
	"icon" text NOT NULL,
	CONSTRAINT "mail_attachments_messageId_id_pk" PRIMARY KEY("messageId","id")
);
--> statement-breakpoint
CREATE TABLE "mail_counts" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_labels" (
	"messageId" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "mail_labels_messageId_position_pk" PRIMARY KEY("messageId","position")
);
--> statement-breakpoint
CREATE TABLE "mail_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"accountId" integer NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"minutesAgo" integer NOT NULL,
	"folder" text NOT NULL,
	"isRead" boolean NOT NULL,
	"isPinned" boolean NOT NULL,
	"isPriority" boolean NOT NULL,
	"hasCc" boolean NOT NULL,
	"hasAttachments" boolean NOT NULL,
	"messageCount" integer
);
--> statement-breakpoint
CREATE TABLE "mail_recipients" (
	"messageId" text NOT NULL,
	"kind" text NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "mail_recipients_messageId_kind_position_pk" PRIMARY KEY("messageId","kind","position")
);
--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_contactId_chat_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."chat_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_chat_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."chat_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_messageId_chat_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_tags" ADD CONSTRAINT "chat_tags_contactId_chat_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."chat_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_messageId_mail_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."mail_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_labels" ADD CONSTRAINT "mail_labels_messageId_mail_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."mail_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_accountId_mail_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."mail_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_recipients" ADD CONSTRAINT "mail_recipients_messageId_mail_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."mail_messages"("id") ON DELETE no action ON UPDATE no action;
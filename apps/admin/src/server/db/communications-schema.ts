import { boolean, date, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

import type { Conversation, Message } from "../../routes/(main)/chat/-components/data.ts";
import type { Attachment, Mail } from "../../routes/(main)/mail/-components/data.tsx";
export const mailAccounts = pgTable("mail_accounts", {
  id: integer().primaryKey(),
  position: integer().notNull(),
  label: text().notNull(),
  email: text().notNull(),
});
export const mailMessages = pgTable("mail_messages", {
  id: text().primaryKey(),
  position: integer().notNull(),
  accountId: integer()
    .notNull()
    .references(() => mailAccounts.id),
  subject: text().notNull(),
  body: text().notNull(),
  minutesAgo: integer().notNull(),
  folder: text().$type<Mail["folder"]>().notNull(),
  isRead: boolean().notNull(),
  isPinned: boolean().notNull(),
  isPriority: boolean().notNull(),
  hasCc: boolean().notNull(),
  hasAttachments: boolean().notNull(),
  messageCount: integer(),
});
export const mailRecipients = pgTable(
  "mail_recipients",
  {
    messageId: text()
      .notNull()
      .references(() => mailMessages.id),
    kind: text().$type<"from" | "to" | "cc">().notNull(),
    position: integer().notNull(),
    name: text().notNull(),
    email: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.kind, t.position] })],
);
export const mailLabels = pgTable(
  "mail_labels",
  {
    messageId: text()
      .notNull()
      .references(() => mailMessages.id),
    position: integer().notNull(),
    label: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.position] })],
);
export const mailAttachments = pgTable(
  "mail_attachments",
  {
    messageId: text()
      .notNull()
      .references(() => mailMessages.id),
    id: text().notNull(),
    position: integer().notNull(),
    name: text().notNull(),
    size: text().notNull(),
    icon: text().$type<Attachment["icon"]>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.id] })],
);
export const mailCounts = pgTable("mail_counts", {
  id: text().primaryKey(),
  position: integer().notNull(),
  label: text().notNull(),
});
export const chatContacts = pgTable("chat_contacts", {
  id: integer().primaryKey(),
  name: text().notNull(),
  role: text().notNull(),
  company: text().notNull(),
  email: text().notNull(),
  phone: text().notNull(),
  website: text().notNull(),
  location: text().notNull(),
  timezone: text().notNull(),
  status: text().notNull(),
  qualifiedAt: text().notNull(),
});
export const chatConversations = pgTable("chat_conversations", {
  id: integer().primaryKey(),
  position: integer().notNull(),
  group: text().$type<Conversation["group"]>().notNull(),
  name: text().notNull(),
  subject: text().notNull(),
  preview: text().notNull(),
  time: text().notNull(),
  isUnread: boolean().notNull(),
  isOnline: boolean().notNull(),
  unreadCount: integer().notNull(),
  contactId: integer()
    .notNull()
    .references(() => chatContacts.id),
});
export const chatTags = pgTable(
  "chat_tags",
  {
    contactId: integer()
      .notNull()
      .references(() => chatContacts.id),
    position: integer().notNull(),
    tag: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.contactId, t.position] })],
);
export const chatMessages = pgTable("chat_messages", {
  id: integer().primaryKey(),
  conversationId: integer()
    .notNull()
    .references(() => chatConversations.id),
  position: integer().notNull(),
  align: text().$type<Message["align"]>().notNull(),
  text: text().notNull(),
  time: text().notNull(),
});
export const chatReactions = pgTable("chat_reactions", {
  messageId: integer()
    .primaryKey()
    .references(() => chatMessages.id),
  reaction: text().notNull(),
});
export const chatUsers = pgTable("chat_users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
});
export const chatDisplay = pgTable("chat_display", {
  id: text().primaryKey(),
  threadDate: date({ mode: "string" }).notNull(),
});
export const chatCounts = pgTable("chat_counts", {
  id: text().primaryKey(),
  position: integer().notNull(),
  label: text().notNull(),
});

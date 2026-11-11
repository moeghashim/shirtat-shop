import { eq } from "drizzle-orm";

import type { getDatabase } from "./client.server.ts";
import * as s from "./communications-schema.ts";
import { chatCounts, chatDisplay, chatTabCounts, conversations, currentUser } from "./fixtures/chat.ts";
import { accounts, mailCounts, mailDefinitions } from "./fixtures/mail.ts";
import { seedMetricCollection } from "./seed-metrics.ts";

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];
export async function seedCommunications(tx: Transaction) {
  await tx.insert(s.chatDisplay).values(chatDisplay).onConflictDoUpdate({ target: s.chatDisplay.id, set: chatDisplay });
  await seedMetricCollection(tx, "communication-chat", "tabs", chatTabCounts);

  for (const [position, a] of accounts.entries()) {
    const row = { ...a, position };
    await tx.insert(s.mailAccounts).values(row).onConflictDoUpdate({ target: s.mailAccounts.id, set: row });
  }
  for (const [position, m] of mailDefinitions.entries()) {
    const { from, to, cc, attachments, labels, messageCount, ...rest } = m;
    const row = {
      ...rest,
      position,
      hasCc: cc !== undefined,
      hasAttachments: attachments !== undefined,
      messageCount: messageCount ?? null,
    };
    await tx.insert(s.mailMessages).values(row).onConflictDoUpdate({ target: s.mailMessages.id, set: row });
    await tx.delete(s.mailRecipients).where(eq(s.mailRecipients.messageId, m.id));
    const recipients = { from: [from], to, cc: cc ?? [] };
    for (const kind of ["from", "to", "cc"] as const)
      for (const [position, recipient] of recipients[kind].entries())
        await tx.insert(s.mailRecipients).values({ ...recipient, messageId: m.id, kind, position });
    await tx.delete(s.mailLabels).where(eq(s.mailLabels.messageId, m.id));
    for (const [position, label] of labels.entries())
      await tx.insert(s.mailLabels).values({ messageId: m.id, position, label });
    await tx.delete(s.mailAttachments).where(eq(s.mailAttachments.messageId, m.id));
    for (const [position, a] of (attachments ?? []).entries())
      await tx.insert(s.mailAttachments).values({ ...a, position, messageId: m.id });
  }
  for (const [position, c] of mailCounts.entries()) {
    const row = { ...c, position };
    await tx.insert(s.mailCounts).values(row).onConflictDoUpdate({ target: s.mailCounts.id, set: row });
  }
  for (const [position, c] of conversations.entries()) {
    const { contact, messages, ...rest } = c;
    const { tags, ...person } = contact;
    const contactRow = { id: c.id, ...person };
    await tx
      .insert(s.chatContacts)
      .values(contactRow)
      .onConflictDoUpdate({ target: s.chatContacts.id, set: contactRow });
    const row = { ...rest, position, contactId: c.id };
    await tx.insert(s.chatConversations).values(row).onConflictDoUpdate({ target: s.chatConversations.id, set: row });
    await tx.delete(s.chatTags).where(eq(s.chatTags.contactId, c.id));
    for (const [position, tag] of tags.entries())
      await tx.insert(s.chatTags).values({ contactId: c.id, position, tag });
    for (const [position, m] of messages.entries()) {
      const { reaction, ...rest } = m;
      const row = { ...rest, position, conversationId: c.id };
      await tx.insert(s.chatMessages).values(row).onConflictDoUpdate({ target: s.chatMessages.id, set: row });
      await tx.delete(s.chatReactions).where(eq(s.chatReactions.messageId, m.id));
      if (reaction !== undefined) await tx.insert(s.chatReactions).values({ messageId: m.id, reaction });
    }
  }
  const user = { id: "current", ...currentUser };
  await tx.insert(s.chatUsers).values(user).onConflictDoUpdate({ target: s.chatUsers.id, set: user });
  for (const [position, c] of chatCounts.entries()) {
    const row = { ...c, position };
    await tx.insert(s.chatCounts).values(row).onConflictDoUpdate({ target: s.chatCounts.id, set: row });
  }
}

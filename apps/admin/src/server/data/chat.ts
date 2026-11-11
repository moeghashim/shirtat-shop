import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { chatCounts, chatDisplay, chatTabCounts, conversations, currentUser } from "../db/fixtures/chat.ts";
import type { ChatData } from "./chat.types.ts";
import { loadMetricCollections } from "./metric-collections.ts";
import { readSource } from "./source.ts";

function displayData(threadDate: string, counts: ChatData["display"]["counts"]): ChatData["display"] {
  return {
    threadDate,
    counts,
    threadDateLabel: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${threadDate}T12:00:00Z`)),
  };
}
const inputSchema = z.object({ id: z.number().int().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoChat(input: Input = {}): Promise<ChatData> {
  const { id } = inputSchema.parse(input);
  return structuredClone({
    conversations: conversations.filter((c) => id === undefined || c.id === id),
    currentUser,
    counts: chatCounts,
    display: displayData(chatDisplay.threadDate, chatTabCounts[0]),
  });
}
export async function dbChat(input: Input = {}): Promise<ChatData> {
  const { id } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/communications-schema.ts");
  const db = getDatabase();
  const rows = await db
    .select({ conversation: s.chatConversations, contact: s.chatContacts })
    .from(s.chatConversations)
    .innerJoin(s.chatContacts, eq(s.chatConversations.contactId, s.chatContacts.id))
    .where(id === undefined ? undefined : eq(s.chatConversations.id, id))
    .orderBy(asc(s.chatConversations.position), asc(s.chatConversations.id));
  const messages = await db.select().from(s.chatMessages).orderBy(asc(s.chatMessages.position), asc(s.chatMessages.id));
  const tags = await db.select().from(s.chatTags).orderBy(asc(s.chatTags.position));
  const reactions = await db.select().from(s.chatReactions);
  const counts = await db.select().from(s.chatCounts).orderBy(asc(s.chatCounts.position), asc(s.chatCounts.id));
  const users = await db.select().from(s.chatUsers).where(eq(s.chatUsers.id, "current"));
  const user = users[0];
  const [display] = await db.select().from(s.chatDisplay).where(eq(s.chatDisplay.id, "default"));
  const metrics = await loadMetricCollections("communication-chat");
  const tabCounts = metrics.tabs?.[0] as ChatData["display"]["counts"] | undefined;
  if (!display || !tabCounts) throw new Error("Missing chat display data");
  if (!user) throw new Error("Missing current chat user");
  return {
    currentUser: { name: user.name, email: user.email },
    display: displayData(display.threadDate, tabCounts),
    counts: counts.map(({ position: _, ...c }) => c),
    conversations: rows.map(({ conversation, contact }) => {
      const { position: _, contactId, ...rest } = conversation;
      const { id: __, ...person } = contact;
      return {
        ...rest,
        contact: { ...person, tags: tags.filter((t) => t.contactId === contactId).map((t) => t.tag) },
        messages: messages
          .filter((m) => m.conversationId === conversation.id)
          .map(({ position: _, conversationId: __, ...m }) => {
            const reaction = reactions.find((r) => r.messageId === m.id)?.reaction;
            return { ...m, ...(reaction === undefined ? {} : { reaction }) };
          }),
      };
    }),
  };
}
export async function readChat(input: Input = {}) {
  return readSource(
    () => demoChat(input),
    () => dbChat(input),
  );
}

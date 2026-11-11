import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { accounts, mailCounts, mailDefinitions } from "../db/fixtures/mail.ts";
import type { MailData } from "./mail.types.ts";
import { readSource } from "./source.ts";

const inputSchema = z.object({ renderedAt: z.iso.datetime(), id: z.string().optional() });
type Input = z.infer<typeof inputSchema>;
export async function demoMail(input: Input): Promise<MailData> {
  const { renderedAt, id } = inputSchema.parse(input);
  return structuredClone({
    renderedAt,
    accounts,
    counts: mailCounts,
    mails: mailDefinitions
      .filter((m) => id === undefined || m.id === id)
      .map(({ minutesAgo, ...m }) => ({
        ...m,
        receivedAt: new Date(Date.parse(renderedAt) - minutesAgo * 60000).toISOString(),
      })),
  });
}
export async function dbMail(input: Input): Promise<MailData> {
  const { renderedAt, id } = inputSchema.parse(input);
  const { getDatabase } = await import("../db/client.server.ts");
  const s = await import("../db/communications-schema.ts");
  const db = getDatabase();
  const messages = await db
    .select()
    .from(s.mailMessages)
    .where(id === undefined ? undefined : eq(s.mailMessages.id, id))
    .orderBy(asc(s.mailMessages.position), asc(s.mailMessages.id));
  const recipients = await db.select().from(s.mailRecipients).orderBy(asc(s.mailRecipients.position));
  const labels = await db.select().from(s.mailLabels).orderBy(asc(s.mailLabels.position));
  const attachments = await db.select().from(s.mailAttachments).orderBy(asc(s.mailAttachments.position));
  const accountRows = await db
    .select()
    .from(s.mailAccounts)
    .orderBy(asc(s.mailAccounts.position), asc(s.mailAccounts.id));
  const counts = await db.select().from(s.mailCounts).orderBy(asc(s.mailCounts.position), asc(s.mailCounts.id));
  return {
    renderedAt,
    accounts: accountRows.map(({ position: _, ...a }) => a),
    counts: counts.map(({ position: _, ...c }) => c),
    mails: messages.map((m) => {
      const { position: _, minutesAgo, hasCc, hasAttachments, messageCount, ...rest } = m;
      const related = (kind: "from" | "to" | "cc") =>
        recipients.filter((r) => r.messageId === m.id && r.kind === kind).map(({ name, email }) => ({ name, email }));
      const from = related("from")[0];
      if (!from) throw new Error("Missing sender");
      return {
        ...rest,
        receivedAt: new Date(Date.parse(renderedAt) - minutesAgo * 60000).toISOString(),
        from,
        to: related("to"),
        ...(hasCc ? { cc: related("cc") } : {}),
        labels: labels.filter((l) => l.messageId === m.id).map((l) => l.label),
        ...(hasAttachments
          ? {
              attachments: attachments
                .filter((a) => a.messageId === m.id)
                .map(({ messageId: _, position: __, ...a }) => a),
            }
          : {}),
        ...(messageCount === null ? {} : { messageCount }),
      };
    }),
  };
}
export async function readMail(input: Input) {
  return readSource(
    () => demoMail(input),
    () => dbMail(input),
  );
}

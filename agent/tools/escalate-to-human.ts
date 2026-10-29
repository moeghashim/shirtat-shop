import { defineTool } from "eve/tools";
import { z } from "zod";

import { shopConfig } from "../../lib/config";
import { sendEscalationMail } from "../lib/agentmail";

const DAILY_LIMIT = 30;
const SESSION_LIMIT = 2;
const sentToday = { count: 0, day: "" };
const sentBySession = new Map<string, number>();

const clean = (value: string, max: number) =>
  // eslint-disable-next-line no-control-regex
  value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);

export default defineTool({
  description:
    "Hand a refund request, complaint, damaged or wrong item, missing parcel, or anything the assistant cannot resolve to the store owner. Collect the shopper's email and a clear description first. This only notifies the owner; it never refunds, replaces, cancels or promises anything. The owner replies to the shopper by email.",
  inputSchema: z.strictObject({
    details: z.string().min(10).max(2000),
    email: z.string().email().max(200),
    kind: z.enum(["refund", "complaint", "damaged-or-wrong-item", "missing-parcel", "other"]),
    language: z.enum(["en", "ar"]),
    name: z.string().max(100).optional(),
    orderNumber: z.string().max(40).optional(),
  }),
  execute: async (input, ctx) => {
    if (!shopConfig.support.escalation.isEnabled) return { sent: false };
    const day = new Date().toISOString().slice(0, 10);
    if (sentToday.day !== day) {
      sentToday.day = day;
      sentToday.count = 0;
      sentBySession.clear();
    }
    const sessionId = ctx.session.id;
    if ((sentBySession.get(sessionId) ?? 0) >= SESSION_LIMIT || sentToday.count >= DAILY_LIMIT)
      return { reason: "limit", sent: false };
    const email = clean(input.email, 200);
    const lines = [
      `Type: ${input.kind}`,
      `Customer email: ${email}`,
      input.name ? `Name: ${clean(input.name, 100)}` : null,
      input.orderNumber ? `Order: ${clean(input.orderNumber, 40)}` : null,
      `Chat language: ${input.language === "ar" ? "Arabic" : "English"}`,
      "",
      "What the customer said (from the site chat, unverified):",
      clean(input.details, 2000),
      "",
      "Nothing has been promised to the customer. Reply to this email to answer them directly.",
    ].filter((line) => line !== null);
    const subject =
      `[Shirtat chat] ${input.kind}${input.orderNumber ? ` - order ${clean(input.orderNumber, 40)}` : ""}`.replace(
        /[\r\n]+/g,
        " ",
      );
    const result = await sendEscalationMail({ replyTo: email, subject, text: lines.join("\n") });
    if (!result.ok) return { reason: result.reason, sent: false };
    sentToday.count += 1;
    sentBySession.set(sessionId, (sentBySession.get(sessionId) ?? 0) + 1);
    return { sent: true };
  },
});

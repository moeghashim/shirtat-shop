import { shopConfig } from "../../lib/config";

export interface EscalationMail {
  replyTo?: string;
  subject: string;
  text: string;
}

export async function sendEscalationMail({ replyTo, subject, text }: EscalationMail) {
  const key = process.env.AGENTMAIL_API_KEY;
  if (!key) return { ok: false as const, reason: "not-configured" };
  const { inboxId, to } = shopConfig.support.escalation;
  const response = await fetch(
    `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`,
    {
      body: JSON.stringify({
        labels: ["support-escalation"],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
        to: [to],
      }),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    },
  );
  return response.ok
    ? { ok: true as const }
    : { ok: false as const, reason: `agentmail-${response.status}` };
}

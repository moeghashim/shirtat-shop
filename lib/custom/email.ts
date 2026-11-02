import { sendOpsEmail } from "@/lib/creators/email";

const INBOX = "shirtat@agentmail.to";
const OWNER = process.env.OPS_EMAIL || "moe@10claws.com";

/** Sends from shirtat@agentmail.to; falls back to the ops mailer so a custom order is never silent. */
export async function sendCustomOrderEmail(email: {
  html: string;
  subject: string;
  text: string;
}): Promise<"agentmail" | "fallback" | "failed"> {
  const key = process.env.AGENTMAIL_API_KEY;
  if (key) {
    try {
      const res = await fetch(
        `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(INBOX)}/messages/send`,
        {
          body: JSON.stringify({ ...email, to: [OWNER] }),
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          method: "POST",
        },
      );
      if (res.ok) return "agentmail";
      console.error(
        `[CUSTOM] agentmail send failed: ${res.status} ${(await res.text()).slice(0, 200)}`,
      );
    } catch (e) {
      console.error("[CUSTOM] agentmail send error", e);
    }
  }
  const fallback = await sendOpsEmail({ ...email, to: OWNER }).catch(() => null);
  return fallback?.status === "sent" ? "fallback" : "failed";
}

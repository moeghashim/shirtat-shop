import { cancelQueuedEmails, newId, queueEmail } from "./store";
import type { CreatorRecord } from "./types";

export type EmailResult = {
  error?: string;
  status: "sent" | "failed" | "not_configured" | "queued";
};

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/**
 * Sends the bilingual approval email (Cloudflare Email Service, then Resend, else queued).
 */
export async function sendApprovalEmail(
  creator: CreatorRecord,
  link: string,
): Promise<EmailResult> {
  const name = esc(creator.name);
  const safeLink = esc(link);
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;line-height:1.6">
<h2>Welcome to Shirtat Creators</h2>
<p>Hi ${name},</p>
<p>Your creator application has been approved. Please complete your creator details (payout and tax information) using this secure link. It expires in 14 days.</p>
<p><a href="${safeLink}" style="background:#000;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Complete my details</a></p>
<hr style="margin:28px 0;border:none;border-top:1px solid #ddd">
<div dir="rtl" lang="ar" style="text-align:right">
<h2>مرحبًا بك في برنامج مبدعي شيرتات</h2>
<p>مرحبًا ${name}،</p>
<p>تمت الموافقة على طلبك. يُرجى إكمال بياناتك (معلومات الدفع والضرائب) عبر هذا الرابط الآمن، وتنتهي صلاحيته خلال 14 يومًا.</p>
<p><a href="${safeLink}" style="background:#000;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">إكمال بياناتي</a></p>
</div>
<p style="color:#888;font-size:12px">Shirtat · shirtat.co</p></div>`;
  const subject = "You're approved: complete your Shirtat creator details · تمت الموافقة على طلبك";
  const text = `Hi ${creator.name}, your Shirtat creator application is approved. Complete your details (link expires in 14 days): ${link}\n\nمرحبًا ${creator.name}، تمت الموافقة على طلبك. أكمل بياناتك (تنتهي صلاحية الرابط خلال 14 يومًا): ${link}\n\nShirtat · shirtat.co`;
  return deliver({ creatorId: creator.id, html, subject, text, to: creator.email });
}

interface OutgoingEmail {
  creatorId: string;
  html: string;
  subject: string;
  text: string;
  to: string;
}

/** Sends through Cloudflare Email Service when configured; returns an error string on failure. */
async function sendViaCloudflare(email: OutgoingEmail): Promise<string | null> {
  const token = process.env.CLOUDFLARE_EMAIL_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const from = process.env.EMAIL_FROM;
  if (!token || !account || !from) return "not_configured";
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/email/sending/send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          html: email.html,
          subject: email.subject,
          text: email.text,
          to: email.to,
        }),
        cache: "no-store",
      },
    );
    if (res.ok) return null;
    const body = (await res.text()).slice(0, 200);
    return `Cloudflare ${res.status}${body ? `: ${body}` : ""}`;
  } catch (e) {
    return e instanceof Error ? e.message : "send failed";
  }
}

async function sendViaResend(email: OutgoingEmail): Promise<string | null> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return "not_configured";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        html: email.html,
        subject: email.subject,
        text: email.text,
        to: [email.to],
      }),
      cache: "no-store",
    });
    return res.ok ? null : `Resend ${res.status}`;
  } catch (e) {
    return e instanceof Error ? e.message : "send failed";
  }
}

/** Cloudflare first, then Resend; if neither sends, the email is queued as a fallback. */
async function deliver(email: OutgoingEmail): Promise<EmailResult> {
  const errors: string[] = [];
  for (const send of [sendViaCloudflare, sendViaResend]) {
    const err = await send(email);
    if (!err) {
      await cancelQueuedEmails(email.creatorId);
      return { status: "sent" };
    }
    if (err !== "not_configured") errors.push(err);
  }
  await cancelQueuedEmails(email.creatorId);
  await queueEmail({
    ...email,
    createdAt: new Date().toISOString(),
    id: newId(),
    status: "queued",
  });
  return errors.length ? { error: errors.join("; "), status: "queued" } : { status: "queued" };
}

/** Queues a bilingual password reset email (sent by the Grok Bot inbox routine, like approval emails). */
export async function queueResetEmail({
  link,
  name,
  to,
  uid,
}: {
  link: string;
  name: string;
  to: string;
  uid: string;
}) {
  const n = esc(name);
  const l = esc(link);
  return deliver({
    creatorId: `reset:${uid}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;line-height:1.6">
<p>Hi ${n},</p><p>We received a request to reset your Shirtat creator password. This link works once and expires in 1 hour. If you didn't ask for this, you can ignore this email.</p>
<p><a href="${l}" style="background:#000;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Reset my password</a></p>
<hr style="margin:28px 0;border:none;border-top:1px solid #ddd">
<div dir="rtl" lang="ar" style="text-align:right"><p>مرحبًا ${n}،</p><p>تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك في شيرتات. يعمل هذا الرابط مرة واحدة وتنتهي صلاحيته خلال ساعة. إن لم تطلب ذلك فتجاهل هذه الرسالة.</p>
<p><a href="${l}" style="background:#000;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">إعادة تعيين كلمة المرور</a></p></div>
<p style="color:#888;font-size:12px">Shirtat · shirtat.co</p></div>`,
    subject: "Reset your Shirtat password · إعادة تعيين كلمة المرور",
    text: `Hi ${name}, reset your Shirtat creator password (works once, expires in 1 hour): ${link}\nIf you didn't ask for this, ignore this email.\n\nمرحبًا ${name}، أعد تعيين كلمة المرور (يعمل مرة واحدة وتنتهي صلاحيته خلال ساعة): ${link}\nإن لم تطلب ذلك فتجاهل هذه الرسالة.\n\nShirtat · shirtat.co`,
    to,
  });
}

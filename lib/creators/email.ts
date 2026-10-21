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
 * Sends the bilingual approval email through Resend when RESEND_API_KEY and EMAIL_FROM are set.
 * Without them it reports "not_configured" and the admin page shows the link to share manually.
 */
export async function sendApprovalEmail(
  creator: CreatorRecord,
  link: string,
): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
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
  if (!key || !from) {
    // No sending API on the server: queue it for the Grok Bot inbox routine to send.
    await cancelQueuedEmails(creator.id);
    await queueEmail({
      createdAt: new Date().toISOString(),
      creatorId: creator.id,
      html,
      id: newId(),
      status: "queued",
      subject,
      text,
      to: creator.email,
    });
    return { status: "queued" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [creator.email],
        subject,
        html,
        text,
      }),
      cache: "no-store",
    });
    if (!res.ok) return { error: `Resend ${res.status}`, status: "failed" };
    return { status: "sent" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "send failed", status: "failed" };
  }
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
  await cancelQueuedEmails(`reset:${uid}`);
  await queueEmail({
    createdAt: new Date().toISOString(),
    creatorId: `reset:${uid}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;line-height:1.6">
<p>Hi ${n},</p><p>We received a request to reset your Shirtat creator password. This link works once and expires in 1 hour. If you didn't ask for this, you can ignore this email.</p>
<p><a href="${l}" style="background:#000;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Reset my password</a></p>
<hr style="margin:28px 0;border:none;border-top:1px solid #ddd">
<div dir="rtl" lang="ar" style="text-align:right"><p>مرحبًا ${n}،</p><p>تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك في شيرتات. يعمل هذا الرابط مرة واحدة وتنتهي صلاحيته خلال ساعة. إن لم تطلب ذلك فتجاهل هذه الرسالة.</p>
<p><a href="${l}" style="background:#000;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">إعادة تعيين كلمة المرور</a></p></div>
<p style="color:#888;font-size:12px">Shirtat · shirtat.co</p></div>`,
    id: newId(),
    status: "queued",
    subject: "Reset your Shirtat password · إعادة تعيين كلمة المرور",
    text: `Hi ${name}, reset your Shirtat creator password (works once, expires in 1 hour): ${link}\nIf you didn't ask for this, ignore this email.\n\nمرحبًا ${name}، أعد تعيين كلمة المرور (يعمل مرة واحدة وتنتهي صلاحيته خلال ساعة): ${link}\nإن لم تطلب ذلك فتجاهل هذه الرسالة.\n\nShirtat · shirtat.co`,
    to,
  });
}

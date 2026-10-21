import type { CreatorRecord } from "./types";

export type EmailResult = { error?: string; status: "sent" | "failed" | "not_configured" };

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
  if (!key || !from) return { status: "not_configured" };
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
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [creator.email],
        subject: "You're approved: complete your Shirtat creator details · تمت الموافقة على طلبك",
        html,
        text: `Hi ${creator.name}, your Shirtat creator application is approved. Complete your details: ${link}\n\nمرحبًا ${creator.name}، تمت الموافقة على طلبك. أكمل بياناتك: ${link}`,
      }),
      cache: "no-store",
    });
    if (!res.ok) return { error: `Resend ${res.status}`, status: "failed" };
    return { status: "sent" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "send failed", status: "failed" };
  }
}

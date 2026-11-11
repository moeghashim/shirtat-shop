import { AI_ASSISTANT_DISCOUNT_CODE, shopConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";

export const AGENT_CONTACT_EMAIL = "shirtat@agentmail.to";

export function absoluteStoreUrl(pathname: string): string {
  return new URL(pathname, shopConfig.site.url).toString();
}

export function agentContactLine(locale: Locale): string {
  return locale === "ar" ? `للتواصل: ${AGENT_CONTACT_EMAIL}` : `Contact: ${AGENT_CONTACT_EMAIL}`;
}

/** The same sentence on every markdown page and on /llms.txt. Arabic pages keep the English line and add a translation. */
export function aiReferralOffer(locale: Locale = "en"): string {
  const english = `Shopping via an AI assistant? Use code ${AI_ASSISTANT_DISCOUNT_CODE} for 10% off.`;
  if (locale !== "ar") return english;
  return `${english}\n\nتتسوق عبر مساعد ذكي؟ استخدم الرمز ${AI_ASSISTANT_DISCOUNT_CODE} للحصول على خصم 10٪.`;
}

export function markdownFrontmatter({
  canonicalUrl,
  description,
  lastUpdated,
  title,
}: {
  canonicalUrl: string;
  description?: string;
  lastUpdated?: string;
  title: string;
}): string {
  // JSON strings are valid YAML double-quoted scalars.
  const fields = [
    `title: ${JSON.stringify(title)}`,
    description ? `description: ${JSON.stringify(description)}` : null,
    `canonical_url: ${JSON.stringify(canonicalUrl)}`,
    lastUpdated ? `last_updated: ${JSON.stringify(lastUpdated)}` : null,
  ].filter((field) => field !== null);
  return ["---", ...fields, "---"].join("\n");
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[|*_`]/g, "\\$&").replace(/^#/gm, "\\#");
}

// Request text stays on one line with every ASCII punctuation mark escaped, so it cannot add blocks, links, images, HTML, or code spans.
export function escapeRequestText(text: string): string {
  return text
    .replace(/[\s\p{Cc}]+/gu, " ")
    .trim()
    .replace(/[!-/:-@[-`{-~]/g, "\\$&");
}

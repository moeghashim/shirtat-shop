import { shopConfig } from "@/lib/config";

interface ProductMention {
  handle: string;
  phrases: string[];
}

/** Design names that exist as published products. Longer phrases are matched first. */
const PRODUCT_MENTIONS: ProductMention[] = [
  {
    handle: "ana-ibn-jala-t-shirt",
    phrases: ["أنا ابن جلا وطلاع الثنايا", "Ana Ibn Jala", "أنا ابن جلا"],
  },
  {
    handle: "habibi-call-me-senator-t-shirt",
    phrases: ["Habibi, Call Me Senator"],
  },
  {
    handle: "bayni-wa-baynak-t-shirt",
    phrases: ["Bayni wa Baynak", "بيني وبينك"],
  },
];

const MENTION_PHRASES = PRODUCT_MENTIONS.flatMap((mention) =>
  mention.phrases.map((phrase) => ({ href: `/products/${mention.handle}`, phrase })),
).sort((a, b) => b.phrase.length - a.phrase.length);

export interface TextSegment {
  href?: string;
  text: string;
}

function isWordChar(char: string | undefined): boolean {
  return Boolean(char && /[\p{L}\p{N}]/u.test(char));
}

/** Link design names to a live product. Phrases with no published product are left as text. */
export function linkProductMentions(text: string): TextSegment[] {
  const taken = new Array<boolean>(text.length).fill(false);
  const hits: { end: number; href: string; start: number }[] = [];
  for (const { href, phrase } of MENTION_PHRASES) {
    let from = 0;
    while (from <= text.length) {
      const start = text.indexOf(phrase, from);
      if (start < 0) break;
      const end = start + phrase.length;
      const blocked =
        isWordChar(text[start - 1]) ||
        isWordChar(text[end]) ||
        taken.slice(start, end).some(Boolean);
      if (!blocked) {
        hits.push({ end, href, start });
        for (let index = start; index < end; index += 1) taken[index] = true;
      }
      from = end;
    }
  }
  hits.sort((a, b) => a.start - b.start);
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const hit of hits) {
    if (hit.start > cursor) segments.push({ text: text.slice(cursor, hit.start) });
    segments.push({ href: hit.href, text: text.slice(hit.start, hit.end) });
    cursor = hit.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${new Intl.NumberFormat(shopConfig.localization.locale).format(count)} ${count === 1 ? singular : plural}`;
}

export function summarizeText(text: string, maxLength = 200): string {
  const summary = text.replace(/\s+/g, " ").trim();
  return summary.length > maxLength ? `${summary.slice(0, maxLength - 1).trimEnd()}…` : summary;
}

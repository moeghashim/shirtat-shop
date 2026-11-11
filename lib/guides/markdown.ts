import { shopConfig } from "@/lib/config";
import { commerceLocale, formatLocale, localizePath, type Locale } from "@/lib/i18n";
import { localizeProductTitle } from "@/lib/i18n/product";
import { escapeMarkdown } from "@/lib/markdown";
import { formatPrice } from "@/lib/money";

import { guideRails } from "./select";
import { loadGuideSources } from "./server";
import type { Guide, RailProduct } from "./types";
import { pick } from "./types";

function abs(locale: Locale, path: string): string {
  return `${shopConfig.site.url}${localizePath(locale, path)}`;
}

function productLine(product: RailProduct, locale: Locale): string {
  const title = localizeProductTitle(product.title, locale);
  const price = formatPrice(product.price, formatLocale(locale));
  const ranged = product.maxPrice.amount !== product.price.amount;
  const shown = ranged ? (locale === "ar" ? `من ${price}` : `From ${price}`) : price;
  return `- [${escapeMarkdown(title)}](${abs(locale, `/products/${product.handle}`)}) — ${escapeMarkdown(shown)}`;
}

export async function guideToMarkdown(guide: Guide, locale: Locale): Promise<string> {
  const { catalog, occasions } = await loadGuideSources(guide.match, commerceLocale(locale));
  const rails = guideRails(guide, catalog, occasions);
  const hasProducts = rails.some((rail) => rail.products.length > 0);
  const hasNote = rails.some((rail) => rail.note);
  const blocks = [
    `# ${escapeMarkdown(pick(guide.h1, locale))}`,
    ...guide.intro.map((paragraph) => escapeMarkdown(pick(paragraph, locale))),
    ...guide.sections.flatMap((section) => [
      `## ${escapeMarkdown(pick(section.heading, locale))}`,
      ...section.paragraphs.map((paragraph) => escapeMarkdown(pick(paragraph, locale))),
    ]),
    ...rails.flatMap((rail) => {
      const lines = [`## ${escapeMarkdown(pick(rail.heading, locale))}`];
      if (rail.note) lines.push(escapeMarkdown(pick(rail.note, locale)));
      lines.push(...rail.products.map((product) => productLine(product, locale)));
      return lines;
    }),
    !hasProducts && !hasNote && guide.match.kind !== "none"
      ? escapeMarkdown(pick(guide.empty, locale))
      : "",
    ...guide.links.map(
      (link) => `- [${escapeMarkdown(pick(link.label, locale))}](${abs(locale, link.href)})`,
    ),
  ];
  return `${blocks.filter(Boolean).join("\n\n")}\n`;
}

import { describeCollection } from "@/lib/collections";
import type { Collection } from "@/lib/collections/types";
import { type Locale, localizePath } from "@/lib/i18n";
import {
  absoluteStoreUrl,
  agentContactLine,
  aiReferralOffer,
  escapeMarkdown,
  markdownFrontmatter,
} from "@/lib/markdown";
import { productLinkLine } from "@/lib/markdown/catalog";
import type { ProductCard } from "@/lib/product/types";

function label(locale: Locale, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

export function collectionToMarkdown(
  collection: Collection,
  locale: Locale,
  products: ProductCard[] = [],
): string {
  const htmlPath = localizePath(locale, collection.path);
  const description = collection.description || collection.seo.description;
  const sections: string[] = [
    markdownFrontmatter({
      canonicalUrl: absoluteStoreUrl(htmlPath),
      description: describeCollection(collection),
      lastUpdated: collection.updatedAt,
      title: collection.title,
    }),
    "",
    aiReferralOffer(locale),
    "",
    `# ${escapeMarkdown(collection.title)}`,
    "",
  ];

  if (description) sections.push(escapeMarkdown(description), "");
  if (collection.image?.url) {
    sections.push(
      `${label(locale, "Image", "الصورة")}: ${collection.image.url}`,
      "",
      `![${escapeMarkdown(collection.image.altText)}](${collection.image.url})`,
      "",
    );
  }

  sections.push(
    `## ${label(locale, "Products", "المنتجات")}`,
    "",
    products.length > 0
      ? products.map((product) => productLinkLine(product, locale)).join("\n")
      : label(
          locale,
          "No products are listed in this collection.",
          "لا توجد منتجات في هذه المجموعة.",
        ),
    "",
    `${label(locale, "Canonical", "الصفحة")}: ${absoluteStoreUrl(htmlPath)}`,
    `${label(locale, "Markdown", "ماركداون")}: ${absoluteStoreUrl(`${htmlPath}.md`)}`,
    "",
    agentContactLine(locale),
    "",
  );

  return sections.join("\n");
}

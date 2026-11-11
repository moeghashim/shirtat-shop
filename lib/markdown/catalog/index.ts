import type { Collection } from "@/lib/collections/types";
import { type Locale, localizePath } from "@/lib/i18n";
import {
  absoluteStoreUrl,
  agentContactLine,
  aiReferralOffer,
  escapeMarkdown,
  markdownFrontmatter,
} from "@/lib/markdown";
import type { ProductCard } from "@/lib/product/types";

export function productPriceAmount(product: ProductCard): string {
  const { currencyCode } = product.price;
  if (product.maxPrice.amount === product.price.amount) {
    return `${product.price.amount} ${currencyCode}`;
  }
  return `${product.price.amount}–${product.maxPrice.amount} ${currencyCode}`;
}

export function productLinkLine(product: ProductCard, locale: Locale): string {
  const markdownPath = `${localizePath(locale, `/products/${product.handle}`)}.md`;
  const stock = product.availableForSale
    ? locale === "ar"
      ? "متوفر"
      : "In stock"
    : locale === "ar"
      ? "نفد"
      : "Sold out";
  const image = product.featuredImage?.url;
  const detail = [productPriceAmount(product), stock, image].filter(Boolean).join(" · ");
  return `- [${escapeMarkdown(product.title)}](${absoluteStoreUrl(markdownPath)}): ${detail}`;
}

export function productIndexToMarkdown(products: ProductCard[], locale: Locale): string {
  const title = locale === "ar" ? "منتجات شيرتات" : "Shirtat products";
  const htmlPath = localizePath(locale, "/collections/all");
  const markdownPath = `${localizePath(locale, "/products")}.md`;
  const intro =
    locale === "ar"
      ? "فهرس كل المنتجات المعروضة للبيع. صفحة كل منتج تتضمن السعر والعملة والمقاسات والخامة وطريقة الطباعة والوصف ورابط الصورة."
      : "Index of every product for sale. Each product page includes the price and currency, sizes, material, print method, description, and image URL.";
  const lines = [
    markdownFrontmatter({
      canonicalUrl: absoluteStoreUrl(markdownPath),
      description: intro,
      title,
    }),
    "",
    aiReferralOffer(locale),
    "",
    `# ${title}`,
    "",
    intro,
    "",
    agentContactLine(locale),
    "",
    `Shop: ${absoluteStoreUrl(htmlPath)}`,
    "",
    products.length > 0
      ? products.map((product) => productLinkLine(product, locale)).join("\n")
      : locale === "ar"
        ? "لا توجد منتجات في الفهرس حاليًا."
        : "No products are listed right now.",
    "",
  ];
  return lines.join("\n");
}

export function collectionIndexToMarkdown(collections: Collection[], locale: Locale): string {
  const title = locale === "ar" ? "مجموعات شيرتات" : "Shirtat collections";
  const htmlPath = localizePath(locale, "/collections");
  const markdownPath = `${htmlPath}.md`;
  const intro =
    locale === "ar"
      ? "مجموعات المتجر. كل رابط يفتح صفحة المجموعة بصيغة ماركداون."
      : "Shop collections. Each link opens that collection as Markdown.";
  const lines = [
    markdownFrontmatter({
      canonicalUrl: absoluteStoreUrl(markdownPath),
      description: intro,
      title,
    }),
    "",
    aiReferralOffer(locale),
    "",
    `# ${title}`,
    "",
    intro,
    "",
    agentContactLine(locale),
    "",
    ...collections.map((collection) => {
      const path = `${localizePath(locale, collection.path)}.md`;
      const summary = collection.description.replace(/\s+/g, " ").trim();
      const link = `[${escapeMarkdown(collection.title)}](${absoluteStoreUrl(path)})`;
      return summary ? `- ${link}: ${escapeMarkdown(summary)}` : `- ${link}`;
    }),
    "",
    `Shop: ${absoluteStoreUrl(htmlPath)}`,
    "",
  ];
  return lines.join("\n");
}

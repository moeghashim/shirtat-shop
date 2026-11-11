import { formatLocale, type Locale, localizePath } from "@/lib/i18n";
import { describeProductImage, localizeOptionName, localizeOptionValue } from "@/lib/i18n/product";
import {
  absoluteStoreUrl,
  agentContactLine,
  aiReferralOffer,
  escapeMarkdown,
  markdownFrontmatter,
} from "@/lib/markdown";
import { formatPrice } from "@/lib/money";
import type { Money } from "@/lib/money/types";
import { imageColorNames, isMarkedDown } from "@/lib/product";
import type { PrintMethod, ProductSpecs } from "@/lib/product/specs";
import type { ProductDetails } from "@/lib/product/types";

const SUMMARY_MAX_LENGTH = 200;

// Same blank and print-partner names as the product page details block.
const BLANK_AR: Record<string, string> = {
  "AS Colour 1001 Cotton Tote Bag": "حقيبة قطنية AS Colour 1001",
  "Bella+Canvas 3001 Unisex Jersey Short Sleeve Tee":
    "تيشيرت جيرسي بكم قصير للجنسين Bella+Canvas 3001",
  "Gildan 18000 Unisex Heavy Blend Crewneck Sweatshirt":
    "سويتشيرت بياقة دائرية للجنسين من خليط ثقيل Gildan 18000",
  "Gildan 18500 Unisex Heavy Blend Hooded Sweatshirt": "هودي للجنسين من خليط ثقيل Gildan 18500",
  "Matte Vertical Poster": "ملصق عمودي مطفي",
  "Yupoong 1501KC Classic Cuffed Beanie": "قبعة صوفية كلاسيكية بحافة Yupoong 1501KC",
  "Yupoong 6245CM Classic Dad Cap": "قبعة كاب كلاسيكية Yupoong 6245CM",
};

const PRINT_OPTION_AR: Record<string, string> = {
  "Digital printing": "طباعة رقمية",
  Embroidery: "تطريز",
};

const PROVIDER_AR: Record<string, string> = {
  "Not recorded": "غير مسجّل",
  "Printify Choice (US)": "Printify Choice (الولايات المتحدة)",
};

function label(locale: Locale, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

function unknown(locale: Locale): string {
  return label(locale, "Unknown (not published by the vendor)", "غير معروف (لم ينشره المورّد)");
}

function bilingual(
  locale: Locale,
  value: { ar: string; en: string } | null | undefined,
): string | null {
  if (!value) return null;
  const text = (locale === "ar" ? value.ar : value.en).trim();
  return text || null;
}

function presentPrintArea(value: string, locale: Locale): string {
  if (locale !== "ar") return value;
  return value
    .replace(/ in\b/g, " بوصة")
    .replace(/ cm\b/g, " سم")
    .replace(/ or /g, " أو ")
    .replace("(full sheet)", "(الورقة كاملة)");
}

function fact(locale: Locale, name: string, value: string | null | undefined): string {
  return `- **${escapeMarkdown(name)}**: ${escapeMarkdown(value?.trim() || unknown(locale))}`;
}

function summarize(product: ProductDetails): string {
  const description = product.description.replace(/\s+/g, " ").trim();
  const seoDescription = product.seo.description.replace(/\s+/g, " ").trim();
  // Shopify defaults the SEO description to the full description; only a distinct one is a real summary.
  if (
    seoDescription &&
    seoDescription !== description &&
    seoDescription.length <= SUMMARY_MAX_LENGTH
  ) {
    return seoDescription;
  }
  const source = seoDescription && seoDescription !== description ? seoDescription : description;
  if (!source) return "";
  const [firstSentence = source] = source.split(/(?<=[.!?])\s+/, 1);
  return firstSentence.length > SUMMARY_MAX_LENGTH
    ? `${firstSentence.slice(0, SUMMARY_MAX_LENGTH - 1).trimEnd()}…`
    : firstSentence;
}

function priceLine(product: ProductDetails, locale: Locale): string {
  const format = (money: Money) => formatPrice(money, formatLocale(locale));
  const { maxVariantPrice, minVariantPrice } = product.priceRange;
  const currency = product.currencyCode || minVariantPrice.currencyCode;
  const amount =
    minVariantPrice.amount === maxVariantPrice.amount
      ? `${minVariantPrice.amount} ${currency}`
      : `${minVariantPrice.amount}–${maxVariantPrice.amount} ${currency}`;
  const display =
    minVariantPrice.amount === maxVariantPrice.amount
      ? format(product.price)
      : `${format(minVariantPrice)} – ${format(maxVariantPrice)}`;
  const parts = [`**${amount}** (${display})`];
  if (minVariantPrice.amount !== maxVariantPrice.amount) {
    parts.push(
      label(
        locale,
        `across ${product.variantsCount} variants`,
        `عبر ${product.variantsCount} خيارًا`,
      ),
    );
  }
  if (product.compareAtPrice && isMarkedDown(product.price.amount, product.compareAtPrice.amount)) {
    parts.push(
      `${label(locale, "Was", "كان")} ${product.compareAtPrice.amount} ${product.compareAtPrice.currencyCode}`,
    );
  }
  parts.push(
    product.availableForSale
      ? label(locale, "In stock", "متوفر")
      : label(locale, "Sold out", "نفد"),
  );
  return parts.join(" · ");
}

function blankName(specs: ProductSpecs, locale: Locale): string {
  if (locale !== "ar") return specs.blank;
  return specs.blankAr?.trim() || BLANK_AR[specs.blank] || specs.blank;
}

function printPartner(specs: ProductSpecs, locale: Locale): string {
  if (specs.provider === specs.vendor) return specs.vendor;
  const provider =
    locale === "ar" ? (PROVIDER_AR[specs.provider] ?? specs.provider) : specs.provider;
  return `${specs.vendor} · ${provider}`;
}

export function productToMarkdown(
  product: ProductDetails,
  locale: Locale,
  facts: { print: PrintMethod | null; specs: ProductSpecs | null } = { print: null, specs: null },
): string {
  const { print, specs } = facts;
  const htmlPath = localizePath(locale, `/products/${product.handle}`);
  const markdownPath = `${htmlPath}.md`;
  const otherLocale: Locale = locale === "ar" ? "en" : "ar";
  const otherPath = `${localizePath(otherLocale, `/products/${product.handle}`)}.md`;
  const summary = summarize(product);
  const sections: string[] = [
    markdownFrontmatter({
      canonicalUrl: absoluteStoreUrl(htmlPath),
      description: summary,
      lastUpdated: product.updatedAt,
      title: product.title,
    }),
    "",
    aiReferralOffer(locale),
    "",
    `# ${escapeMarkdown(product.title)}`,
    "",
  ];

  const attribution: string[] = [];
  if (product.vendor) attribution.push(escapeMarkdown(product.vendor));
  if (product.category) {
    attribution.push(
      escapeMarkdown(
        [
          ...product.category.ancestors.map((ancestor) => ancestor.name),
          product.category.name,
        ].join(" > "),
      ),
    );
  }
  if (attribution.length > 0) sections.push(attribution.join(" · "), "");
  if (summary) sections.push(`> ${escapeMarkdown(summary)}`, "");

  sections.push(
    priceLine(product, locale),
    "",
    `${label(locale, "Canonical", "الصفحة")}: ${absoluteStoreUrl(htmlPath)}`,
    `${label(locale, "Markdown", "ماركداون")}: ${absoluteStoreUrl(markdownPath)}`,
    `${label(locale, "العربية", "English")}: ${absoluteStoreUrl(otherPath)}`,
    "",
    `## ${label(locale, "Description", "الوصف")}`,
    "",
    escapeMarkdown(product.description || unknown(locale)),
    "",
    `## ${label(locale, "Variants", "الخيارات")}`,
    "",
  );

  if (product.options.length === 0) {
    sections.push(fact(locale, label(locale, "Options", "الخيارات"), null), "");
  } else {
    for (const option of product.options) {
      const values = option.values
        .map((value) => escapeMarkdown(localizeOptionValue(option.name, value.name, locale)))
        .join(", ");
      sections.push(`- **${escapeMarkdown(localizeOptionName(option.name, locale))}**: ${values}`);
    }
    sections.push("");
  }

  sections.push(`## ${label(locale, "Materials", "الخامة")}`, "");
  if (!specs) {
    sections.push(fact(locale, label(locale, "Fabric", "القماش"), null), "");
  } else {
    const sizes = specs.sizes.map((size) => localizeOptionValue("Size", size, locale)).join(", ");
    sections.push(
      fact(locale, label(locale, "Blank", "القطعة الأساسية"), blankName(specs, locale)),
      fact(locale, label(locale, "Print partner", "مورّد الطباعة"), printPartner(specs, locale)),
      fact(locale, label(locale, "Fabric", "القماش"), bilingual(locale, specs.fabric)),
      fact(locale, label(locale, "Weight", "الوزن"), specs.weight),
      fact(locale, label(locale, "Fit", "القصة"), bilingual(locale, specs.fit)),
      fact(locale, label(locale, "Sizes", "المقاسات"), sizes || null),
      fact(locale, label(locale, "Care", "العناية"), bilingual(locale, specs.care)),
      fact(locale, label(locale, "Origin", "المنشأ"), bilingual(locale, specs.origin)),
      "",
    );
    if (specs.sizeChart) {
      const chart = specs.sizeChart;
      const headers = [
        label(locale, "Size", "المقاس"),
        ...chart.columns.map((column) => (locale === "ar" ? column.ar : column.en)),
      ];
      sections.push(
        `### ${label(locale, "Size chart (cm)", "جدول المقاسات (سم)")}`,
        "",
        `| ${headers.join(" | ")} |`,
        `| ${headers.map(() => "---").join(" | ")} |`,
        ...chart.sizes.map((size, index) => {
          const cells = [size, ...chart.columns.map((column) => column.values[index] ?? "")];
          return `| ${cells.join(" | ")} |`;
        }),
        "",
      );
    }
  }

  sections.push(`## ${label(locale, "Print method", "طريقة الطباعة")}`, "");
  if (!print) {
    sections.push(fact(locale, label(locale, "Method", "الطريقة"), null), "");
  } else {
    sections.push(
      fact(locale, label(locale, "Method", "الطريقة"), bilingual(locale, print.method)),
      fact(locale, label(locale, "Placement", "موضع الطباعة"), bilingual(locale, print.placement)),
      fact(
        locale,
        label(locale, "Print area", "مساحة الطباعة"),
        print.printArea ? presentPrintArea(print.printArea, locale) : null,
      ),
    );
    if (print.available.length > 0) {
      sections.push("", `### ${label(locale, "Vendor options", "خيارات المورّد")}`, "");
      for (const option of print.available) {
        const areas = option.areas
          .map((area) => (locale === "ar" ? area.ar : area.en))
          .filter(Boolean)
          .join(locale === "ar" ? "، " : ", ");
        const name =
          locale === "ar" ? (PRINT_OPTION_AR[option.method] ?? option.method) : option.method;
        sections.push(`- **${escapeMarkdown(name)}**${areas ? `: ${escapeMarkdown(areas)}` : ""}`);
      }
    }
    sections.push("");
  }

  const colors = imageColorNames(product.options);
  const images =
    product.images.length > 0
      ? product.images
      : product.featuredImage
        ? [product.featuredImage]
        : [];
  sections.push(`## ${label(locale, "Images", "الصور")}`, "");
  const featured = product.featuredImage ?? images[0];
  if (featured) {
    sections.push(`${label(locale, "Image", "الصورة")}: ${featured.url}`, "");
  }
  if (images.length === 0) {
    sections.push(unknown(locale), "");
  } else {
    for (const image of images) {
      const alt = describeProductImage({
        altText: image.altText,
        color: colors[image.url],
        locale,
        title: product.title,
      });
      sections.push(`- ${image.url}`);
      sections.push(`  ![${escapeMarkdown(alt)}](${image.url})`);
    }
    sections.push("");
  }

  sections.push(agentContactLine(locale), "");
  return sections.join("\n");
}

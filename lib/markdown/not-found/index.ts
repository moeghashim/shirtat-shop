import type { Locale } from "@/lib/i18n";
import { absoluteStoreUrl, aiReferralOffer } from "@/lib/markdown";

export function notFoundMarkdown({
  kind,
  locale,
}: {
  kind: "Collection" | "Product";
  locale: Locale;
}): string {
  const title =
    locale === "ar"
      ? `${kind === "Product" ? "المنتج" : "المجموعة"} غير موجود`
      : `${kind} Not Found`;
  const body =
    locale === "ar"
      ? "تعذّر العثور على الصفحة المطلوبة."
      : `The requested ${kind.toLowerCase()} could not be found.`;
  return `# ${title}

${aiReferralOffer(locale)}

${body}

## ${locale === "ar" ? "متابعة التصفح" : "Continue browsing"}

- [Browse all products](${absoluteStoreUrl("/products.md")})
- [كل المنتجات](${absoluteStoreUrl("/ar/products.md")})
- [Storefront guide](${absoluteStoreUrl("/llms.txt")})
`;
}

export function errorMarkdown(locale: Locale): string {
  const title = locale === "ar" ? "خطأ في الخادم" : "Server Error";
  const body =
    locale === "ar"
      ? "حدث خطأ أثناء جلب الصفحة. حاول مرة أخرى لاحقًا."
      : "An error occurred while retrieving this page. Please try again later.";
  return `# ${title}\n\n${aiReferralOffer(locale)}\n\n${body}\n`;
}

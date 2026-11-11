import { shopConfig } from "@/lib/config";
import { type Locale, localizePath } from "@/lib/i18n";
import {
  absoluteStoreUrl,
  agentContactLine,
  aiReferralOffer,
  escapeMarkdown,
  markdownFrontmatter,
} from "@/lib/markdown";
import { markdownHeaders, markdownLocale } from "@/lib/markdown/representation";

function homeMarkdown(locale: Locale): string {
  const { description, name } = shopConfig.site;
  const title = locale === "ar" ? "شيرتات" : name;
  const intro =
    locale === "ar"
      ? "ملابس ومطبوعات بالخط العربي: تيشيرتات وهوديات وسويتشيرتات وحقائب ومطبوعات من الشعر والفكاهة والثقافة. كل قطعة تُطبع حسب الطلب."
      : description;
  return `${markdownFrontmatter({ canonicalUrl: absoluteStoreUrl(localizePath(locale, "/")), description: intro, title })}

${aiReferralOffer(locale)}

# ${escapeMarkdown(title)}

${escapeMarkdown(intro)}

${agentContactLine(locale)}

## ${locale === "ar" ? "التصفح" : "Browse"}

- [${locale === "ar" ? "كل المنتجات" : "All products"}](${absoluteStoreUrl(`${localizePath(locale, "/products")}.md`)})
- [${locale === "ar" ? "المجموعات" : "Collections"}](${absoluteStoreUrl(`${localizePath(locale, "/collections")}.md`)})
- [${locale === "ar" ? "دليل المتجر" : "Storefront guide"}](${absoluteStoreUrl("/llms.txt")})
`;
}

export function GET(request: Request): Response {
  const locale = markdownLocale(request);
  return new Response(homeMarkdown(locale), {
    headers: markdownHeaders({
      cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
      pathname: localizePath(locale, "/"),
    }),
  });
}

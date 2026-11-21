import { shopConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import { organizationJsonLd } from "@/lib/seo/product";

function buildSiteSchema(locale: Locale) {
  return [
    organizationJsonLd(locale),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: shopConfig.site.name,
      url: shopConfig.site.url,
      inLanguage: shopConfig.localization.locale,
      potentialAction: {
        "@type": "SearchAction",
        target: `${shopConfig.site.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

export function SiteSchema({ locale }: { locale: Locale }) {
  const schemas = buildSiteSchema(locale);
  return (
    <>
      {schemas.map((schema) => (
        <script key={schema["@type"]} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </>
  );
}

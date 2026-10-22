import { shopConfig } from "@/lib/config";
import { socialLinks } from "@/lib/config/social";

function buildSiteSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: shopConfig.site.name,
      url: shopConfig.site.url,
      logo: `${shopConfig.site.url}/icons/icon-512.png`,
      sameAs: socialLinks.map((link) => link.url),
    },
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

export function SiteSchema() {
  const schemas = buildSiteSchema();
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

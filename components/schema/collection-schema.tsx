import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { absoluteStoreUrl, itemListJsonLd } from "@/lib/seo/product";

interface CollectionSchemaData {
  handle: string;
  title: string;
  description: string;
  updatedAt?: string;
}

export async function CollectionSchema({ collection }: { collection: CollectionSchemaData }) {
  const locale = await getLocale();
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description: collection.description || undefined,
    url: absoluteStoreUrl(locale, `/collections/${collection.handle}`),
    dateModified: collection.updatedAt,
  };

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}

export function ItemListSchema({
  items,
  locale,
}: {
  items: { name: string; path: string }[];
  locale: Locale;
}) {
  if (items.length === 0) return null;
  return (
    <script type="application/ld+json">{JSON.stringify(itemListJsonLd(locale, items))}</script>
  );
}

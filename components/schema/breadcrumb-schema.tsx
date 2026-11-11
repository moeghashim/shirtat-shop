import { getLocale } from "@/lib/i18n/server";
import { breadcrumbJsonLd } from "@/lib/seo/product";

interface BreadcrumbSchemaItem {
  name: string;
  path: string;
}

export async function BreadcrumbSchema({ items }: { items: BreadcrumbSchemaItem[] }) {
  if (items.length === 0) return null;
  const locale = await getLocale();
  const schema = breadcrumbJsonLd(locale, items);
  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}

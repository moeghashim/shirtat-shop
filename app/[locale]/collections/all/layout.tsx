import { CollectionLayout } from "@/components/collections/collection-page";
import { SEARCH_SORT_EXCLUDE } from "@/lib/collections";
import { ALL_PRODUCTS_HANDLE, getAllProductsCollection } from "@/lib/collections/server";
import { getLocale } from "@/lib/i18n/server";

export default async function AllProductsLayout({
  children,
}: LayoutProps<"/[locale]/collections/all">) {
  return (
    <CollectionLayout
      collection={await getAllProductsCollection(await getLocale())}
      handle={ALL_PRODUCTS_HANDLE}
      sortExclude={SEARCH_SORT_EXCLUDE}
    >
      {children}
    </CollectionLayout>
  );
}

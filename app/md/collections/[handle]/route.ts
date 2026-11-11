import { categoryCollection } from "@/lib/collections/categories";
import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getCollection,
  getCollectionCatalog,
} from "@/lib/collections/server";
import { commerceLocale } from "@/lib/i18n";
import { collectionToMarkdown } from "@/lib/markdown/collection";
import { errorMarkdown, notFoundMarkdown } from "@/lib/markdown/not-found";
import { markdownHeaders, markdownLocale } from "@/lib/markdown/representation";
import { getProductIndex } from "@/lib/product/server";

const FRESH = "public, max-age=86400, stale-while-revalidate=604800";
const MISSING = "public, max-age=3600, stale-while-revalidate=604800";
const PRIVATE = "no-cache, no-store, must-revalidate";

// Opts the handler into the stored-output model; every handle renders on demand and is kept until its tag is invalidated.
export function generateStaticParams(): Array<{ handle: string }> {
  return [];
}

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const locale = markdownLocale(request);
  const pathname = locale === "ar" ? `/ar/collections/${handle}` : `/collections/${handle}`;
  const headers = (cacheControl: string) => markdownHeaders({ cacheControl, pathname });
  try {
    const commerce = commerceLocale(locale);
    const collection =
      handle === ALL_PRODUCTS_HANDLE
        ? await getAllProductsCollection(locale)
        : ((await getCollection({ handle, locale: commerce })) ??
          categoryCollection(handle, locale));
    if (!collection) {
      return new Response(notFoundMarkdown({ kind: "Collection", locale }), {
        status: 404,
        headers: headers(MISSING),
      });
    }
    const products =
      handle === ALL_PRODUCTS_HANDLE
        ? await getProductIndex({ locale: commerce })
        : await getCollectionCatalog({ handle, locale: commerce });
    return new Response(collectionToMarkdown(collection, locale, products), {
      headers: headers(FRESH),
    });
  } catch {
    return new Response(errorMarkdown(locale), {
      status: 500,
      headers: headers(PRIVATE),
    });
  }
}

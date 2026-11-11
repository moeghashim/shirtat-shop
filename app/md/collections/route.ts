import {
  ALL_PRODUCTS_HANDLE,
  getAllProductsCollection,
  getCollections,
} from "@/lib/collections/server";
import { commerceLocale } from "@/lib/i18n";
import { collectionIndexToMarkdown } from "@/lib/markdown/catalog";
import { errorMarkdown } from "@/lib/markdown/not-found";
import { markdownHeaders, markdownLocale } from "@/lib/markdown/representation";

export async function GET(request: Request): Promise<Response> {
  const locale = markdownLocale(request);
  const pathname = locale === "ar" ? "/ar/collections.md" : "/collections.md";
  try {
    const [all, collections] = await Promise.all([
      getAllProductsCollection(locale),
      getCollections({ limit: 250, locale: commerceLocale(locale) }).catch(() => []),
    ]);
    const listed = [
      all,
      ...collections.filter((collection) => collection.handle !== ALL_PRODUCTS_HANDLE),
    ];
    return new Response(collectionIndexToMarkdown(listed, locale), {
      headers: markdownHeaders({
        cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        pathname,
      }),
    });
  } catch {
    return new Response(errorMarkdown(locale), {
      status: 500,
      headers: markdownHeaders({
        cacheControl: "no-cache, no-store, must-revalidate",
        pathname,
      }),
    });
  }
}

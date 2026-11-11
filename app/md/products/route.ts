import { commerceLocale } from "@/lib/i18n";
import { productIndexToMarkdown } from "@/lib/markdown/catalog";
import { errorMarkdown } from "@/lib/markdown/not-found";
import { markdownHeaders, markdownLocale } from "@/lib/markdown/representation";
import { getProductIndex } from "@/lib/product/server";

export async function GET(request: Request): Promise<Response> {
  const locale = markdownLocale(request);
  const pathname = locale === "ar" ? "/ar/products.md" : "/products.md";
  try {
    const products = await getProductIndex({ locale: commerceLocale(locale) });
    return new Response(productIndexToMarkdown(products, locale), {
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

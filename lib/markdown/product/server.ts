import { shopConfig } from "@/lib/config";
import { customDesignPath } from "@/lib/custom/products";
import { commerceLocale, type Locale, localizePath } from "@/lib/i18n";
import { errorMarkdown, notFoundMarkdown } from "@/lib/markdown/not-found";
import { productToMarkdown } from "@/lib/markdown/product";
import { markdownHeaders } from "@/lib/markdown/representation";
import { getProduct } from "@/lib/product/server";
import { getProductSpecs } from "@/lib/product/specs";

const FRESH = "public, max-age=86400, stale-while-revalidate=604800";
const MISSING = "public, max-age=3600, stale-while-revalidate=604800";
const PRIVATE = "no-cache, no-store, must-revalidate";

export async function productMarkdownResponse(handle: string, locale: Locale): Promise<Response> {
  const pathname = localizePath(locale, `/products/${handle}`);
  const headers = (cacheControl: string) => markdownHeaders({ cacheControl, pathname });
  const designPath = customDesignPath(handle, locale);
  if (designPath) return Response.redirect(new URL(designPath, shopConfig.site.url), 308);
  try {
    const [product, facts] = await Promise.all([
      getProduct({ handle, locale: commerceLocale(locale) }),
      getProductSpecs(handle),
    ]);
    if (!product) {
      return new Response(notFoundMarkdown({ kind: "Product", locale }), {
        headers: headers(MISSING),
        status: 404,
      });
    }
    return new Response(productToMarkdown(product, locale, facts), {
      headers: headers(FRESH),
    });
  } catch {
    return new Response(errorMarkdown(locale), {
      headers: headers(PRIVATE),
      status: 500,
    });
  }
}

import { localizePath } from "@/lib/i18n";
import { markdownLocale } from "@/lib/markdown/representation";
import { markdownHeaders } from "@/lib/markdown/representation";
import { searchToMarkdown } from "@/lib/markdown/search";

export function GET(request: Request): Response {
  const locale = markdownLocale(request);
  const query = new URL(request.url).searchParams.get("q") ?? undefined;
  return new Response(searchToMarkdown(query, locale), {
    headers: markdownHeaders({
      cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
      pathname: localizePath(locale, "/search"),
    }),
  });
}

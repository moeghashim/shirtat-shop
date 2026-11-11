import { getGuide } from "@/lib/guides/copy";
import { guideToMarkdown } from "@/lib/guides/markdown";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { markdownHeaders } from "@/lib/markdown/representation";

export function generateStaticParams(): Array<{ path: string[] }> {
  return [];
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const joined = `/${path.join("/")}`;
  const locale: Locale = joined === "/ar" || joined.startsWith("/ar/") ? "ar" : "en";
  const pagePath = joined.replace(/^\/ar(?=\/|$)/, "") || "/";
  const guide = getGuide(pagePath);
  const pathname = localizePath(locale, pagePath);
  if (!guide) {
    return new Response("# Not found\n\nThis page does not exist.\n", {
      headers: markdownHeaders({
        cacheControl: "public, max-age=3600, stale-while-revalidate=604800",
        pathname,
      }),
      status: 404,
    });
  }
  try {
    return new Response(await guideToMarkdown(guide, locale), {
      headers: markdownHeaders({
        cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
        pathname,
      }),
    });
  } catch {
    return new Response("# Server Error\n\nAn error occurred while retrieving the page.\n", {
      headers: markdownHeaders({
        cacheControl: "no-cache, no-store, must-revalidate",
        pathname,
      }),
      status: 500,
    });
  }
}

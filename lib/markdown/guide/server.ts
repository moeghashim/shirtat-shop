import { getGuide } from "@/lib/guides/copy";
import { guideToMarkdown } from "@/lib/guides/markdown";
import { type Locale, localizePath } from "@/lib/i18n";
import { markdownHeaders } from "@/lib/markdown/representation";

const FRESH = "public, max-age=86400, stale-while-revalidate=604800";
const MISSING = "public, max-age=3600, stale-while-revalidate=604800";
const PRIVATE = "no-cache, no-store, must-revalidate";

export async function guideMarkdownResponse(path: string[], locale: Locale): Promise<Response> {
  const pagePath = `/${path.join("/")}`;
  const guide = getGuide(pagePath);
  const pathname = localizePath(locale, pagePath);
  if (!guide) {
    return new Response("# Not found\n\nThis page does not exist.\n", {
      headers: markdownHeaders({ cacheControl: MISSING, pathname }),
      status: 404,
    });
  }
  try {
    return new Response(await guideToMarkdown(guide, locale), {
      headers: markdownHeaders({ cacheControl: FRESH, pathname }),
    });
  } catch {
    return new Response("# Server Error\n\nAn error occurred while retrieving the page.\n", {
      headers: markdownHeaders({ cacheControl: PRIVATE, pathname }),
      status: 500,
    });
  }
}

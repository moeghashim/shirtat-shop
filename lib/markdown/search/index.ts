import { getSearchResultUrl } from "@shopify/hydrogen";

import { type Locale, localizePath } from "@/lib/i18n";
import {
  absoluteStoreUrl,
  aiReferralOffer,
  escapeRequestText,
  markdownFrontmatter,
} from "@/lib/markdown";
import { SEARCH_TERM_MAX_LENGTH } from "@/lib/search";

function normalizeSearchTerm(query: string | undefined): string {
  const term = query?.replace(/[\s\p{Cc}]+/gu, " ").trim() ?? "";
  return Array.from(term).slice(0, SEARCH_TERM_MAX_LENGTH).join("").trimEnd();
}

export function searchToMarkdown(query: string | undefined, locale: Locale = "en"): string {
  const term = normalizeSearchTerm(query);
  const shopPath = localizePath(
    locale,
    term ? getSearchResultUrl({ baseUrl: "/search", term }) : "/search",
  );

  const title = term ? `Search: ${term}` : "Search";
  const description =
    "Search results change with the live catalog, so this page does not list products.";

  return [
    markdownFrontmatter({
      canonicalUrl: absoluteStoreUrl(shopPath),
      description,
      title,
    }),
    "",
    aiReferralOffer(locale),
    "",
    `# ${term ? `Search: ${escapeRequestText(term)}` : "Search"}`,
    "",
    description,
    "",
    "## Search",
    "",
    `- Shop: ${absoluteStoreUrl(shopPath)}`,
    `- Products: ${absoluteStoreUrl(`${localizePath(locale, "/products")}.md`)}`,
  ].join("\n");
}

import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

import { pick } from "./types";
import type { Guide } from "./types";

export function guideMetadata(guide: Guide, locale: Locale): Metadata {
  const description = pick(guide.seoDescription, locale);
  const title = pick(guide.seoTitle, locale);
  return {
    alternates: buildAlternates({ locale, markdown: true, pathname: guide.path }),
    description,
    openGraph: buildOpenGraph({
      description,
      locale,
      title,
      type: "article",
      url: localizePath(locale, guide.path),
    }),
    title: { absolute: title },
  };
}

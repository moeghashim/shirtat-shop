import type { Metadata } from "next";

import { PrintMethodCardList } from "@/components/print-methods/cards";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { localizePath } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { PRINT_METHOD_INDEX, printMethodText } from "@/lib/print-methods";
import { buildAlternates, buildOpenGraph, siteOgImages } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const description = printMethodText(PRINT_METHOD_INDEX.seoDescription, locale);
  const title = printMethodText(PRINT_METHOD_INDEX.seoTitle, locale);
  return {
    alternates: buildAlternates({ locale, pathname: PRINT_METHOD_INDEX.path }),
    description,
    openGraph: buildOpenGraph({
      description,
      locale,
      title,
      type: "website",
      url: localizePath(locale, PRINT_METHOD_INDEX.path),
    }),
    title: { absolute: title },
    twitter: {
      card: "summary_large_image",
      description,
      images: siteOgImages(locale).map((image) => image.url),
      title,
    },
  };
}

export default async function PrintMethodsPage() {
  const locale = await getLocale();
  const text = (copy: Parameters<typeof printMethodText>[0]) => printMethodText(copy, locale);
  return (
    <Page>
      <Container>
        <div className="grid gap-10">
          <header className="grid max-w-3xl gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {text(PRINT_METHOD_INDEX.eyebrow)}
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">
              {text(PRINT_METHOD_INDEX.title)}
            </h1>
            <p className="leading-7 text-muted-foreground">{text(PRINT_METHOD_INDEX.intro)}</p>
          </header>
          <PrintMethodCardList locale={locale} titleAs="h2" />
        </div>
      </Container>
    </Page>
  );
}

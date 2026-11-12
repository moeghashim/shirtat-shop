import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  PrintMethodArticle,
  PrintMethodShopSkeleton,
  PrintMethodSkeleton,
} from "@/components/print-methods/article";
import { PrintMethodShop } from "@/components/print-methods/shop";
import { localizePath } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { getPrintMethod, PRINT_METHODS, printMethodText } from "@/lib/print-methods";
import { buildAlternates, buildOpenGraph, siteOgImages } from "@/lib/seo";

export function generateStaticParams() {
  return PRINT_METHODS.map((method) => ({ slug: method.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/print-methods/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const method = getPrintMethod(slug);
  if (!method) return {};
  const locale = await getLocale();
  const description = printMethodText(method.seoDescription, locale);
  const title = printMethodText(method.seoTitle, locale);
  return {
    alternates: buildAlternates({ locale, pathname: method.path }),
    description,
    openGraph: buildOpenGraph({
      description,
      locale,
      title,
      type: "website",
      url: localizePath(locale, method.path),
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

export default function PrintMethodPage({ params }: PageProps<"/[locale]/print-methods/[slug]">) {
  return (
    <Suspense fallback={<PrintMethodSkeleton />}>
      <PrintMethodContent params={params} />
    </Suspense>
  );
}

async function PrintMethodContent({
  params,
}: Pick<PageProps<"/[locale]/print-methods/[slug]">, "params">) {
  const { slug } = await params;
  const method = getPrintMethod(slug);
  if (!method) notFound();
  const locale = await getLocale();
  return (
    <PrintMethodArticle locale={locale} method={method}>
      <Suspense fallback={<PrintMethodShopSkeleton />}>
        <PrintMethodShop locale={locale} method={method.id} />
      </Suspense>
    </PrintMethodArticle>
  );
}

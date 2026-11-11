import type { Metadata } from "next";

import { CollectionCard } from "@/components/collections/collection-card";
import { T } from "@/components/i18n/t";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getCollectionsListing } from "@/lib/collections/server";
import { commerceLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates, buildOpenGraph, siteOgImages } from "@/lib/seo";

const INDEX_SEO = {
  ar: {
    description:
      "مجموعات شيرتات: شعر وعبارات يومية، وتيشيرتات وهوديز وحقائب ولوحات. السعر في البطاقة مباشر من Shopify.",
    h1: "مجموعات الخط العربي",
    lead: [
      "هذه مجموعات شيرتات: الشعر، والعبارات اليومية، وأنواع المنتجات مثل التيشيرتات والهوديز واللوحات.",
      "كل مجموعة تبدأ بما فيها، والأسعار في الشبكة أسعار Shopify المباشرة.",
      "الاسم الذي لا تجده في مجموعة يمكن كتابته من صفحة التصميم.",
    ],
    title: "مجموعات الخط العربي | شيرتات",
  },
  en: {
    description:
      "Shirtat collections: poetry, everyday phrases, and product types such as t-shirts, hoodies and prints. Card prices are live from Shopify.",
    h1: "Arabic calligraphy collections",
    lead: [
      "These are Shirtat's collections: poetry, everyday phrases, and product types such as t-shirts, hoodies and prints.",
      "Each collection page starts with what is in it, and the prices in the grid are the live Shopify prices.",
      "A name that is not already in a collection can be written on the design page.",
    ],
    title: "Arabic Calligraphy Collections | Shirtat",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { description, title } = INDEX_SEO[locale];
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates({
      locale,
      pathname: "/collections",
    }),
    openGraph: buildOpenGraph({
      description,
      locale,
      title,
      type: "website",
      url: "/collections",
    }),
    twitter: {
      card: "summary_large_image",
      description,
      images: siteOgImages(locale),
      title,
    },
  };
}

export default async function CollectionsPage() {
  const t = await getT();
  const locale = await getLocale();
  const collections = await getCollectionsListing({ locale: commerceLocale(locale) });
  const viewCollectionLabel = t("View this collection");
  const { h1, lead } = INDEX_SEO[locale];
  return (
    <Page className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <div className="grid gap-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl">{h1}</h1>
            {lead.map((sentence) => (
              <p className="max-w-3xl leading-6 text-muted-foreground" key={sentence}>
                {sentence}
              </p>
            ))}
          </div>

          {collections.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.handle}
                  collection={collection}
                  viewCollectionLabel={viewCollectionLabel}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              <T k="No collections found." />
            </p>
          )}
        </Sections>
      </Container>
    </Page>
  );
}

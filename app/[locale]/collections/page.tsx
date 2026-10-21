import type { Metadata } from "next";

import { CollectionCard } from "@/components/collections/collection-card";
import { T } from "@/components/i18n/t";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getCollectionsListing } from "@/lib/collections/server";
import { commerceLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getLocale();
  const title = t("Collections");
  const description = t("Browse products by collection.");
  return {
    title,
    description,
    alternates: buildAlternates({
      locale,
      pathname: "/collections",
    }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/collections",
      type: "website",
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export default async function CollectionsPage() {
  const t = await getT();
  const collections = await getCollectionsListing({ locale: commerceLocale(await getLocale()) });
  const viewCollectionLabel = t("View this collection");
  return (
    <Page className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl">
            <T k="Collections" />
          </h1>

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

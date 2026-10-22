import type { Metadata } from "next";

import { HeroRail } from "@/components/home/hero-rail";
import { Inspiration } from "@/components/home/inspiration";
import {
  CategoryTiles,
  DesignersAndSell,
  DesignSpotlight,
  ProductTypeRow,
} from "@/components/home/sections";
import { ProductsGrid } from "@/components/product/products-grid";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { shopConfig } from "@/lib/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getLocale();
  const title = t("Home");
  const description = t(shopConfig.site.description);
  return {
    title: `${title} | ${shopConfig.site.name}`,
    description,
    alternates: buildAlternates({ locale, pathname: "/" }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/",
      type: "website",
    }),
  };
}

export default async function HomePage() {
  return (
    <Page className="pt-0">
      <Sections>
        <HeroRail />

        <CategoryTiles />

        <Container>
          <ProductsGrid
            title="New arrivals"
            eagerCount={4}
            limit={8}
            collectionUrl="/collections/all"
          />
        </Container>

        <DesignSpotlight />

        <ProductTypeRow />

        <Inspiration />

        <DesignersAndSell />
      </Sections>
    </Page>
  );
}

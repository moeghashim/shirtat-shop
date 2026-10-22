import type { Metadata } from "next";

import { HeroRail } from "@/components/home/hero-rail";
import { Inspiration } from "@/components/home/inspiration";
import {
  CategoryTiles,
  DesignersAndSell,
  DesignSpotlight,
  NewArrivals,
  ProductTypeRow,
} from "@/components/home/sections";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { shopConfig } from "@/lib/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { buildAlternates, buildOpenGraph, siteOgImages } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getLocale();
  const title = t("Home");
  const description = t(shopConfig.site.description);
  return {
    title: { absolute: shopConfig.site.name },
    description,
    alternates: buildAlternates({ locale, pathname: "/" }),
    openGraph: buildOpenGraph({ locale: await getLocale(),
      title: shopConfig.site.name,
      description,
      url: locale === "ar" ? "/ar" : "/",
      type: "website",
    }),
    twitter: {
      card: "summary_large_image",
      title: shopConfig.site.name,
      description,
      images: siteOgImages(locale).map((image) => image.url),
    },
  };
}

export default async function HomePage() {
  return (
    <Page className="pt-0">
      <Sections>
        <HeroRail />

        <CategoryTiles />

        <NewArrivals />

        <DesignSpotlight />

        <ProductTypeRow />

        <Inspiration />

        <DesignersAndSell />
      </Sections>
    </Page>
  );
}

import type { Metadata } from "next";

import { DesignBand } from "@/components/home/design-band";
import { GiftGuideLink } from "@/components/home/gift-link";
import { HeroRail } from "@/components/home/hero-rail";
import { Inspiration } from "@/components/home/inspiration";
import { PrintMethods } from "@/components/home/print-methods";
import {
  CategoryTiles,
  DesignersAndSell,
  DesignSpotlight,
  NewArrivals,
  ProductTypeRow,
} from "@/components/home/sections";
import { SenatorLaunch } from "@/components/home/senator";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocale } from "@/lib/i18n/server";
import { buildAlternates, buildOpenGraph, siteOgImages } from "@/lib/seo";

const HOME_SEO = {
  ar: {
    description:
      "شيرتات تطبع الخط العربي على التيشيرتات والهوديز والسويتشيرتات والحقائب واللوحات. تسوّق الشعر والعبارات اليومية، أو اكتب اسمك على قطعة.",
    title: "تيشيرتات وهوديز بالخط العربي وهدايا | شيرتات",
  },
  en: {
    description:
      "Shirtat prints Arabic calligraphy on t-shirts, hoodies, sweatshirts, totes and art prints. Shop poetry and everyday phrases, or put your own name on a shirt.",
    title: "Arabic Calligraphy T-Shirts, Hoodies & Gifts | Shirtat",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { description, title } = HOME_SEO[locale];
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates({ locale, pathname: "/" }),
    openGraph: buildOpenGraph({
      locale,
      title,
      description,
      url: locale === "ar" ? "/ar" : "/",
      type: "website",
    }),
    twitter: {
      card: "summary_large_image",
      title,
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

        <DesignBand />

        <SenatorLaunch />

        <CategoryTiles />

        <NewArrivals />

        <DesignSpotlight />

        <ProductTypeRow />

        <GiftGuideLink />

        <PrintMethods />

        <Inspiration />

        <DesignersAndSell />
      </Sections>
    </Page>
  );
}

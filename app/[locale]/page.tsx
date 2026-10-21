import type { Metadata } from "next";

import { Inspiration } from "@/components/home/inspiration";
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
  const t = await getT();
  return (
    <Page className="pt-0">
      <Sections>
        <section className="grid grid-cols-1">
          <div className="col-start-1 row-start-1 hidden md:block md:aspect-4/1" />
          <div className="relative col-start-1 row-start-1 flex items-center justify-center px-5 py-10 lg:px-10">
            <div className="flex flex-col items-center text-center gap-2.5">
              <h1 className="text-4xl md:text-6xl font-semibold max-w-3xl text-foreground">
                {t("Arabic calligraphy, made to wear")}
              </h1>
              <p className="text-sm md:text-base max-w-xl text-foreground">
                {t(
                  "Shirtat means “t-shirts” in Arabic. We make clothing that carries the beauty of Arabic calligraphy.",
                )}
              </p>
            </div>
          </div>
        </section>

        <Inspiration />

        <Container>
          <ProductsGrid
            title="Products"
            eagerCount={4}
            limit={8}
            collectionUrl="/collections/all"
          />
        </Container>
      </Sections>
    </Page>
  );
}

import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";

import { DesignBuilder } from "@/components/custom/design-builder";
import { DESIGN_FONT_VARIABLES } from "@/components/custom/fonts";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { compactForm } from "@/lib/custom/compact";
import { CUSTOM_HOODIE_HANDLE, CUSTOM_MUG_HANDLE, CUSTOM_TEE_HANDLE } from "@/lib/custom/products";
import { commerceLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { toProductFormInput } from "@/lib/product";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { fetchProductWithVariants } from "@/lib/shopify/operations/products/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getLocale();
  const title = t("Design your own | Shirtat");
  const description = t(
    "Your text, in Arabic calligraphy, on a tee, a hoodie or a mug. Pick a style, preview it, and order.",
  );
  return {
    alternates: buildAlternates({ locale, pathname: "/design" }),
    description,
    openGraph: buildOpenGraph({
      description,
      locale,
      title,
      url: locale === "ar" ? "/ar/design" : "/design",
    }),
    title: { absolute: title },
  };
}

export default function DesignPage() {
  return (
    <Page>
      <Container className={`${DESIGN_FONT_VARIABLES} grid gap-10`}>
        <Intro />
        <Suspense fallback={<div className="min-h-[1700px] md:min-h-[860px]" />}>
          <Builder />
        </Suspense>
      </Container>
    </Page>
  );
}

async function Intro() {
  const t = await getT();
  return (
    <header className="grid max-w-3xl gap-3">
      <h1 className="text-3xl font-semibold sm:text-4xl">{t("Design your own")}</h1>
      <p className="text-base text-muted-foreground sm:text-lg">
        {t(
          "Write your sentence, pick a calligraphy style, then choose a tee, a hoodie or a mug. A designer finalises the artwork before anything is printed, which adds 1 to 2 days to production.",
        )}
      </p>
    </header>
  );
}

async function loadCustomProduct(handle: string, locale: ReturnType<typeof commerceLocale>) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", `product-${handle}`);
  return fetchProductWithVariants({ handle, locale });
}

/** The form store resolves a selection from the variants it holds, so it gets every variant up front. */
function toBuilderInput(
  product: Awaited<ReturnType<typeof loadCustomProduct>>,
  pick: { color?: string; fit?: string; size?: string },
) {
  if (!product) return null;
  const all = product.variants ?? [];
  const wanted = all.find((v) => {
    const o = Object.fromEntries(v.selectedOptions.map((x) => [x.name, x.value]));
    return (
      (!pick.color || o.Color === pick.color) &&
      (!pick.fit || o.Fit === pick.fit) &&
      (!pick.size || o.Size === pick.size)
    );
  });
  return compactForm(
    toProductFormInput(
      { ...product, adjacentVariants: all.length ? all : product.adjacentVariants },
      wanted ?? product.defaultVariant,
    ),
  );
}

async function Builder() {
  const locale = commerceLocale(await getLocale());
  const [tee, hoodie, mug] = await Promise.all([
    loadCustomProduct(CUSTOM_TEE_HANDLE, locale),
    loadCustomProduct(CUSTOM_HOODIE_HANDLE, locale),
    loadCustomProduct(CUSTOM_MUG_HANDLE, locale),
  ]);
  return (
    <DesignBuilder
      hoodie={toBuilderInput(hoodie, { color: "Black", size: "M" })}
      mug={toBuilderInput(mug, {})}
      tee={toBuilderInput(tee, { color: "Black", fit: "Men's", size: "M" })}
    />
  );
}

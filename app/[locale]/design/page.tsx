import type { Metadata } from "next";
import { Suspense } from "react";

import { DesignBuilder } from "@/components/custom/design-builder";
import { DESIGN_FONT_VARIABLES } from "@/components/custom/fonts";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { CUSTOM_MUG_HANDLE, CUSTOM_TEE_HANDLE } from "@/lib/custom/products";
import { commerceLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { toProductFormInput } from "@/lib/product";
import { getProduct } from "@/lib/product/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { fetchProductVariant } from "@/lib/shopify/operations/products/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getLocale();
  const title = t("Design your own | Shirtat");
  const description = t(
    "Your text, in Arabic calligraphy, on a tee or a mug. Pick a style, preview it, and order.",
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
          "Write your sentence, pick a calligraphy style, then choose a tee or a mug. A designer finalises the artwork before anything is printed, which adds 1 to 2 days to production.",
        )}
      </p>
    </header>
  );
}

async function Builder() {
  const locale = commerceLocale(await getLocale());
  const [tee, mug] = await Promise.all([
    getProduct({ handle: CUSTOM_TEE_HANDLE, locale }),
    getProduct({ handle: CUSTOM_MUG_HANDLE, locale }),
  ]);
  const teeVariant = tee
    ? await fetchProductVariant({
        handle: tee.handle,
        locale,
        selectedOptions: [
          { name: "Color", value: "Black" },
          { name: "Size", value: "M" },
        ],
      })
    : undefined;
  return (
    <DesignBuilder
      mug={mug ? toProductFormInput(mug, mug.defaultVariant) : null}
      tee={tee ? toProductFormInput(tee, teeVariant ?? tee.defaultVariant) : null}
    />
  );
}

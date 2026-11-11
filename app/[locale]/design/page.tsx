import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";

import { DesignBuilder } from "@/components/custom/design-builder";
import { DESIGN_FONT_VARIABLES } from "@/components/custom/fonts";
import { DesignSchema } from "@/components/custom/schema";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { compactForm } from "@/lib/custom/compact";
import {
  DESIGN_EXAMPLES,
  DESIGN_H1,
  DESIGN_LEDE,
  DESIGN_SEO,
  DESIGN_STYLES_SHOWN,
  designFaq,
  priceSentence,
  type PriceSpan,
} from "@/lib/custom/copy";
import { CUSTOM_HOODIE_HANDLE, CUSTOM_MUG_HANDLE, CUSTOM_TEE_HANDLE } from "@/lib/custom/products";
import { presetImage, styleImage } from "@/lib/custom/styles";
import { commerceLocale, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { toProductFormInput } from "@/lib/product";
import type { ProductDetails } from "@/lib/product/types";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { fetchProductWithVariants } from "@/lib/shopify/operations/products/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { description, title } = DESIGN_SEO[locale];
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

export default async function DesignPage() {
  const locale = await getLocale();
  const commerce = commerceLocale(locale);
  const [tee, hoodie, mug] = await Promise.all([
    loadCustomProduct(CUSTOM_TEE_HANDLE, commerce),
    loadCustomProduct(CUSTOM_HOODIE_HANDLE, commerce),
    loadCustomProduct(CUSTOM_MUG_HANDLE, commerce),
  ]);
  const spans = {
    hoodie: priceSpan(hoodie),
    mug: priceSpan(mug),
    tee: priceSpan(tee),
  };
  const facts = (
    [
      ["tee", spans.tee],
      ["hoodie", spans.hoodie],
      ["mug", spans.mug],
    ] as const
  ).flatMap(([kind, span]) => (span ? [priceSentence(kind, span, locale)] : []));
  const faq = designFaq(facts, locale);
  const offers = (
    [
      ["tee", tee, spans.tee],
      ["hoodie", hoodie, spans.hoodie],
      ["mug", mug, spans.mug],
    ] as const
  ).flatMap(([kind, product, span]) => {
    if (!product || !span) return [];
    const sentence = priceSentence(kind, span, locale);
    return [
      {
        available: product.availableForSale,
        currency: span.currency,
        description: sentence,
        high: span.high,
        images: (product.images ?? []).map((image) => ({
          altText: image.altText,
          height: image.height,
          url: image.url,
          width: image.width,
        })),
        low: span.low,
        offerCount: Math.max(product.variants?.length ?? 0, product.variantsCount || 0, 1),
        title: product.title,
      },
    ];
  });

  return (
    <Page>
      <Container className={`${DESIGN_FONT_VARIABLES} grid gap-10`}>
        <header className="grid max-w-3xl gap-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">{DESIGN_H1[locale]}</h1>
          {DESIGN_LEDE[locale].map((paragraph) => (
            <p className="text-base leading-7 text-muted-foreground sm:text-lg" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </header>
        <Examples locale={locale} />
        {facts.length > 0 ? (
          <ul className="grid max-w-3xl gap-2" id="custom-prices">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        ) : null}
        <DesignBuilder
          hoodie={toBuilderInput(hoodie, { color: "Black", size: "M" })}
          mug={toBuilderInput(mug, {})}
          tee={toBuilderInput(tee, { color: "Black", fit: "Men's", size: "M" })}
        />
        <section className="grid max-w-3xl gap-4">
          <h2 className="text-2xl font-semibold">{locale === "ar" ? "أسئلة" : "Questions"}</h2>
          {faq.map((item) => (
            <div className="grid gap-2" key={item.question}>
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="leading-7">{item.answer}</p>
            </div>
          ))}
        </section>
        <DesignSchema faq={faq} products={offers} />
      </Container>
    </Page>
  );
}

function Examples({ locale }: { locale: Locale }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold">
        {locale === "ar" ? "أمثلة من المصمّم" : "Examples from the builder"}
      </h2>
      <p className="max-w-3xl leading-7 text-muted-foreground">
        {locale === "ar"
          ? "هذه أعمال تجريبية من المصمّم، لا صور لتيشيرتات منتهية."
          : "These are sample artworks from the builder, not photographs of finished shirts."}
      </p>
      <ul className="grid grid-cols-3 gap-4 sm:max-w-md">
        {DESIGN_STYLES_SHOWN.map((style) => (
          <li className="grid gap-2" key={style.id}>
            <Image
              alt={locale === "ar" ? style.nameAr : style.nameEn}
              className="h-auto w-full rounded-xl bg-muted"
              height={192}
              sizes="100vw"
              src={styleImage(style.id)}
              width={192}
            />
            <span className="text-sm font-medium">
              {locale === "ar" ? style.nameAr : style.nameEn}
            </span>
          </li>
        ))}
      </ul>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {DESIGN_EXAMPLES.map((example) => (
          <li className="grid gap-2" key={example.id}>
            <Image
              alt={example.text}
              className="h-auto w-full rounded-xl bg-muted"
              height={192}
              sizes="100vw"
              src={presetImage(example.id)}
              width={192}
            />
            <p className="font-medium" dir="rtl" lang="ar">
              {example.text}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {locale === "ar" ? example.glossAr : example.glossEn}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function priceSpan(product: ProductDetails | undefined): PriceSpan | undefined {
  const low = product?.priceRange.minVariantPrice;
  const high = product?.priceRange.maxVariantPrice;
  if (!low?.amount || !high?.amount || !low.currencyCode) return undefined;
  return { currency: low.currencyCode, high: high.amount, low: low.amount };
}

async function loadCustomProduct(handle: string, locale: ReturnType<typeof commerceLocale>) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", `product-${handle}`);
  try {
    return await fetchProductWithVariants({ handle, locale });
  } catch {
    return undefined;
  }
}

/** The form store resolves a selection from the variants it holds, so it gets every variant up front. */
function toBuilderInput(
  product: Awaited<ReturnType<typeof loadCustomProduct>>,
  pick: { color?: string; fit?: string; size?: string },
) {
  if (!product) return null;
  const all = product.variants ?? [];
  const wanted = all.find((variant) => {
    const options = Object.fromEntries(
      variant.selectedOptions.map((option) => [option.name, option.value]),
    );
    return (
      (!pick.color || options.Color === pick.color) &&
      (!pick.fit || options.Fit === pick.fit) &&
      (!pick.size || options.Size === pick.size)
    );
  });
  return compactForm(
    toProductFormInput(
      { ...product, adjacentVariants: all.length ? all : product.adjacentVariants },
      wanted ?? product.defaultVariant,
    ),
  );
}

import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";

import { DesignBuilder } from "@/components/custom/design-builder";
import { DesignBuilder as OldBuilder } from "@/components/custom/design-builder-old";
import { DESIGN_FONT_VARIABLES } from "@/components/custom/fonts";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { compactForm } from "@/lib/custom/compact";
import { CUSTOM_HOODIE_HANDLE, CUSTOM_MUG_HANDLE, CUSTOM_TEE_HANDLE } from "@/lib/custom/products";
import { commerceLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { toProductFormInput } from "@/lib/product";
import { fetchProductWithVariants } from "@/lib/shopify/operations/products/server";

async function load(handle: string, locale: ReturnType<typeof commerceLocale>) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", `product-${handle}`);
  return fetchProductWithVariants({ handle, locale });
}

function toInput(
  product: Awaited<ReturnType<typeof load>>,
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

async function Lab({ v }: { v: string }) {
  const locale = commerceLocale(await getLocale());
  if (v === "empty") return null;
  const [tee, hoodie, mug] = await Promise.all([
    load(CUSTOM_TEE_HANDLE, locale),
    load(CUSTOM_HOODIE_HANDLE, locale),
    load(CUSTOM_MUG_HANDLE, locale),
  ]);
  return (
    <DesignBuilder
      lab={v}
      hoodie={toInput(hoodie, { color: "Black", size: "M" })}
      mug={toInput(mug, {})}
      tee={toInput(tee, { color: "Black", fit: "Men's", size: "M" })}
    />
  );
}

export default async function LabPage({ params }: { params: Promise<{ v: string }> }) {
  return (
    <Page>
      <Container className={`${DESIGN_FONT_VARIABLES} grid gap-10`}>
        <header className="grid max-w-3xl gap-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">Design your own</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Write your sentence, pick a calligraphy style, then choose a tee, a hoodie or a mug. A
            designer finalises the artwork before anything is printed, which adds 1 to 2 days to
            production.
          </p>
        </header>
        <Suspense fallback={<div className="min-h-[1700px] md:min-h-[860px]" />}>
          <LabInner params={params} />
        </Suspense>
      </Container>
    </Page>
  );
}

async function LabInner({ params }: { params: Promise<{ v: string }> }) {
  const { v } = await params;
  return <Lab v={v} />;
}

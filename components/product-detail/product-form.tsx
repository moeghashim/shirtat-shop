"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { ProductInfoOptions } from "@/components/product-detail/product-info";
import { ProductPrice } from "@/components/product-detail/product-price";
import { localizeHref } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/client";
import { enqueueMeta } from "@/lib/meta/queue";
import { buildProductUrl, replaceProductSelectionUrl } from "@/lib/product";
import { ProductProvider, useProduct, useProductSelection } from "@/lib/product/client";
import type {
  OptionGroupState,
  ProductFormInput,
  ProductFormSwatch,
  ProductFormVariant,
} from "@/lib/product/types";

export function ProductForm({
  children,
  product,
}: {
  children: ReactNode;
  product: ProductFormInput;
}) {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const selection = useProductSelection();
  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const handle = result.selectedVariant?.product.handle ?? product.handle;
        const href = localizeHref(
          locale,
          buildProductUrl(handle, result.selectedOptions, searchParams),
        );
        if (handle !== product.handle) {
          router.replace(href, { scroll: false });
          return;
        }
        selection?.select(result.selectedOptions);
        replaceProductSelectionUrl(href);
      }}
    >
      <SelectedVariantView productId={product.id} title={product.title} />
      {children}
    </ProductProvider>
  );
}

// The first variant is already reported from the server payload. Later picks stay on this page, so report them here.
function SelectedVariantView({ productId, title }: { productId: string; title: string }) {
  const { selectedVariant } = useProduct();
  const skipInitial = useRef(true);
  const variantId = selectedVariant?.id;
  const amount = selectedVariant?.price.amount;
  const currency = selectedVariant?.price.currencyCode;

  useEffect(() => {
    if (!variantId) return;
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }
    if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return;
    const eventTime = Math.floor(Date.now() / 1000);
    const sourceUrl = window.location.href;
    enqueueMeta(`view:${variantId}`, () => {
      void import("@/lib/meta/client").then((mod) => {
        mod.trackViewContent({
          currency,
          eventTime,
          price: amount,
          productId,
          sourceUrl,
          title,
          variantId,
        });
      });
    });
  }, [amount, currency, productId, title, variantId]);
  return null;
}

interface ProductFormOptionsProps {
  handle: string;
}

export function ProductFormOptions({ handle }: ProductFormOptionsProps) {
  const locale = useLocale();
  const { options, selectOption } = useProduct();
  const optionGroups: OptionGroupState[] = options.map((option) => ({
    name: option.name,
    values: option.values.map((value) => {
      const swatch = value.swatch as ProductFormSwatch | undefined;
      return {
        available: value.available,
        crossProduct: value.handle !== handle,
        exists: value.exists,
        href: buildProductUrl(value.handle, value.selectedOptions),
        image: swatch?.variantImage,
        name: value.name,
        selected: value.selected,
        swatch: swatch ? { color: swatch.color, image: swatch.image } : undefined,
      };
    }),
  }));
  return <ProductInfoOptions locale={locale} options={optionGroups} onSelectValue={selectOption} />;
}

export function ProductFormPrice({
  fallbackVariant,
}: {
  fallbackVariant: Pick<ProductFormVariant, "compareAtPrice" | "price"> | undefined;
}) {
  const { selectedVariant } = useProduct();
  const variant = selectedVariant ?? fallbackVariant;
  if (!variant) return null;
  return (
    <ProductPrice
      amount={variant.price.amount}
      currencyCode={variant.price.currencyCode}
      compareAtAmount={variant.compareAtPrice?.amount}
    />
  );
}

"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { ProductCardPrice, ProductCardTitle } from "@/components/product-card/components";
import { ProductInfoOptions } from "@/components/product-detail/product-info";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Link } from "@/components/ui/link";
import { toAgentOptionGroups } from "@/lib/agent/products";
import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";
import { useT } from "@/lib/i18n/client";
import type { Money } from "@/lib/money/types";
import type { SelectedOptions } from "@/lib/product/types";

export function AgentProductCards({ products }: { products: AgentProduct[] }) {
  const t = useT();
  return (
    <div className="grid gap-3">
      {products.map((product) => {
        const href = `/products/${product.handle}`;
        return (
          <article
            className="@container overflow-hidden rounded-2xl border border-foreground/10 bg-[#fffdf8]"
            data-slot="agent-product-card"
            key={product.handle}
          >
            <div className="flex flex-col gap-3 p-3 @min-[20rem]:flex-row @min-[20rem]:items-start">
              <Link
                className="relative block h-40 w-full shrink-0 overflow-hidden rounded-xl bg-[#ececea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf8] @min-[20rem]:size-32"
                href={href}
              >
                {product.image ? (
                  <Image
                    alt={product.title}
                    className="object-contain"
                    fill
                    sizes="100vw"
                    src={product.image}
                  />
                ) : (
                  <ImagePlaceholder className="size-full" />
                )}
              </Link>
              <div className="grid min-w-0 flex-1 content-start gap-2">
                <ProductCardTitle
                  className="line-clamp-2 text-start font-medium text-sm leading-5"
                  dir="auto"
                >
                  {product.title}
                </ProductCardTitle>
                <ProductCardPrice
                  amount={product.price.amount}
                  className="font-medium"
                  compareAtAmount={product.compareAtPrice?.amount}
                  compareAtCurrencyCode={product.compareAtPrice?.currencyCode}
                  currencyCode={product.price.currencyCode}
                />
                {product.available ? null : (
                  <p className="text-muted-foreground text-xs">{t("Out of Stock")}</p>
                )}
                <Link
                  aria-label={`${t("View product")}: ${product.title}`}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border border-foreground/15 bg-[#efe6d2] px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf8] @min-[20rem]:w-fit"
                  href={href}
                >
                  {t("View product")}
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function AgentChooserBody({
  children,
  compareAt,
  onSelect,
  price,
  product,
  selected,
}: {
  children: ReactNode;
  compareAt?: Money | null;
  onSelect: (name: string, value: string) => void;
  price: Money;
  product: AgentProductDetails;
  selected: SelectedOptions;
}) {
  return (
    <div className="grid gap-5 [&_[data-slot=swatch]]:size-11">
      <Link
        className="relative block h-40 overflow-hidden rounded-xl bg-[#ececea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e8]"
        href={`/products/${product.handle}`}
      >
        {product.image ? (
          <Image
            alt={product.title}
            className="object-contain"
            fill
            sizes="100vw"
            src={product.image}
          />
        ) : (
          <ImagePlaceholder className="size-full" />
        )}
      </Link>
      <div className="grid gap-1 px-1">
        <Link className="hover:underline" href={`/products/${product.handle}`}>
          <ProductCardTitle className="line-clamp-2 text-base font-normal">
            {product.title}
          </ProductCardTitle>
        </Link>
        <ProductCardPrice
          amount={price.amount}
          compareAtAmount={compareAt?.amount}
          compareAtCurrencyCode={compareAt?.currencyCode}
          currencyCode={price.currencyCode}
        />
      </div>
      <ProductInfoOptions
        onSelectValue={onSelect}
        options={toAgentOptionGroups(product, selected)}
      />
      {children}
    </div>
  );
}

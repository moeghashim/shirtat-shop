"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import {
  ProductCard,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardTitle,
} from "@/components/product-card/components";
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
    <div className="grid gap-8">
      {products.map((product) => (
        <Link className="grid gap-3" href={`/products/${product.handle}`} key={product.handle}>
          <ProductCard>
            <ProductCardImageContainer>
              <ProductCardImage
                alt={product.title}
                className="aspect-[4/3] rounded-[1.25rem]"
                outOfStock={!product.available}
                outOfStockText={t("Out of Stock")}
                src={product.image}
              />
              <ProductCardContent className="gap-1 px-1 py-0">
                <ProductCardTitle className="line-clamp-2 text-base font-normal">
                  {product.title}
                </ProductCardTitle>
                <ProductCardPrice
                  amount={product.price.amount}
                  compareAtAmount={product.compareAtPrice?.amount}
                  compareAtCurrencyCode={product.compareAtPrice?.currencyCode}
                  currencyCode={product.price.currencyCode}
                />
              </ProductCardContent>
            </ProductCardImageContainer>
          </ProductCard>
        </Link>
      ))}
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
        className="block overflow-hidden rounded-[1.25rem] bg-[#ececea]"
        href={`/products/${product.handle}`}
      >
        <span className="relative block aspect-[4/3]">
          {product.image ? (
            <Image
              alt={product.title}
              className="object-contain mix-blend-multiply"
              fill
              sizes="100vw"
              src={product.image}
            />
          ) : (
            <ImagePlaceholder className="size-full" />
          )}
        </span>
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

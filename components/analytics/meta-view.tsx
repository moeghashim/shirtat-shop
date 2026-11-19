"use client";

import { use, useEffect } from "react";

import { enqueueMeta } from "@/lib/meta/queue";
import type { ProductDetails, ProductVariant } from "@/lib/product/types";

export function MetaViewContent({
  product,
  variantPromise,
}: {
  product: Pick<ProductDetails, "id" | "title">;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  const variant = use(variantPromise);
  const variantId = variant?.id;
  const amount = variant?.price.amount;
  const currency = variant?.price.currencyCode;
  const title = product.title;
  const productId = product.id;

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_META_PIXEL_ID || !variantId) return;
    enqueueMeta(`view:${variantId}`, () => {
      void import("@/lib/meta/client").then((mod) => {
        mod.trackViewContent({
          currency,
          price: amount,
          productId,
          title,
          variantId,
        });
      });
    });
  }, [amount, currency, productId, title, variantId]);
  return null;
}

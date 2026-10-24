import { Suspense } from "react";

import { T } from "@/components/i18n/t";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { getProductRecommendations } from "@/lib/product/server";

function RelatedProductsSectionSkeleton({ limit }: { limit: number }) {
  return (
    <div className="grid gap-4">
      <h2 className="text-2xl sm:text-3xl">
        <T k="You May Also Like" />
      </h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: limit }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

async function Render({ handle, limit }: { handle: string; limit: number }) {
  const related = await getProductRecommendations({ handle, intent: "RELATED" });
  if (related.length === 0) return null;
  return (
    <div className="grid gap-4">
      <h2 className="text-2xl sm:text-3xl">
        <T k="You May Also Like" />
      </h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {related.slice(0, limit).map((product) => (
          <ProductCard key={product.id} product={product} outOfStockText="Out of Stock" />
        ))}
      </div>
    </div>
  );
}

export function RelatedProductsSection({ handle, limit }: { handle: string; limit: number }) {
  return (
    <Suspense fallback={<RelatedProductsSectionSkeleton limit={limit} />}>
      <Render handle={handle} limit={limit} />
    </Suspense>
  );
}

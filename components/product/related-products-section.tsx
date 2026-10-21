import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { getProductRecommendations } from "@/lib/product/server";
import { T } from "@/components/i18n/t";

function RelatedProductsSectionSkeleton({ limit }: { limit: number }) {
  return (
    <div className="grid gap-4">
      <h2 className="text-2xl sm:text-3xl"><T k="You May Also Like" /></h2>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
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
      <h2 className="text-2xl sm:text-3xl"><T k="You May Also Like" /></h2>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
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

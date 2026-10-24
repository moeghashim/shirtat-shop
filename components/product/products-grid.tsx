import { cn } from "cn";
import { Suspense } from "react";

import { T } from "@/components/i18n/t";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { Link } from "@/components/ui/link";
import { getT } from "@/lib/i18n/server";
import { getSearchIndexProducts } from "@/lib/product/server";

interface ProductsGridSkeletonProps {
  count: number;
  className?: string;
}

export function ProductsGridSkeleton({ count, className }: ProductsGridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface ProductsGridProps {
  collectionUrl?: string;
  eagerCount?: number;
  limit: number;
  title: string;
}

export function ProductsGrid({ collectionUrl, eagerCount = 0, limit, title }: ProductsGridProps) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl">
          <T k={title} />
        </h2>
        {collectionUrl && (
          <Link
            href={collectionUrl}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <T k="View All" />
          </Link>
        )}
      </div>
      <Suspense fallback={<ProductsGridSkeleton count={limit} />}>
        <ProductsGridContent eagerCount={eagerCount} limit={limit} outOfStockText="Out of Stock" />
      </Suspense>
    </div>
  );
}

async function ProductsGridContent({
  eagerCount,
  limit,
  outOfStockText,
}: {
  eagerCount: number;
  limit: number;
  outOfStockText: string;
}) {
  const t = await getT();
  // Use the search index (not the products connection) so these match the first items on /collections/all.
  const { products } = await getSearchIndexProducts({
    limit,
  });
  if (products.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          loading={index < eagerCount ? "eager" : "lazy"}
          product={product}
          outOfStockText={outOfStockText}
          quickShopText={t("Choose")}
        />
      ))}
    </div>
  );
}

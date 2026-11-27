import type { ProductFilter } from "@shopify/hydrogen";
import type { ProductSortKeys } from "@shopify/hydrogen/storefront-api-types";

import type { CommerceLocale } from "@/lib/config/types";
import type { Facets } from "@/lib/filters/types";
import type { ProductPage, ProductVariant } from "@/lib/product/types";

export type SearchIndexProductsParams = {
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: CommerceLocale;
  query?: string;
  sortKey?: string;
};

export type CollectionProductsParams = {
  collection: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: CommerceLocale;
  sortKey?: string;
};

export interface CollectionProductsResult extends ProductPage {
  facets: Facets;
}

export type ProductOptionValues = Map<string, Map<string, Set<string>>>;

export interface ProductVariantSelection {
  options: { name: string; values: string[] }[];
  variant?: ProductVariant;
}

export type SearchFacetsParams = {
  filters?: ProductFilter[];
  locale?: CommerceLocale;
  query?: string;
};

export type ProductIdsByQueryParams = {
  locale?: CommerceLocale;
  query: string;
  reverse?: boolean;
  sortKey: ProductSortKeys;
};

export type SearchFacetsResult = { facets: Facets; total: number };

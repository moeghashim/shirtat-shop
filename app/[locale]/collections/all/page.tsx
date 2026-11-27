import type { Metadata } from "next";

import { CollectionResults } from "@/components/collections/browse";
import {
  CollectionBrowseBoundary,
  SearchParamsProbe,
} from "@/components/collections/collection-page";
import { getAllProductsMetadata, getAllProductsResults } from "@/lib/collections/server";
import { getCommerceLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return getAllProductsMetadata();
}

export default async function AllProductsPage({
  searchParams,
}: PageProps<"/[locale]/collections/all">) {
  const locale = await getCommerceLocale();
  return (
    <CollectionBrowseBoundary>
      <CollectionResults results={getAllProductsResults({ locale })} />
      <SearchParamsProbe searchParams={searchParams} />
    </CollectionBrowseBoundary>
  );
}

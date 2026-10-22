import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { localizeCategory } from "@/lib/collections/categories";
import { describeCollection, PRODUCTS_PER_PAGE, resolveBrowseParams } from "@/lib/collections";
import type {
  BrowseResults,
  BrowseState,
  Collection,
  CollectionWithThumbnail,
} from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { commerceLocale, type Locale, translate } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { tagProducts } from "@/lib/product/server";
import { buildAlternates, buildOpenGraph, siteOgImages } from "@/lib/seo";
import {
  fetchCollection,
  fetchCollections,
  fetchCollectionsListing,
} from "@/lib/shopify/operations/collections/server";
import {
  fetchCollectionProducts,
  fetchSearchFacets,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";

// /collections/all is a local virtual collection with no Storefront API equivalent.
export const ALL_PRODUCTS_HANDLE = "all";

function tagCollections(collections: Array<{ handle: string }>): void {
  for (const collection of collections) {
    cacheTag(`collection-${collection.handle}`);
  }
}

// Bump to start a fresh remote cache entry when the collection set or its shaping changes.
const COLLECTIONS_CACHE_VERSION = 3;

export async function getCollections(
  params: { limit?: number; locale?: CommerceLocale } = {},
): Promise<Collection[]> {
  return getCollectionsCached({ ...params, v: COLLECTIONS_CACHE_VERSION });
}

async function getCollectionsCached({
  v: _v,
  ...params
}: { limit?: number; locale?: CommerceLocale; v: number }): Promise<Collection[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const collections = (await fetchCollections(params)).map((c) =>
    localizeCategory(c, params.locale?.language),
  );
  tagCollections(collections);
  return collections;
}

export async function getCollection(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<Collection | undefined> {
  return getCollectionCached({ ...params, v: COLLECTIONS_CACHE_VERSION });
}

async function getCollectionCached({
  v: _v,
  ...params
}: {
  handle: string;
  locale?: CommerceLocale;
  v: number;
}): Promise<Collection | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", `collection-${params.handle}`);

  const collection = await fetchCollection(params);
  return collection ? localizeCategory(collection, params.locale?.language) : collection;
}

export async function getCollectionsListing(
  params: { limit?: number; locale?: CommerceLocale } = {},
): Promise<CollectionWithThumbnail[]> {
  return getCollectionsListingCached({ ...params, v: COLLECTIONS_CACHE_VERSION });
}

async function getCollectionsListingCached({
  v: _v,
  ...params
}: {
  limit?: number;
  locale?: CommerceLocale;
  v: number;
}): Promise<CollectionWithThumbnail[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const collections = (await fetchCollectionsListing(params)).map((c) =>
    localizeCategory(c, params.locale?.language),
  );
  tagCollections(collections);
  // Thumbnails fall back to product imagery, so product updates must refresh the listing.
  tagProducts(
    collections.flatMap((collection) =>
      collection.thumbnailProductId ? [{ id: collection.thumbnailProductId }] : [],
    ),
  );
  return collections;
}

export async function readBrowseState(
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>,
): Promise<BrowseState> {
  return resolveBrowseParams(recordToSearchParams(await searchParamsPromise));
}

function recordToSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

// The default view, unfiltered and in its default sort: "minutes" bounds Search & Discovery edits, which send no webhook, and Load more's product dedupe absorbs cursor drift.
export async function getCollectionResults(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<BrowseResults> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("collections", `collection-${params.handle}`, "products-index");

  const { facets, pageInfo, products } = await fetchCollectionProducts({
    collection: params.handle,
    limit: PRODUCTS_PER_PAGE,
    locale: params.locale,
  });
  tagProducts(products);
  return {
    dataSearch: "",
    facets,
    pageInfo,
    products,
    source: { collection: params.handle, type: "collection" },
  };
}

export async function getAllProductsResults(
  params: { locale?: CommerceLocale } = {},
): Promise<BrowseResults> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("products-index");

  const [{ pageInfo, products }, { facets, total }] = await Promise.all([
    fetchSearchIndexProducts({ limit: PRODUCTS_PER_PAGE, locale: params.locale }),
    fetchSearchFacets({ locale: params.locale }),
  ]);
  tagProducts(products);
  return { dataSearch: "", facets, pageInfo, products, source: { type: "search" }, total };
}

// Filtered and sorted views stay live; a cache entry per combination would rarely be reused.
export async function fetchCollectionResults({
  handle,
  statePromise,
}: {
  handle: string;
  statePromise: Promise<BrowseState>;
}): Promise<BrowseResults> {
  const { dataSearch, filters, sort } = await statePromise;
  const { facets, pageInfo, products } = await fetchCollectionProducts({
    collection: handle,
    filters,
    limit: PRODUCTS_PER_PAGE,
    sortKey: sort,
  });
  return {
    dataSearch,
    facets,
    pageInfo,
    products,
    source: { collection: handle, type: "collection" },
  };
}

export async function getAllProductsCollection(locale: Locale = "en"): Promise<Collection> {
  const title = translate(locale, "Products");
  const description = "";
  return {
    handle: ALL_PRODUCTS_HANDLE,
    title,
    description,
    image: null,
    path: `/collections/${ALL_PRODUCTS_HANDLE}`,
    seo: {
      description: `Browse every product at ${shopConfig.site.name}: compare prices and check availability.`,
      title,
    },
  };
}

function browseMetadata(
  handle: string,
  title: string,
  description: string,
  locale: Locale = "en",
): Metadata {
  const url = `/collections/${handle}`;
  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathname: url }),
    openGraph: buildOpenGraph({ locale, title, description, url, type: "website" }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: siteOgImages(locale),
    },
  };
}

export async function getCollectionMetadata(handle: string): Promise<Metadata> {
  const locale = await getLocale();
  const collection = await getCollection({ handle, locale: commerceLocale(locale) });
  if (!collection) {
    return browseMetadata(
      handle,
      translate(locale, "Collection"),
      translate(locale, "Browse collection products."),
      locale,
    );
  }
  return browseMetadata(
    collection.handle,
    collection.seo.title,
    describeCollection(collection),
    locale,
  );
}

export async function getAllProductsMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return browseMetadata(
    ALL_PRODUCTS_HANDLE,
    translate(locale, "Products"),
    describeCollection(await getAllProductsCollection(locale)),
    locale,
  );
}

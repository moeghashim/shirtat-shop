import { gql } from "@shopify/hydrogen";
import { cacheLife, cacheTag } from "next/cache";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import { senatorSlots } from "@/lib/home/senator";
import type { SenatorSlot } from "@/lib/home/senator";
import { localizeProductTitle } from "@/lib/i18n/product";
import { tagProducts } from "@/lib/product/server";
import { fetchSenatorCampaignProducts } from "@/lib/shopify/operations/products/server";
import { storefront } from "@/lib/shopify/storefront/server";

const HOME_PRODUCTS_QUERY = gql(/* GraphQL */ `
  query homeProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 100, sortKey: CREATED_AT, reverse: true) {
      nodes {
        featuredImage {
          altText
          url
        }
        handle
        media(first: 10) {
          nodes {
            ... on MediaImage {
              image {
                altText
                height
                url
                width
              }
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        productType
        tags
        title
      }
    }
  }
`);

export interface HomeProduct {
  handle: string;
  /** Card gallery: featured image first, then the hover image (design art, else on-model photo, else next image). */
  gallery: { altText: string; height: number; url: string; width: number }[];
  image: { altText: string | null; url: string } | null;
  price: { amount: string; currencyCode: string };
  productType: string;
  tags: string[];
  title: string;
}

/** Active products visible to the storefront, newest first (used for homepage tiles and spotlight). */
export async function getHomeProducts(
  locale: CommerceLocale = shopConfig.localization,
): Promise<HomeProduct[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", "products-index");

  if (
    !process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    !process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
  ) {
    return [];
  }
  try {
    const { data } = await storefront.request(HOME_PRODUCTS_QUERY, { locale });
    return (data?.products.nodes ?? [])
      .filter((product) => !product.tags.includes("example"))
      .map((product) => ({
        gallery: homeGallery(
          product.featuredImage,
          product.media.nodes.flatMap((node) =>
            "image" in node && node.image ? [{ image: node.image }] : [],
          ),
        ),
        handle: product.handle,
        image: product.featuredImage,
        price: product.priceRange.minVariantPrice,
        productType: product.productType,
        tags: product.tags,
        title: product.title,
      }));
  } catch {
    return [];
  }
}

const DESIGN_ALT = /\b(design|artwork|calligraphy)\b/i;
const LIFESTYLE_ALT = /\bmodel wearing\b/i;

export async function getSenatorCampaignSlots(
  locale: CommerceLocale,
): Promise<SenatorSlot<HomeProduct>[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", "products-index", "collection-politics");

  const products = await fetchSenatorCampaignProducts({ locale });
  const slots = senatorSlots(products);
  tagProducts(slots.flatMap((slot) => (slot.product ? [slot.product] : [])));
  const language = locale.language === "AR" ? "ar" : "en";
  return slots.map((slot) => ({
    id: slot.id,
    label: slot.label,
    product: slot.product
      ? {
          gallery: [],
          handle: slot.product.handle,
          image: slot.product.image
            ? { altText: slot.product.image.altText, url: slot.product.image.url }
            : null,
          price: slot.product.price,
          productType: slot.product.productType,
          tags: slot.product.tags,
          title: localizeProductTitle(slot.product.title, language),
        }
      : null,
  }));
}

function homeGallery(
  featured: { altText: string | null; url: string } | null,
  nodes: {
    image?: { altText: string | null; height: number | null; url: string; width: number | null };
  }[],
): HomeProduct["gallery"] {
  const base = (u: string) => u.split("?")[0];
  const imgs = nodes.flatMap((n) =>
    n.image
      ? [
          {
            altText: n.image.altText ?? "",
            height: n.image.height ?? 1,
            url: n.image.url,
            width: n.image.width ?? 1,
          },
        ]
      : [],
  );
  const first = featured ? imgs.find((i) => base(i.url) === base(featured.url)) : undefined;
  const rest = imgs.filter((i) => i !== first);
  let h = rest.findIndex((i) => DESIGN_ALT.test(i.altText));
  if (h < 0) h = rest.findIndex((i) => LIFESTYLE_ALT.test(i.altText));
  if (h > 0) rest.unshift(...rest.splice(h, 1));
  return first ? [first, ...rest] : rest;
}

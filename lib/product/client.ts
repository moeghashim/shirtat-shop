"use client";

import { createProductComponents } from "@shopify/hydrogen/react";
import { getImageProps } from "next/image";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { preload } from "react-dom";

import type { Image } from "@/lib/media/types";

import type {
  ProductFormInput,
  RecentlyViewedProduct,
  SelectedOption,
  SelectedOptions,
} from "./types";

export const { ProductProvider, useProduct, useProductForm } =
  createProductComponents<ProductFormInput>();

interface ProductSelection {
  select: (options: readonly SelectedOption[]) => void;
  selected: SelectedOptions | null;
}

const ProductSelectionContext = createContext<ProductSelection | null>(null);

// Null until the shopper picks an option. The first paint keeps the server-resolved selection.
export function ProductSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<SelectedOptions | null>(null);
  const select = useCallback((options: readonly SelectedOption[]) => {
    const next: SelectedOptions = {};
    for (const option of options) next[option.name] = option.value;
    setSelected(next);
  }, []);
  const value = useMemo(() => ({ select, selected }), [select, selected]);
  return createElement(ProductSelectionContext.Provider, { value }, children);
}

export function useProductSelection(): ProductSelection | null {
  return useContext(ProductSelectionContext);
}

// The hidden breakpoint's copy uses a 32px slot so it does not download a second hero.
export const PRODUCT_MOBILE_HERO_SIZES = "(min-width: 1024px) 32px, 100vw";
export const PRODUCT_DESKTOP_HERO_SIZES =
  "(max-width: 1023px) 32px, (min-width: 1536px) 858px, 55vw";
const DESKTOP_MEDIA = "(min-width: 1024px)";

const knownImages = new Map<string, Image>();

function heroSizes(slot: "desktop" | "mobile"): string {
  return slot === "mobile" ? PRODUCT_MOBILE_HERO_SIZES : PRODUCT_DESKTOP_HERO_SIZES;
}

// The preload must share the <img>'s srcset and sizes, or the browser downloads the tile twice.
export function preloadProductHero(
  image: Image,
  slot: "desktop" | "mobile",
  priority: "high" | "low" = "high",
): void {
  const { props } = getImageProps({
    alt: "",
    height: image.height,
    sizes: heroSizes(slot),
    src: image.url,
    width: image.width,
  });
  preload(props.src, {
    as: "image",
    fetchPriority: priority,
    imageSizes: props.sizes,
    imageSrcSet: props.srcSet,
    media: slot === "mobile" ? "(max-width: 1023px)" : DESKTOP_MEDIA,
  });
}

export function rememberProductImages(images: readonly Image[]): void {
  for (const image of images) {
    if (image.width > 0 && image.height > 0) knownImages.set(image.url, image);
  }
}

export function prefetchProductImage(url: string | undefined): void {
  const image = url ? knownImages.get(url) : undefined;
  if (!image) return;
  preloadProductHero(image, "mobile", "low");
  preloadProductHero(image, "desktop", "low");
}

const RECENTLY_VIEWED_KEY = "template-recently-viewed-v1";
const RECENTLY_VIEWED_LIMIT = 4;

function readRecentlyViewedProducts(): RecentlyViewedProduct[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "null");
    return Array.isArray(stored)
      ? (stored as RecentlyViewedProduct[]).slice(0, RECENTLY_VIEWED_LIMIT)
      : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewedProduct(product: RecentlyViewedProduct): void {
  try {
    const previous = readRecentlyViewedProducts().filter((item) => item.handle !== product.handle);
    localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify([product, ...previous].slice(0, RECENTLY_VIEWED_LIMIT)),
    );
  } catch {
    /* The overlay still works without browser storage. */
  }
}

// Re-read on each open: the overlay outlives navigation, so a product page may have recorded a view since last time.
export function useRecentlyViewedProducts(open: boolean): RecentlyViewedProduct[] {
  const [state, setState] = useState({ open: false, products: [] as RecentlyViewedProduct[] });
  if (state.open !== open) {
    setState({ open, products: open ? readRecentlyViewedProducts() : [] });
  }
  return state.products;
}

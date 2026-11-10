"use client";

import { cn } from "cn";
import Image, { getImageProps } from "next/image";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { preload } from "react-dom";

import { AutoPlayVideo } from "@/components/ui/auto-play-video";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { useLocale, useT } from "@/lib/i18n/client";
import { describeProductImage } from "@/lib/i18n/product";
import type { Image as ImageType, Video } from "@/lib/media/types";

import { Lightbox, LightboxTrigger } from "./lightbox";

const ProductImageContext = createContext<{ colors: Record<string, string>; title: string }>({
  colors: {},
  title: "",
});

function useImageCaption(image: ImageType): string {
  const locale = useLocale();
  const { colors, title } = useContext(ProductImageContext);
  return describeProductImage({
    altText: image.altText,
    color: colors[image.url],
    locale,
    title,
  });
}

type MediaItem =
  | { type: "image"; image: ImageType }
  | { type: "placeholder" }
  | { type: "video"; video: Video };

function mediaKey(item: MediaItem) {
  if (item.type === "image") return item.image.url;
  if (item.type === "video") return item.video.url;
  return "placeholder";
}

// `preload` alone does not set high fetch priority; other images stay lazy so the hidden carousel or grid never downloads.
const LCP_IMAGE_PROPS = { fetchPriority: "high", loading: "eager", preload: true } as const;

const LAZY_IMAGE_PROPS = { loading: "lazy" } as const;

// Tailwind `lg`, where the 2x2 grid replaces the carousel.
const DESKTOP_MEDIA = "(min-width: 1024px)";
// The 2x2 grid is above the fold, so desktop preloads every tile while the lazy <img> keeps mobile from fetching them.
const DESKTOP_GRID_PRELOAD_COUNT = 4;

// The preload must share the <img>'s srcset and sizes, or the browser downloads the tile twice.
function preloadDesktopGridImage(image: ImageType) {
  const { props } = getImageProps({
    src: image.url,
    alt: "",
    fill: true,
    sizes: "100vw",
  });
  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    media: DESKTOP_MEDIA,
  });
}

function MediaImage({
  item,
  title,
  idx,
  priority,
  className,
}: {
  item: Extract<MediaItem, { type: "image" }>;
  title: string;
  idx: number;
  priority: boolean;
  className?: string;
}) {
  const caption = useImageCaption(item.image);
  return (
    <Image
      src={item.image.url}
      alt={caption || `${title} ${idx + 1}`}
      height={item.image.height}
      width={item.image.width}
      className={cn("absolute inset-0 size-full object-cover", className)}
      sizes="(min-width: 1024px) 50vw, 100vw"
      {...(priority ? LCP_IMAGE_PROPS : LAZY_IMAGE_PROPS)}
      draggable={false}
    />
  );
}

function MediaVideo({
  item,
  priority,
  className,
}: {
  item: Extract<MediaItem, { type: "video" }>;
  priority: boolean;
  className?: string;
}) {
  const preview = item.video.previewImage;
  const caption = useImageCaption(
    preview ?? { altText: "", height: 0, url: item.video.url, width: 0 },
  );
  return (
    <AutoPlayVideo
      src={item.video.url}
      previewImage={
        preview
          ? {
              src: preview.url,
              alt: caption,
            }
          : null
      }
      previewImageFetchPriority={priority ? "high" : "auto"}
      previewImageLoading={priority ? "eager" : "lazy"}
      className={cn("h-full w-full scale-[1.04] object-cover", className)}
    />
  );
}

function Carousel({
  mediaItems,
  title,
  hasColorSlot,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  hasColorSlot: boolean;
  children?: ReactNode;
}) {
  const t = useT();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [itemCount, setItemCount] = useState(mediaItems.length);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const scrollToImage = (index: number) => {
    if (!container) return;
    container.scrollTo({
      left: index * container.offsetWidth,
      behavior: "smooth",
    });
    setSelectedIndex(index);
  };
  useEffect(() => {
    if (!container) return;

    // Variant/video items arrive via slot children, so count the rendered DOM, not just mediaItems.
    const sync = () => {
      const width = container.offsetWidth;
      if (width === 0) return;
      const total = Math.max(1, container.children.length);
      setItemCount(total);
      setSelectedIndex(Math.min(Math.max(0, Math.round(container.scrollLeft / width)), total - 1));
    };

    // New media set: snap back to the first slide before observers take over.
    container.scrollTo({ left: 0 });
    sync();

    // The colour slot is the first slide; when the colour changes, jump back to it.
    let firstSrc = container.querySelector("img")?.getAttribute("src");
    const onMutate = () => {
      const src = container.querySelector("img")?.getAttribute("src");
      if (src && src !== firstSrc) {
        firstSrc = src;
        container.scrollTo({ left: 0, behavior: "smooth" });
      }
      sync();
    };

    container.addEventListener("scroll", sync, { passive: true });
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(onMutate);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });

    return () => {
      container.removeEventListener("scroll", sync);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [container]);
  return (
    <div className="grid gap-5">
      <div
        ref={setContainer}
        data-slot="pdp-carousel"
        className="relative overflow-x-auto flex snap-x snap-mandatory overscroll-x-contain scrollbar-hide -mx-5 w-[calc(100%+2.5rem)]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
        {mediaItems.map((item, idx) => {
          const priority = !hasColorSlot && idx === 0;
          return (
            <div
              key={mediaKey(item)}
              className="relative shrink-0 w-full snap-start snap-always overflow-hidden aspect-square"
            >
              {item.type === "video" ? (
                <MediaVideo item={item} priority={priority} />
              ) : item.type === "placeholder" ? (
                <ImagePlaceholder className="size-full" />
              ) : (
                <MediaImage item={item} title={title} idx={idx} priority={priority} />
              )}
            </div>
          );
        })}
      </div>

      {/* Dot indicators – reserve space but hide when there's only one image */}
      <div className={cn("flex justify-center", itemCount <= 1 && "invisible")}>
        {Array.from({ length: itemCount }, (_, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => scrollToImage(idx)}
            className="group flex h-6 min-w-6 items-center justify-center px-1"
            aria-label={t("Go to image {n}", { n: idx + 1 })}
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === selectedIndex
                  ? "bg-foreground w-8"
                  : "bg-muted-foreground/30 w-1.5 group-hover:bg-muted-foreground/50",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function GridItem({
  item,
  title,
  idx,
  priority,
}: {
  item: MediaItem;
  title: string;
  idx: number;
  priority: boolean;
}) {
  return (
    <div className="relative w-full overflow-hidden aspect-square">
      {item.type === "video" ? (
        <MediaVideo item={item} priority={priority} />
      ) : item.type === "placeholder" ? (
        <ImagePlaceholder className="size-full" />
      ) : (
        <CaptionedLightbox item={item} title={title} idx={idx} priority={priority} />
      )}
    </div>
  );
}

function Grid({
  mediaItems,
  title,
  hasColorSlot,
  interactive = true,
  children,
}: {
  mediaItems: MediaItem[];
  title: string;
  hasColorSlot: boolean;
  interactive?: boolean;
  children?: ReactNode;
}) {
  // The color slot (children) occupies the first tile when present.
  const firstTileOffset = hasColorSlot ? 1 : 0;
  for (const [idx, item] of mediaItems.entries()) {
    const tile = idx + firstTileOffset;
    if (tile >= DESKTOP_GRID_PRELOAD_COUNT) break;
    // Tile 0 is the LCP image and already preloaded via next/image's `preload` prop.
    if (tile > 0 && item.type === "image") preloadDesktopGridImage(item.image);
  }

  const grid = (
    // Main image spans the full width; the rest sit below as a thumbnail strip.
    <div className="grid grid-cols-4 gap-2.5 [&>*:first-child]:col-span-4 [&>*:not(:first-child)]:rounded-lg [&>*:first-child]:rounded-xl">
      {children}
      {mediaItems.map((item, idx) => (
        <GridItem
          key={mediaKey(item)}
          item={item}
          title={title}
          idx={idx}
          priority={!hasColorSlot && idx === 0}
        />
      ))}
    </div>
  );

  return interactive ? <Lightbox label={title}>{grid}</Lightbox> : grid;
}

function CaptionedLightbox({
  idx,
  item,
  priority,
  title,
}: {
  idx: number;
  item: Extract<MediaItem, { type: "image" }>;
  priority: boolean;
  title: string;
}) {
  const caption = useImageCaption(item.image);
  return (
    <LightboxTrigger image={{ ...item.image, altText: caption }}>
      <MediaImage item={item} title={title} idx={idx} priority={priority} />
    </LightboxTrigger>
  );
}

export function ColorImageGrid({ images, title }: { images: ImageType[]; title: string }) {
  return images.map((image, idx) => (
    <GridItem
      key={image.url}
      item={{ type: "image", image }}
      title={title}
      idx={idx}
      priority={idx === 0}
    />
  ));
}

function CaptionedCarouselImage({ idx, image }: { idx: number; image: ImageType }) {
  const caption = useImageCaption(image);
  return (
    <Image
      src={image.url}
      alt={caption}
      height={image.height}
      width={image.width}
      className="absolute inset-0 size-full object-cover"
      sizes="(min-width: 1024px) 50vw, 100vw"
      {...(idx === 0 ? LCP_IMAGE_PROPS : LAZY_IMAGE_PROPS)}
      draggable={false}
    />
  );
}

export function ColorImageCarouselItems({ images }: { images: ImageType[]; title: string }) {
  return images.map((image, idx) => (
    <div
      key={image.url}
      className="relative shrink-0 w-full snap-start snap-always overflow-hidden aspect-square"
    >
      <CaptionedCarouselImage image={image} idx={idx} />
    </div>
  ));
}

export function ProductMedia({
  colors = {},
  otherImages,
  videos,
  title,
  className,
  desktopSlot,
  mobileSlot,
}: {
  colors?: Record<string, string>;
  otherImages: ImageType[];
  videos: Video[];
  title: string;
  className?: string;
  desktopSlot?: ReactNode;
  mobileSlot?: ReactNode;
}) {
  const sharedMediaItems: MediaItem[] = [
    ...videos.map((video): MediaItem => ({ type: "video", video })),
    ...otherImages.map((image): MediaItem => ({ type: "image", image })),
  ];

  const hasColorSlot = !!mobileSlot || !!desktopSlot;
  const isEmpty = sharedMediaItems.length === 0 && !hasColorSlot;
  const mediaItems: MediaItem[] = isEmpty ? [{ type: "placeholder" }] : sharedMediaItems;

  return (
    <ProductImageContext.Provider value={{ colors, title }}>
      <div className={className}>
        <div className="lg:hidden">
          <Carousel
            key={mediaItems.map(mediaKey).join(",")}
            mediaItems={mediaItems}
            title={title}
            hasColorSlot={hasColorSlot}
          >
            {mobileSlot}
          </Carousel>
        </div>
        <div className="hidden lg:block">
          <Grid
            mediaItems={mediaItems}
            title={title}
            hasColorSlot={hasColorSlot}
            interactive={!isEmpty}
          >
            {desktopSlot}
          </Grid>
        </div>
      </div>
    </ProductImageContext.Provider>
  );
}

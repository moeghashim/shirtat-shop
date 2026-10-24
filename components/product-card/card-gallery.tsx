"use client";

import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { useLocale } from "@/lib/i18n/client";
import type { Image as ImageType } from "@/lib/media/types";

interface CardGalleryProps {
  alt: string;
  children?: ReactNode;
  images: ImageType[];
  loading?: "eager" | "lazy";
}

const DESIGN_ALT = /\b(design|artwork|calligraphy)\b/i;
const SIZES = "(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw";

// The first image is the only one in the initial HTML; the rest mount on hover/focus intent.
export function CardGallery({ alt, children, images, loading = "lazy" }: CardGalleryProps) {
  const isAr = useLocale().startsWith("ar");
  const [armed, setArmed] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  // The stretched title link overlays the image, so hover intent is read from the whole card.
  useEffect(() => {
    const card = ref.current?.closest("article");
    if (!card) return;
    const enter = (e: PointerEvent) => e.pointerType === "mouse" && setArmed(true);
    const leave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setArmed(false);
      setIndex(null);
    };
    // Touch: the first tap on the card reveals the hover image (the flat design); the next tap opens the product.
    let touch = false;
    const down = (e: PointerEvent) => {
      touch = e.pointerType !== "mouse";
    };
    const click = (e: MouseEvent) => {
      if (!touch || revealed.current || images.length < 2) return;
      const target = e.target as HTMLElement;
      if (target.closest("button") || !target.closest("a")) return;
      e.preventDefault();
      e.stopPropagation();
      revealed.current = true;
      setArmed(true);
      window.dispatchEvent(new CustomEvent("card-reveal", { detail: card }));
    };
    const other = (e: Event) => {
      if ((e as CustomEvent).detail === card) return;
      revealed.current = false;
      setArmed(false);
      setIndex(null);
    };
    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);
    card.addEventListener("pointerdown", down);
    card.addEventListener("click", click, true);
    window.addEventListener("card-reveal", other);
    return () => {
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
      card.removeEventListener("pointerdown", down);
      card.removeEventListener("click", click, true);
      window.removeEventListener("card-reveal", other);
    };
  }, [images.length]);
  const count = images.length;
  const first = images[0];
  if (!first) return null;
  const shown = index ?? (armed && count > 1 ? 1 : 0);
  const step = (delta: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setArmed(true);
    setIndex((shown + delta + count) % count);
  };

  return (
    <div
      ref={ref}
      className="group/gallery absolute inset-0"
      onFocus={() => setArmed(true)}
    >
      {images.map((img, i) =>
        i === 0 || (armed && (i === shown || i === 1)) ? (
          <Image
            key={img.url}
            src={img.url}
            alt={i === 0 ? alt : img.altText || alt}
            fill
            sizes={SIZES}
            loading={i === 0 ? loading : "eager"}
            className={cn(
              // Multiply blends white mockup backgrounds into the card's grey tile.
              DESIGN_ALT.test(img.altText) && i > 0
                ? "object-contain p-[12%] transition-opacity duration-300"
                : "object-cover mix-blend-multiply transition-opacity duration-300",
              i === 0 ? "" : "absolute inset-0",
              i === shown ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null,
      )}
      {count > 1 ? (
        <div className="pointer-events-none absolute inset-x-2 top-1/2 z-10 flex -translate-y-1/2 justify-between opacity-0 transition-opacity [@media(hover:hover)]:group-hover/card:opacity-100 group-focus-within/gallery:opacity-100">
          <button
            type="button"
            aria-label={isAr ? "الصورة السابقة" : "Previous image"}
            onClick={step(-1)}
            className="pointer-events-auto flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background focus-visible:outline-2 [@media(hover:none)]:pointer-events-none [@media(hover:none)]:group-focus-within/gallery:pointer-events-auto"
          >
            <ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={isAr ? "الصورة التالية" : "Next image"}
            onClick={step(1)}
            className="pointer-events-auto flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background focus-visible:outline-2 [@media(hover:none)]:pointer-events-none [@media(hover:none)]:group-focus-within/gallery:pointer-events-auto"
          >
            <ChevronRightIcon className="size-4 rtl:rotate-180" aria-hidden />
          </button>
        </div>
      ) : null}
      {children}
    </div>
  );
}

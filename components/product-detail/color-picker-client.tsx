"use client";

import type { ComponentProps, MouseEvent } from "react";

import { Link } from "@/components/ui/link";
import { prefetchProductImage } from "@/lib/product/client";

type ColorOptionLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onClick"> & {
  href: string;
  image?: string;
  onSelect?: () => void;
};

export function ColorOptionLink({ href, image, onSelect, ...props }: ColorOptionLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (
          !onSelect ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        onSelect();
      }}
      onFocus={(event) => {
        prefetchProductImage(image);
        props.onFocus?.(event);
      }}
      onPointerEnter={(event) => {
        prefetchProductImage(image);
        props.onPointerEnter?.(event);
      }}
    />
  );
}

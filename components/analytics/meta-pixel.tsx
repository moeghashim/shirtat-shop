"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/lib/cart/client";
import { metaIsLive, subscribeMetaLive } from "@/lib/meta/queue";

const ENGAGE = ["keydown", "pointerdown", "touchstart"] as const;

interface PendingAdd {
  currency?: string;
  price?: string;
  quantity: number;
  title?: string;
  variantId?: string;
}

// The pixel id is set on preview, so the tag waits for a key, pointer, or touch and stays off automated Chrome.
export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const [live, setLive] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const router = useRouter();
  const started = useRef(false);
  const pendingAdds = useRef<PendingAdd[]>([]);
  const quantities = useRef<Map<string, number> | null>(null);
  const cart = useCart((state) => state.data);
  const loading = useCart((state) => state.loading);
  const pendingLines = useCart((state) => state.pending.lines.size);

  useEffect(
    () =>
      subscribeMetaLive(() => {
        setLive(true);
        const queued = pendingAdds.current.splice(0);
        if (!queued.length) return;
        void import("@/lib/meta/client").then((mod) => {
          for (const add of queued) mod.trackAddToCart(add);
        });
      }),
    [],
  );

  useEffect(() => {
    if (!pixelId || navigator.webdriver) return;
    const start = () => {
      if (started.current) return;
      started.current = true;
      for (const name of ENGAGE) window.removeEventListener(name, start);
      void import("@/lib/meta/client").then((mod) => {
        mod.beginMeta((url) => router.push(url));
      });
    };
    for (const name of ENGAGE) window.addEventListener(name, start, { once: true, passive: true });
    return () => {
      for (const name of ENGAGE) window.removeEventListener(name, start);
    };
  }, [pixelId, router]);

  useEffect(() => {
    if (loading) return;
    const next = new Map<string, number>();
    const adds: PendingAdd[] = [];
    for (const line of cart.lines.nodes) {
      next.set(line.id, line.quantity);
      const previous = quantities.current?.get(line.id) ?? 0;
      const delta = line.quantity - previous;
      if (!quantities.current || delta <= 0 || pendingLines > 0) continue;
      adds.push({
        currency: line.cost.amountPerQuantity.currencyCode,
        price: line.cost.amountPerQuantity.amount,
        quantity: delta,
        title: line.merchandise?.product.title,
        variantId: line.merchandise?.id,
      });
    }
    if (!quantities.current) {
      quantities.current = next;
      return;
    }
    if (pendingLines > 0) return;
    quantities.current = next;
    if (!adds.length) return;
    if (!metaIsLive()) {
      pendingAdds.current.push(...adds);
      return;
    }
    void import("@/lib/meta/client").then((mod) => {
      for (const add of adds) mod.trackAddToCart(add);
    });
  }, [cart, loading, pendingLines]);

  useEffect(() => {
    if (!live) return;
    const url = `${window.location.origin}${pathname}${search ? `?${search}` : ""}`;
    void import("@/lib/meta/client").then((mod) => mod.trackPageView(url));
  }, [live, pathname, search]);

  return null;
}

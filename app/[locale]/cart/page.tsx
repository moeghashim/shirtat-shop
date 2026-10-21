import type { Metadata } from "next";
import { Suspense } from "react";

import { CartViewedTracker } from "@/components/analytics/trackers";
import { CartPageContent, CartPageSkeleton } from "@/components/cart/cart-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Cart"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function CartPage() {
  return (
    <>
      <CartViewedTracker />
      <Suspense fallback={<CartPageSkeleton />}>
        <CartPageContent />
      </Suspense>
    </>
  );
}

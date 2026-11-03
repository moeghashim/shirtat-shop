import { HandbagIcon } from "lucide-react";

import { T } from "@/components/i18n/t";
import { getCart } from "@/lib/cart/server";
import { getT } from "@/lib/i18n/server";
import { withFallback } from "@/lib/shopify/errors/server";

import { CartIconClient } from "./cart-client";

export async function CartIcon() {
  const t = await getT();
  const cart = await withFallback(getCart(), undefined);
  return <CartIconClient cartLabel={t("Cart")} initialCart={cart ?? null} />;
}

export function CartIconFallback() {
  return (
    <span className="flex items-center justify-center gap-1.5 text-foreground">
      <HandbagIcon className="size-5" />
      <span className="sr-only">
        <T k="Cart" />
      </span>
    </span>
  );
}

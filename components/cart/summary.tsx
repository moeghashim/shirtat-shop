"use client";

import type { CartData } from "@shopify/hydrogen";
import { Loader2 } from "lucide-react";

import { T } from "@/components/i18n/t";
import { Price } from "@/components/product/price";
import { Button } from "@/components/ui/button";
import { useCart, useCheckout } from "@/lib/cart/client";
import { useT } from "@/lib/i18n/client";

import { DiscountForm } from "./discount-form";

interface CartSummaryProps {
  cart: CartData;
}

export function CartSummary({ cart }: CartSummaryProps) {
  const t = useT();
  return (
    <div className="grid gap-5">
      <div className="grid gap-2.5">
        <DiscountForm cart={cart} />
        <CartTotal cart={cart} />
      </div>
      <CartCheckout label={t("Go to Checkout")} />
    </div>
  );
}

interface CartTotalProps {
  cart: CartData;
}

export function CartTotal({ cart }: CartTotalProps) {
  const t = useT();
  const isCostPending = useCart((state) =>
    Boolean(state.loading || state.pending.cost || state.revalidating),
  );
  const { amount, currencyCode } = cart.cost.totalAmount;
  return (
    <div
      aria-busy={isCostPending || undefined}
      aria-label={t("Estimated total")}
      className="grid gap-1"
      role="group"
    >
      <div className="flex items-baseline justify-between text-base text-foreground">
        <span>
          <T k="Estimated total" />
        </span>
        {isCostPending || !currencyCode ? (
          <span className="font-medium text-muted-foreground text-xl">
            <T k="Updating…" />
          </span>
        ) : (
          <Price amount={amount} className="font-medium text-xl" currencyCode={currencyCode} />
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        <T k="Taxes and shipping calculated at checkout." />
      </p>
    </div>
  );
}

interface CartCheckoutProps {
  label?: string;
}

export function CartCheckout({ label: labelProp }: CartCheckoutProps) {
  const t = useT();
  const label = labelProp ?? t("Checkout");
  const {
    checkoutError,
    checkoutErrorId,
    handleCheckout,
    isCheckingOut,
    isCheckoutDisabled,
    isUpdatingCart,
  } = useCheckout();
  return (
    <div className="grid gap-2.5">
      <Button
        aria-busy={isCheckingOut || isUpdatingCart || undefined}
        aria-describedby={checkoutError ? checkoutErrorId : undefined}
        className="h-12 w-full justify-center"
        disabled={isCheckoutDisabled}
        onClick={handleCheckout}
        type="button"
      >
        {isCheckingOut || isUpdatingCart ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {isCheckingOut ? "Redirecting..." : isUpdatingCart ? "Updating cart..." : label}
      </Button>
      {checkoutError ? (
        <p className="text-xs text-destructive" id={checkoutErrorId} role="alert">
          {checkoutError}
        </p>
      ) : null}
    </div>
  );
}

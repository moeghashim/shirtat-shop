"use client";

import { createCartComponents } from "@shopify/hydrogen/react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { useAgentCartPending } from "@/lib/agent/cart/client";
import { prepareCheckoutAction } from "@/lib/cart/action";

import type { cartHandlers } from "./request";

export const { CartProvider, useCart, useCartActions, useCartForm, useSuspenseCart } =
  createCartComponents<typeof cartHandlers>();

export function useCheckout() {
  const agentPending = useAgentCartPending();
  const cartState = useCart((state) => state);
  const { data: cart, loading, pending, revalidating } = cartState;
  const isUpdatingCart = Boolean(
    agentPending ||
    loading ||
    revalidating ||
    pending.attributes ||
    pending.cost ||
    pending.discountCodes.size ||
    pending.lines.size ||
    pending.note,
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const checkoutErrorId = useId();
  const attempt = useRef<object | null>(null);
  const latestCartState = useRef(cartState);
  const isCheckoutDisabled = isUpdatingCart || isCheckingOut || !cart.lines.nodes.length;

  useLayoutEffect(() => {
    latestCartState.current = cartState;
    if (attempt.current && isUpdatingCart) {
      attempt.current = null;
      setIsCheckingOut(false);
      setCheckoutError(
        "Your cart changed. Wait for it to finish updating, then try checkout again.",
      );
    }
  }, [cartState, isUpdatingCart]);

  useEffect(() => {
    const resetCheckout = () => {
      attempt.current = null;
      setIsCheckingOut(false);
      setCheckoutError(null);
    };
    window.addEventListener("pageshow", resetCheckout);
    return () => {
      attempt.current = null;
      window.removeEventListener("pageshow", resetCheckout);
    };
  }, []);

  async function handleCheckout() {
    if (isCheckoutDisabled || attempt.current) return;
    const currentAttempt = {};
    attempt.current = currentAttempt;
    setCheckoutError(null);
    setIsCheckingOut(true);

    try {
      const { checkoutUrl } = await prepareCheckoutAction();
      if (attempt.current !== currentAttempt) return;
      if (latestCartState.current.data !== cart) {
        setCheckoutError("Your cart changed. Please try checkout again.");
      } else if (!checkoutUrl) {
        setCheckoutError("Checkout is unavailable. Refresh your cart and try again.");
      } else {
        if (process.env.NEXT_PUBLIC_META_PIXEL_ID) {
          try {
            const { beginMeta, trackInitiateCheckout, whenConsentKnown } =
              await import("@/lib/meta/client");
            if (attempt.current !== currentAttempt) return;
            beginMeta();
            await whenConsentKnown(1000);
            if (attempt.current !== currentAttempt) return;
            trackInitiateCheckout({
              currency: cart.cost.totalAmount.currencyCode,
              lines: cart.lines.nodes.map((line) => ({
                price: line.cost.amountPerQuantity.amount,
                quantity: line.quantity,
                variantId: line.merchandise?.id,
              })),
              value: cart.cost.totalAmount.amount,
            });
          } catch {
            if (attempt.current !== currentAttempt) return;
          }
        }
        if (attempt.current !== currentAttempt) return;
        window.location.href = checkoutUrl;
        return;
      }
    } catch {
      if (attempt.current !== currentAttempt) return;
      setCheckoutError("We couldn't start checkout. Please try again.");
    }

    attempt.current = null;
    setIsCheckingOut(false);
  }

  return {
    checkoutError,
    checkoutErrorId,
    handleCheckout,
    isCheckingOut,
    isCheckoutDisabled,
    isUpdatingCart,
  };
}

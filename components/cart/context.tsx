"use client";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { CartProvider, useCart, useCartActions } from "@/lib/cart/client";
import { isSupportedCountry } from "@/lib/commerce";

interface CartDrawerContextValue {
  isOverlayOpen: boolean;
  openOverlay: () => void;
  setOverlayOpen: (open: boolean) => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOverlayOpen, setOverlayOpen] = useState(false);
  const openOverlay = useCallback(() => setOverlayOpen(true), []);

  return (
    <CartDrawerContext.Provider value={{ isOverlayOpen, openOverlay, setOverlayOpen }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  if (!context) throw new Error("useCartDrawer must be used within CartDrawerProvider");
  return context;
}

interface CartProviderWrapperProps {
  cartData: ComponentProps<typeof CartProvider>["initialData"];
  children: ReactNode;
}

export function CartProviderWrapper({ cartData, children }: CartProviderWrapperProps) {
  return (
    <CartProvider initialData={cartData}>
      <CartCountrySync />
      <CartDrawerProvider>{children}</CartDrawerProvider>
    </CartProvider>
  );
}

function CartCountrySync() {
  const cartId = useCart((state) => state.data?.id ?? null);
  const buyerCountry = useCart((state) => state.data?.buyerIdentity?.countryCode ?? null);
  const { refresh } = useCartActions();
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const country = document.documentElement.dataset.country;
    if (!cartId || !country || !isSupportedCountry(country) || buyerCountry === country) return;
    const key = `${cartId}:${country}`;
    if (sent.current === key) return;
    sent.current = key;
    void fetch("/api/cart", {
      body: JSON.stringify({ buyerCountry: true }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
      .then((response) => {
        if (response.ok) refresh();
        else sent.current = null;
      })
      .catch(() => {
        sent.current = null;
      });
  }, [buyerCountry, cartId, refresh]);

  return null;
}

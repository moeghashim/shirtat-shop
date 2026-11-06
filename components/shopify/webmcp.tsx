"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { localizeHref, type Locale } from "@/lib/i18n";
import { SHOPIFY_ROUTE_TEMPLATES } from "@/lib/shopify/routing";

let started = false;

function pageLocale(): Locale {
  return location.pathname === "/ar" || location.pathname.startsWith("/ar/") ? "ar" : "en";
}

function supportsWebMcp() {
  return (
    (typeof document !== "undefined" && "modelContext" in document) ||
    (typeof navigator !== "undefined" && "modelContext" in navigator)
  );
}

export function WebMcp() {
  const router = useRouter();

  useEffect(() => {
    if (started || !supportsWebMcp()) return;
    started = true;
    void import("@shopify/hydrogen").then(({ initializeShopifyScripts }) =>
      initializeShopifyScripts({
        navigate: (url) => {
          const next = new URL(url, location.origin);
          if (next.origin !== location.origin) {
            location.assign(url);
            return;
          }
          router.push(localizeHref(pageLocale(), `${next.pathname}${next.search}${next.hash}`));
        },
        routes: SHOPIFY_ROUTE_TEMPLATES,
        webMcp: true,
      }),
    );
  }, [router]);

  return null;
}

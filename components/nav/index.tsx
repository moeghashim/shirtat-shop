import { PredictiveSearchProvider } from "@shopify/hydrogen/react";
import Image from "next/image";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { shopConfig } from "@/lib/config";
import type { MenuItem } from "@/lib/menu/types";

import { NavAccount, NavAccountFallback } from "./account";
import { CartIcon, CartIconFallback } from "./cart";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";
import { SearchModal } from "./search-modal";

export function Nav() {
  const items: MenuItem[] = [
    { id: "default-nav-shop", items: [], title: "Shop", url: "/collections/all" },
  ];
  return (
    <nav
      className="sticky top-0 z-30 w-full bg-background pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <Container className="flex h-16 items-center gap-2.5 md:h-20 md:gap-5">
        <MobileMenu items={items} />

        <Link className="flex items-center shrink-0" href="/">
          <Image
            alt="Shirtat"
            className="h-11 w-auto md:h-15 dark:invert"
            height={366}
            priority
            src="/shirtat-logo-mark.svg"
            unoptimized
            width={554}
          />
          <span
            aria-hidden
            className="ml-2.5 text-base font-medium tracking-[0.25em] text-foreground md:text-lg"
          >
            SHIRTAT
          </span>
        </Link>

        <QuickLinks items={items} />

        <div className="flex items-center gap-5 ml-auto">
          {shopConfig.search.isEnabled && (
            <PredictiveSearchProvider
              debounceInMs={300}
              limit={3}
              types={["PRODUCT", "COLLECTION", "QUERY"]}
            >
              <SearchModal />
            </PredictiveSearchProvider>
          )}
          {shopConfig.auth.isEnabled && (
            <Suspense fallback={<NavAccountFallback />}>
              <NavAccount />
            </Suspense>
          )}
          <Suspense fallback={<CartIconFallback />}>
            <CartIcon />
          </Suspense>
        </div>
      </Container>
    </nav>
  );
}

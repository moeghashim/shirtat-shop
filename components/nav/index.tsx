import { PredictiveSearchProvider } from "@shopify/hydrogen/react";
import Image from "next/image";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { CATEGORIES } from "@/lib/collections/categories";
import { shopConfig } from "@/lib/config";
import { getT } from "@/lib/i18n/server";
import type { MenuItem } from "@/lib/menu/types";

import { NavAccount, NavAccountFallback } from "./account";
import { CartIcon, CartIconFallback } from "./cart";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { QuickLinks } from "./quick-links";
import { SearchModal } from "./search-modal";

export async function Nav() {
  const t = await getT();
  const items: MenuItem[] = [
    { id: "default-nav-shop", items: [], title: t("Shop"), url: "/collections/all" },
    ...CATEGORIES.map((c) => ({
      id: `nav-category-${c.id}`,
      items: [],
      title: t(c.labelEn),
      url: `/collections/${c.id}`,
    })),
    { id: "nav-designers", items: [], title: t("Designers"), url: "/designers" },
    { id: "nav-sell", items: [], title: t("Sell on Shirtat"), url: "/creators" },
  ];
  return (
    <nav
      className="sticky top-0 z-30 w-full bg-background pt-[env(safe-area-inset-top,0px)] transition-shadow duration-250"
      id="nav-outer"
    >
      <Container className="grid h-18 grid-cols-[1fr_auto_1fr] items-center gap-2.5 md:h-24 md:gap-5">
        <div className="flex min-w-0 items-center gap-5 justify-self-start">
          <MobileMenu items={items} />
          <QuickLinks items={items} />
        </div>

        <Link className="flex items-center shrink-0 justify-self-center" href="/">
          <Image
            alt="Shirtat"
            className="h-14 w-auto md:h-19 dark:invert"
            height={461}
            priority
            src="/shirtat-logo.svg"
            unoptimized
            width={554}
          />
        </Link>

        <div className="flex items-center gap-3 md:gap-5 justify-self-end">
          <LanguageSwitcher />
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

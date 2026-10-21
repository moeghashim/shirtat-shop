import { cn } from "cn";
import Image from "next/image";

import { MenuLink } from "@/components/nav/menu-link";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Sections } from "@/components/ui/sections";
import { shopConfig } from "@/lib/config";
import { commerceLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import type { MenuItem } from "@/lib/menu/types";
import { getShopPolicies } from "@/lib/policies/server";

import { SocialLinks } from "./social-links";
import type { SocialLink } from "./social-links";

export async function Footer() {
  const socialLinks: SocialLink[] = [];
  const items: MenuItem[] = [];
  const locale = await getLocale();
  const t = await getT();
  const policies = await getShopPolicies({ locale: commerceLocale(locale) }).catch(() => []);
  const englishOnly = locale === "ar" ? { hrefLang: "en" } : {};
  return (
    <footer>
      {/* pb-22 clears the fixed agent ActionBar pill when it renders */}
      <Container className={cn("pt-20 pb-10", shopConfig.agent.isEnabled && "pb-22")}>
        <Sections className="gap-10">
          {items.length > 0 && <FooterMenu items={items} />}
          <nav
            aria-label={t("Policies")}
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground sm:justify-start"
          >
            {[
              ["/about", "About"],
              ["/contact", "Contact"],
              ["/shipping", "Shipping"],
              ["/refunds", "Refunds & returns"],
              ["/terms", "Terms & conditions"],
              ["/privacy", "Privacy"],
              ["/creators/terms", "Designer terms"],
            ].map(([href, label]) => (
              <Link key={href} href={href!} className="transition-colors hover:text-foreground">
                {t(label!)}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-start">
              <p className="text-sm text-muted-foreground leading-5">
                {t("© {name}. All rights reserved.", { name: shopConfig.site.name })}
              </p>
              <Link
                href="/making-of"
                className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("The making of Shirtat")}
              </Link>
              <Link
                href="/creators"
                className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("Sell on Shirtat")}
              </Link>
              <Link
                href="/roadmap"
                {...englishOnly}
                className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("Roadmap")}
              </Link>
              <Link
                href="/sales"
                {...englishOnly}
                className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("Sales")}
              </Link>
              <p className="text-sm text-muted-foreground leading-6">
                {t("This project is part of")}{" "}
                <a
                  className="inline-flex items-center gap-1 whitespace-nowrap align-middle font-medium transition-colors hover:text-foreground"
                  href="https://10claws.com/"
                  rel="noopener"
                  target="_blank"
                >
                  <Image
                    alt=""
                    className="inline-block dark:invert"
                    height={20}
                    src="/10claws-logo.svg"
                    unoptimized
                    width={20}
                  />
                  10claws
                </a>
                {t(" and is fully managed by")}{" "}
                <span className="inline-flex items-center gap-1 whitespace-nowrap align-middle font-medium">
                  <Image
                    alt=""
                    className="inline-block"
                    height={18}
                    src="/grokbot-icon.png"
                    unoptimized
                    width={18}
                  />
                  Grok Bot
                </span>
                .
              </p>
              {policies.map((policy) => (
                <Link
                  key={policy.handle}
                  href={`/policies/${policy.handle}`}
                  className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {policy.title}
                </Link>
              ))}
            </div>
            {socialLinks.length > 0 && <SocialLinks links={socialLinks} />}
          </div>
        </Sections>
      </Container>
    </footer>
  );
}

function FooterMenu({ items }: { items: MenuItem[] }) {
  const columns = items.slice(0, 5);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10">
      {columns.map((column) => (
        <div key={column.id} className="space-y-3">
          {column.url ? (
            <MenuLink
              url={column.url}
              className="block text-sm font-semibold hover:opacity-70 transition-opacity"
            >
              {column.title}
            </MenuLink>
          ) : (
            <h3 className="text-sm font-semibold">{column.title}</h3>
          )}
          {column.items.length > 0 && (
            <ul className="space-y-2">
              {column.items.map((leaf) => (
                <li key={leaf.id}>
                  <MenuLink
                    url={leaf.url}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {leaf.title}
                  </MenuLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

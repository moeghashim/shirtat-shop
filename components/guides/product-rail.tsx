import Image from "next/image";

import { Link } from "@/components/ui/link";
import type { ProductRail } from "@/lib/guides/types";
import { pick } from "@/lib/guides/types";
import type { Locale } from "@/lib/i18n";
import { formatLocale } from "@/lib/i18n";
import { localizeProductTitle } from "@/lib/i18n/product";
import { formatPrice } from "@/lib/money";

export function GuideRails({ locale, rails }: { locale: Locale; rails: ProductRail[] }) {
  const visible = rails.filter((rail) => rail.products.length > 0 || rail.note);
  if (!visible.length) return null;
  return (
    <>
      {visible.map((rail) => (
        <section className="grid gap-4" key={pick(rail.heading, locale)}>
          <h2 className="text-2xl font-semibold">{pick(rail.heading, locale)}</h2>
          {rail.note ? (
            <p className="max-w-3xl leading-6 text-muted-foreground">{pick(rail.note, locale)}</p>
          ) : null}
          {rail.products.length > 0 ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {rail.products.map((product) => {
                const title = localizeProductTitle(product.title, locale);
                const price = formatPrice(product.price, formatLocale(locale));
                const ranged = product.maxPrice.amount !== product.price.amount;
                return (
                  <li key={product.handle}>
                    <Link className="grid gap-2" href={`/products/${product.handle}`}>
                      {product.image ? (
                        <Image
                          alt={product.image.altText || title}
                          className="aspect-square w-full rounded-2xl bg-muted object-cover"
                          height={product.image.height}
                          sizes="100vw"
                          src={product.image.url}
                          width={product.image.width}
                        />
                      ) : null}
                      <span className="font-medium">{title}</span>
                      <span className="text-sm text-muted-foreground">
                        {ranged ? (locale === "ar" ? `من ${price}` : `From ${price}`) : price}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}

import Image from "next/image";

import { Link } from "@/components/ui/link";
import { formatLocale, type Locale } from "@/lib/i18n";
import { describeProductImage, localizeProductTitle } from "@/lib/i18n/product";
import { formatPrice } from "@/lib/money";
import type { PrintMethod } from "@/lib/print-methods";
import { getPrintMethodProducts } from "@/lib/print-methods/server";

export async function PrintMethodShop({
  locale,
  method,
}: {
  locale: Locale;
  method: PrintMethod["id"];
}) {
  const products = await getPrintMethodProducts(method, locale);
  if (products.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {products.map((product) => {
        const title = localizeProductTitle(product.title, locale);
        const price = formatPrice(product.price, formatLocale(locale));
        const ranged = product.maxPrice.amount !== product.price.amount;
        return (
          <li key={product.handle}>
            <Link className="grid cursor-pointer gap-2" href={`/products/${product.handle}`}>
              {product.image ? (
                <Image
                  alt={describeProductImage({
                    altText: product.image.altText,
                    locale,
                    title: product.title,
                  })}
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
  );
}

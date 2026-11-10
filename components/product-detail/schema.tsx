import { shopConfig } from "@/lib/config";
import { describeProductImage } from "@/lib/i18n/product";
import { getLocale } from "@/lib/i18n/server";
import type { Image } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";

interface ProductSchemaData {
  availableForSale: boolean;
  currencyCode: string;
  description: string;
  handle: string;
  images: Image[];
  offerCount: number;
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  sku?: string;
  title: string;
  vendor?: string;
}

interface ProductSchemaProps {
  colors?: Record<string, string>;
  product: ProductSchemaData;
}

export async function ProductSchema({ colors = {}, product }: ProductSchemaProps) {
  const locale = await getLocale();
  const url = `${shopConfig.site.url}/products/${product.handle}`;
  const availability = product.availableForSale
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const { maxVariantPrice, minVariantPrice } = product.priceRange;
  // Google merchant listings require an Offer; an AggregateOffer only qualifies for product snippets.
  const singlePrice =
    minVariantPrice.amount === maxVariantPrice.amount &&
    minVariantPrice.currencyCode === maxVariantPrice.currencyCode;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((img) => {
      const caption = describeProductImage({
        altText: img.altText,
        color: colors[img.url],
        locale,
        title: product.title,
      });
      return {
        "@type": "ImageObject",
        caption,
        ...(img.height > 0 ? { height: img.height } : {}),
        name: caption,
        url: img.url,
        ...(img.width > 0 ? { width: img.width } : {}),
      };
    }),
    brand: product.vendor
      ? {
          "@type": "Brand",
          name: product.vendor,
        }
      : undefined,
    offers: singlePrice
      ? {
          "@type": "Offer",
          availability,
          price: minVariantPrice.amount,
          priceCurrency: product.currencyCode,
          url,
        }
      : {
          "@type": "AggregateOffer",
          availability,
          highPrice: maxVariantPrice.amount,
          lowPrice: minVariantPrice.amount,
          offerCount: product.offerCount,
          priceCurrency: product.currencyCode,
          url,
        },
    sku: product.offerCount === 1 ? product.sku : undefined,
  };

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}

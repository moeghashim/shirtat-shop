import type { Locale } from "@/lib/i18n";
import { describeProductImage } from "@/lib/i18n/product";
import type { Image } from "@/lib/media/types";
import { productJsonLd } from "@/lib/seo/product";

interface ProductSchemaProps {
  availableForSale: boolean;
  colors?: Record<string, string>;
  currencyCode: string;
  description: string;
  handle: string;
  highPrice: string;
  images: Image[];
  locale: Locale;
  lowPrice: string;
  name: string;
  offerCount: number;
  properties: { name: string; value: string }[];
  sku?: string;
  vendor?: string;
}

export function ProductSchema({
  availableForSale,
  colors = {},
  currencyCode,
  description,
  handle,
  highPrice,
  images,
  locale,
  lowPrice,
  name,
  offerCount,
  properties,
  sku,
  vendor,
}: ProductSchemaProps) {
  const schema = productJsonLd({
    availableForSale,
    brand: vendor,
    currencyCode,
    description,
    handle,
    highPrice,
    images: images.map((image) => ({
      caption: describeProductImage({
        altText: image.altText,
        color: colors[image.url],
        locale,
        title: name,
      }),
      height: image.height,
      url: image.url,
      width: image.width,
    })),
    locale,
    lowPrice,
    name,
    offerCount,
    properties,
    sku,
  });

  return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
}

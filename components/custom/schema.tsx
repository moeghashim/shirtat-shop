import { shopConfig } from "@/lib/config";

interface DesignOfferProduct {
  available: boolean;
  currency: string;
  description: string;
  high: string;
  images: { altText: string; height: number; url: string; width: number }[];
  low: string;
  offerCount: number;
  title: string;
}

function productSchema(product: DesignOfferProduct) {
  const url = `${shopConfig.site.url}/design`;
  const availability = product.available
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const single = product.low === product.high;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    brand: { "@type": "Brand", name: shopConfig.site.name },
    description: product.description,
    image: product.images.map((image) => image.url),
    name: product.title,
    offers: single
      ? {
          "@type": "Offer",
          availability,
          price: product.low,
          priceCurrency: product.currency,
          url,
        }
      : {
          "@type": "AggregateOffer",
          availability,
          highPrice: product.high,
          lowPrice: product.low,
          offerCount: product.offerCount,
          priceCurrency: product.currency,
          url,
        },
    url,
  };
}

export function DesignSchema({
  faq,
  products,
}: {
  faq: { answer: string; question: string }[];
  products: DesignOfferProduct[];
}) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text: item.answer },
      name: item.question,
    })),
  };
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      {products.map((product) => (
        <script key={product.title} type="application/ld+json">
          {JSON.stringify(productSchema(product))}
        </script>
      ))}
    </>
  );
}

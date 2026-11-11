import { ProductSchema } from "@/components/product-detail/schema";
import { Link } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { localizeOptionValue } from "@/lib/i18n/product";
import { formatPrice } from "@/lib/money";
import { imageColorNames } from "@/lib/product";
import { getProductSpecs } from "@/lib/product/specs";
import type { ProductDetails } from "@/lib/product/types";
import { offerPolicyFacts } from "@/lib/seo/product";

interface OfferFactsProps {
  locale: Locale;
  product: ProductDetails;
}

function bilingual(
  value: { ar: string; en: string } | null | undefined,
  isArabic: boolean,
): string | undefined {
  const text = (isArabic ? value?.ar : value?.en)?.trim();
  return text ? text : undefined;
}

function optionLine(product: ProductDetails, name: string, locale: Locale): string | undefined {
  const option = product.options.find((item) => item.name === name);
  if (!option || option.values.length === 0) return undefined;
  return option.values.map((value) => localizeOptionValue(name, value.name, locale)).join(" · ");
}

export async function ProductOfferFacts({ locale, product }: OfferFactsProps) {
  const isArabic = locale === "ar";
  const { print, specs } = await getProductSpecs(product.handle);
  const facts = offerPolicyFacts(locale);
  const low = product.priceRange.minVariantPrice;
  const high = product.priceRange.maxVariantPrice;
  const uniform = low.amount === high.amount && low.currencyCode === high.currencyCode;
  const price = uniform ? formatPrice(low) : `${formatPrice(low)} – ${formatPrice(high)}`;
  const material = bilingual(specs?.fabric, isArabic);
  const printMethod = bilingual(print?.method, isArabic);
  const fit = bilingual(specs?.fit, isArabic) || optionLine(product, "Fit", locale);
  const sizeSource = specs?.sizes?.length
    ? specs.sizes
    : (product.options
        .find((option) => option.name === "Size")
        ?.values.map((value) => value.name) ?? []);
  const sizes = sizeSource.length
    ? sizeSource.map((size) => localizeOptionValue("Size", size, locale)).join(" · ")
    : undefined;
  const rows = [
    { name: isArabic ? "السعر" : "Price", value: price },
    {
      name: isArabic ? "التوفر" : "Availability",
      value: product.availableForSale
        ? isArabic
          ? "متوفر"
          : "In stock"
        : isArabic
          ? "نفدت الكمية"
          : "Out of Stock",
    },
    material ? { name: isArabic ? "الخامة" : "Material", value: material } : undefined,
    printMethod
      ? { name: isArabic ? "طريقة الطباعة" : "Print method", value: printMethod }
      : undefined,
    fit ? { name: isArabic ? "القصة" : "Fit", value: fit } : undefined,
    sizes ? { name: isArabic ? "المقاسات" : "Sizes", value: sizes } : undefined,
    product.defaultVariantSku ? { name: "SKU", value: product.defaultVariantSku } : undefined,
    { name: isArabic ? "الشحن" : "Shipping", value: facts.shipping },
    { name: isArabic ? "الإرجاع" : "Returns", value: facts.returns },
  ].filter((row): row is { name: string; value: string } => Boolean(row));
  const schemaNames = new Set([
    "Price",
    "السعر",
    "Availability",
    "التوفر",
    "SKU",
    "Shipping",
    "الشحن",
    "Returns",
    "الإرجاع",
  ]);
  const properties = rows.filter((row) => !schemaNames.has(row.name));

  return (
    <section data-slot="offer-facts" className="grid gap-3" dir={isArabic ? "rtl" : "ltr"}>
      <ProductSchema
        availableForSale={product.availableForSale}
        colors={imageColorNames(product.options)}
        currencyCode={product.currencyCode}
        description={product.description}
        handle={product.handle}
        highPrice={high.amount}
        images={product.images}
        locale={locale}
        lowPrice={low.amount}
        name={product.title}
        offerCount={product.variantsCount}
        properties={properties}
        sku={product.defaultVariantSku}
        vendor={product.vendor}
      />
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {isArabic ? "تفاصيل العرض" : "Offer"}
      </h2>
      <dl className="grid gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-[minmax(6.5rem,32%)_1fr] gap-3">
            <dt className="font-medium text-foreground">{row.name}</dt>
            <dd className="text-foreground/80">
              {row.name === "Price" ||
              row.name === "السعر" ||
              row.name === "SKU" ||
              row.name === "Sizes" ||
              row.name === "المقاسات" ? (
                <span dir="ltr">{row.value}</span>
              ) : row.name === "Shipping" || row.name === "الشحن" ? (
                <>
                  {row.value}{" "}
                  <Link
                    href="/shipping"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    {isArabic ? "سياسة الشحن" : "Shipping Policy"}
                  </Link>
                </>
              ) : row.name === "Returns" || row.name === "الإرجاع" ? (
                <>
                  {row.value}{" "}
                  <Link
                    href="/refunds"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    {isArabic ? "سياسة الاسترداد والإرجاع" : "Refund & Returns Policy"}
                  </Link>
                </>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function OfferFactsFallback() {
  return (
    <div aria-busy="true" className="grid gap-2" data-slot="offer-facts">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

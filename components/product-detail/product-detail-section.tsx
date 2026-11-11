import { cn } from "cn";
import { MinusIcon, PlusIcon } from "lucide-react";
import { type ReactNode, Suspense } from "react";

import { T } from "@/components/i18n/t";
import { BundleComponents, BundleParents } from "@/components/product-detail/bundle-components";
import { BuyButtons, PurchaseOptions } from "@/components/product-detail/buy-buttons";
import { BuyWithShopLogo } from "@/components/product-detail/buy-with-shop-logo";
import { ComplementaryProducts } from "@/components/product-detail/complementary-products";
import { GiftCardPurchaseForm } from "@/components/product-detail/gift-card-purchase-form";
import { OfferFactsFallback, ProductOfferFacts } from "@/components/product-detail/offer-facts";
import { ProductOpenGraph } from "@/components/product-detail/open-graph";
import {
  DesignStoryBlock,
  PdpTrustAndDetails,
  ProductSpecsBlock,
  RelatedCollections,
  ShopThisScript,
} from "@/components/product-detail/pdp-extras";
import {
  ProductForm,
  ProductFormOptions,
  ProductFormPrice,
} from "@/components/product-detail/product-form";
import {
  ProductInfoDescription,
  ProductInfoOptions,
} from "@/components/product-detail/product-info";
import {
  ColorImageCarouselItems,
  ColorImageGrid,
  ProductMedia,
} from "@/components/product-detail/product-media";
import { ProductPrice } from "@/components/product-detail/product-price";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { breadcrumbCollectionId, collectionLabel } from "@/lib/collections/categories";
import { shopConfig } from "@/lib/config";
import { commerceLocale, type Locale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import {
  defaultSelectedOptions,
  getProductPurchaseOptions,
  getColorImagesOrdered,
  getNonColorImages,
  hasColorImagePartitioning,
  imageColorNames,
  toProductFormInput,
  toStaticOptionGroups,
} from "@/lib/product";
import { type SelectedOptions } from "@/lib/product/types";
import type { ProductDetails, ProductVariant } from "@/lib/product/types";

export function ProductDetailSection({
  product,
  selectedOptionsPromise,
  variantPromise,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  return (
    <>
      <ProductOpenGraph
        availableForSale={product.availableForSale}
        price={product.priceRange.minVariantPrice}
      />
      <div className="grid min-w-0 gap-8 lg:grid-cols-10 lg:items-start lg:gap-10">
        <ProductMediaArea product={product} selectedOptionsPromise={selectedOptionsPromise} />
        <ProductInfoArea product={product} variantPromise={variantPromise} />
      </div>
    </>
  );
}

function ProductMediaArea({
  product,
  selectedOptionsPromise,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
}) {
  const colors = imageColorNames(product.options);
  if (!hasColorImagePartitioning(product.options)) {
    return (
      <ProductMedia
        colors={colors}
        otherImages={product.images}
        videos={product.videos}
        title={product.title}
        className="lg:col-span-6"
      />
    );
  }

  const defaultImages = getColorImagesOrdered(product, defaultSelectedOptions(product));
  return (
    <ProductMedia
      colors={colors}
      otherImages={getNonColorImages(product.images, product.options)}
      videos={product.videos}
      title={product.title}
      className="lg:col-span-6"
      desktopSlot={
        // Fallback is the default-colour image so the LCP image is in the first HTML flush.
        <Suspense fallback={<ColorImageGrid images={defaultImages} title={product.title} />}>
          <ResolvedColorImageGrid
            product={product}
            selectedOptionsPromise={selectedOptionsPromise}
          />
        </Suspense>
      }
      mobileSlot={
        <Suspense
          fallback={<ColorImageCarouselItems images={defaultImages} title={product.title} />}
        >
          <ResolvedColorImageCarousel
            product={product}
            selectedOptionsPromise={selectedOptionsPromise}
          />
        </Suspense>
      }
    />
  );
}

async function ResolvedColorImageGrid({
  product,
  selectedOptionsPromise,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
}) {
  const images = getColorImagesOrdered(product, await selectedOptionsPromise);
  if (images.length === 0) return null;
  return <ColorImageGrid images={images} title={product.title} />;
}

async function ResolvedColorImageCarousel({
  product,
  selectedOptionsPromise,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
}) {
  const images = getColorImagesOrdered(product, await selectedOptionsPromise);
  if (images.length === 0) return null;
  return <ColorImageCarouselItems images={images} title={product.title} />;
}

async function ProductInfoArea({
  product,
  variantPromise,
}: {
  product: ProductDetails;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  const t = await getT();
  const locale = await getLocale();
  const isArabic = locale === "ar";
  const collectionId = breadcrumbCollectionId(product.handle, product.tags ?? []);
  const category = collectionId ? collectionLabel(collectionId) : undefined;
  const crumbs = [
    { name: t("Home"), path: "/" },
    ...(collectionId && category
      ? [
          {
            name: isArabic ? category.labelAr : category.labelEn,
            path: `/collections/${collectionId}`,
          },
        ]
      : []),
    { name: product.title, path: `/products/${product.handle}` },
  ];
  const { options, handle, descriptionHtml } = product;
  const uniformStock = product.allVariantsInStock;
  const singleVariant = product.variantsCount === 1;
  const showBuyLabel = uniformStock && !singleVariant;
  const allInStock = product.defaultVariant?.availableForSale ?? product.availableForSale;
  const hasOptions = options.some((option) => option.values.length > 1);
  return (
    <div className="grid gap-8 lg:sticky lg:top-20 lg:col-span-4">
      <div
        className="grid gap-6 data-[uniform-price=true]:gap-6"
        data-uniform-price={product.hasUniformPricing}
      >
        <div data-slot="product-info-header" className="grid gap-2">
          <BreadcrumbSchema items={crumbs} />
          <nav aria-label={isArabic ? "مسار التنقل" : "Breadcrumb"}>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <li key={crumb.path} className="flex items-center gap-2">
                    {index > 0 ? <span aria-hidden="true">/</span> : null}
                    {last ? (
                      <span aria-current="page" className="text-foreground">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link className="underline-offset-4 hover:underline" href={crumb.path}>
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <h1 className="text-foreground text-2xl leading-tight font-semibold sm:text-3xl">
            {product.title}
          </h1>
          {product.hasUniformPricing ? (
            <ProductPrice
              amount={product.priceRange.minVariantPrice.amount}
              currencyCode={product.priceRange.minVariantPrice.currencyCode}
              compareAtAmount={product.compareAtPriceRange?.minVariantPrice.amount}
            />
          ) : null}
        </div>

        <Suspense fallback={<OfferFactsFallback />}>
          <ProductOfferFacts locale={locale} product={product} />
        </Suspense>

        {singleVariant ? (
          <ProductInfoContent
            priceSlot={
              !product.hasUniformPricing ? (
                <Suspense fallback={<div className="h-7" aria-hidden />}>
                  <ResolvedProductPrice variantPromise={variantPromise} />
                </Suspense>
              ) : undefined
            }
            product={product}
            selectedVariant={product.defaultVariant}
          />
        ) : (
          <Suspense
            fallback={
              <ProductInfoFallback
                allInStock={allInStock}
                hasOptions={hasOptions}
                locale={isArabic ? "ar" : "en"}
                product={product}
                showLabel={showBuyLabel}
              />
            }
          >
            <ResolvedProductInfo product={product} variantPromise={variantPromise} />
          </Suspense>
        )}
      </div>

      {!product.isGiftCard && shopConfig.pdp.bundles.isEnabled ? (
        <BundleRelationships variant={product.defaultVariant} />
      ) : null}

      {!product.isGiftCard && shopConfig.pdp.complementaryProducts.isEnabled ? (
        <ComplementaryProducts handle={handle} limit={4} title={t("Pairs Well With")} />
      ) : null}

      <PdpTrustAndDetails
        handle={handle}
        isArabic={isArabic}
        specsSlot={
          <Suspense fallback={null}>
            <ProductSpecsBlock handle={handle} isArabic={isArabic} />
          </Suspense>
        }
        storySlot={
          <Suspense fallback={null}>
            <DesignStoryBlock handle={handle} isArabic={isArabic} />
          </Suspense>
        }
      />

      <ProductInfoDescription descriptionHtml={descriptionHtml} />
      <RelatedCollections handle={handle} isArabic={isArabic} tags={product.tags ?? []} />
      <Suspense fallback={null}>
        <ShopThisScript
          description={`${product.title} ${product.description}`}
          handle={handle}
          isArabic={isArabic}
          locale={commerceLocale(locale)}
        />
      </Suspense>
    </div>
  );
}

async function ResolvedProductPrice({
  variantPromise,
}: {
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  const variant = await variantPromise;
  return (
    <ProductFormPrice
      fallbackVariant={
        variant ? { compareAtPrice: variant.compareAtPrice, price: variant.price } : undefined
      }
    />
  );
}

async function ResolvedProductInfo({
  product,
  variantPromise,
}: {
  product: ProductDetails;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  return <ProductInfoContent product={product} selectedVariant={await variantPromise} />;
}

// The store is seeded from the URL-resolved variant so server HTML and client state agree on first paint.
function ProductInfoContent({
  priceSlot,
  product,
  selectedVariant,
}: {
  priceSlot?: ReactNode;
  product: ProductDetails;
  selectedVariant: ProductVariant | undefined;
}) {
  const formProduct = toProductFormInput(product, selectedVariant);
  const fallbackVariant = formProduct.selectedOrFirstAvailableVariant ?? undefined;
  const hasOptions = product.options.some((option) => option.values.length > 1);

  return (
    <ProductForm product={formProduct}>
      <div className="grid gap-6">
        {!product.hasUniformPricing ? (
          <div data-slot="product-info-price">
            {priceSlot ?? <ProductFormPrice fallbackVariant={fallbackVariant} />}
          </div>
        ) : null}
        {hasOptions ? <ProductFormOptions handle={product.handle} /> : null}
        {product.isGiftCard ? (
          <GiftCardPurchaseForm />
        ) : (
          <BuyButtons
            fallbackVariant={fallbackVariant}
            availableForSale={product.availableForSale}
            buyWithShop={shopConfig.pdp.buyWithShop.isEnabled}
            quantityPicker={shopConfig.pdp.quantityPicker.isEnabled}
          />
        )}
      </div>
    </ProductForm>
  );
}

function ProductInfoFallback({
  locale,
  showLabel,
  allInStock,
  hasOptions,
  product,
}: {
  allInStock: boolean;
  hasOptions: boolean;
  locale: Locale;
  product: ProductDetails;
  showLabel: boolean;
}) {
  return (
    <div className="grid gap-6">
      {!product.hasUniformPricing ? <div className="h-7" aria-hidden /> : null}
      {hasOptions ? (
        <ProductInfoOptions options={toStaticOptionGroups(product)} hideImages locale={locale} />
      ) : null}
      {product.isGiftCard ? (
        <GiftCardPurchaseFormFallback />
      ) : (
        <BuyButtonsFallback
          allInStock={allInStock}
          showLabel={showLabel}
          variant={product.defaultVariant}
        />
      )}
    </div>
  );
}

// Bundle relationships are product-level, so keep them in the static shell.
async function BundleRelationships({ variant }: { variant: ProductVariant | undefined }) {
  const t = await getT();
  if (!variant) return null;
  if (variant.components.length === 0 && variant.bundleParents.length === 0) return null;
  return (
    <div className="grid gap-5">
      <BundleComponents components={variant.components} title={t("Bundle Includes")} />
      <BundleParents variants={variant.bundleParents} title={t("Available in Bundles")} />
    </div>
  );
}

async function GiftCardPurchaseFormFallback() {
  const t = await getT();
  // Match the resolved form's geometry to avoid layout shift.
  return (
    <div className="grid gap-5">
      <div className="grid gap-2.5">
        <div className="grid gap-2.5">
          <Label>
            <T k="Recipient email" />
          </Label>
          <Input type="email" disabled placeholder="friend@example.com" />
        </div>
        <div className="grid gap-2.5">
          <Label>
            <T k="Recipient name" />
          </Label>
          <Input type="text" disabled placeholder={t("Friend's name (optional)")} />
        </div>
        <div className="grid gap-2.5">
          <Label>
            <T k="Message" />
          </Label>
          <Textarea rows={3} disabled placeholder={t("Write a personal note (optional)")} />
        </div>
        <div className="grid gap-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2.5">
            <Label>
              <T k="Schedule for later" />
            </Label>
            <span className="inline-flex h-[1.15rem] w-8 items-center rounded-full bg-input opacity-50" />
          </div>
        </div>
      </div>
      <div className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground opacity-50">
        <T k="Add to Cart" />
      </div>
    </div>
  );
}

function QuantityPickerFallback() {
  return (
    <div
      aria-hidden="true"
      className="grid h-12 w-32 shrink-0 grid-cols-[3rem_2rem_3rem] rounded-lg bg-background ring-1 ring-border ring-inset"
    >
      <span className="flex size-12 items-center justify-center opacity-50">
        <MinusIcon className="size-4 shrink-0" />
      </span>
      <span className="flex h-12 w-8 items-center justify-center text-sm font-medium tabular-nums">
        1
      </span>
      <span className="flex size-12 items-center justify-center">
        <PlusIcon className="size-4 shrink-0" />
      </span>
    </div>
  );
}

async function BuyButtonsFallback({
  allInStock,
  showLabel,
  variant,
}: {
  allInStock: boolean;
  showLabel: boolean;
  variant: ProductVariant | undefined;
}) {
  const t = await getT();
  const { plans, selectedPlan } = getProductPurchaseOptions(variant);
  return (
    <div className="grid gap-2.5">
      {variant ? (
        <PurchaseOptions
          disabled
          plans={plans}
          price={variant.price}
          requiresSellingPlan={variant.requiresSellingPlan}
          selectedPlan={selectedPlan}
        />
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        {shopConfig.pdp.quantityPicker.isEnabled ? <QuantityPickerFallback /> : null}
        <div className="flex h-12 min-w-40 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
          {showLabel ? (allInStock ? t("Add to Cart") : t("Out of Stock")) : null}
        </div>
      </div>
      {shopConfig.pdp.buyWithShop.isEnabled && !selectedPlan && !variant?.requiresSellingPlan ? (
        <div
          className={cn(
            "flex h-12 items-center justify-center rounded-lg bg-shop px-4 text-white",
            !allInStock && "invisible",
          )}
        >
          <BuyWithShopLogo aria-hidden="true" className="h-auto w-24.5" />
        </div>
      ) : null}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
      <div className="lg:col-span-6">
        {/* Media blocks stay static; a pulsing skeleton in the LCP slot flashes harder than an empty image canvas. */}
        <div className="grid gap-5 lg:hidden">
          <div className="-mx-5 aspect-square w-[calc(100%+2.5rem)] bg-accent" />
          <div aria-hidden="true" className="h-1.5" />
        </div>
        <div className="hidden grid-cols-2 gap-2.5 lg:grid">
          <div className="aspect-square w-full bg-accent" />
          <div className="aspect-square w-full bg-accent" />
          <div className="aspect-square w-full bg-accent" />
          <div className="aspect-square w-full bg-accent" />
        </div>
      </div>
      <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
        <div className="grid gap-10">
          <div>
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-7 w-24" />
          </div>
          <div className="grid gap-10">
            <div className="grid gap-5">
              <Skeleton className="h-5 w-32" />
              <div className="grid gap-2.5">
                <Skeleton className="h-5 w-16" />
                <div className="flex flex-wrap gap-2">
                  {["w-15", "w-16", "w-16", "w-15", "w-15"].map((width, index) => (
                    <Skeleton key={index} className={cn("h-9.5 rounded-lg", width)} />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-2.5">
              <div className="flex flex-wrap gap-2.5">
                {shopConfig.pdp.quantityPicker.isEnabled ? <QuantityPickerFallback /> : null}
                <Skeleton className="h-12 min-w-40 flex-1" />
              </div>
              {shopConfig.pdp.buyWithShop.isEnabled ? <Skeleton className="h-12 w-full" /> : null}
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

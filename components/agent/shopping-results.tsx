"use client";

import type { EveMessage } from "eve/react";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { CartLineItems } from "@/components/cart/line-item";
import { CartCheckout, CartTotal } from "@/components/cart/summary";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { isCartMutation } from "@/lib/agent/cart";
import { defaultAgentSelection, findAgentVariant, selectAgentOption } from "@/lib/agent/products";
import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";
import { useCart, useCartForm } from "@/lib/cart/client";
import { useT } from "@/lib/i18n/client";
import { buildProductUrl } from "@/lib/product";

import { AgentChooserBody, AgentProductCards } from "./product-view";

interface CartConfirmation {
  warnings: string[];
}

interface ShoppingResultsProps {
  confirmation?: CartConfirmation;
  fallback?: ReactNode;
  isLatest: boolean;
  isStreaming: boolean;
  message: EveMessage;
  productCardsOnly?: boolean;
}

function isAgentProduct(value: unknown): value is AgentProduct | AgentProductDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "handle" in value &&
    typeof value.handle === "string" &&
    "title" in value &&
    typeof value.title === "string"
  );
}

export function ShoppingResults({
  confirmation,
  fallback = null,
  isLatest,
  isStreaming,
  message,
  productCardsOnly = false,
}: ShoppingResultsProps) {
  const products = new Map<string, AgentProduct | AgentProductDetails>();
  const results = message.parts.flatMap((part) => {
    if (part.type !== "dynamic-tool" || part.state !== "output-available" || part.partial)
      return [];
    const output = part.output;
    if (!output || typeof output !== "object") return [];
    const candidates = [
      ...("products" in output && Array.isArray(output.products) ? output.products : []),
      ...("product" in output && output.product ? [output.product] : []),
    ];
    for (const product of candidates) {
      if (isAgentProduct(product)) products.set(product.handle, product);
    }
    return "error" in output ? [] : [{ output, part }];
  });
  const changesCart = message.parts.some(
    (part) => part.type === "dynamic-tool" && isCartMutation(part.toolName),
  );
  const children: ReactNode[] = [];
  const seen = new Set<string>();
  let hasCart = false;

  for (const { output, part } of results) {
    if (
      ["present-products", "browse-collection", "get-recommendations"].includes(part.toolName) &&
      "products" in output &&
      Array.isArray(output.products)
    ) {
      const cards = output.products.flatMap((product) => {
        if (
          !product ||
          typeof product !== "object" ||
          typeof product.handle !== "string" ||
          seen.has(product.handle)
        )
          return [];
        seen.add(product.handle);
        const known = products.get(product.handle);
        return known ? [known] : [];
      });
      if (cards.length) {
        children.push(<AgentProductCards key={part.toolCallId} products={cards} />);
      }
    }
    if (productCardsOnly || isStreaming || changesCart) continue;
    if (
      part.toolName === "get-product-details" &&
      "product" in output &&
      output.product &&
      typeof output.product === "object" &&
      "handle" in output.product &&
      typeof output.product.handle === "string"
    ) {
      const product = products.get(output.product.handle);
      children.push(
        <AgentVariantPicker
          key={part.toolCallId}
          isLatest={isLatest}
          product={product && "variants" in product ? product : undefined}
        />,
      );
    }
    if (part.toolName === "get-cart" && !hasCart && isLatest) {
      hasCart = true;
      children.push(<AgentCartSummary key="cart" />);
    }
  }
  // Only the latest turn renders the editable cart; older turns rely on the assistant's text.
  if (!productCardsOnly && confirmation && !hasCart)
    children.push(<AgentCartSummary key="cart" warnings={confirmation.warnings} />);

  return children.length ? <div className="grid gap-4">{children}</div> : fallback;
}

function MissingData({ children }: { children: string }) {
  return <p className="my-2 text-muted-foreground text-xs">{children}</p>;
}

interface AgentCartSummaryProps {
  warnings?: string[];
}

export function AgentCartSummary({ warnings = [] }: AgentCartSummaryProps) {
  const t = useT();
  const cart = useCart((state) => state.data);
  const isLoading = useCart((state) => state.loading);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest" });
  }, []);
  if (isLoading && cart.lines.nodes.length === 0)
    return (
      <div className="my-2 flex items-center gap-2.5 text-muted-foreground text-xs" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t("Loading cart…")}
      </div>
    );
  if (cart.lines.nodes.length === 0) return <MissingData>{t("Your cart is empty")}</MissingData>;
  return (
    <div ref={ref} className="grid gap-5 rounded-[1.25rem] bg-[#efe6d2] p-4">
      {warnings.length > 0 && (
        <div className="grid gap-1">
          {warnings.map((warning) => (
            <p key={warning} role="alert" className="text-muted-foreground text-xs">
              {warning}
            </p>
          ))}
        </div>
      )}
      <CartLineItems lines={cart.lines.nodes} />
      <CartTotal cart={cart} />
      <CartCheckout />
      <span className="sr-only">{t("This cart updates as you change it.")}</span>
    </div>
  );
}

interface AgentVariantPickerProps {
  isLatest: boolean;
  product: AgentProductDetails | undefined;
}

function AgentVariantPicker({ isLatest, product }: AgentVariantPickerProps) {
  const t = useT();
  const { formProps, register } = useCartForm();
  const cartBusy = useCart((state) =>
    Boolean(state.pending.lines.size || state.pending.cost || state.revalidating),
  );
  const cartErrors = useCart((state) => state.errors);
  const [selected, setSelected] = useState(() => (product ? defaultAgentSelection(product) : {}));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<"added" | "failed" | null>(null);
  const observedBusy = useRef(false);
  const [errorsAtSubmit, setErrorsAtSubmit] = useState({ lines: 0, network: 0 });
  useEffect(() => {
    if (!submitted) return;
    if (cartBusy) {
      observedBusy.current = true;
      return;
    }
    if (!observedBusy.current) return;
    observedBusy.current = false;
    setSubmitted(false);
    const failed =
      cartErrors.linesUpdatedAt > errorsAtSubmit.lines ||
      cartErrors.networkUpdatedAt > errorsAtSubmit.network;
    setResult(failed ? "failed" : "added");
  }, [cartBusy, cartErrors, errorsAtSubmit, submitted]);
  if (!product) return <MissingData>{t("This product is no longer available.")}</MissingData>;
  const variant = findAgentVariant(product, selected);
  const price = variant?.price ?? product.price;
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
  const choosePlan = variant?.available && variant.requiresSellingPlan;
  const canAdd = variant?.available && !variant.requiresBundleConfiguration && !submitted;
  const customDesign = product.customDesign === true;
  const buttonText = submitted
    ? t("Adding…")
    : !variant || variant.available
      ? customDesign
        ? t("Design this on the product page")
        : variant?.requiresBundleConfiguration
          ? t("Choose bundle items")
          : t("Add to Cart")
      : t("Out of Stock");
  const action = customDesign ? (
    <Button className="min-h-11 w-full" render={<Link href={`/products/${product.handle}`} />}>
      {t("Design this on the product page")}
    </Button>
  ) : choosePlan && variant ? (
    <Button
      className="min-h-11 w-full"
      render={<Link href={buildProductUrl(product.handle, variant.options)} />}
    >
      {t("Choose a subscription")}
    </Button>
  ) : (
    <form
      {...formProps({
        beforeSubmit: () => {
          setErrorsAtSubmit({
            lines: cartErrors.linesUpdatedAt,
            network: cartErrors.networkUpdatedAt,
          });
          setResult(null);
          setSubmitted(true);
        },
      })}
    >
      <input type="hidden" {...register("merchandiseId", { value: variant?.id ?? "" })} />
      <input type="hidden" {...register("quantity", { value: 1 })} />
      <Button {...register("add")} className="min-h-11 w-full" disabled={!canAdd} type="submit">
        {buttonText}
      </Button>
    </form>
  );
  return (
    <div className="grid gap-5">
      <AgentChooserBody
        compareAt={compareAtPrice}
        onSelect={(name, value) =>
          setSelected((current) => selectAgentOption(product, current, name, value))
        }
        price={price}
        product={product}
        selected={selected}
      >
        {action}
      </AgentChooserBody>
      {result === "added" && isLatest && <AgentCartSummary />}
      {result === "failed" && (
        <p role="alert" className="text-destructive text-sm">
          {t("We couldn't add this to your cart. Check the cart before trying again.")}
        </p>
      )}
    </div>
  );
}

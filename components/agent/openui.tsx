"use client";

import { createLibrary, defineComponent, Renderer, useTriggerAction } from "@openuidev/react-lang";
import type { EveMessage } from "eve/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { z } from "zod/v4";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import {
  cartProps,
  chooserProps,
  followUpsProps,
  noteProps,
  productCardsProps,
  shoppingCopy,
} from "@/lib/agent/openui/catalog";
import { defaultAgentSelection, findAgentVariant, selectAgentOption } from "@/lib/agent/products";
import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";
import { useCart, useCartForm } from "@/lib/cart/client";
import { useT } from "@/lib/i18n/client";
import { buildProductUrl } from "@/lib/product";

import { AgentChooserBody, AgentProductCards } from "./product-view";
import { AgentCartSummary } from "./shopping-results";

const ShoppingFacts = createContext<Map<string, AgentProduct | AgentProductDetails>>(new Map());

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

function factsFromMessage(message: EveMessage) {
  const products = new Map<string, AgentProduct | AgentProductDetails>();
  for (const part of message.parts) {
    if (part.type !== "dynamic-tool" || part.state !== "output-available" || part.partial) continue;
    const output = part.output;
    if (!output || typeof output !== "object") continue;
    const candidates = [
      ...("products" in output && Array.isArray(output.products) ? output.products : []),
      ...("product" in output && output.product ? [output.product] : []),
    ];
    for (const product of candidates) {
      if (!isAgentProduct(product)) continue;
      const previous = products.get(product.handle);
      products.set(
        product.handle,
        previous && "variants" in previous && !("variants" in product) ? previous : product,
      );
    }
  }
  return products;
}

function Missing({ children }: { children: string }) {
  return <p className="text-muted-foreground text-xs">{children}</p>;
}

function NoteView({ text }: { text: string }) {
  return (
    <p className="text-sm" dir="auto">
      {text}
    </p>
  );
}

function ProductCardsView({ handles }: { handles: string[] }) {
  const t = useT();
  const facts = useContext(ShoppingFacts);
  const products = handles.flatMap((handle) => {
    const product = facts.get(handle);
    return product ? [product] : [];
  });
  if (!products.length) return <Missing>{t("This product is no longer available.")}</Missing>;
  return <AgentProductCards products={products} />;
}

function ChooserView({ handle }: { handle: string }) {
  const t = useT();
  const facts = useContext(ShoppingFacts);
  const product = facts.get(handle);
  const details = product && "variants" in product ? product : undefined;
  const { formProps, register } = useCartForm();
  const cartBusy = useCart((state) =>
    Boolean(state.pending.lines.size || state.pending.cost || state.revalidating),
  );
  const [selected, setSelected] = useState(() => (details ? defaultAgentSelection(details) : {}));
  const [submitted, setSubmitted] = useState(false);
  const [added, setAdded] = useState(false);
  const [failed, setFailed] = useState(false);
  const observedBusy = useRef(false);
  const cartErrors = useCart((state) => state.errors);
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
    const didFail =
      cartErrors.linesUpdatedAt > errorsAtSubmit.lines ||
      cartErrors.networkUpdatedAt > errorsAtSubmit.network;
    setFailed(didFail);
    setAdded(!didFail);
  }, [cartBusy, cartErrors, errorsAtSubmit, submitted]);
  if (!product) return <Missing>{t("This product is no longer available.")}</Missing>;
  const variant = details ? findAgentVariant(details, selected) : undefined;
  const price = variant?.price ?? product.price;
  const compareAtPrice = variant ? variant.compareAtPrice : product.compareAtPrice;
  const customDesign = details?.customDesign === true;
  const canAdd =
    !customDesign &&
    variant?.available &&
    !variant.requiresBundleConfiguration &&
    !submitted &&
    !cartBusy;
  if (!details) return <Missing>{t("This product is no longer available.")}</Missing>;
  const action = customDesign ? (
    <Button className="min-h-11 w-full" render={<Link href={`/products/${product.handle}`} />}>
      {t("Design this on the product page")}
    </Button>
  ) : !variant ? (
    <Button className="min-h-11 w-full" render={<Link href={`/products/${product.handle}`} />}>
      {t("Choose")}
    </Button>
  ) : variant.requiresSellingPlan || variant.requiresBundleConfiguration ? (
    <Button
      className="min-h-11 w-full"
      render={<Link href={buildProductUrl(product.handle, variant.options)} />}
    >
      {variant.requiresSellingPlan ? t("Choose a subscription") : t("Choose bundle items")}
    </Button>
  ) : (
    <form
      {...formProps({
        beforeSubmit: () => {
          setErrorsAtSubmit({
            lines: cartErrors.linesUpdatedAt,
            network: cartErrors.networkUpdatedAt,
          });
          setAdded(false);
          setFailed(false);
          setSubmitted(true);
        },
      })}
    >
      <input type="hidden" {...register("merchandiseId", { value: variant.id })} />
      <input type="hidden" {...register("quantity", { value: 1 })} />
      <Button {...register("add")} className="min-h-11 w-full" disabled={!canAdd} type="submit">
        {submitted || cartBusy
          ? t("Adding…")
          : variant.available
            ? t("Add to Cart")
            : t("Out of Stock")}
      </Button>
    </form>
  );
  return (
    <div className="grid gap-5">
      <AgentChooserBody
        compareAt={compareAtPrice}
        onSelect={(name, value) =>
          setSelected((current) => selectAgentOption(details, current, name, value))
        }
        price={price}
        product={details}
        selected={selected}
      >
        {action}
        {failed ? (
          <p className="text-destructive text-sm" role="alert">
            {t("We couldn't add this to your cart. Check the cart before trying again.")}
          </p>
        ) : null}
      </AgentChooserBody>
      {added ? <AgentCartSummary /> : null}
    </div>
  );
}

function FollowUpsView({ options }: z.infer<typeof followUpsProps>) {
  const trigger = useTriggerAction();
  const streaming = useContext(StreamingContext);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          className="min-h-11 cursor-pointer rounded-full bg-[#efe6d2] px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e8] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={streaming}
          key={option.label}
          onClick={() => trigger(option.label, undefined, option.action)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const StreamingContext = createContext(false);

const Note = defineComponent({
  component: ({ props }) => <NoteView text={props.text} />,
  description: shoppingCopy.note,
  name: "Note",
  props: noteProps,
});
const ProductCards = defineComponent({
  component: ({ props }) => <ProductCardsView handles={props.handles} />,
  description: shoppingCopy.productCards,
  name: "ProductCards",
  props: productCardsProps,
});
const Chooser = defineComponent({
  component: ({ props }) => <ChooserView handle={props.handle} />,
  description: shoppingCopy.chooser,
  name: "Chooser",
  props: chooserProps,
});
const Cart = defineComponent({
  component: () => <AgentCartSummary />,
  description: shoppingCopy.cart,
  name: "Cart",
  props: cartProps,
});
const FollowUps = defineComponent({
  component: ({ props }) => <FollowUpsView options={props.options} />,
  description: shoppingCopy.followUps,
  name: "FollowUps",
  props: followUpsProps,
});
const Stack = defineComponent({
  component: ({ props, renderNode }) => (
    <div className="grid gap-8">
      {props.children.map((child, index) => (
        <div key={index}>{renderNode(child)}</div>
      ))}
    </div>
  ),
  description: shoppingCopy.stack,
  name: "Stack",
  props: z.object({
    children: z.array(z.union([Note.ref, ProductCards.ref, Chooser.ref, Cart.ref, FollowUps.ref])),
  }),
});

const shoppingLibrary = createLibrary({
  components: [Cart, Chooser, FollowUps, Note, ProductCards, Stack],
  root: "Stack",
});

export function openUiSource(text: string) {
  const fenced = text.match(/```(?:openui-lang|openui)?\s*([\s\S]*?)```/);
  const source = (fenced?.[1] ?? text).trim();
  if (!/\broot\s*=/.test(source)) return null;
  const start = source.search(/^(?:root|[A-Za-z_][\w]*)\s*=/m);
  return start <= 0 ? source : source.slice(start);
}

export function OpenUiMessage({
  isStreaming,
  message,
  onFollowUp,
  program,
}: {
  isStreaming: boolean;
  message: EveMessage;
  onFollowUp: (text: string) => void;
  program: string;
}) {
  const facts = factsFromMessage(message);
  return (
    <ShoppingFacts.Provider value={facts}>
      <StreamingContext.Provider value={isStreaming}>
        <Renderer
          isStreaming={isStreaming}
          library={shoppingLibrary}
          onAction={(event) => {
            if (isStreaming || event.type !== "continue_conversation") return;
            const text = event.humanFriendlyMessage.trim();
            if (text) onFollowUp(text);
          }}
          publishObservability={false}
          response={program}
        />
      </StreamingContext.Provider>
    </ShoppingFacts.Provider>
  );
}

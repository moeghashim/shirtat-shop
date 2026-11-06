import { createLibrary, createStreamingParser, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";

import {
  cartProps,
  chooserProps,
  followUpsProps,
  noteProps,
  productCardsProps,
  shoppingCopy,
} from "./catalog";

const stub = () => null;

const Note = defineComponent({
  component: stub,
  description: shoppingCopy.note,
  name: "Note",
  props: noteProps,
});
const ProductCards = defineComponent({
  component: stub,
  description: shoppingCopy.productCards,
  name: "ProductCards",
  props: productCardsProps,
});
const Chooser = defineComponent({
  component: stub,
  description: shoppingCopy.chooser,
  name: "Chooser",
  props: chooserProps,
});
const Cart = defineComponent({
  component: stub,
  description: shoppingCopy.cart,
  name: "Cart",
  props: cartProps,
});
const FollowUps = defineComponent({
  component: stub,
  description: shoppingCopy.followUps,
  name: "FollowUps",
  props: followUpsProps,
});
const Stack = defineComponent({
  component: stub,
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

const shoppingSchema = shoppingLibrary.toJSONSchema();

const CARD_TOOLS = new Set(["browse-collection", "get-recommendations", "present-products"]);

interface SettledToolPart {
  output?: unknown;
  partial?: boolean;
  state?: string;
  toolName?: string;
  type: string;
}

export const NAMED_PRODUCT_CARDS = `cards = ProductCards(handles: ["tafakkar-t-shirt", "ana-ibn-jala-hoodie"])
note = Note("Two pieces from the shop.")
root = Stack([note, cards])`;

export const NOTE_ONLY_PROGRAM = `note = Note("Two pieces from the shop.")
root = Stack([note])`;

export const PARTIAL_NAMED_PROGRAM = `cards = ProductCards(handles: ["tafakkar-t-shirt"])
note = Note("Two pieces from the shop.")
root = Stack([note`;

export const POSITIONAL_PRODUCT_CARDS = `cards = ProductCards(["tafakkar-t-shirt", "ana-ibn-jala-hoodie"])
note = Note("Two pieces from the shop.")
root = Stack([note, cards])`;

export const REPLACED_ROOT_PROGRAM = `cards = ProductCards(["tafakkar-t-shirt", "ana-ibn-jala-hoodie"])
root = Stack([cards])
root = Stack([Note("Later")])`;

// The prompt signature is ProductCards(handles: string[]). Colon arguments are rejected and the element is omitted.
export function productCardHandles(program: string, complete: boolean): string[] {
  try {
    const result = createStreamingParser(shoppingSchema, "Stack").set(program, complete);
    const handles: string[] = [];
    walk(result.root, (handlesProp) => {
      for (const handle of handlesProp) {
        if (typeof handle === "string") handles.push(handle);
      }
    });
    return handles;
  } catch {
    return [];
  }
}

export function keepSettledProductCards(toolHandles: readonly string[]): boolean {
  return toolHandles.length > 0;
}

export function extraOpenUiCardHandles(
  requested: readonly string[],
  toolHandles: readonly string[],
  known: readonly string[],
): string[] {
  const facts = new Set(known);
  const shown = new Set(toolHandles);
  return requested.filter((handle) => facts.has(handle) && !shown.has(handle));
}

export function showUnavailableCopy(
  requested: readonly string[],
  toolHandles: readonly string[],
  known: readonly string[],
): boolean {
  if (toolHandles.length > 0 || requested.length === 0) return false;
  const facts = new Set(known);
  return requested.every((handle) => !facts.has(handle));
}

export function settledRecommendationHandles(parts: readonly SettledToolPart[]): string[] {
  const handles: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    if (part.type !== "dynamic-tool" || part.state !== "output-available" || part.partial) continue;
    if (!part.toolName || !CARD_TOOLS.has(part.toolName)) continue;
    const output = part.output;
    if (!output || typeof output !== "object" || "error" in output) continue;
    if (!("products" in output) || !Array.isArray(output.products)) continue;
    for (const product of output.products) {
      if (!product || typeof product !== "object" || !("handle" in product)) continue;
      if (typeof product.handle !== "string" || seen.has(product.handle)) continue;
      seen.add(product.handle);
      handles.push(product.handle);
    }
  }
  return handles;
}

function walk(value: unknown, onHandles: (handles: readonly unknown[]) => void) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, onHandles);
    return;
  }
  const node = value as { props?: Record<string, unknown>; typeName?: string };
  if (node.typeName === "ProductCards" && Array.isArray(node.props?.handles)) {
    onHandles(node.props.handles);
  }
  if (!node.props) return;
  for (const child of Object.values(node.props)) walk(child, onHandles);
}

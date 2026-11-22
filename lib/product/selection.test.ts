import assert from "node:assert/strict";
import test from "node:test";

import type { Image } from "@/lib/media/types";
import {
  type ColorGalleryProduct,
  buildProductUrl,
  getColorImagesOrdered,
  parseSelectedOptions,
  replaceProductSelectionUrl,
  toProductFormInput,
} from "@/lib/product";
import type { ProductDetails, ProductOption, ProductVariant } from "@/lib/product/types";

function image(url: string, altText: string): Image {
  return { altText, height: 1200, url, width: 1200 };
}

function variant(id: string, color: string, size: string): ProductVariant {
  return {
    availableForSale: true,
    bundleParents: [],
    components: [],
    id,
    image: image(`https://cdn.example/${id}.jpg`, `${color} ${size}`),
    price: { amount: size === "XL" ? "58.99" : "51.99", currencyCode: "USD" },
    productHandle: "rise-up-hoodie",
    productTitle: "Rise Up",
    requiresComponents: false,
    requiresSellingPlan: false,
    selectedOptions: [
      { name: "Color", value: color },
      { name: "Size", value: size },
    ],
    sellingPlanAllocations: [],
    title: `${color} / ${size}`,
  };
}

const options = [
  {
    id: "color",
    name: "Color",
    values: [
      { id: "white", image: "https://cdn.example/white.jpg", name: "White" },
      { id: "sand", image: "https://cdn.example/sand.jpg", name: "Sand" },
      { id: "grey", image: "https://cdn.example/grey.jpg", name: "Sport Grey" },
    ],
  },
  {
    id: "size",
    name: "Size",
    values: [
      { id: "m", name: "M" },
      { id: "xl", name: "XL" },
    ],
  },
] as ProductOption[];

test("a deep link canonicalizes colour and size against the product", () => {
  assert.deepEqual(parseSelectedOptions(options, { color: "sand", size: "xl" }), {
    Color: "Sand",
    Size: "XL",
  });
  assert.deepEqual(parseSelectedOptions(options, { utm: "spring" }), {});
});

test("the shareable product url keeps unrelated params and replaces the selection", () => {
  const href = buildProductUrl(
    "rise-up-hoodie",
    [
      { name: "Color", value: "Sand" },
      { name: "Size", value: "XL" },
    ],
    new URLSearchParams("utm=spring&Color=White"),
  );
  const params = new URLSearchParams(href.split("?")[1]);
  assert.equal(href.startsWith("/products/rise-up-hoodie?"), true);
  assert.equal(params.get("utm"), "spring");
  assert.equal(params.get("Color"), "Sand");
  assert.equal(params.get("Size"), "XL");
  assert.equal([...params.keys()].filter((key) => key.toLowerCase() === "color").length, 1);
});

test("the selection url writes through History.prototype so Next does not restore the route", () => {
  const written: { state: unknown; url?: string | null }[] = [];
  class History {
    replaceState(state: unknown, _unused: string, url?: string | null) {
      written.push({ state, url });
    }
  }
  const previous = globalThis.History;
  globalThis.History = History as unknown as typeof globalThis.History;
  try {
    const state = { __NA: true, tree: "product" };
    replaceProductSelectionUrl("/ar/products/rise-up-hoodie?Color=Sand&Size=XL", {
      replaceState() {
        throw new Error("patched history.replaceState");
      },
      state,
    });
  } finally {
    if (previous) globalThis.History = previous;
    else Reflect.deleteProperty(globalThis, "History");
  }
  assert.deepEqual(written, [
    {
      state: { __NA: true, tree: "product" },
      url: "/ar/products/rise-up-hoodie?Color=Sand&Size=XL",
    },
  ]);
});

test("the selected colour's mockup leads the gallery and the other colours follow", () => {
  const product: ColorGalleryProduct = {
    images: [
      image("https://cdn.example/white.jpg", "White"),
      image("https://cdn.example/sand.jpg", "Sand"),
      image("https://cdn.example/grey.jpg", "Sport Grey"),
      image("https://cdn.example/model.jpg", "AI-generated model wearing the hoodie"),
    ],
    options,
    title: "Rise Up",
  };
  const ordered = getColorImagesOrdered(product, { Color: "Sand", Size: "XL" });
  assert.deepEqual(
    ordered.map((item) => item.url),
    [
      "https://cdn.example/sand.jpg",
      "https://cdn.example/model.jpg",
      "https://cdn.example/white.jpg",
      "https://cdn.example/grey.jpg",
    ],
  );
});

test("every loaded variant is available to the product form, including a colour and size the adjacent list omits", () => {
  const whiteM = variant("white-m", "White", "M");
  const sandXl = variant("sand-xl", "Sand", "XL");
  const product = {
    adjacentVariants: [whiteM],
    defaultVariant: whiteM,
    encodedVariantAvailability: null,
    encodedVariantExistence: null,
    handle: "rise-up-hoodie",
    id: "gid://shopify/Product/1",
    options,
    priceRange: {
      maxVariantPrice: { amount: "58.99", currencyCode: "USD" },
      minVariantPrice: { amount: "51.99", currencyCode: "USD" },
    },
    title: "Rise Up",
    variants: [whiteM, sandXl],
    vendor: "Shirtat",
  } as unknown as ProductDetails;
  const form = toProductFormInput(product, whiteM);
  const ids = form.adjacentVariants.map((item) => item.id).sort();
  assert.deepEqual(ids, ["sand-xl", "white-m"]);
  const sand = form.adjacentVariants.find((item) => item.id === "sand-xl");
  assert.equal(sand?.price.amount, "58.99");
  assert.deepEqual(sand?.selectedOptions, [
    { name: "Color", value: "Sand" },
    { name: "Size", value: "XL" },
  ]);
});

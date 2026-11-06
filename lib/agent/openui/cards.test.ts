import assert from "node:assert/strict";
import { test } from "node:test";

import {
  NAMED_PRODUCT_CARDS,
  NOTE_ONLY_PROGRAM,
  PARTIAL_NAMED_PROGRAM,
  POSITIONAL_PRODUCT_CARDS,
  REPLACED_ROOT_PROGRAM,
  extraOpenUiCardHandles,
  keepSettledProductCards,
  productCardHandles,
  settledRecommendationHandles,
  showUnavailableCopy,
} from "./cards";
import { shoppingPrompt } from "./prompt";

const TOOL_HANDLES = ["tafakkar-t-shirt", "ana-ibn-jala-hoodie"] as const;

const PROGRAMS = [
  NAMED_PRODUCT_CARDS,
  NOTE_ONLY_PROGRAM,
  PARTIAL_NAMED_PROGRAM,
  POSITIONAL_PRODUCT_CARDS,
  REPLACED_ROOT_PROGRAM,
  "root = Stack([",
  "",
];

test("colon product cards never enter the tree", () => {
  assert.deepEqual(productCardHandles(NAMED_PRODUCT_CARDS, true), []);
  assert.deepEqual(productCardHandles(PARTIAL_NAMED_PROGRAM, false), []);
  assert.match(shoppingPrompt, /ProductCards\(handles: string\[\]\)/);
  assert.match(shoppingPrompt, /ProductCards\(\["handle"\]\)/);
});

test("positional cards resolve and a later root can drop them", () => {
  assert.deepEqual(productCardHandles(POSITIONAL_PRODUCT_CARDS, true), [...TOOL_HANDLES]);
  assert.deepEqual(productCardHandles(NOTE_ONLY_PROGRAM, true), []);
  assert.deepEqual(productCardHandles(REPLACED_ROOT_PROGRAM, true), []);
  const truncated = productCardHandles('cards = ProductCards(["tafakkar', false);
  assert.equal(truncated.includes("tafakkar-t-shirt"), false);
});

test("settled recommendation cards stay beside every program", () => {
  for (const program of PROGRAMS) {
    assert.equal(keepSettledProductCards(TOOL_HANDLES), true, program);
  }
  assert.equal(keepSettledProductCards([]), false);
});

test("openui draws only cards the tool list does not already show", () => {
  assert.deepEqual(extraOpenUiCardHandles([...TOOL_HANDLES], TOOL_HANDLES, TOOL_HANDLES), []);
  assert.deepEqual(
    extraOpenUiCardHandles(["gid://shopify/Product/1"], TOOL_HANDLES, TOOL_HANDLES),
    [],
  );
  assert.deepEqual(extraOpenUiCardHandles(["custom-design"], [], ["custom-design"]), [
    "custom-design",
  ]);
  assert.equal(showUnavailableCopy(["gid://shopify/Product/1"], TOOL_HANDLES, TOOL_HANDLES), false);
  assert.equal(showUnavailableCopy(["gid://shopify/Product/1"], [], TOOL_HANDLES), true);
  assert.equal(showUnavailableCopy([], [], []), false);
});

test("partial and failed tool output does not count as settled cards", () => {
  assert.deepEqual(
    settledRecommendationHandles([
      {
        output: { products: [{ handle: "tafakkar-t-shirt" }] },
        partial: true,
        state: "output-available",
        toolName: "present-products",
        type: "dynamic-tool",
      },
      {
        output: { error: "unavailable", products: [{ handle: "gone" }] },
        state: "output-available",
        toolName: "present-products",
        type: "dynamic-tool",
      },
      {
        output: { product: { handle: "detail-only" } },
        state: "output-available",
        toolName: "get-product-details",
        type: "dynamic-tool",
      },
      {
        output: {
          products: [
            { handle: "tafakkar-t-shirt" },
            { handle: "tafakkar-t-shirt" },
            { handle: "ana-ibn-jala-hoodie" },
          ],
        },
        state: "output-available",
        toolName: "browse-collection",
        type: "dynamic-tool",
      },
    ]),
    [...TOOL_HANDLES],
  );
});

test("malformed programs yield no card handles", () => {
  assert.deepEqual(productCardHandles("not a program", true), []);
  assert.deepEqual(productCardHandles("root = ", false), []);
  assert.deepEqual(productCardHandles("root = Stack([Note(", false), []);
});

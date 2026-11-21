import assert from "node:assert/strict";
import test from "node:test";

import { productDetailsCacheLife } from "./cache-life";

test("a published product is cached for the long profile", () => {
  assert.equal(productDetailsCacheLife(true), "max");
});

test("a missing product is cached for minutes so an unpublished handle does not stay a 404", () => {
  assert.equal(productDetailsCacheLife(false), "minutes");
});

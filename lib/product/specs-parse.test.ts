import assert from "node:assert/strict";
import test from "node:test";

import { parsePrintMethod, parseProductSpecs } from "./specs-parse";

// The al-jamal products shipped print_method JSON without "available", which crashed the PDP render.
const AL_JAMAL_PRINT = JSON.stringify({
  vendor: "Printify",
  method: { en: "Embroidery", ar: "تطريز" },
  placement: { en: "Centre chest, about 4 in wide", ar: "وسط الصدر، بعرض 10 سم تقريباً" },
  printArea: null,
  source: "https://api.printify.com/v1/catalog/blueprints/12.json",
});

test("print_method without an available list parses to an empty list", () => {
  const print = parsePrintMethod(AL_JAMAL_PRINT);
  assert.ok(print);
  assert.deepEqual(print.available, []);
  assert.equal(print.method?.en, "Embroidery");
  assert.equal(print.printArea, null);
});

test("print_method options with missing or broken areas keep the method", () => {
  const print = parsePrintMethod(
    JSON.stringify({
      available: [{ method: "DTG" }, { areas: [] }, { method: "DTF", areas: [{ en: "Back" }, 3] }],
    }),
  );
  assert.deepEqual(print?.available, [
    { method: "DTG", areas: [] },
    { method: "DTF", areas: [{ en: "Back", ar: "Back" }] },
  ]);
});

test("specs without sizes or with a malformed size chart degrade to unknown", () => {
  const specs = parseProductSpecs(
    JSON.stringify({ vendor: "Printify", blank: "Tee", sizeChart: { columns: "nope" }, weight: 5 }),
  );
  assert.ok(specs);
  assert.deepEqual(specs.sizes, []);
  assert.equal(specs.sizeChart, null);
  assert.equal(specs.weight, null);
  assert.equal(specs.provider, "Printify");
});

test("invalid JSON or non-object metafields return null", () => {
  assert.equal(parsePrintMethod("{"), null);
  assert.equal(parsePrintMethod("[]"), null);
  assert.equal(parseProductSpecs(undefined), null);
});

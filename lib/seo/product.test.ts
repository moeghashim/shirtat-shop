import assert from "node:assert/strict";
import test from "node:test";

import { breadcrumbCollectionId, relatedCollectionIds } from "../collections/categories";
import {
  auditJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  offerPolicyFacts,
  productJsonLd,
} from "./product";

const IMAGE = {
  caption: "Tafakkar tee",
  height: 1200,
  url: "https://cdn.shopify.com/tee.jpg",
  width: 1200,
};

function product(locale: "ar" | "en") {
  const facts = offerPolicyFacts(locale);
  return productJsonLd({
    availableForSale: true,
    brand: "Shirtat",
    currencyCode: "USD",
    description: locale === "ar" ? "«تفكّر» بالخط الكوفي الهندسي العريض." : "Bold geometric Kufic.",
    handle: "tafakkar-t-shirt",
    highPrice: "41.99",
    images: [IMAGE],
    locale,
    lowPrice: "33.99",
    name:
      locale === "ar"
        ? "تيشيرت «تفكّر» بالخط الكوفي"
        : "Tafakkar (تفكّر) Kufic Arabic Calligraphy T-Shirt",
    offerCount: 15,
    properties: [
      { name: locale === "ar" ? "الخامة" : "Material", value: locale === "ar" ? "قطن" : "Cotton" },
    ],
    sku: "TEE-1",
  });
}

test("product JSON-LD carries shipping, returns and sku that match the policy text", () => {
  for (const locale of ["en", "ar"] as const) {
    const schema = product(locale);
    assert.deepEqual(auditJsonLd(schema), []);
    const facts = offerPolicyFacts(locale);
    const offer = schema.offers as {
      hasMerchantReturnPolicy: { description: string };
      shippingDetails: { description?: string }[];
    };
    assert.equal(offer.shippingDetails[0]?.description, facts.shipping);
    assert.equal(offer.hasMerchantReturnPolicy.description, facts.returns);
    assert.equal(schema.sku, "TEE-1");
    assert.equal(schema.description.includes("تفكّر«تفكّر»"), false);
    const shipping = JSON.stringify(offer.shippingDetails);
    assert.match(shipping, /2/);
    assert.match(shipping, /5/);
    assert.match(facts.shipping, locale === "ar" ? /2 إلى 5/ : /2–5/);
    assert.equal(shipping.includes("shippingRate"), false);
  }
});

test("a single price is an Offer and the breadcrumb includes the collection", () => {
  const schema = productJsonLd({
    availableForSale: false,
    currencyCode: "USD",
    description: "One price.",
    handle: "ana-ibn-jala-t-shirt",
    highPrice: "32.99",
    images: [IMAGE],
    locale: "en",
    lowPrice: "32.99",
    name: "Ana Ibn Jala (أنا ابن جلا وطلاع الثنايا) Arabic Calligraphy T-Shirt",
    offerCount: 1,
    properties: [],
    sku: "ANA-1",
  });
  assert.equal(schema.offers["@type"], "Offer");
  assert.equal((schema.offers as { price: string }).price, "32.99");
  assert.deepEqual(auditJsonLd(schema), []);

  const crumbs = breadcrumbJsonLd("en", [
    { name: "Home", path: "/" },
    { name: "Poetry", path: "/collections/poetry" },
    { name: schema.name, path: "/products/ana-ibn-jala-t-shirt" },
  ]);
  assert.deepEqual(auditJsonLd(crumbs), []);
  assert.equal(crumbs.itemListElement[1]?.name, "Poetry");
  assert.match(crumbs.itemListElement[2]?.item ?? "", /\/products\/ana-ibn-jala-t-shirt$/);
});

test("collection ItemList names the products on the page", () => {
  const list = itemListJsonLd("ar", [
    { name: "تيشيرت «تفكّر»", path: "/products/tafakkar-t-shirt" },
    { name: "تيشيرت «الأدب»", path: "/products/al-adab-t-shirt" },
  ]);
  assert.deepEqual(auditJsonLd(list), []);
  assert.match(list.itemListElement[0]?.url ?? "", /\/ar\/products\/tafakkar-t-shirt$/);
});

test("organization alternateName is the Arabic brand", () => {
  assert.deepEqual(
    auditJsonLd({
      "@type": "Organization",
      alternateName: "شيرتات",
      name: "Shirtat",
      url: "https://shirtat.co",
    }),
    [],
  );
});

test("related collections only include collections the shop publishes", () => {
  assert.deepEqual(relatedCollectionIds("tafakkar-t-shirt", ["category:poetry", "category:tees"]), [
    "poetry",
  ]);
  assert.deepEqual(
    breadcrumbCollectionId("tafakkar-kids-t-shirt", ["category:poetry", "category:kids"]),
    "poetry",
  );
  assert.deepEqual(relatedCollectionIds("tafakkar-kids-t-shirt", ["category:poetry"]), [
    "poetry",
    "kids",
  ]);
  assert.equal(breadcrumbCollectionId("example-baby-bodysuit", []), "baby");
});

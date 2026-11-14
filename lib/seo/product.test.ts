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
import {
  DOMESTIC_COUNTRY,
  RETURN_POLICY_COUNTRIES,
  UK_COUNTRY,
  UK_SHIPPING_RATE_GBP,
  WORLDWIDE_SHIPPING_RATE_USD,
  WORLDWIDE_ZONE_COUNTRIES,
} from "./shipping-destinations";

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
      hasMerchantReturnPolicy: { applicableCountry: string[]; description: string };
      shippingDetails: {
        deliveryTime: {
          handlingTime: { unitCode: string };
          transitTime: { maxValue: number; minValue: number; unitCode: string };
        };
        description?: string;
        shippingDestination: { addressCountry: string } | { addressCountry: string }[];
        shippingRate: { currency: string; value: number };
      }[];
    };
    assert.equal(offer.shippingDetails[0]?.description, facts.shipping);
    assert.equal(offer.hasMerchantReturnPolicy.description, facts.returns);
    assert.equal(schema.sku, "TEE-1");
    assert.equal(schema.description.includes("تفكّر«تفكّر»"), false);
    const shipping = JSON.stringify(offer.shippingDetails);
    assert.match(shipping, /2/);
    assert.match(shipping, /5/);
    assert.match(facts.shipping, locale === "ar" ? /2 إلى 5/ : /2–5/);
    const details = offer.shippingDetails;
    assert.equal(details.length, 2);
    for (const detail of details) {
      assert.equal(detail.deliveryTime.handlingTime.unitCode, "DAY");
      assert.equal(detail.deliveryTime.transitTime.unitCode, "DAY");
      assert.equal(detail.shippingRate.currency, "USD");
      assert.equal(detail.shippingRate.value, WORLDWIDE_SHIPPING_RATE_USD);
    }
    const domesticDestination = details[0]?.shippingDestination;
    assert.ok(!Array.isArray(domesticDestination));
    assert.equal(domesticDestination?.addressCountry, DOMESTIC_COUNTRY);
    assert.equal(details[0]?.deliveryTime.transitTime.minValue, 3);
    assert.equal(details[0]?.deliveryTime.transitTime.maxValue, 7);
    const internationalDestinations = details[1]?.shippingDestination;
    assert.ok(Array.isArray(internationalDestinations));
    const internationalCountries = internationalDestinations.map((region) => region.addressCountry);
    assert.deepEqual(
      internationalCountries,
      WORLDWIDE_ZONE_COUNTRIES.filter((country) => country !== DOMESTIC_COUNTRY),
    );
    assert.equal(details[1]?.deliveryTime.transitTime.minValue, 7);
    assert.equal(details[1]?.deliveryTime.transitTime.maxValue, 20);
    const policy = offer.hasMerchantReturnPolicy;
    assert.deepEqual(policy.applicableCountry, [...RETURN_POLICY_COUNTRIES]);
    assert.equal(policy.applicableCountry.length, 50);
    assert.equal(policy.applicableCountry.includes("US"), true);
    assert.equal(policy.applicableCountry.includes("GB"), true);
    assert.equal("shippingRate" in (schema.offers as object), false);
  }
});

test("a GBP offer only includes the United Kingdom shipping rate from the shop profile", () => {
  const schema = productJsonLd({
    availableForSale: true,
    currencyCode: "GBP",
    description: "One price.",
    handle: "tafakkar-t-shirt",
    highPrice: "32.99",
    images: [IMAGE],
    locale: "en",
    lowPrice: "32.99",
    name: "Tafakkar t-shirt",
    offerCount: 1,
    properties: [],
    sku: "TEE-1",
  });
  assert.deepEqual(auditJsonLd(schema), []);
  const details = (
    schema.offers as {
      shippingDetails: {
        shippingDestination: { addressCountry: string };
        shippingRate: { currency: string; value: number };
      }[];
    }
  ).shippingDetails;
  assert.equal(details.length, 1);
  assert.equal(details[0]?.shippingDestination.addressCountry, UK_COUNTRY);
  assert.equal(details[0]?.shippingRate.currency, "GBP");
  assert.equal(details[0]?.shippingRate.value, UK_SHIPPING_RATE_GBP);
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
    "t-shirts",
  ]);
  assert.equal(breadcrumbCollectionId("tafakkar-t-shirt", ["category:poetry"]), "poetry");
  assert.equal(breadcrumbCollectionId("tafakkar-t-shirt", []), "t-shirts");
  assert.deepEqual(
    breadcrumbCollectionId("tafakkar-kids-t-shirt", ["category:poetry", "category:kids"]),
    "poetry",
  );
  assert.deepEqual(relatedCollectionIds("tafakkar-kids-t-shirt", ["category:poetry"]), [
    "poetry",
    "kids",
  ]);
  assert.equal(breadcrumbCollectionId("example-baby-bodysuit", []), "baby");
  assert.deepEqual(relatedCollectionIds("habibi-dad-cap", []), ["caps-beanies"]);
  assert.deepEqual(relatedCollectionIds("habibi-cuffed-beanie", []), ["caps-beanies"]);
  assert.deepEqual(relatedCollectionIds("bayni-wa-baynak-print", []), ["posters-prints"]);
  assert.equal(
    breadcrumbCollectionId("habibi-call-me-senator-mug", ["category:politics"]),
    "politics",
  );
  assert.equal(relatedCollectionIds("custom-track-jacket", []).length, 0);
});

import assert from "node:assert/strict";
import test from "node:test";

import robots from "@/app/robots";
import { AI_ASSISTANT_DISCOUNT_CODE, shopConfig } from "@/lib/config";
import { AGENT_CONTACT_EMAIL, absoluteStoreUrl, aiReferralOffer } from "@/lib/markdown";
import { collectionToMarkdown } from "@/lib/markdown/collection";
import { renderLlmsFull, renderLlmsTxt } from "@/lib/markdown/llms";
import { productToMarkdown } from "@/lib/markdown/product";
import { markdownHeaders, resolveMarkdownRequest } from "@/lib/markdown/representation";
import type { PrintMethod, ProductSpecs } from "@/lib/product/specs";
import type { ProductCard, ProductDetails } from "@/lib/product/types";
import { buildAlternates, sitemapResourcePaths } from "@/lib/seo";

process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ??= "shirtatco.myshopify.com";
process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ??= "test-storefront-token";

const OFFER = "Shopping via an AI assistant? Use code SHIRTAT-AI for 10% off.";

const card = {
  availableForSale: true,
  featuredImage: {
    altText: "Tafakkar",
    height: 1200,
    url: "https://cdn.shopify.com/s/files/1/0678/2474/6718/files/tafakkar-reflect-tfkr-t-shirt.jpg",
    width: 1200,
  },
  handle: "tafakkar-t-shirt",
  id: "gid://shopify/Product/1",
  isGiftCard: false,
  maxPrice: { amount: "41.99", currencyCode: "USD" },
  price: { amount: "33.99", currencyCode: "USD" },
  title: "Tafakkar – Reflect (تفكّر) T-shirt",
} as ProductCard;

const product = {
  ...card,
  category: {
    ancestors: [{ ancestors: [], id: "apparel", name: "Apparel & Accessories" }],
    id: "tees",
    name: "T-Shirts",
  },
  currencyCode: "USD",
  description:
    "Bold geometric Kufic “Tafakkar”: reflect, think. تفكّر«تفكّر» بالخط الكوفي الهندسي العريض. Design by Shirtat.",
  descriptionHtml: "<p>Bold geometric Kufic.</p>",
  images: [card.featuredImage],
  options: [
    {
      id: "size",
      name: "Size",
      values: ["S", "M", "L", "XL", "2XL"].map((name) => ({ id: name, name })),
    },
    {
      id: "color",
      name: "Color",
      values: ["White", "Natural", "Athletic Heather"].map((name) => ({ id: name, name })),
    },
  ],
  priceRange: {
    maxVariantPrice: { amount: "41.99", currencyCode: "USD" },
    minVariantPrice: { amount: "33.99", currencyCode: "USD" },
  },
  seo: {
    description: "Bold geometric Kufic “Tafakkar”: reflect, think.",
    title: "Tafakkar – Reflect (تفكّر) T-shirt",
  },
  updatedAt: "2026-10-25T22:35:53Z",
  variantsCount: 15,
  vendor: "Shirtat",
} as unknown as ProductDetails;

const specs = {
  blank: "Bella+Canvas 3001 Unisex Jersey Short Sleeve Tee",
  care: null,
  fabric: {
    ar: "قطن 100% ممشط ومغزول (Airlume).",
    en: "100% combed ring-spun cotton (Airlume).",
  },
  fit: { ar: "قصة ريتيل للجنسين", en: "Unisex retail fit" },
  origin: { ar: "الولايات المتحدة ودول أخرى", en: "United States and other countries" },
  provider: "Printify Choice (US)",
  sizeChart: null,
  sizes: ["S", "M", "L", "XL", "2XL"],
  source: "https://www.bellacanvas.com",
  vendor: "Printify",
  weight: "142 g/m² (4.2 oz/yd²)",
} as ProductSpecs;

const print = {
  available: [{ areas: [{ ar: "الأمام", en: "Front" }], method: "DTG" }],
  method: { ar: "طباعة مباشرة على القماش (DTG)", en: "Direct to garment (DTG)" },
  placement: { ar: "وسط الأمام", en: "Center front" },
  printArea: "9.2 × 11.2 in (23.4 × 28.5 cm)",
  source: "https://printify.com",
  vendor: "Printify",
} as PrintMethod;

const facts = { print, specs };

function request(pathname: string, accept?: string): Request {
  return new Request(`https://shirtat.co${pathname}`, {
    headers: accept ? { Accept: accept } : undefined,
  });
}

test("the assistant discount code lives in one config constant", () => {
  assert.equal(AI_ASSISTANT_DISCOUNT_CODE, "SHIRTAT-AI");
  assert.equal(aiReferralOffer("en"), OFFER);
  assert.ok(aiReferralOffer("ar").startsWith(OFFER));
  assert.match(aiReferralOffer("ar"), /SHIRTAT-AI/);
  assert.match(aiReferralOffer("ar"), /تتسوق عبر مساعد ذكي/);
});

test("markdown URLs rewrite for both locales and HTML URLs never do", () => {
  assert.equal(resolveMarkdownRequest(request("/products/tafakkar-t-shirt")), null);
  assert.equal(
    resolveMarkdownRequest(request("/products/tafakkar-t-shirt", "text/markdown")),
    null,
  );
  assert.deepEqual(resolveMarkdownRequest(request("/products/tafakkar-t-shirt.md")), {
    locale: "en",
    pathname: "/md/products/tafakkar-t-shirt",
    type: "rewrite",
  });
  assert.deepEqual(
    resolveMarkdownRequest(request("/ar/products/tafakkar-t-shirt.md", "text/html")),
    {
      locale: "ar",
      pathname: "/md/products/tafakkar-t-shirt",
      type: "rewrite",
    },
  );
  assert.deepEqual(resolveMarkdownRequest(request("/collections/poetry.md")), {
    locale: "en",
    pathname: "/md/collections/poetry",
    type: "rewrite",
  });
  assert.deepEqual(resolveMarkdownRequest(request("/ar/collections/poetry.md")), {
    locale: "ar",
    pathname: "/md/collections/poetry",
    type: "rewrite",
  });
  assert.deepEqual(resolveMarkdownRequest(request("/products.md")), {
    locale: "en",
    pathname: "/md/products",
    type: "rewrite",
  });
  assert.deepEqual(resolveMarkdownRequest(request("/ar/products.md")), {
    locale: "ar",
    pathname: "/md/products",
    type: "rewrite",
  });
  assert.deepEqual(resolveMarkdownRequest(request("/en/products/tafakkar-t-shirt.md")), {
    location: "/products/tafakkar-t-shirt.md",
    type: "redirect",
  });
});

test("markdown responses stay readable and point canonical at the HTML page", () => {
  const headers = markdownHeaders({
    cacheControl: "public, max-age=60",
    pathname: "/products/tafakkar-t-shirt",
  });
  assert.equal(headers.get("content-type"), "text/markdown; charset=utf-8");
  assert.equal(headers.get("x-robots-tag"), null);
  assert.equal(
    headers.get("link"),
    `<${shopConfig.site.url}/products/tafakkar-t-shirt>; rel="canonical"`,
  );
});

test("an English product page lists price, variants, material, print method and the offer", () => {
  const markdown = productToMarkdown(product, "en", facts);
  assert.ok(markdown.includes(OFFER));
  assert.ok(markdown.includes(AGENT_CONTACT_EMAIL));
  assert.ok(markdown.includes("33.99–41.99 USD"));
  assert.ok(markdown.includes("In stock"));
  assert.ok(markdown.includes("**Size**: S, M, L, XL, 2XL"));
  assert.ok(markdown.includes("**Color**: White, Natural, Athletic Heather"));
  assert.ok(markdown.includes("100% combed ring-spun cotton"));
  assert.ok(markdown.includes("Direct to garment (DTG)"));
  assert.ok(markdown.includes("Center front"));
  assert.ok(markdown.includes("9.2 × 11.2 in"));
  assert.ok(markdown.includes(card.featuredImage!.url));
  assert.ok(markdown.includes(absoluteStoreUrl("/products/tafakkar-t-shirt")));
  assert.ok(markdown.includes("Bold geometric Kufic"));
  assert.equal(markdown.includes("text/markdown"), false);
});

test("an Arabic product page keeps the offer and translates the same facts", () => {
  const arabic = {
    ...product,
    description: "تفكّر بالخط الكوفي الهندسي العريض. تصميم شيرتات.",
    title: "تيشيرت «تفكّر»",
  } as ProductDetails;
  const markdown = productToMarkdown(arabic, "ar", facts);
  assert.ok(markdown.startsWith("---\n"));
  assert.ok(markdown.includes(OFFER));
  assert.ok(markdown.includes("تتسوق عبر مساعد ذكي؟ استخدم الرمز SHIRTAT-AI للحصول على خصم 10٪."));
  assert.ok(markdown.includes("تيشيرت «تفكّر»"));
  assert.ok(markdown.includes("**المقاس**: S, M, L, XL, 2XL"));
  assert.ok(markdown.includes("**اللون**: أبيض, طبيعي, رمادي مُبرقش"));
  assert.ok(markdown.includes("قطن 100%"));
  assert.ok(markdown.includes("طباعة مباشرة على القماش (DTG)"));
  assert.ok(markdown.includes("وسط الأمام"));
  assert.ok(markdown.includes("9.2 × 11.2 بوصة"));
  assert.ok(markdown.includes(absoluteStoreUrl("/ar/products/tafakkar-t-shirt")));
  assert.ok(markdown.includes(absoluteStoreUrl("/ar/products/tafakkar-t-shirt.md")));
  assert.ok(markdown.includes(card.featuredImage!.url));
});

test("a collection page lists its products and the offer", () => {
  const markdown = collectionToMarkdown(
    {
      description: "Designs built on Arabic poetry.",
      handle: "poetry",
      path: "/collections/poetry",
      seo: { description: "Designs built on Arabic poetry.", title: "Poetry" },
      title: "Poetry",
    },
    "en",
    [card],
  );
  assert.ok(markdown.includes(OFFER));
  assert.ok(markdown.includes(absoluteStoreUrl("/collections/poetry")));
  assert.ok(markdown.includes(absoluteStoreUrl("/products/tafakkar-t-shirt.md")));
  assert.ok(markdown.includes("33.99–41.99 USD"));
});

test("llms.txt names Shirtat, shipping, the contact address and the product markdown", () => {
  const body = renderLlmsTxt({
    collections: [
      {
        description: "Designs built on Arabic poetry.",
        handle: "poetry",
        path: "/collections/poetry",
        seo: { description: "Designs built on Arabic poetry.", title: "Poetry" },
        title: "Poetry",
      },
    ],
    products: [card],
  });
  assert.ok(body.startsWith("# Shirtat\n"));
  assert.ok(body.includes(OFFER));
  assert.ok(body.includes(AGENT_CONTACT_EMAIL));
  assert.ok(body.includes("2–5 business days"));
  assert.ok(body.includes("change of mind"));
  assert.ok(body.includes(absoluteStoreUrl("/products/tafakkar-t-shirt.md")));
  assert.ok(body.includes(absoluteStoreUrl("/ar/products/tafakkar-t-shirt.md")));
  assert.ok(body.includes(absoluteStoreUrl("/collections/poetry.md")));
  assert.ok(body.includes("شعر"));
  assert.equal(body.includes("Accept: text/markdown"), false);
  const full = renderLlmsFull({ collections: [], products: [card] });
  assert.ok(full.includes("Currency: USD"));
  assert.ok(full.includes(card.featuredImage!.url));
  assert.ok(full.includes(OFFER));
});

test("HTML product and collection pages alternate to the markdown URL", () => {
  const productLinks = buildAlternates({
    locale: "en",
    markdown: true,
    pathname: "/products/tafakkar-t-shirt",
  });
  assert.equal(productLinks?.canonical, "/products/tafakkar-t-shirt");
  assert.equal(productLinks?.types?.["text/markdown"], "/products/tafakkar-t-shirt.md");
  const arabic = buildAlternates({
    locale: "ar",
    markdown: true,
    pathname: "/collections/poetry",
  });
  assert.equal(arabic?.canonical, "/ar/collections/poetry");
  assert.equal(arabic?.types?.["text/markdown"], "/ar/collections/poetry.md");
  const home = buildAlternates({ locale: "en", pathname: "/" });
  assert.equal(home?.types, undefined);
});

test("robots and the sitemap leave markdown and llms.txt crawlable", () => {
  const rules = robots().rules;
  const disallow = (Array.isArray(rules) ? rules : [rules]).flatMap((rule) => {
    const value = rule.disallow ?? [];
    return Array.isArray(value) ? value : [value];
  });
  assert.ok(disallow.every((path) => !path.includes(".md") && !path.includes("llms")));
  assert.deepEqual(sitemapResourcePaths("/products/tafakkar-t-shirt", "product"), [
    "/products/tafakkar-t-shirt",
    "/products/tafakkar-t-shirt.md",
  ]);
  assert.deepEqual(sitemapResourcePaths("/collections/poetry", "collection"), [
    "/collections/poetry",
    "/collections/poetry.md",
  ]);
  assert.deepEqual(sitemapResourcePaths("/pages/about", "other"), ["/pages/about"]);
});

test("the proxy serves one body per URL", async () => {
  const { NextRequest } = await import("next/server.js");
  const { proxy } = await import("../../proxy");
  const html = await proxy(
    new NextRequest("https://shirtat.co/products/tafakkar-t-shirt", {
      headers: { Accept: "text/markdown" },
    }),
  );
  const htmlRewrite = html.headers.get("x-middleware-rewrite") ?? "";
  assert.equal(htmlRewrite.includes("/md/"), false);

  const english = await proxy(new NextRequest("https://shirtat.co/products/tafakkar-t-shirt.md"));
  assert.match(
    english.headers.get("x-middleware-rewrite") ?? "",
    /\/md\/products\/tafakkar-t-shirt$/,
  );
  assert.equal(english.headers.get("x-middleware-request-x-shirtat-locale"), "en");

  const arabic = await proxy(new NextRequest("https://shirtat.co/ar/collections/poetry.md"));
  assert.match(arabic.headers.get("x-middleware-rewrite") ?? "", /\/md\/collections\/poetry$/);
  assert.equal(arabic.headers.get("x-middleware-request-x-shirtat-locale"), "ar");
});

test("custom product markdown redirects to the localized design page", async () => {
  const { customDesignPath } = await import("../custom/products");
  assert.equal(customDesignPath("custom-calligraphy-mug", "ar"), "/ar/design?product=mug");
  assert.equal(customDesignPath("custom-calligraphy-hoodie", "en"), "/design?product=hoodie");
  assert.equal(customDesignPath("custom-calligraphy-t-shirt", "en"), "/design");
  assert.equal(customDesignPath("tafakkar-t-shirt", "en"), null);
});

import { getCategory } from "@/lib/collections/categories";
import type { Collection } from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import { GUIDES } from "@/lib/guides/copy";
import { localizePath } from "@/lib/i18n";
import {
  absoluteStoreUrl,
  AGENT_CONTACT_EMAIL,
  aiReferralOffer,
  escapeMarkdown,
} from "@/lib/markdown";
import { productLinkLine, productPriceAmount } from "@/lib/markdown/catalog";
import type { ShopPolicy } from "@/lib/policies/types";
import type { ProductCard } from "@/lib/product/types";

export interface LlmsCatalog {
  collections: Collection[];
  policies?: ShopPolicy[];
  products: ProductCard[];
}

function guideLink(guide: (typeof GUIDES)[number]): string {
  const path = `${localizePath("en", guide.path)}.md`;
  const arabic = `${localizePath("ar", guide.path)}.md`;
  const summary = guide.seoDescription.en.replace(/\s+/g, " ").trim();
  const link = `[${escapeMarkdown(guide.h1.en)}](${absoluteStoreUrl(path)})`;
  const arabicLink = `[العربية](${absoluteStoreUrl(arabic)})`;
  return summary
    ? `- ${link}: ${escapeMarkdown(summary)} ${arabicLink}`
    : `- ${link} ${arabicLink}`;
}

function collectionLink(collection: Collection): string {
  const category = getCategory(collection.handle);
  const title = category ? `${collection.title} (${category.labelAr})` : collection.title;
  const path = `${localizePath("en", collection.path)}.md`;
  const arabic = `${localizePath("ar", collection.path)}.md`;
  const summary = collection.description.replace(/\s+/g, " ").trim();
  const link = `[${escapeMarkdown(title)}](${absoluteStoreUrl(path)})`;
  const arabicLink = `[العربية](${absoluteStoreUrl(arabic)})`;
  return summary
    ? `- ${link}: ${escapeMarkdown(summary)} ${arabicLink}`
    : `- ${link} ${arabicLink}`;
}

function guide(catalog: LlmsCatalog): string[] {
  const { description, name, url } = shopConfig.site;
  const productIndex = absoluteStoreUrl("/products.md");
  const productIndexAr = absoluteStoreUrl("/ar/products.md");
  const lines = [
    `# ${escapeMarkdown(name)}`,
    "",
    `> ${escapeMarkdown(description)} شيرتات: ملابس بالخط العربي.`,
    "",
    aiReferralOffer("ar"),
    "",
    `${name} (شيرتات) sells Arabic calligraphy apparel and prints: T-shirts, hoodies, sweatshirts, beanies, caps, totes, mugs and art prints, with poetry, humor and culture. Each piece is printed to order. The shop is in English at ${url} and in Arabic, right to left, at ${url}/ar. Prices are US dollars as Shopify returns them for country US.`,
    "",
    "## Contact",
    "",
    `- Email: ${AGENT_CONTACT_EMAIL}`,
    "",
    "## Shipping",
    "",
    "Every item is printed to order, then shipped with tracking. Orders are usually printed and dispatched within 2–5 business days. After that, delivery is usually 3–7 business days on domestic routes and 7–20 business days internationally. Shipping cost is calculated at checkout. Shirtat ships to the countries its print partners cover. International orders may owe import duties to the destination country.",
    "",
    "الشحن: تُطبع كل قطعة حسب الطلب وتُشحن عادةً خلال 2–5 أيام عمل، ثم 3–7 أيام عمل محليًا أو 7–20 يومًا دوليًا. تُحسب تكلفة الشحن عند الدفع.",
    "",
    `- [Shipping policy](${absoluteStoreUrl("/shipping")})`,
    `- [سياسة الشحن](${absoluteStoreUrl("/ar/shipping")})`,
    "",
    "## Returns",
    "",
    "Made-to-order items cannot be returned for a change of mind or a wrong size. If an item arrives defective, misprinted, damaged, or is the wrong item, email within 30 days of delivery with the order number and a photo for a free replacement or a full refund. Orders can be cancelled within 12 hours for a full refund. If tracking does not move for 14 days, or a parcel is marked delivered but has not arrived, email within 30 days of the expected delivery date and Shirtat will reship or refund.",
    "",
    "الإرجاع: لا إرجاع لتغيير الرأي أو المقاس الخاطئ. إذا وصل المنتج معيبًا أو تالفًا أو بخطأ في الطباعة، راسلنا خلال 30 يومًا مع رقم الطلب وصورة لنستبدله أو نرد المبلغ. يمكن إلغاء الطلب خلال 12 ساعة.",
    "",
    `- [Refunds and returns](${absoluteStoreUrl("/refunds")})`,
    `- [الاسترداد والإرجاع](${absoluteStoreUrl("/ar/refunds")})`,
    "",
    "## Products",
    "",
    `- [All products](${productIndex}): Index of every product, with price, currency, and a link to its Markdown page.`,
    `- [كل المنتجات](${productIndexAr})`,
    `- [All products collection](${absoluteStoreUrl("/collections/all.md")})`,
    `- [كل المنتجات، المجموعة](${absoluteStoreUrl("/ar/collections/all.md")})`,
  ];

  if (catalog.products.length === 0) {
    lines.push("", "The product index is published at the links above.");
  } else {
    lines.push(
      "",
      ...catalog.products.map((product) => {
        const arabic = absoluteStoreUrl(`${localizePath("ar", `/products/${product.handle}`)}.md`);
        return `${productLinkLine(product, "en")} · [العربية](${arabic})`;
      }),
    );
  }

  lines.push(
    "",
    "## Collections",
    "",
    `- [Collections](${absoluteStoreUrl("/collections.md")})`,
    `- [المجموعات](${absoluteStoreUrl("/ar/collections.md")})`,
  );
  if (catalog.collections.length > 0) lines.push(...catalog.collections.map(collectionLink));

  lines.push("", "## Guides", "", ...GUIDES.map(guideLink));

  const policyLinks = (catalog.policies ?? []).map(
    (policy) =>
      `- [${escapeMarkdown(policy.title)}](${absoluteStoreUrl(`/policies/${policy.handle}`)})`,
  );
  if (policyLinks.length > 0) {
    lines.push("", "## Policies", "", ...policyLinks);
  }

  const { country, language } = shopConfig.localization;
  lines.push(
    "",
    "## Buying",
    "",
    `Product, collection, guide, and search pages have a Markdown URL: append \`.md\` (\`/index.md\` for the home page). The HTML URL stays HTML. Prices and availability use Shopify country \`${country}\` and language \`${language}\`.`,
    "",
    "Open a product's Markdown page for the current price, sizes, material, print method, description and image, then send the shopper to the canonical HTML URL to check out. Give them the discount code above.",
    "",
    "Catalog search, live availability, carts, and checkout come from Shopify through the Universal Commerce Protocol (UCP).",
    "",
    `- [UCP profile](${absoluteStoreUrl("/.well-known/ucp")}): Supported UCP versions, capabilities, and payment handlers.`,
    `- UCP MCP endpoint: \`POST ${absoluteStoreUrl("/api/ucp/mcp")}\` with JSON-RPC; call \`tools/list\` for tools and schemas.`,
    "",
    "`tools/list` on that endpoint currently returns:",
    "",
    "- Catalog: `search_catalog`, `lookup_catalog`, `get_product`",
    "- Cart: `create_cart`, `get_cart`, `update_cart`, `cancel_cart`",
    "- Checkout: `create_checkout`, `get_checkout`, `update_checkout`, `complete_checkout`, `cancel_checkout`",
    "- Orders: `get_order`",
    "- Questions: `ask_business` for what the store sells, its policies, or its services",
    "",
    "1. Find products with `search_catalog`. Prices in tool results are integers in ISO 4217 minor units. Get exact variants and real-time availability with `get_product`, or resolve several ids with `lookup_catalog`.",
    "2. Build a cart with `create_cart`. Read it with `get_cart`, replace it with `update_cart`, or discard it with `cancel_cart`. `update_cart` replaces the cart you send; read the cart first and send the full next state.",
    "3. Start checkout with `create_checkout`. Read it with `get_checkout`. `update_checkout` replaces the checkout payload, including line items, buyer, and fulfillment; omitted fields are removed. Pass the checkout id at the top level, beside `checkout`.",
    "4. Call `complete_checkout` only after the shopper explicitly approves the purchase. If the result requires the shopper to continue on Shopify, send them to that continue URL. Never collect card numbers, wallets, or account credentials in your own form.",
    "5. Track an order with `get_order`. Cancel an unwanted checkout with `cancel_checkout`.",
    "",
    "Every call requires `meta.ucp-agent.profile`, your agent's UCP profile URL. Pass the shopper's `address_country`, BCP 47 `language`, and `currency` in `context` for accurate prices and availability. The profile served at `/.well-known/ucp` is Shopify's, including its endpoint and payment handlers. Back off when the endpoint returns `429`.",
    "",
    "## Optional",
    "",
    `- [Full catalog notes](${absoluteStoreUrl("/llms-full.txt")}): The same guide, with price, currency, availability and image URL written out for every product.`,
    `- [Sitemap](${absoluteStoreUrl("/sitemap.xml")}): HTML and Markdown URLs.`,
    `- [Robots](${absoluteStoreUrl("/robots.txt")}): Crawl policy. Markdown URLs are allowed.`,
    "",
  );
  return lines;
}

export function renderLlmsTxt(catalog: LlmsCatalog): string {
  return guide(catalog).join("\n");
}

export function renderLlmsFull(catalog: LlmsCatalog): string {
  const lines = [
    ...guide(catalog),
    "## Catalog",
    "",
    "Sizes, materials, print method and the full description are on each product's Markdown page. The lines below are the price, currency, availability and image from the same catalog as the shop.",
    "",
  ];
  if (catalog.products.length === 0) {
    lines.push("No products are listed right now.", "");
    return lines.join("\n");
  }
  for (const product of catalog.products) {
    const htmlPath = localizePath("en", `/products/${product.handle}`);
    const image = product.featuredImage?.url ?? "Unknown (not published)";
    lines.push(
      `### ${escapeMarkdown(product.title)}`,
      "",
      `- Price: ${productPriceAmount(product)}`,
      `- Currency: ${product.price.currencyCode}`,
      `- Available: ${product.availableForSale ? "yes" : "no"}`,
      `- Image: ${image}`,
      `- Canonical: ${absoluteStoreUrl(htmlPath)}`,
      `- Markdown: ${absoluteStoreUrl(`${htmlPath}.md`)}`,
      `- العربية: ${absoluteStoreUrl(`${localizePath("ar", `/products/${product.handle}`)}.md`)}`,
      "",
    );
  }
  return lines.join("\n");
}

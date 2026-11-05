import { getCollections } from "@/lib/collections/server";
import { shopConfig } from "@/lib/config";
import { summarizeText } from "@/lib/content";
import { escapeMarkdown } from "@/lib/markdown";
import { getShopPolicies } from "@/lib/policies/server";

export async function GET(): Promise<Response> {
  const { description, name, url } = shopConfig.site;
  const { country, language } = shopConfig.localization;
  const [collections, policies] = await Promise.all([
    getCollections({ limit: 50 }).catch(() => []),
    getShopPolicies().catch(() => []),
  ]);
  const collectionLinks = collections.map((collection) => {
    const link = `[${escapeMarkdown(collection.title)}](${url}${collection.path})`;
    const summary = summarizeText(collection.description);
    return summary ? `- ${link}: ${escapeMarkdown(summary)}` : `- ${link}`;
  });
  const policyLinks = policies.map(
    (policy) => `- [${escapeMarkdown(policy.title)}](${url}/policies/${policy.handle})`,
  );

  return new Response(
    `# ${escapeMarkdown(name)}

> ${escapeMarkdown(summarizeText(description))}

Home, product, collection, and search pages return Markdown with an \`Accept: text/markdown\` header or at the page URL with \`.md\` appended (\`/index.md\` for the home page). Prices and availability use Shopify country \`${country}\` and language \`${language}\`.

## Buy for a shopper

Catalog search, live availability, carts, and checkout come from Shopify through the Universal Commerce Protocol (UCP).

- [UCP profile](${url}/.well-known/ucp): Supported UCP versions, capabilities, and payment handlers.
- UCP MCP endpoint: \`POST ${url}/api/ucp/mcp\` with JSON-RPC; call \`tools/list\` for tools and schemas.

\`tools/list\` on that endpoint currently returns:

- Catalog: \`search_catalog\`, \`lookup_catalog\`, \`get_product\`
- Cart: \`create_cart\`, \`get_cart\`, \`update_cart\`, \`cancel_cart\`
- Checkout: \`create_checkout\`, \`get_checkout\`, \`update_checkout\`, \`complete_checkout\`, \`cancel_checkout\`
- Orders: \`get_order\`
- Questions: \`ask_business\` for what the store sells, its policies, or its services

1. Find products with \`search_catalog\`. Prices in tool results are integers in ISO 4217 minor units. Get exact variants and real-time availability with \`get_product\`, or resolve several ids with \`lookup_catalog\`.
2. Build a cart with \`create_cart\`. Read it with \`get_cart\`, replace it with \`update_cart\`, or discard it with \`cancel_cart\`. \`update_cart\` replaces the cart you send; read the cart first and send the full next state.
3. Start checkout with \`create_checkout\`. Read it with \`get_checkout\`. \`update_checkout\` replaces the checkout payload, including line items, buyer, and fulfillment; omitted fields are removed. Pass the checkout id at the top level, beside \`checkout\`.
4. Call \`complete_checkout\` only after the shopper explicitly approves the purchase. If the result requires the shopper to continue on Shopify, send them to that continue URL. Never collect card numbers, wallets, or account credentials in your own form.
5. Track an order with \`get_order\`. Cancel an unwanted checkout with \`cancel_checkout\`.

Every call requires \`meta.ucp-agent.profile\`, your agent's UCP profile URL. Pass the shopper's \`address_country\`, BCP 47 \`language\`, and \`currency\` in \`context\` for accurate prices and availability. The profile served at \`/.well-known/ucp\` is Shopify's, including its endpoint and payment handlers. Back off when the endpoint returns \`429\`.

## Policies

${[
  ...policyLinks,
  `- Policy and FAQ search: MCP tool \`search_shop_policies_and_faqs\` at \`POST ${url}/api/mcp\` answers questions about shipping, returns, and contacting the store.`,
].join("\n")}

## Browse

- [All products](${url}/collections/all): The full product catalog.
${collectionLinks.length > 0 ? `\n## Collections\n\n${collectionLinks.join("\n")}\n` : ""}
## Discovery

- [Sitemap](${url}/sitemap.xml): Complete index of product and collection URLs.
- [Robots](${url}/robots.txt): Crawl policy.
`,
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}

import { defineTool } from "eve/tools";
import { z } from "zod";

import type { ProductSpecs } from "../../lib/product/specs";

const API_VERSION = "2025-01";

export default defineTool({
  description:
    "Read a product's sizes, fit, size chart, fabric and care from its product page data. Needs the product handle (find it with catalog search first). If it returns no size chart, say the chart is not on record and offer to pass the question to the owner.",
  inputSchema: z.strictObject({
    handle: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(255),
    language: z.enum(["en", "ar"]),
  }),
  execute: async ({ handle, language }) => {
    const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    if (!domain || !token) return { error: "Product data is unavailable." };
    const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
      body: JSON.stringify({
        query: `query($h: String!) { product(handle: $h) { title specs: metafield(namespace: "shirtat", key: "specs") { value } } }`,
        variables: { h: handle },
      }),
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      method: "POST",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { error: "Product data is unavailable." };
    const json = (await response.json()) as {
      data?: { product: { specs: { value: string } | null; title: string } | null };
    };
    const product = json.data?.product;
    if (!product) return { error: "No product with that handle." };
    let specs: ProductSpecs | null = null;
    try {
      specs = product.specs ? (JSON.parse(product.specs.value) as ProductSpecs) : null;
    } catch {
      specs = null;
    }
    if (!specs) return { sizeChart: null, title: product.title };
    return {
      care: specs.care?.[language] ?? null,
      fabric: specs.fabric?.[language] ?? null,
      fit: specs.fit?.[language] ?? null,
      sizeChart: specs.sizeChart
        ? {
            columns: specs.sizeChart.columns.map((column) => ({
              name: column[language],
              values: column.values,
            })),
            sizes: specs.sizeChart.sizes,
            unit: specs.sizeChart.unit,
          }
        : null,
      sizes: specs.sizes,
      title: product.title,
    };
  },
});

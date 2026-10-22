import { adminGraphql } from "@/lib/creators/shopify-admin";

import { suggestCategories } from "./categorize";

interface ProductPayload {
  admin_graphql_api_id?: string;
  body_html?: string | null;
  id?: number;
  product_type?: string;
  tags?: string | string[];
  title?: string;
}

/**
 * products/create (and products/update) hook: adds `category:<id>` tags decided from the design's
 * title, description and tags. Additive only; never removes a category someone set by hand.
 * Returns the tags added (empty when nothing changed).
 */
export async function autoCategorizeProduct(payload: ProductPayload): Promise<string[]> {
  const id = payload.admin_graphql_api_id ?? (payload.id ? `gid://shopify/Product/${payload.id}` : null);
  if (!id) return [];
  const tags = (Array.isArray(payload.tags) ? payload.tags : (payload.tags ?? "").split(","))
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.includes("example") || tags.includes("no-auto-category")) return [];
  const text = [payload.title, (payload.body_html ?? "").replace(/<[^>]+>/g, " "), ...tags].join(" ");
  const wanted = suggestCategories(text).categoryIds.map((c) => `category:${c}`);
  const missing = wanted.filter((t) => !tags.map((x) => x.toLowerCase()).includes(t));
  if (!missing.length) return [];
  await adminGraphql(
    `mutation AutoCategory($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`,
    { id, tags: missing },
  );
  return missing;
}

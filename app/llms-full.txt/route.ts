import { getCollections } from "@/lib/collections/server";
import { renderLlmsFull } from "@/lib/markdown/llms";
import { getShopPolicies } from "@/lib/policies/server";
import { getProductIndex } from "@/lib/product/server";

const HEADERS = {
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  "Content-Type": "text/plain; charset=utf-8",
};

export async function GET(): Promise<Response> {
  const [collections, policies, products] = await Promise.all([
    getCollections({ limit: 250 }).catch(() => []),
    getShopPolicies().catch(() => []),
    getProductIndex().catch(() => []),
  ]);
  return new Response(renderLlmsFull({ collections, policies, products }), { headers: HEADERS });
}

import { getCollections } from "@/lib/collections/server";
import { renderLlmsTxt } from "@/lib/markdown/llms";
import { getProductIndex } from "@/lib/product/server";

const HEADERS = {
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  "Content-Type": "text/plain; charset=utf-8",
};

export async function GET(): Promise<Response> {
  const [collections, products] = await Promise.all([
    getCollections({ limit: 250 }).catch(() => []),
    getProductIndex().catch(() => []),
  ]);
  return new Response(renderLlmsTxt({ collections, products }), { headers: HEADERS });
}

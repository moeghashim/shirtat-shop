import { shopConfig } from "@/lib/config";
import { getShopifySitemapPagesCount, sitemapShardIsListed } from "@/lib/seo/server";
import type { ShopifySitemapType } from "@/lib/shopify/operations/sitemap/types";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(): Promise<Response> {
  const [articlePages, blogPages, collectionPages, pagePages, productPages] = await Promise.all([
    getShopifySitemapPagesCount("ARTICLE"),
    getShopifySitemapPagesCount("BLOG"),
    getShopifySitemapPagesCount("COLLECTION"),
    getShopifySitemapPagesCount("PAGE"),
    getShopifySitemapPagesCount("PRODUCT"),
  ]);

  const shards: Array<{ id: string; page?: number; type?: ShopifySitemapType }> = [
    { id: "static" },
    ...Array.from({ length: productPages }, (_, i) => ({
      id: `products-${i + 1}`,
      page: i + 1,
      type: "PRODUCT" as const,
    })),
    ...Array.from({ length: collectionPages }, (_, i) => ({
      id: `collections-${i + 1}`,
      page: i + 1,
      type: "COLLECTION" as const,
    })),
    ...Array.from({ length: pagePages }, (_, i) => ({
      id: `pages-${i + 1}`,
      page: i + 1,
      type: "PAGE" as const,
    })),
    ...Array.from({ length: blogPages }, (_, i) => ({
      id: `blogs-${i + 1}`,
      page: i + 1,
      type: "BLOG" as const,
    })),
    ...Array.from({ length: articlePages }, (_, i) => ({
      id: `articles-${i + 1}`,
      page: i + 1,
      type: "ARTICLE" as const,
    })),
  ];
  const listed = await Promise.all(
    shards.map(async (shard) => {
      if (!shard.type || !shard.page) return shard.id;
      return (await sitemapShardIsListed(shard.type, shard.page)) ? shard.id : null;
    }),
  );
  const childIds = listed.filter((id): id is string => id !== null);

  const entries = childIds
    .map(
      (id) =>
        `  <sitemap><loc>${escapeXml(`${shopConfig.site.url}/sitemap/${id}.xml`)}</loc></sitemap>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

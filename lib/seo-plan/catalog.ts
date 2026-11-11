import type { CountReading } from "./types";

const API_VERSION = "2025-01";

function storefrontConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  );
}

interface Connection {
  nodes: { id: string }[];
  pageInfo: { endCursor: string | null; hasNextPage: boolean };
}

async function countConnection(root: "collections" | "products"): Promise<CountReading> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return { state: "not-connected" };
  let count = 0;
  let cursor: string | null = null;
  try {
    for (let page = 0; page < 20; page += 1) {
      const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
        body: JSON.stringify({
          query: `query CatalogCount($cursor: String) { ${root}(first: 250, after: $cursor) { nodes { id } pageInfo { hasNextPage endCursor } } }`,
          variables: { cursor },
        }),
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          "x-shopify-storefront-access-token": token,
        },
        method: "POST",
      });
      if (!response.ok) return { state: "unavailable" };
      const json = (await response.json()) as {
        data?: {
          collections?: Connection;
          products?: Connection;
        };
        errors?: unknown[];
      };
      if (json.errors?.length) return { state: "unavailable" };
      const connection = json.data?.[root];
      if (!connection) return { state: "unavailable" };
      count += connection.nodes.length;
      if (!connection.pageInfo.hasNextPage) return { count, state: "ok" };
      if (!connection.pageInfo.endCursor) return { state: "unavailable" };
      cursor = connection.pageInfo.endCursor;
    }
    return { state: "unavailable" };
  } catch {
    return { state: "unavailable" };
  }
}

export async function getCatalogCounts(): Promise<{
  collections: CountReading;
  products: CountReading;
}> {
  if (!storefrontConfigured()) {
    return {
      collections: { state: "not-connected" },
      products: { state: "not-connected" },
    };
  }
  const [collections, products] = await Promise.all([
    countConnection("collections"),
    countConnection("products"),
  ]);
  return { collections, products };
}

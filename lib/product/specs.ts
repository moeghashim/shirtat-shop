import { cacheLife, cacheTag } from "next/cache";

const API_VERSION = "2025-01";

export type Bilingual = { ar: string; en: string };

/** shirtat.specs: technical details copied from the product's selected POD vendor. null = unknown. */
export interface ProductSpecs {
  blank: string;
  blankAr?: string;
  care: Bilingual | null;
  fabric: Bilingual | null;
  fit: Bilingual | null;
  origin: Bilingual | null;
  provider: string;
  sizeChart: {
    columns: Array<Bilingual & { values: string[] }>;
    sizes: string[];
    unit: "cm";
  } | null;
  sizes: string[];
  source: string;
  vendor: string;
  weight: string | null;
}

/** shirtat.print_method: how the selected vendor prints this product. */
export interface PrintMethod {
  available: Array<{ areas: Bilingual[]; method: string }>;
  method: Bilingual | null;
  placement: Bilingual | null;
  printArea: string | null;
  source: string;
  vendor: string;
}

function parse<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function getProductSpecs(
  handle: string,
): Promise<{ print: PrintMethod | null; specs: ProductSpecs | null }> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("products", `product-${handle}`);
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return { print: null, specs: null };
  try {
    const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({
        query: `query($h: String!) { product(handle: $h) { specs: metafield(namespace: "shirtat", key: "specs") { value } print: metafield(namespace: "shirtat", key: "print_method") { value } } }`,
        variables: { h: handle },
      }),
    });
    if (!res.ok) return { print: null, specs: null };
    const json = (await res.json()) as {
      data?: {
        product: { print: { value: string } | null; specs: { value: string } | null } | null;
      };
    };
    const p = json.data?.product;
    return {
      print: parse<PrintMethod>(p?.print?.value),
      specs: parse<ProductSpecs>(p?.specs?.value),
    };
  } catch {
    return { print: null, specs: null };
  }
}

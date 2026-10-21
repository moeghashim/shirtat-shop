import { getCategory } from "@/lib/collections/categories";
import { getProductType } from "@/lib/creators/product-types";
import { adminGraphql, ShopifyWriteError } from "@/lib/creators/shopify-admin";
import { signedAssetUrl } from "@/lib/creators/tokens";
import type { AppliedProduct, StoredFile } from "@/lib/creators/types";

import { priceForType } from "./pricing";
import { createPrintifyProduct, printifyEnabled } from "./printify";

/** The Shirtat studio's own designs use this designer handle. */
export const STUDIO_HANDLE = "shirtat";

export interface DraftInput {
  categoryId: string;
  colors: string[];
  descriptionAr: string;
  descriptionEn: string;
  designerHandle: string;
  designerName: string;
  extraTags?: string[];
  file: StoredFile;
  title: string;
  typeId: string;
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/**
 * Workflow B, one product type: creates a Shopify DRAFT tagged category:<id> and designer:<handle>,
 * with the type's taxonomy category, Size × Color variants, the design image and
 * price = Printify cost × 3 rounded up to .99.
 */
export async function createDraftForType(
  input: DraftInput,
): Promise<{ handle: string; id: string }> {
  const type = getProductType(input.typeId);
  const category = getCategory(input.categoryId);
  const price = priceForType(input.typeId);
  if (!type || !price) throw new ShopifyWriteError(`Unknown product type ${input.typeId}`);
  if (!category) throw new ShopifyWriteError(`Unknown category ${input.categoryId}`);
  const allowed = new Set(type.colors.map((c) => c.en));
  const colors = input.colors.filter((c) => allowed.has(c));
  if (colors.length === 0) colors.push(type.colors[0]!.en);
  const descriptionHtml = [
    input.descriptionEn && `<p>${esc(input.descriptionEn)}</p>`,
    input.descriptionAr && `<p dir="rtl" lang="ar">${esc(input.descriptionAr)}</p>`,
    `<p>Design by ${esc(input.designerName)}.</p>`,
  ]
    .filter(Boolean)
    .join("\n");
  const image =
    input.file.contentType === "image/png" || input.file.contentType === "image/jpeg"
      ? [
          {
            alt: input.title,
            contentType: "IMAGE",
            originalSource: signedAssetUrl(input.file.pathname),
          },
        ]
      : [];
  const extra = (input.extraTags ?? []).filter((t) => {
    const l = t.toLowerCase();
    return !l.startsWith("category:") && !l.startsWith("designer:") && !l.startsWith("creator:");
  });
  const title = `${input.title} ${type.labelEn}`;
  const data = await adminGraphql<{
    productSet: {
      product: { handle: string; id: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation CreateDraft($input: ProductSetInput!) {
      productSet(synchronous: true, input: $input) { product { id handle } userErrors { field message } }
    }`,
    {
      input: {
        category: type.category,
        descriptionHtml,
        files: image,
        productOptions: [
          { name: "Size", values: type.sizes.map((name) => ({ name })) },
          { name: "Color", values: colors.map((name) => ({ name })) },
        ],
        productType: type.productType,
        status: "DRAFT",
        tags: [
          `category:${category.id}`,
          `designer:${input.designerHandle}`,
          `supplier:printify`,
          ...extra,
        ].slice(0, 20),
        title,
        variants: type.sizes.flatMap((size) =>
          colors.map((color) => ({
            optionValues: [
              { name: size, optionName: "Size" },
              { name: color, optionName: "Color" },
            ],
            price,
          })),
        ),
        vendor: "Shirtat",
      },
    },
  );
  const err = data.productSet.userErrors[0];
  if (err || !data.productSet.product)
    throw new ShopifyWriteError(err?.message ?? "Product not created");
  if (printifyEnabled()) {
    await createPrintifyProduct({
      colors,
      description: input.descriptionEn,
      imageUrl: signedAssetUrl(input.file.pathname),
      title,
      typeId: type.id,
    }).catch(() => null);
  }
  return data.productSet.product;
}

/** Workflow B: apply one design to several product types/colours; one Shopify draft per type. */
export async function applyDesign(
  base: Omit<DraftInput, "colors" | "typeId">,
  items: { colors: string[]; typeId: string }[],
): Promise<AppliedProduct[]> {
  const out: AppliedProduct[] = [];
  for (const item of items) {
    const price = priceForType(item.typeId) ?? "";
    try {
      const p = await createDraftForType({ ...base, ...item });
      out.push({
        ...item,
        price,
        shopifyProductHandle: p.handle,
        shopifyProductId: p.id,
        status: "draft",
      });
    } catch (e) {
      out.push({
        ...item,
        error: e instanceof Error ? e.message : "Failed",
        price,
        status: "failed",
      });
    }
  }
  return out;
}

import type { ProductFormInput, ProductFormVariant } from "@/lib/product/types";

/**
 * The design page ships the variants of three products twice (HTML and RSC payload). As full form
 * variants that is ~650 bytes each; this keeps one short row per variant and rebuilds the rest in the browser.
 */
export interface CompactForm {
  /** The form minus its variants and options. */
  base: Omit<ProductFormInput, "adjacentVariants" | "options" | "selectedOrFirstAvailableVariant">;
  currency: string;
  /** Per option value, the index of its first selectable variant, or -1. */
  firstSelectable: number[][];
  handle: string;
  options: Array<{ name: string; values: string[] }>;
  selected: number;
  title: string;
  /** [id tail, 1 if available, price, ...index of each option's value]. */
  variants: Array<[string, number, string, ...number[]]>;
}

const ID_PREFIX = "gid://shopify/ProductVariant/";

export function compactForm(form: ProductFormInput): CompactForm {
  const variants = form.adjacentVariants ?? [];
  const options = form.options.map((o) => ({
    name: o.name,
    values: o.optionValues.map((v) => v.name),
  }));
  const rows = variants.map((variant): CompactForm["variants"][number] => [
    variant.id.slice(ID_PREFIX.length),
    variant.availableForSale ? 1 : 0,
    variant.price.amount,
    ...options.map((option) => {
      const chosen = variant.selectedOptions.find((s) => s.name === option.name)?.value;
      return option.values.indexOf(chosen ?? "");
    }),
  ]);
  const indexOf = (variant: ProductFormVariant | null) =>
    variant ? variants.findIndex((v) => v.id === variant.id) : -1;
  const { adjacentVariants: _a, options: _o, selectedOrFirstAvailableVariant, ...base } = form;
  return {
    base,
    currency: variants[0]?.price.currencyCode ?? "USD",
    firstSelectable: form.options.map((o) =>
      o.optionValues.map((v) => indexOf(v.firstSelectableVariant ?? null)),
    ),
    handle: variants[0]?.product.handle ?? form.handle,
    options,
    selected: indexOf(selectedOrFirstAvailableVariant ?? null),
    title: variants[0]?.product.title ?? form.title,
    variants: rows,
  };
}

export function expandForm(compact: CompactForm): ProductFormInput {
  const { options } = compact;
  const build = (row: CompactForm["variants"][number]): ProductFormVariant => {
    const selectedOptions = options.map((option, i) => ({
      name: option.name,
      value: option.values[row[3 + i] as number] as string,
    }));
    return {
      availableForSale: row[1] === 1,
      id: ID_PREFIX + row[0],
      image: null,
      price: { amount: row[2], currencyCode: compact.currency },
      product: { handle: compact.handle, title: compact.title },
      requiresBundleConfiguration: false,
      requiresSellingPlan: false,
      selectedOptions,
      sellingPlanAllocations: [],
      title: selectedOptions.map((o) => o.value).join(" / "),
    } as ProductFormVariant;
  };
  const variants = compact.variants.map(build);
  const at = (i: number) => (i >= 0 ? (variants[i] ?? null) : null);
  return {
    ...compact.base,
    adjacentVariants: variants,
    options: options.map((option, o) => ({
      name: option.name,
      optionValues: option.values.map((name, v) => ({
        firstSelectableVariant: at(compact.firstSelectable[o]?.[v] ?? -1),
        name,
      })),
    })),
    selectedOrFirstAvailableVariant: at(compact.selected),
  };
}

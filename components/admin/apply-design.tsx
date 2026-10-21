import { SUPPLIER, SUPPLIER_COSTS, retailPrice } from "@/lib/catalog/pricing";
import { CATEGORIES } from "@/lib/collections/categories";
import { PRODUCT_TYPES } from "@/lib/creators/product-types";

const field = "rounded-md border border-border bg-background px-2 py-1 text-sm";

/** Product and colour picker for workflow B/C: one Shopify draft per checked type. */
export function ProductPicks({
  hintColors = [],
  hintTypeId,
}: {
  hintColors?: string[];
  hintTypeId?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PRODUCT_TYPES.map((t) => {
        const cost = SUPPLIER_COSTS[t.id]!.costUsd;
        const hinted = t.id === hintTypeId;
        return (
          <fieldset
            key={t.id}
            className="flex flex-col gap-1.5 rounded-lg border border-border p-2.5"
          >
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" name="types" value={t.id} defaultChecked={hinted} />
              {t.labelEn}
              {hinted && <span className="rounded bg-muted px-1.5 text-xs">designer hint</span>}
              <span className="ms-auto text-xs font-normal text-muted-foreground">
                ${cost.toFixed(2)} × 3 →{" "}
                <strong className="text-foreground">${retailPrice(cost)}</strong>
              </span>
            </label>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {t.colors.map((c, i) => (
                <label key={c.en} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name={`colors:${t.id}`}
                    value={c.en}
                    defaultChecked={
                      hinted && hintColors.length ? hintColors.includes(c.en) : i === 0
                    }
                  />
                  {c.en}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

export function CategorySelect({ matched, suggested }: { matched: string[]; suggested: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      Category (auto-suggested
      {matched.length ? ` from “${matched.slice(0, 3).join("”, “")}”` : ", default"}; override if
      needed)
      <select name="category" defaultValue={suggested} className={field}>
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.labelEn} · {c.labelAr}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SupplierNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Supplier: {SUPPLIER.name}. Price = supplier cost × 3, rounded up to .99. Drafts get{" "}
      <code>category:&lt;id&gt;</code>, <code>designer:&lt;handle&gt;</code>, product type, sizes ×
      colours and the price. Printify auto-sync is off until an API token is added.
    </p>
  );
}

export { field as adminField };

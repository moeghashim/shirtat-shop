import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type { DesignersView } from "../../../../../../../../lib/admin-api/types.ts";

type Catalog = DesignersView["catalog"];

/** Product and colour picker for workflows B and C: one Shopify draft per checked type. */
export function ProductPicks({
  catalog,
  hintColors = [],
  hintTypeId,
  idPrefix,
}: {
  catalog: Catalog;
  hintColors?: string[];
  hintTypeId?: string;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {catalog.productTypes.map((t) => {
        const hinted = t.id === hintTypeId;
        return (
          <fieldset key={t.id} className="flex flex-col gap-2 rounded-lg border p-3">
            <legend className="sr-only">{t.labelEn}</legend>
            <label className="flex items-center gap-2 text-sm font-medium" htmlFor={`${idPrefix}-type-${t.id}`}>
              <input
                className="accent-primary size-4"
                defaultChecked={hinted}
                id={`${idPrefix}-type-${t.id}`}
                name="types"
                type="checkbox"
                value={t.id}
              />
              {t.labelEn}
              {hinted ? <span className="bg-muted rounded px-1 text-xs">designer hint</span> : null}
              <span className="text-muted-foreground ms-auto text-xs font-normal" title={t.blueprint ?? undefined}>
                from ${t.cost.toFixed(2)} × 3 → <strong className="text-foreground">${t.retail}</strong>
              </span>
            </label>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {t.colors.map((color, i) => (
                <label key={color} className="flex min-h-6 items-center gap-1">
                  <input
                    className="accent-primary size-4"
                    defaultChecked={hinted && hintColors.length ? hintColors.includes(color) : i === 0}
                    name={`colors:${t.id}`}
                    type="checkbox"
                    value={color}
                  />
                  {color}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

export function CategorySelect({
  catalog,
  id,
  matched,
  suggested,
}: {
  catalog: Catalog;
  id: string;
  matched: string[];
  suggested: string;
}) {
  return (
    <label className="grid gap-1 text-xs" htmlFor={id}>
      Category (auto-suggested
      {matched.length ? ` from “${matched.slice(0, 3).join("”, “")}”` : ", default"}; override if needed)
      <NativeSelect className="w-full" defaultValue={suggested} id={id} name="category">
        {catalog.categories.map((c) => (
          <NativeSelectOption key={c.id} value={c.id}>
            {c.labelEn} · {c.labelAr}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}

export function SupplierNote({ supplier }: { supplier: string }) {
  return (
    <p className="text-muted-foreground text-xs">
      Supplier: {supplier}. Price = supplier cost × 3, rounded up to .99, per variant (larger sizes cost more). Drafts
      get <code>category:&lt;id&gt;</code>, <code>designer:&lt;handle&gt;</code>, product type, sizes × colours and the
      price. With Printify on, a Printify product is made first; its mockups and variant SKUs go on the draft.
    </p>
  );
}
